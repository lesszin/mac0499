const map = L.map('mapContainer', { zoomControl: false }).setView([-23.55052, -46.633308], 13);
L.control.zoom({ position: 'bottomleft' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

const schoolLayer = L.layerGroup().addTo(map);
const selectedLayer = L.layerGroup().addTo(map);
const schoolMarkers = new Map();
let selectedSchoolCode = null;
const modalityFilters = document.querySelectorAll(".modality-filter");
const searchInput = document.getElementById("schoolInput");
const suggestionsBox = document.getElementById("searchSuggestions");

const dotStyle = {
    radius: 5,
    fillColor: "#007bff",
    color: "#fff",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

const redIcon = L.divIcon({
    className: 'marker-no-bg',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="28" height="40" style="filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.3));"><path fill="#dc3545" d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/></svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40]
});

function createPopup(school) {
    return `
        <strong>${school.nome}</strong><br>
        <button class="btn btn-sm btn-primary mt-2"
            onclick="window.open('/escola/${school.codigo}','_blank')">
            Ver Detalhes
        </button>
    `;
}

function createMarker(school) {
    const marker = L.circleMarker(
        [school.lat, school.lng],
        dotStyle
    );
    marker.options.schoolData = school;
    marker.on("click", () => selectSchool(school));
    return marker;
}

function createPin(school) {
    const pin = L.marker(
        [school.lat, school.lng],
        { icon: redIcon }
    );
    pin.bindPopup(createPopup(school));
    return pin;
}

function addMarker(school) {
    const marker = createMarker(school);
    schoolMarkers.set(school.codigo, marker);
    schoolLayer.addLayer(marker);
    return marker;
}

function clearVisibleMarkers() {
    schoolMarkers.forEach((marker, codigo) => {
        if (codigo !== selectedSchoolCode) {
            schoolLayer.removeLayer(marker);
            schoolMarkers.delete(codigo);
        }
    });
}

function removeInvisibleMarkers(visibleSchools) {
    schoolMarkers.forEach((marker, codigo) => {
        if (
            !visibleSchools.has(codigo) &&
            codigo !== selectedSchoolCode
        ) {
            schoolLayer.removeLayer(marker);
            schoolMarkers.delete(codigo);
        }
    });
}

function getSelectedModalities() {
    const selectedFilters = Array.from(modalityFilters)
        .filter(filter => filter.checked);
    if (selectedFilters.length === 0) {
        return null;
    }
    return Array.from(selectedFilters)
        .map(filter => filter.value)
        .join(",");
}

function canLoadSchools(modalities) {
    if (!modalities) {
        clearVisibleMarkers();
        return false;
    }
    if (map.getZoom() < 5) {
        clearVisibleMarkers();
        return false;
    }
    return true;
}

function createSchoolsUrl(modalities) {
    const bounds = map.getBounds();
    return (
        `/api/escolas-mapa?modalidades=${modalities}`
        + `&lat_min=${bounds.getSouth()}`
        + `&lat_max=${bounds.getNorth()}`
        + `&lng_min=${bounds.getWest()}`
        + `&lng_max=${bounds.getEast()}`
    );
}

function fetchSchools(modalities) {
    return fetch(createSchoolsUrl(modalities))
        .then(response => response.json());
}

function updateVisibleSchools(schools) {
    const visibleSchools = new Set();
    schools.forEach(school => {
        visibleSchools.add(school.codigo);
        if (school.codigo === selectedSchoolCode) {
            if (!schoolMarkers.has(school.codigo)) {
                addMarker(school);
            }
            return;
        }
        if (!schoolMarkers.has(school.codigo)) {
            addMarker(school);
        }
    });
    removeInvisibleMarkers(visibleSchools);
}

function loadSchoolsOnMap() {
    const modalities = getSelectedModalities();
    if (!canLoadSchools(modalities)) {
        return;
    }
    return fetchSchools(modalities)
        .then(updateVisibleSchools)
        .catch(console.error);
}

function selectSchool(schoolData) {
    selectedLayer.clearLayers();
    selectedSchoolCode = null;
    let marker = schoolMarkers.get(schoolData.codigo);
    if (!marker) {
        marker = addMarker(schoolData);
    }
    const pin = createPin(schoolData);
    selectedLayer.addLayer(pin);
    pin.openPopup();
    selectedSchoolCode = schoolData.codigo;
}

function searchSchools(term) {
    return fetch(`/api/busca/${term}`)
        .then(response => response.json());
}

function showSuggestionsBox() {
    suggestionsBox.classList.remove("d-none");
}

function hideSuggestionsBox() {
    suggestionsBox.classList.add("d-none");
}

function clearSuggestions() {
    suggestionsBox.innerHTML = "";
    hideSuggestionsBox();
}

function createSuggestionButton(school) {
    const button = document.createElement("button");
    button.className =
        "list-group-item list-group-item-action text-start py-2";
    button.innerHTML = `
        <div class="fw-bold text-dark">${school.nome}</div>
        <small class="text-muted">${school.cidade} - ${school.estado}</small>
    `;
    button.onclick = () => {
        hideSuggestionsBox();
        searchInput.value = "";
        map.once("moveend", () => {
            setTimeout(() => selectSchool(school), 100);
        });
        map.flyTo([school.lat, school.lng], 16);
    };
    return button;
}

function showSuggestions(schools) {
    suggestionsBox.innerHTML = "";
    if (schools.length === 0) {
        suggestionsBox.innerHTML =
            '<div class="list-group-item text-muted">Nenhuma escola encontrada</div>';
        showSuggestionsBox();
        return;
    }
    schools.forEach(school => {
        suggestionsBox.appendChild(createSuggestionButton(school));
    });
    showSuggestionsBox();
}

function onSearchInput() {
    const term = searchInput.value.trim();
    if (term.length < 3) {
        clearSuggestions();
        return;
    }
    searchSchools(term)
        .then(showSuggestions)
        .catch(console.error);
}

map.on('moveend', loadSchoolsOnMap);

modalityFilters.forEach(filter => {
    filter.addEventListener("change", loadSchoolsOnMap);
});

window.addEventListener("load", () => {
    modalityFilters.forEach(filter => {
        filter.checked = false;
    });
    schoolLayer.clearLayers();
    selectedLayer.clearLayers();
    schoolMarkers.clear();
    selectedSchoolCode = null;

});

searchInput.addEventListener("input", onSearchInput);

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        hideSuggestionsBox();
    }
});