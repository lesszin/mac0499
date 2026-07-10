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

function loadSchoolsOnMap() {
    const checkboxes = document.querySelectorAll('.modality-filter:checked');

    if (checkboxes.length === 0) {

        schoolMarkers.forEach((marker, codigo) => {
            if (codigo !== selectedSchoolCode) {
                schoolLayer.removeLayer(marker);
                schoolMarkers.delete(codigo);
            }
        });

        return;
    }

    const modalities = Array.from(checkboxes).map(cb => cb.value).join(',');
    if (map.getZoom() < 5) {

        schoolMarkers.forEach((marker, codigo) => {
            if (codigo !== selectedSchoolCode) {
                schoolLayer.removeLayer(marker);
                schoolMarkers.delete(codigo);
            }
        });

        return;
    }

    const bounds = map.getBounds();

    let url =
        `/api/escolas-mapa?modalidades=${modalities}`
        + `&lat_min=${bounds.getSouth()}`
        + `&lat_max=${bounds.getNorth()}`
        + `&lng_min=${bounds.getWest()}`
        + `&lng_max=${bounds.getEast()}`;

    return fetch(url)
        .then(response => response.json())
        .then(schools => {

            const visibleSchools = new Set();
            schools.forEach(school => {
                visibleSchools.add(school.codigo);

                if (school.codigo === selectedSchoolCode) {

                    if (!schoolMarkers.has(school.codigo)) {

                        const marker = L.circleMarker(
                            [school.lat, school.lng],
                            dotStyle
                        );

                        marker.options.schoolData = school;
                        marker.on("click", () => selectSchool(marker, school));

                        schoolMarkers.set(school.codigo, marker);
                        schoolLayer.addLayer(marker);
                    }

                    return;
                }

                if (schoolMarkers.has(school.codigo))
                    return;

                const marker = L.circleMarker(
                    [school.lat, school.lng],
                    dotStyle
                );

                marker.options.schoolData = school;
                marker.on('click', function () {
                    selectSchool(marker, school);
                });

                schoolMarkers.set(school.codigo, marker);
                schoolLayer.addLayer(marker);
            });

            schoolMarkers.forEach((marker, codigo) => {
                if (
                    !visibleSchools.has(codigo) &&
                    codigo !== selectedSchoolCode
                ) {
                    schoolLayer.removeLayer(marker);
                    schoolMarkers.delete(codigo);
                }
            });

        })
        .catch(console.error);
}

function selectSchool(marker, schoolData) {

    selectedLayer.clearLayers();

    const pin = L.marker(
        [schoolData.lat, schoolData.lng],
        { icon: redIcon }
    );

    pin.bindPopup(`
        <strong>${schoolData.nome}</strong><br>
        <button class="btn btn-sm btn-primary mt-2"
            onclick="window.open('/escola/${schoolData.codigo}','_blank')">
            Ver Detalhes
        </button>
    `);

    selectedLayer.addLayer(pin);

    pin.openPopup();

    selectedSchoolCode = schoolData.codigo;
}

function selectSchoolByData(schoolData) {

    selectedLayer.clearLayers();

    let marker = schoolMarkers.get(schoolData.codigo);

    if (!marker) {
        marker = L.circleMarker(
            [schoolData.lat, schoolData.lng],
            dotStyle
        );

        marker.options.schoolData = schoolData;
        marker.on("click", () => selectSchool(marker, schoolData));

        schoolMarkers.set(schoolData.codigo, marker);
        schoolLayer.addLayer(marker);
    }

    const pin = L.marker(
        marker.getLatLng(),
        { icon: redIcon }
    );

    pin.bindPopup(`
        <strong>${schoolData.nome}</strong><br>
        <button class="btn btn-sm btn-primary mt-2"
            onclick="window.open('/escola/${schoolData.codigo}','_blank')">
            Ver Detalhes
        </button>
    `);

    selectedLayer.addLayer(pin);

    pin.openPopup();

    selectedSchoolCode = schoolData.codigo;
}

map.on('moveend', loadSchoolsOnMap);

document.querySelectorAll('.modality-filter').forEach(checkbox => {
    checkbox.addEventListener('change', loadSchoolsOnMap);
});

const searchInput = document.getElementById('schoolInput');
const suggestionsBox = document.getElementById('searchSuggestions');

window.addEventListener("load", () => {

    document.querySelectorAll(".modality-filter").forEach(cb => {
        cb.checked = false;
    });

    schoolLayer.clearLayers();
    selectedLayer.clearLayers();
    schoolMarkers.clear();
    selectedSchoolCode = null;

});

searchInput.addEventListener('input', function() {
    const term = this.value.trim();
    
    if (term.length < 3) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.classList.add('d-none');
        return;
    }

    fetch(`/api/busca/${term}`)
        .then(response => response.json())
        .then(schools => {
            suggestionsBox.innerHTML = '';
            
            if (schools.length === 0) {
                suggestionsBox.innerHTML = '<div class="list-group-item text-muted">Nenhuma escola encontrada</div>';
                suggestionsBox.classList.remove('d-none');
                return;
            }

            schools.forEach(school => {
                const button = document.createElement('button');
                button.className = 'list-group-item list-group-item-action text-start py-2';
                button.innerHTML = `
                    <div class="fw-bold text-dark">${school.nome}</div>
                    <small class="text-muted">${school.cidade} - ${school.estado}</small>
                `;
                
                button.onclick = () => {
                    suggestionsBox.classList.add('d-none');
                    searchInput.value = '';

                    map.once("moveend", () => {
                        setTimeout(() => {
                            selectSchoolByData(school);
                        }, 100);
                    });

                    map.flyTo([school.lat, school.lng], 16);
                };
                
                suggestionsBox.appendChild(button);
            });
            
            suggestionsBox.classList.remove('d-none');
        })
        .catch(error => console.error(error));
});

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.add('d-none');
    }
});