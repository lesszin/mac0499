import {
    initializeMapSearch
} from "./map-search.js";
import {
    initializeMapFilters
} from "./map-filters.js";
import {
    initializeMapAdministrative
} from "./map-administrative.js";
import {
    initializeMapSpatial
} from "./map-spatial.js";
import {
    initializeMapComparison
} from "./map-comparison.js";

let userLocationMarker = null;
let userLocation = null;

const map = L.map('mapContainer', { zoomControl: false }).setView([-23.55052, -46.633308], 13);
L.control.zoom({ position: 'bottomleft' }).addTo(map);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }
).addTo(map);
const schoolLayer = L.layerGroup().addTo(map);
const selectedLayer = L.layerGroup().addTo(map);
const schoolMarkers = new Map();
let selectedSchoolCode = null;

const mapSearch =
    initializeMapSearch({
        map,
        schoolLayer,
        selectedLayer,
        schoolMarkers,
        addMarker,
        createPin,
        getUserLocation: () =>
            userLocation,
        onComparisonSchoolSelected:
            school =>
                mapComparison.selectComparisonSchoolFromMap(
                    school
                ),
        setSelectedSchoolCode: value => {
            selectedSchoolCode = value;
        }
    });

const mapFilters =
    initializeMapFilters({
        map,
        schoolLayer,
        schoolMarkers,
        addMarker,
        getSelectedSchoolCode: () =>
            selectedSchoolCode
    });

const mapAdministrative =
    initializeMapAdministrative({
        map,
        hideSchoolCard:
            mapSearch.hideSchoolCard
    });

const mapSpatial =
    initializeMapSpatial({
        map,
        mapSearch,
        mapAdministrative,
        schoolLayer,
        selectedLayer,
        schoolMarkers,
        setSelectedSchoolCode: value => {
            selectedSchoolCode = value;
        }
    });

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

const mapComparison =
    initializeMapComparison({
        map,
        selectedLayer,
        mapSearch,
        createPin,
        greenIcon,
        setSelectedSchoolCode: value => {
            selectedSchoolCode = value;
        }
    });

const savedUserLocation = localStorage.getItem("userLocation");

if (savedUserLocation) {
    try {
        userLocation = JSON.parse(savedUserLocation);
    } catch (error) {
        console.error(
            "Erro ao recuperar localização:",
            error
        );

        localStorage.removeItem("userLocation");
    }
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

function renderSavedUserLocation() {
    const savedLocation = localStorage.getItem("userLocation");

    if (!savedLocation) {
        return;
    }

    try {
        userLocation = JSON.parse(savedLocation);

        const userIcon = L.divIcon({
            className: "user-location-marker",
            html: '<div class="user-location-dot"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });

        const latLng = [
            userLocation.lat,
            userLocation.lng
        ];

        if (userLocationMarker) {
            userLocationMarker.setLatLng(latLng);
        } else {
            userLocationMarker = L.marker(
                latLng,
                { icon: userIcon }
            ).addTo(map);
        }

    } catch (error) {
        console.error(
            "Erro ao recuperar localização salva:",
            error
        );

        localStorage.removeItem("userLocation");
        userLocation = null;
    }
}

function createMarker(school) {
    const marker = L.circleMarker(
        [school.lat, school.lng],
        dotStyle
    );

    marker.options.schoolData =
        school;

    marker.on(
        "click",
        () => {
            mapComparison.handleSchoolMarkerClick(
                school
            );
        }
    );

    return marker;
}

function createPin(school) {
    const pin = L.marker(
        [school.lat, school.lng],
        { icon: redIcon }
    );
    pin.on("click", () => mapSearch.showSchoolCard(school));
    return pin;
}

function addMarker(school) {
    const marker = createMarker(school);
    schoolMarkers.set(school.codigo, marker);
    schoolLayer.addLayer(marker);
    return marker;
}

map.on('moveend', () => {

    if (mapSpatial.isSpatialAnalysisMode()) {
        mapSpatial.handleMapMoveEnd();
        return;
    }

    mapFilters.loadSchoolsOnMap();
});

window.addEventListener("load", () => {
    document
        .querySelectorAll(
            ".modality-filter, " +
            ".administrative-filter, " +
            ".private-category-filter, " +
            ".location-filter"
        )
        .forEach(filter => {
            filter.checked = false;
        });

    schoolLayer.clearLayers();

    selectedLayer.clearLayers();

    schoolMarkers.clear();

    renderSavedUserLocation();

    selectedSchoolCode = null;

    const administrativeCountryFilter =
        document.getElementById(
            "administrativeCountryFilter"
        );

    const administrativeRegionFilter =
        document.getElementById(
            "administrativeRegionFilter"
        );

    const administrativeUfFilter =
        document.getElementById(
            "administrativeUfFilter"
        );

    const administrativeMunicipalityFilter =
        document.getElementById(
            "administrativeMunicipalityFilter"
        );

    if (administrativeCountryFilter) {
        administrativeCountryFilter.value = "";
    }

    if (administrativeRegionFilter) {
        administrativeRegionFilter.innerHTML = `
            <option value="" selected disabled>
                Selecione...
            </option>
        `;

        administrativeRegionFilter.value = "";
        administrativeRegionFilter.disabled = true;
    }

    if (administrativeUfFilter) {
        administrativeUfFilter.innerHTML = `
            <option value="" selected disabled>
                Selecione...
            </option>
        `;

        administrativeUfFilter.value = "";
        administrativeUfFilter.disabled = true;
    }

    if (administrativeMunicipalityFilter) {
        administrativeMunicipalityFilter.innerHTML = `
            <option value="" selected disabled>
                Selecione...
            </option>
        `;

        administrativeMunicipalityFilter.value = "";
        administrativeMunicipalityFilter.disabled = true;
    }

    mapSearch.hideSchoolCard();

    mapAdministrative.loadAdministrativeCountries();

    mapAdministrative.updateAdministrativeConfirmButton();

    mapSearch.restoreSchoolFromSheet();

    mapAdministrative.restoreAdministrativeDivisionFromSheet();
});

document
    .getElementById(
        "closeAdministrativeDivisionCard"
    )
    .addEventListener(
        "click",
        mapAdministrative.hideAdministrativeDivisionCard
    );

document
    .getElementById("closeSchoolCard")
    .addEventListener(
        "click",
        () => {

            mapSearch.hideSchoolCard();

            if (
                mapComparison.isComparisonMapMode()
            ) {
                mapComparison.clearComparisonCandidate();

                return;
            }

            selectedLayer.clearLayers();

            selectedSchoolCode = null;
        }
    );

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

    localStorage.setItem(
        "userLocation",
        JSON.stringify(userLocation)
    );

    renderSavedUserLocation();
});

map.on("locationerror", function (e) {
    console.error(
        "Não foi possível obter a localização:",
        e.message
    );
});