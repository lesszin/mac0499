let userLocationMarker = null;
let userLocation = null;
let comparisonCandidateMarker = null;
let comparisonMapMode =
    sessionStorage.getItem("comparisonMapMode") === "true";
let comparisonPrincipalSchool = null;
let spatialAnalysisLayer = null;
let spatialAnalysisMode = false;
let proportionalSymbolLayer = null;
let administrativeDivisionLayer = null;
const storedPrincipalSchool =
    sessionStorage.getItem("comparisonPrincipalSchool");
if (storedPrincipalSchool) {
    comparisonPrincipalSchool =
        JSON.parse(storedPrincipalSchool);
}
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

const savedUserLocation =
    sessionStorage.getItem("userLocation");

if (savedUserLocation) {
    try {
        userLocation = JSON.parse(savedUserLocation);
    } catch (error) {
        console.error(
            "Erro ao recuperar localização:",
            error
        );

        sessionStorage.removeItem("userLocation");
    }
}

const spatialModalityFilter =
    document.getElementById("spatialModalityFilter");

const spatialDependencyFilter =
    document.getElementById("spatialDependencyFilter");

if (spatialModalityFilter && spatialDependencyFilter) {

    spatialModalityFilter.addEventListener("change", () => {

        spatialDependencyFilter.value = "";

        loadSpatialAnalysis();
    });

    spatialDependencyFilter.addEventListener("change", () => {

        spatialModalityFilter.value = "";

        loadSpatialAnalysis();
    });
}

const spatialProportionalModalityFilter =
    document.getElementById(
        "spatialProportionalModalityFilter"
    );

const spatialProportionalGenderFilter =
    document.getElementById(
        "spatialProportionalGenderFilter"
    );

const spatialProportionalRaceFilter =
    document.getElementById(
        "spatialProportionalRaceFilter"
    );

const proportionalFilters = [
    spatialProportionalModalityFilter,
    spatialProportionalGenderFilter,
    spatialProportionalRaceFilter
];

const administrativeCountryFilter =
    document.getElementById(
        "administrativeCountryFilter"
    );

if (administrativeCountryFilter) {
    administrativeCountryFilter.addEventListener(
        "change",
        async () => {

            const regionFilter =
                document.getElementById(
                    "administrativeRegionFilter"
                );

            const ufFilter =
                document.getElementById(
                    "administrativeUfFilter"
                );

            const municipalityFilter =
                document.getElementById(
                    "administrativeMunicipalityFilter"
                );

            if (ufFilter) {
                ufFilter.innerHTML = `
                    <option value="" selected disabled>
                        Selecione...
                    </option>
                `;

                ufFilter.value = "";
                ufFilter.disabled = true;
            }

            if (municipalityFilter) {
                municipalityFilter.innerHTML = `
                    <option value="" selected disabled>
                        Selecione...
                    </option>
                `;

                municipalityFilter.value = "";
                municipalityFilter.disabled = true;
            }

            if (regionFilter) {
                regionFilter.innerHTML = `
                    <option value="" selected disabled>
                        Selecione...
                    </option>
                `;

                regionFilter.value = "";
                regionFilter.disabled = true;
            }

            updateAdministrativeConfirmButton();

            if (
                !administrativeCountryFilter.value ||
                !regionFilter
            ) {
                return;
            }

            try {
                const response =
                    await fetch(
                        "/api/divisoes/regioes"
                    );

                if (!response.ok) {
                    throw new Error(
                        `Erro ao carregar regiões: ${response.status}`
                    );
                }

                const regions =
                    await response.json();

                regions.forEach(region => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        region.codigo;

                    option.textContent =
                        region.nome;

                    regionFilter.appendChild(
                        option
                    );
                });

                regionFilter.disabled =
                    regions.length === 0;

                updateAdministrativeConfirmButton();

            } catch (error) {
                console.error(
                    "Erro ao carregar regiões:",
                    error
                );
            }
        }
    );
}

const administrativeRegionFilter =
    document.getElementById(
        "administrativeRegionFilter"
    );

if (administrativeRegionFilter) {
    administrativeRegionFilter.addEventListener(
        "change",
        async () => {

            const region =
                administrativeRegionFilter.value;

            const ufFilter =
                document.getElementById(
                    "administrativeUfFilter"
                );

            const municipalityFilter =
                document.getElementById(
                    "administrativeMunicipalityFilter"
                );

            if (ufFilter) {
                ufFilter.innerHTML = `
                    <option value="" selected disabled>
                        Selecione...
                    </option>
                `;

                ufFilter.disabled = true;
            }

            if (municipalityFilter) {
                municipalityFilter.innerHTML = `
                    <option value="" selected disabled>
                        Selecione...
                    </option>
                `;

                municipalityFilter.disabled = true;
            }

            if (!region || !ufFilter) {
                return;
            }

            try {
                const response =
                    await fetch(
                        `/api/divisoes/ufs?regiao=${encodeURIComponent(region)}`
                    );

                if (!response.ok) {
                    throw new Error(
                        `Erro ao carregar UFs: ${response.status}`
                    );
                }

                const ufs =
                    await response.json();

                ufs.forEach(uf => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        uf.codigo;

                    option.textContent =
                        uf.nome;

                    ufFilter.appendChild(
                        option
                    );
                });

                ufFilter.disabled =
                    ufs.length === 0;
                
                updateAdministrativeConfirmButton();

            } catch (error) {
                console.error(
                    "Erro ao carregar UFs:",
                    error
                );
            }
        }
    );
}

const administrativeUfFilter =
    document.getElementById(
        "administrativeUfFilter"
    );

if (administrativeUfFilter) {
    administrativeUfFilter.addEventListener(
        "change",
        async () => {

            const uf =
                administrativeUfFilter.value;

            const municipalityFilter =
                document.getElementById(
                    "administrativeMunicipalityFilter"
                );

            if (!municipalityFilter) {
                return;
            }

            municipalityFilter.innerHTML = `
                <option value="" selected disabled>
                    Selecione...
                </option>
            `;

            municipalityFilter.disabled = true;

            if (!uf) {
                return;
            }

            try {
                const response =
                    await fetch(
                        `/api/divisoes/municipios?uf=${encodeURIComponent(uf)}`
                    );

                if (!response.ok) {
                    throw new Error(
                        `Erro ao carregar municípios: ${response.status}`
                    );
                }

                const municipios =
                    await response.json();

                municipios.forEach(municipio => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        municipio.codigo;

                    option.textContent =
                        municipio.nome;

                    municipalityFilter.appendChild(
                        option
                    );
                });

                municipalityFilter.disabled =
                    municipios.length === 0;
                
                updateAdministrativeConfirmButton();

            } catch (error) {
                console.error(
                    "Erro ao carregar municípios:",
                    error
                );
            }
        }
    );
}

const administrativeMunicipalityFilter =
    document.getElementById(
        "administrativeMunicipalityFilter"
    );

if (administrativeMunicipalityFilter) {
    administrativeMunicipalityFilter.addEventListener(
        "change",
        () => {
            updateAdministrativeConfirmButton();
        }
    );
}

const confirmAdministrativeFilter =
    document.getElementById(
        "confirmAdministrativeFilter"
    );

if (confirmAdministrativeFilter) {
    confirmAdministrativeFilter.addEventListener(
        "click",
        async () => {

            const countryFilter =
                document.getElementById(
                    "administrativeCountryFilter"
                );

            const regionFilter =
                document.getElementById(
                    "administrativeRegionFilter"
                );

            const ufFilter =
                document.getElementById(
                    "administrativeUfFilter"
                );

            const municipalityFilter =
                document.getElementById(
                    "administrativeMunicipalityFilter"
                );

            let tipo = "";
            let codigo = "";

            if (
                municipalityFilter &&
                municipalityFilter.value
            ) {
                tipo = "municipio";
                codigo =
                    municipalityFilter.value;

            } else if (
                ufFilter &&
                ufFilter.value
            ) {
                tipo = "uf";
                codigo =
                    ufFilter.value;

            } else if (
                regionFilter &&
                regionFilter.value
            ) {
                tipo = "regiao";
                codigo =
                    regionFilter.value;

            } else if (
                countryFilter &&
                countryFilter.value
            ) {
                tipo = "pais";
                codigo =
                    countryFilter.value;
            }

            if (!tipo || !codigo) {
                return;
            }

            await loadAdministrativeDivision(
                tipo,
                codigo
            );
        }
    );
}

function updateAdministrativeConfirmButton() {
    const countryFilter =
        document.getElementById(
            "administrativeCountryFilter"
        );

    const regionFilter =
        document.getElementById(
            "administrativeRegionFilter"
        );

    const ufFilter =
        document.getElementById(
            "administrativeUfFilter"
        );

    const municipalityFilter =
        document.getElementById(
            "administrativeMunicipalityFilter"
        );

    const confirmButton =
        document.getElementById(
            "confirmAdministrativeFilter"
        );

    if (!confirmButton) {
        return;
    }

    const hasSelection =
        Boolean(
            (countryFilter &&
                countryFilter.value) ||
            (regionFilter &&
                regionFilter.value) ||
            (ufFilter &&
                ufFilter.value) ||
            (municipalityFilter &&
                municipalityFilter.value)
        );

    confirmButton.disabled =
        !hasSelection;
}

async function loadAdministrativeCountries() {
    const countryFilter =
        document.getElementById(
            "administrativeCountryFilter"
        );

    if (!countryFilter) {
        return;
    }

    try {
        const response =
            await fetch(
                "/api/divisoes/pais"
            );

        if (!response.ok) {
            throw new Error(
                `Erro ao carregar país: ${response.status}`
            );
        }

        const countries =
            await response.json();

        countryFilter.innerHTML = `
            <option value="" selected disabled>
                Selecione...
            </option>
        `;

        countries.forEach(country => {

            const option =
                document.createElement("option");

            option.value =
                country.codigo;

            option.textContent =
                country.nome;

            countryFilter.appendChild(
                option
            );
        });

    } catch (error) {
        console.error(
            "Erro ao carregar países:",
            error
        );
    }
}

async function loadAdministrativeDivision(
    tipo,
    codigo
) {
    try {
        const url =
            `/api/divisoes/geometria?tipo=${encodeURIComponent(tipo)}&codigo=${encodeURIComponent(codigo)}`;

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Erro ao carregar geometria: ${response.status}`
            );
        }

        const geojson =
            await response.json();

        if (administrativeDivisionLayer) {
            map.removeLayer(
                administrativeDivisionLayer
            );

            administrativeDivisionLayer = null;
        }

        administrativeDivisionLayer =
            L.geoJSON(
                geojson,
                {
                    style: {
                        color: "#007bff",
                        weight: 2,
                        opacity: 0.9,
                        fillColor: "#007bff",
                        fillOpacity: 0.12
                    }
                }
            ).addTo(map);

        const bounds =
            administrativeDivisionLayer.getBounds();

        if (bounds.isValid()) {
            map.fitBounds(
                bounds,
                {
                    padding: [30, 30]
                }
            );
        }

    } catch (error) {
        console.error(
            "Erro ao desenhar divisão administrativa:",
            error
        );

        if (administrativeDivisionLayer) {
            map.removeLayer(
                administrativeDivisionLayer
            );

            administrativeDivisionLayer = null;
        }
    }
}

function handleProportionalFilterChange(
    selectedFilter
) {
    const spatialModalityFilter =
        document.getElementById(
            "spatialModalityFilter"
        );

    const spatialDependencyFilter =
        document.getElementById(
            "spatialDependencyFilter"
        );

    if (spatialAnalysisLayer) {
        map.removeLayer(
            spatialAnalysisLayer
        );

        spatialAnalysisLayer = null;
    }

    if (spatialModalityFilter) {
        spatialModalityFilter.value = "";
    }

    if (spatialDependencyFilter) {
        spatialDependencyFilter.value = "";
    }

    proportionalFilters.forEach(filter => {
        if (
            filter &&
            filter !== selectedFilter
        ) {
            filter.value = "";
        }
    });

    loadProportionalSymbolMap();
}


proportionalFilters.forEach(filter => {

    if (!filter) {
        return;
    }

    filter.addEventListener(
        "change",
        () => {
            handleProportionalFilterChange(
                filter
            );
        }
    );

});

async function loadSpatialAnalysis() {
    try {
        const dependencyFilter =
            document.getElementById("spatialDependencyFilter");

        const modalityFilter =
            document.getElementById("spatialModalityFilter");

        const dependency = dependencyFilter
            ? dependencyFilter.value
            : "";

        const modality = modalityFilter
            ? modalityFilter.value
            : "";

        if (!dependency && !modality) {
            if (spatialAnalysisLayer) {
                map.removeLayer(spatialAnalysisLayer);
                spatialAnalysisLayer = null;
            }
            return;
        }

        if (proportionalSymbolLayer) {
            map.removeLayer(
                proportionalSymbolLayer
            );

            proportionalSymbolLayer = null;
        }

        const proportionalModalityFilter =
            document.getElementById(
                "spatialProportionalModalityFilter"
            );

        if (proportionalModalityFilter) {
            proportionalModalityFilter.value = "";
        }

        let url =
            "/api/analise-espacial/escolas";

        const params =
            new URLSearchParams();

        if (
            dependency &&
            dependency !== "todas"
        ) {
            params.set(
                "dependencia",
                dependency
            );
        }

        if (
            modality &&
            modality !== "todas"
        ) {
            params.set(
                "modalidade",
                modality
            );
        }

        const queryString =
            params.toString();

        if (queryString) {
            url += `?${queryString}`;
        }

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Erro ao carregar dados da análise espacial: ${response.status}`
            );
        }

        const schools =
            await response.json();

        const points =
            schools.map(school => [
                school.lat,
                school.lng,
                1
            ]);

        if (spatialAnalysisLayer) {
            map.removeLayer(
                spatialAnalysisLayer
            );

            spatialAnalysisLayer = null;
        }

        spatialAnalysisLayer =
            L.heatLayer(
                points,
                {
                    radius: 20,
                    blur: 15,
                    maxZoom: 8
                }
            ).addTo(map);

        console.log(
            `Análise espacial: ${points.length} escolas encontradas`
        );

    } catch (error) {
        console.error(
            "Erro na análise espacial:",
            error
        );

        if (spatialAnalysisLayer) {
            map.removeLayer(
                spatialAnalysisLayer
            );

            spatialAnalysisLayer = null;
        }
    }
}

function enterSpatialAnalysisMode() {
    if (spatialAnalysisMode) {
        return;
    }

    spatialAnalysisMode = true;

    if (administrativeDivisionLayer) {
        map.removeLayer(administrativeDivisionLayer);
        administrativeDivisionLayer = null;
    }
    
    const filtersPanel =
        document.querySelector(
            ".filters-panel"
        );

    const administrativeFilterPanel =
        document.getElementById(
            "administrativeFilterPanel"
        );

    const spatialOptionsPanel =
        document.getElementById(
            "spatialOptionsPanel"
        );

    const searchBox =
        document.getElementById(
            "schoolSearchBox"
        );

    const schoolCard =
        document.getElementById(
            "schoolCard"
        );

    const analysisEntry =
        document.getElementById(
            "spatialAnalysisEntry"
        );

    const backButton =
        document.getElementById(
            "spatialAnalysisBackButton"
        );

    const mapContainer =
        document.getElementById(
            "mapContainer"
        );

    clearSuggestions();
    hideSchoolCard();

    if (filtersPanel) {
        filtersPanel.classList.add(
            "d-none"
        );
    }

    if (administrativeFilterPanel) {
        administrativeFilterPanel.classList.add(
            "d-none"
        );
    }

    if (spatialOptionsPanel) {
        spatialOptionsPanel.classList.remove(
            "d-none"
        );
    }

    if (searchBox) {
        searchBox.classList.add(
            "d-none"
        );
    }

    if (schoolCard) {
        schoolCard.classList.add(
            "d-none"
        );
    }

    if (analysisEntry) {
        analysisEntry.classList.add(
            "d-none"
        );
    }

    if (backButton) {
        backButton.classList.remove(
            "d-none"
        );
    }

    if (mapContainer) {
        mapContainer.classList.add(
            "spatial-analysis-mode"
        );
    }

    schoolLayer.clearLayers();
    selectedLayer.clearLayers();
    schoolMarkers.clear();

    selectedSchoolCode = null;

    if (spatialAnalysisLayer) {
        map.removeLayer(
            spatialAnalysisLayer
        );

        spatialAnalysisLayer = null;
    }

    const heatmapOptions =
        document.getElementById(
            "heatmapOptions"
        );

    if (heatmapOptions) {
        heatmapOptions.classList.remove(
            "show"
        );
    }

    const dependencyFilter =
        document.getElementById(
            "spatialDependencyFilter"
        );

    if (dependencyFilter) {
        dependencyFilter.value = "";
    }
}

function exitSpatialAnalysisMode() {
    if (!spatialAnalysisMode) {
        return;
    }

    spatialAnalysisMode = false;

    if (administrativeDivisionLayer) {
        map.removeLayer(administrativeDivisionLayer);
        administrativeDivisionLayer = null;
    }

    const filtersPanel =
        document.querySelector(
            ".filters-panel"
        );
    
    const administrativeFilterPanel =
        document.getElementById(
            "administrativeFilterPanel"
        );

    const spatialOptionsPanel =
        document.getElementById(
            "spatialOptionsPanel"
        );

    const searchBox =
        document.getElementById(
            "schoolSearchBox"
        );

    const analysisEntry =
        document.getElementById(
            "spatialAnalysisEntry"
        );

    const backButton =
        document.getElementById(
            "spatialAnalysisBackButton"
        );

    const mapContainer =
        document.getElementById(
            "mapContainer"
        );

    if (spatialAnalysisLayer) {
        map.removeLayer(
            spatialAnalysisLayer
        );

        spatialAnalysisLayer = null;
    }

    if (proportionalSymbolLayer) {
        map.removeLayer(
            proportionalSymbolLayer
        );

        proportionalSymbolLayer = null;
    }

    if (mapContainer) {
        mapContainer.classList.remove(
            "spatial-analysis-mode"
        );
    }

    if (spatialOptionsPanel) {
        spatialOptionsPanel.classList.add(
            "d-none"
        );
    }

    if (filtersPanel) {
        filtersPanel.classList.remove(
            "d-none"
        );
    }

    if (administrativeFilterPanel) {
        administrativeFilterPanel.classList.remove(
            "d-none"
        );
    }

    if (searchBox) {
        searchBox.classList.remove(
            "d-none"
        );
    }

    if (analysisEntry) {
        analysisEntry.classList.remove(
            "d-none"
        );
    }

    if (backButton) {
        backButton.classList.add(
            "d-none"
        );
    }

    allMapFilters.forEach(filter => {
        filter.checked = false;
    });

    hideSchoolCard();
    clearSuggestions();

    selectedLayer.clearLayers();
    schoolLayer.clearLayers();
    schoolMarkers.clear();

    selectedSchoolCode = null;

    const spatialModalityFilter =
    document.getElementById("spatialModalityFilter");

    const spatialDependencyFilter =
        document.getElementById("spatialDependencyFilter");

    if (spatialModalityFilter) {
        spatialModalityFilter.value = "";
    }

    if (spatialDependencyFilter) {
        spatialDependencyFilter.value = "";
    }

    const proportionalModalityFilter =
        document.getElementById(
            "spatialProportionalModalityFilter"
        );
    
    const proportionalGenderFilter =
        document.getElementById(
            "spatialProportionalGenderFilter"
        );

    const proportionalRaceFilter =
        document.getElementById(
            "spatialProportionalRaceFilter"
        );

    if (proportionalModalityFilter) {
        proportionalModalityFilter.value = "";
    }

    if (proportionalGenderFilter) {
        proportionalGenderFilter.value = "";
    }

    if (proportionalRaceFilter) {
        proportionalRaceFilter.value = "";
    }

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

    updateAdministrativeConfirmButton();
}

async function loadProportionalSymbolMap() {
    try {
        const modalityFilter =
            document.getElementById(
                "spatialProportionalModalityFilter"
            );

        const genderFilter =
            document.getElementById(
                "spatialProportionalGenderFilter"
            );

        const raceFilter =
            document.getElementById(
                "spatialProportionalRaceFilter"
            );

        const modality =
            modalityFilter
                ? modalityFilter.value
                : "";

        const gender =
            genderFilter
                ? genderFilter.value
                : "";

        const race =
            raceFilter
                ? raceFilter.value
                : "";

        let tipo = "";
        let indicador = "";

        if (modality) {
            tipo = "modalidade";
            indicador = modality;
        } else if (gender) {
            tipo = "genero";
            indicador = gender;
        } else if (race) {
            tipo = "raca_cor";
            indicador = race;
        }

        if (!tipo || !indicador) {
            if (proportionalSymbolLayer) {
                map.removeLayer(
                    proportionalSymbolLayer
                );

                proportionalSymbolLayer = null;
            }

            return;
        }

        const bounds = map.getBounds();

        const params =
            new URLSearchParams();

        params.set(
            "tipo",
            tipo
        );

        params.set(
            "indicador",
            indicador
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

        const url =
            `/api/analise-espacial/matriculas?${params.toString()}`;

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Erro ao carregar dados de matrículas: ${response.status}`
            );
        }

        const schools =
            await response.json();

        if (proportionalSymbolLayer) {
            map.removeLayer(
                proportionalSymbolLayer
            );

            proportionalSymbolLayer = null;
        }

        if (schools.length === 0) {
            console.log(
                "Nenhuma escola encontrada para o indicador selecionado."
            );

            return;
        }

        const maxValue =
            Math.max(
                ...schools.map(
                    school => school.valor
                )
            );

        const radiusMin = 4;
        const radiusMax = 30;

        proportionalSymbolLayer =
            L.layerGroup();

        schools.forEach(school => {

            const value =
                school.valor;

            let radius =
                radiusMin;

            if (
                maxValue > 0 &&
                value > 0
            ) {
                radius =
                    radiusMin +
                    (
                        Math.sqrt(value) /
                        Math.sqrt(maxValue)
                    ) *
                    (
                        radiusMax -
                        radiusMin
                    );
            }

            const marker =
                L.circleMarker(
                    [
                        school.lat,
                        school.lng
                    ],
                    {
                        radius: radius,
                        fillColor: "#007bff",
                        color: "#fff",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    }
                );

            proportionalSymbolLayer.addLayer(
                marker
            );
        });

        proportionalSymbolLayer.addTo(
            map
        );

        console.log(
            `Mapa proporcional: tipo=${tipo}, indicador=${indicador}, escolas=${schools.length}, valor máximo=${maxValue}`
        );

    } catch (error) {
        console.error(
            "Erro no mapa de símbolo proporcional:",
            error
        );

        if (proportionalSymbolLayer) {
            map.removeLayer(
                proportionalSymbolLayer
            );

            proportionalSymbolLayer = null;
        }
    }
}

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

function setupClearSchoolInput() {
    const input = document.getElementById("schoolInput");
    const button = document.getElementById("clearSchoolInput");

    if (!input || !button) {
        return;
    }

    const updateButton = () => {
        button.classList.toggle(
            "d-none",
            input.value.trim() === ""
        );
    };

    input.addEventListener("input", updateButton);

    button.addEventListener("click", () => {
        input.value = "";

        input.dispatchEvent(
            new Event("input", {
                bubbles: true
            })
        );

        input.focus();
    });

    updateButton();
}

function renderSavedUserLocation() {
    const savedLocation =
        sessionStorage.getItem("userLocation");

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

        sessionStorage.removeItem("userLocation");
        userLocation = null;
    }
}

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

async function restoreSchoolFromSheet() {
    const schoolCode =
        sessionStorage.getItem(
            "returnToSchoolMap"
        );

    if (!schoolCode) {
        return;
    }

    try {
        const response =
            await fetch(
                `/api/escola-localizacao/${schoolCode}`
            );

        if (!response.ok) {
            throw new Error(
                `Erro ao carregar escola: ${response.status}`
            );
        }

        const school =
            await response.json();

        if (school.erro) {
            throw new Error(school.erro);
        }

        if (
            school.lat == null ||
            school.lng == null
        ) {
            return;
        }

        selectedSchoolCode =
            school.codigo;

        const marker =
            createPin(school);

        selectedLayer.clearLayers();
        selectedLayer.addLayer(marker);

        searchInput.value =
            school.nome || "";

        showSuggestions([school]);

        map.flyTo(
            [school.lat, school.lng],
            16
        );

    } catch (error) {
        console.error(
            "Erro ao restaurar escola no mapa:",
            error
        );

    } finally {
        sessionStorage.removeItem(
            "returnToSchoolMap"
        );
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

map.on('moveend', () => {

    if (!spatialAnalysisMode) {
        loadSchoolsOnMap();
        return;
    }

    const proportionalModalityFilter =
        document.getElementById(
            "spatialProportionalModalityFilter"
        );

    const proportionalGenderFilter =
        document.getElementById(
            "spatialProportionalGenderFilter"
        );

    const proportionalRaceFilter =
        document.getElementById(
            "spatialProportionalRaceFilter"
        );

    const proportionalFilterSelected =
        (
            proportionalModalityFilter &&
            proportionalModalityFilter.value
        ) ||
        (
            proportionalGenderFilter &&
            proportionalGenderFilter.value
        ) ||
        (
            proportionalRaceFilter &&
            proportionalRaceFilter.value
        );

    if (proportionalFilterSelected) {
        loadProportionalSymbolMap();
        return;
    }

    loadSpatialAnalysis();
});

allMapFilters.forEach(filter => {
    if (filter.classList.contains("private-category-filter")) {
        return;
    }

    filter.addEventListener(
        "change",
        loadSchoolsOnMap
    );
});

document
    .querySelectorAll(".private-category-filter")
    .forEach(filter => {
        filter.addEventListener(
            "change",
            () => {
                updatePrivateCategoryDependency();
                loadSchoolsOnMap();
            }
        );
    });

window.addEventListener("load", () => {
    allMapFilters.forEach(filter => {
        filter.checked = false;
    });

    schoolLayer.clearLayers();
    selectedLayer.clearLayers();
    schoolMarkers.clear();
    renderSavedUserLocation();
    selectedSchoolCode = null;

    const spatialModalityFilter =
        document.getElementById(
            "spatialModalityFilter"
        );
    
    const proportionalGenderFilter =
        document.getElementById(
            "spatialProportionalGenderFilter"
        );

    const proportionalRaceFilter =
        document.getElementById(
            "spatialProportionalRaceFilter"
        );

    const spatialDependencyFilter =
        document.getElementById(
            "spatialDependencyFilter"
        );

    const proportionalModalityFilter =
        document.getElementById(
            "spatialProportionalModalityFilter"
        );

    if (proportionalModalityFilter) {
        proportionalModalityFilter.value = "";
    }

    if (proportionalGenderFilter) {
        proportionalGenderFilter.value = "";
    }

    if (proportionalRaceFilter) {
        proportionalRaceFilter.value = "";
    }

    if (spatialDependencyFilter) {
        spatialDependencyFilter.value = "";
    }

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

    hideSchoolCard();

    if (comparisonMapMode) {
        document
            .getElementById("schoolSearchBox")
            .classList.add("d-none");
        
        document
            .getElementById("spatialAnalysisEntry")
            .classList.add("d-none");

        document
            .getElementById("administrativeFilterPanel")
            .classList.add("d-none");

        document
            .getElementById("comparisonBackButton")
            .classList.remove("d-none");
        
        document
            .querySelector(".search-panel")
            .classList.add("comparison-map-mode");
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

    loadAdministrativeCountries();
    updateAdministrativeConfirmButton();
    restoreSchoolFromSheet();
});

setupClearSchoolInput();

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

    sessionStorage.setItem(
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

document
    .getElementById("spatialAnalysisEntry")
    .addEventListener(
        "click",
        enterSpatialAnalysisMode
    );

document
    .getElementById("spatialAnalysisBackButton")
    .addEventListener(
        "click",
        exitSpatialAnalysisMode
    );

document
    .getElementById(
        "spatialDependencyFilter"
    )
    .addEventListener(
        "change",
        loadSpatialAnalysis
    );