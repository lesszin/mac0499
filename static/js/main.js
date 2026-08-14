let userLocationMarker = null;
let userLocation = null;
let comparisonCandidateMarker = null;
let comparisonMapMode =
    sessionStorage.getItem("comparisonMapMode") === "true";
let comparisonPrincipalSchool = null;
const storedPrincipalSchool =
    sessionStorage.getItem("comparisonPrincipalSchool");
if (storedPrincipalSchool) {
    comparisonPrincipalSchool =
        JSON.parse(storedPrincipalSchool);
}
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
const allMapFilters = document.querySelectorAll(
    ".modality-filter, .administrative-filter, .private-category-filter, .location-filter"
);
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
    html: `
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 384 512" 
            width="28" 
            height="40" 
            style="filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.3));">
            <path 
                fill="#dc3545" 
                d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/>
        </svg>
    `,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
});

const greenIcon = L.divIcon({
    className: "marker-no-bg",
    html: `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 384 512"
            width="28"
            height="40"
            style="filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.3));">
            <path
                fill="#198754"
                d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/>
        </svg>
    `,
    iconSize: [28, 40],
    iconAnchor: [14, 40]
});

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    return R * c;
}

document
    .querySelectorAll(".filter-header-cursor, .filter-subheader")
    .forEach(header => {
        const targetSelector =
            header.getAttribute("data-bs-target");
        const target =
            document.querySelector(targetSelector);
        const arrow =
            header.querySelector(".collapse-arrow");
        if (!target || !arrow) {
            return;
        }
        const updateArrow = () => {
            const isOpen = target.classList.contains("show");

            arrow.classList.toggle(
                "bi-chevron-up",
                isOpen
            );
            arrow.classList.toggle(
                "bi-chevron-down",
                !isOpen
            );
        };
        target.addEventListener(
            "shown.bs.collapse",
            updateArrow
        );
        target.addEventListener(
            "hidden.bs.collapse",
            updateArrow
        );
        updateArrow();
    });

function createMarker(school) {
    const marker = L.circleMarker(
        [school.lat, school.lng],
        dotStyle
    );

    marker.options.schoolData = school;

    marker.on("click", () => {
        if (comparisonMapMode) {
            selectComparisonCandidate(school);
        } else {
            selectSchool(school);
        }
    });

    return marker;
}

function createPin(school) {
    const pin = L.marker(
        [school.lat, school.lng],
        { icon: redIcon }
    );
    pin.on("click", () => showSchoolCard(school));
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

function getSelectedFilters() {
    const getValues = selector => {
        return Array.from(
            document.querySelectorAll(selector)
        )
            .filter(filter => filter.checked)
            .map(filter => filter.value);
    };
    return {
        modalidades: getValues(".modality-filter"),
        dependencias: getValues(".administrative-filter"),
        categorias_privadas: getValues(".private-category-filter"),
        localizacoes: getValues(".location-filter")
    };
}

function canLoadSchools(filters) {
    const hasFilters =
        filters.modalidades.length > 0 ||
        filters.dependencias.length > 0 ||
        filters.categorias_privadas.length > 0 ||
        filters.localizacoes.length > 0;

    if (!hasFilters) {
        clearVisibleMarkers();
        return false;
    }
    if (map.getZoom() < 5) {
        clearVisibleMarkers();
        return false;
    }
    return true;
}

function createSchoolsUrl(filters) {
    const bounds = map.getBounds();
    const params = new URLSearchParams();
    params.set(
        "modalidades",
        filters.modalidades.join(",")
    );
    params.set(
        "dependencias",
        filters.dependencias.join(",")
    );
    params.set(
        "categorias_privadas",
        filters.categorias_privadas.join(",")
    );
    params.set(
        "localizacoes",
        filters.localizacoes.join(",")
    );
    params.set(
        "lat_min",
        bounds.getSouth()
    );
    params.set(
        "lat_max",
        bounds.getNorth()
    );
    params.set(
        "lng_min",
        bounds.getWest()
    );
    params.set(
        "lng_max",
        bounds.getEast()
    );
    return `/api/escolas-mapa?${params.toString()}`;
}
function fetchSchools(filters) {
    return fetch(createSchoolsUrl(filters))
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
    const filters = getSelectedFilters();
    if (!canLoadSchools(filters)) {
        return;
    }
    return fetchSchools(filters)
        .then(updateVisibleSchools)
        .catch(console.error);
}
function selectSchool(schoolData) {
    selectedLayer.clearLayers();
    selectedSchoolCode = null;
    if (schoolData.lat != null && schoolData.lng != null) {
        let marker = schoolMarkers.get(schoolData.codigo);
        if (!marker) {
            marker = addMarker(schoolData);
        }
        const pin = createPin(schoolData);
        selectedLayer.addLayer(pin);
    }
    showSchoolCard(schoolData);
    selectedSchoolCode = schoolData.codigo;
}

function searchSchools(term) {
    return fetch(`/api/busca/${term}`)
        .then(response => response.json());
}

function showSchoolCard(school, comparisonMode = false) {
    const card = document.getElementById("schoolCard");
    const body = document.getElementById("schoolCardBody");
    const hasCoordinates =
        school.lat != null &&
        school.lng != null;

    const locationMessage = hasCoordinates
        ? ""
        : `
            <div class="alert alert-warning py-2 mt-2 mb-2">
                Esta escola não possui coordenadas geográficas cadastradas e, por isso, não pode ser exibida no mapa.
            </div>
        `;

    let distanceHtml = "";

    if (
        userLocation &&
        hasCoordinates
    ) {
        const distance = calculateDistanceKm(
            userLocation.lat,
            userLocation.lng,
            school.lat,
            school.lng
        );

        distanceHtml = `
            <span class="text-muted">
                ${distance.toFixed(1).replace(".", ",")} km
            </span>
        `;
    }

    const actionHtml = comparisonMode
        ? `
            <button
                id="compareSelectedSchool"
                type="button"
                class="btn btn-success btn-sm">
                Comparar com esta escola
            </button>
        `
        : `
            <a
                href="/escola/${school.codigo}"
                class="btn btn-primary btn-sm">
                Ver ficha técnica
            </a>
        `;

    body.innerHTML = `
        <h6 class="fw-bold mb-1">
            ${school.nome}
        </h6>

        <div class="d-flex justify-content-between mb-2">
            <p class="text-muted mb-0">
                ${school.cidade}, ${school.estado}
            </p>

            ${distanceHtml}
        </div>

        ${locationMessage}

        ${actionHtml}
    `;

    card.classList.remove("d-none");

    if (comparisonMode) {
        document
            .getElementById("compareSelectedSchool")
            .addEventListener("click", () => {
                selectComparisonSchoolFromMap(school);
            });
    }
}

function selectComparisonSchoolFromMap(school) {
    sessionStorage.setItem(
        "comparisonSelectedSchool",
        JSON.stringify(school)
    );

    sessionStorage.removeItem(
        "comparisonMapMode"
    );

    sessionStorage.removeItem(
        "comparisonPrincipalSchoolCode"
    );

    const returnUrl =
        sessionStorage.getItem(
            "comparisonReturnUrl"
        );

    window.location.href =
        returnUrl || "/";
}

function selectComparisonCandidate(school) {
    if (
        school.lat == null ||
        school.lng == null
    ) {
        showSchoolCard(school, true);
        return;
    }

    if (comparisonCandidateMarker) {
        selectedLayer.removeLayer(
            comparisonCandidateMarker
        );
    }

    comparisonCandidateMarker = L.marker(
        [school.lat, school.lng],
        { icon: greenIcon }
    );

    selectedLayer.addLayer(
        comparisonCandidateMarker
    );

    showSchoolCard(school, true);
}

function hideSchoolCard() {
    document.getElementById("schoolCard")
        .classList.add("d-none");
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
    let distanceHtml = "";
    if (
        userLocation &&
        school.lat != null &&
        school.lng != null
    ) {
        const distance = calculateDistanceKm(
            userLocation.lat,
            userLocation.lng,
            school.lat,
            school.lng
        );
        distanceHtml = `
            <span class="text-muted">
                ${distance.toFixed(1).replace(".", ",")} km
            </span>
        `;
    }
    button.innerHTML = `
        <div class="fw-bold text-dark">
            ${school.nome}
        </div>
        <div class="d-flex justify-content-between">
            <small class="text-muted">
                ${school.cidade} - ${school.estado}
            </small>
            ${distanceHtml}
        </div>
    `;
    button.onclick = () => {
        console.log(school);
        hideSuggestionsBox();
        searchInput.value = "";
        if (school.lat != null && school.lng != null) {
            map.once("moveend", () => {
                setTimeout(() => selectSchool(school), 100);
            });
            map.flyTo(
                [school.lat, school.lng],
                16
            );
        } else {
            selectSchool(school);
        }
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

function updatePrivateCategoryDependency() {
    const privateCategories = document.querySelectorAll(
        ".private-category-filter"
    );

    const hasPrivateCategory = Array.from(privateCategories)
        .some(filter => filter.checked);

    const dependencyFilters = document.querySelectorAll(
        ".administrative-filter"
    );

    const privateDependency = document.querySelector(
        '.administrative-filter[value="privada"]'
    );

    if (hasPrivateCategory) {
        dependencyFilters.forEach(filter => {
            filter.checked = filter === privateDependency;
        });
    }
}

map.on('moveend', loadSchoolsOnMap);

allMapFilters.forEach(filter => {
    filter.addEventListener("change", loadSchoolsOnMap);
});

document
    .querySelectorAll(".private-category-filter")
    .forEach(filter => {
        filter.addEventListener("change", () => {
            updatePrivateCategoryDependency();
            loadSchoolsOnMap();
        });
    });

window.addEventListener("load", () => {
    allMapFilters.forEach(filter => {
        filter.checked = false;
    });

    schoolLayer.clearLayers();
    selectedLayer.clearLayers();
    schoolMarkers.clear();

    selectedSchoolCode = null;

    hideSchoolCard();

    if (comparisonMapMode) {
        document
            .getElementById("schoolSearchBox")
            .classList.add("d-none");

        document
            .getElementById("comparisonBackButton")
            .classList.remove("d-none");
    }

    const principalSchoolCode =
        sessionStorage.getItem(
            "comparisonPrincipalSchoolCode"
        );

    if (
        comparisonMapMode &&
        principalSchoolCode
    ) {
        fetch(
            `/api/escola-localizacao/${principalSchoolCode}`
        )
            .then(response => response.json())
            .then(school => {
                if (school.erro) {
                    console.error(school.erro);
                    return;
                }

                comparisonPrincipalSchool = school;

                selectedSchoolCode =
                    school.codigo;

                if (
                    school.lat != null &&
                    school.lng != null
                ) {
                    const pin = createPin(school);

                    selectedLayer.clearLayers();
                    selectedLayer.addLayer(pin);

                    map.setView(
                        [school.lat, school.lng],
                        14
                    );
                }
            })
            .catch(console.error);
    }
});

searchInput.addEventListener("input", onSearchInput);

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        hideSuggestionsBox();
    }
});

document
    .getElementById("closeSchoolCard")
    .addEventListener("click", () => {
        hideSchoolCard();

        if (comparisonMapMode) {
            if (comparisonCandidateMarker) {
                selectedLayer.removeLayer(
                    comparisonCandidateMarker
                );

                comparisonCandidateMarker = null;
            }

            return;
        }

        selectedLayer.clearLayers();
        selectedSchoolCode = null;
    });

const locateButton =
    document.getElementById("locateButton");

locateButton.addEventListener("click", () => {
    map.locate({
        setView: true,
        maxZoom: 16
    });
});

map.on("locationfound", function (e) {
    userLocation = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
    };
    const userIcon = L.divIcon({
        className: "user-location-marker",
        html: '<div class="user-location-dot"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });
    if (userLocationMarker) {
        userLocationMarker.setLatLng(e.latlng);
    } else {
        userLocationMarker = L.marker(
            e.latlng,
            { icon: userIcon }
        ).addTo(map);
    }
});

map.on("locationerror", function (e) {
    console.error(
        "Não foi possível obter a localização:",
        e.message
    );
});

document
    .getElementById("comparisonBackButton")
    .addEventListener("click", () => {
        const returnUrl =
            sessionStorage.getItem(
                "comparisonReturnUrl"
            );

        sessionStorage.removeItem(
            "comparisonMapMode"
        );

        sessionStorage.removeItem(
            "comparisonPrincipalSchoolCode"
        );

        window.location.href =
            returnUrl || "/";
    });