function initializeMapSpatial({
    map,
    mapSearch,
    mapAdministrative,
    schoolLayer,
    selectedLayer,
    schoolMarkers,
    setSelectedSchoolCode
}) {

    let spatialAnalysisLayer = null;
    let spatialAnalysisMode = false;
    let proportionalSymbolLayer = null;

    const spatialModalityFilter =
        document.getElementById(
            "spatialModalityFilter"
        );

    const spatialDependencyFilter =
        document.getElementById(
            "spatialDependencyFilter"
        );

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

    function resetSpatialFilters() {

        if (spatialModalityFilter) {
            spatialModalityFilter.value = "";
        }

        if (spatialDependencyFilter) {
            spatialDependencyFilter.value = "";
        }

        if (spatialProportionalModalityFilter) {
            spatialProportionalModalityFilter.value = "";
        }

        if (spatialProportionalGenderFilter) {
            spatialProportionalGenderFilter.value = "";
        }

        if (spatialProportionalRaceFilter) {
            spatialProportionalRaceFilter.value = "";
        }
    }

    function handleProportionalFilterChange(
        selectedFilter
    ) {

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

    async function loadSpatialAnalysis() {
        try {
            const dependency =
                spatialDependencyFilter
                    ? spatialDependencyFilter.value
                    : "";

            const modality =
                spatialModalityFilter
                    ? spatialModalityFilter.value
                    : "";

            if (!dependency && !modality) {

                if (spatialAnalysisLayer) {
                    map.removeLayer(
                        spatialAnalysisLayer
                    );

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

            if (spatialProportionalModalityFilter) {
                spatialProportionalModalityFilter.value = "";
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

    async function loadProportionalSymbolMap() {
        try {

            const modality =
                spatialProportionalModalityFilter
                    ? spatialProportionalModalityFilter.value
                    : "";

            const gender =
                spatialProportionalGenderFilter
                    ? spatialProportionalGenderFilter.value
                    : "";

            const race =
                spatialProportionalRaceFilter
                    ? spatialProportionalRaceFilter.value
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

            const bounds =
                map.getBounds();

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

    function enterSpatialAnalysisMode() {

        if (spatialAnalysisMode) {
            return;
        }

        spatialAnalysisMode = true;

        mapAdministrative.clearAdministrativeDivisionLayer();

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

        const administrativeDivisionCard =
            document.getElementById(
                "administrativeDivisionCard"
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

        mapSearch.clearSuggestions();

        mapSearch.hideSchoolCard();

        mapAdministrative.hideAdministrativeDivisionCard();

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

        if (administrativeDivisionCard) {
            administrativeDivisionCard.classList.add(
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

        setSelectedSchoolCode(null);

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

        if (spatialDependencyFilter) {
            spatialDependencyFilter.value = "";
        }
    }

    function exitSpatialAnalysisMode() {

        if (!spatialAnalysisMode) {
            return;
        }

        spatialAnalysisMode = false;

        mapAdministrative.clearAdministrativeDivisionLayer();

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

        mapSearch.hideSchoolCard();

        mapSearch.clearSuggestions();

        selectedLayer.clearLayers();

        schoolLayer.clearLayers();

        schoolMarkers.clear();

        setSelectedSchoolCode(null);

        resetSpatialFilters();

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

        mapAdministrative.updateAdministrativeConfirmButton();
    }

    function handleMapMoveEnd() {

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
    }

    if (
        spatialModalityFilter &&
        spatialDependencyFilter
    ) {
        spatialModalityFilter.addEventListener(
            "change",
            () => {

                spatialDependencyFilter.value = "";

                loadSpatialAnalysis();
            }
        );

        spatialDependencyFilter.addEventListener(
            "change",
            () => {

                spatialModalityFilter.value = "";

                loadSpatialAnalysis();
            }
        );
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

    const spatialAnalysisEntry =
        document.getElementById(
            "spatialAnalysisEntry"
        );

    if (spatialAnalysisEntry) {
        spatialAnalysisEntry.addEventListener(
            "click",
            enterSpatialAnalysisMode
        );
    }

    const spatialAnalysisBackButton =
        document.getElementById(
            "spatialAnalysisBackButton"
        );

    if (spatialAnalysisBackButton) {
        spatialAnalysisBackButton.addEventListener(
            "click",
            exitSpatialAnalysisMode
        );
    }

    window.addEventListener(
        "load",
        resetSpatialFilters
    );

    return {
        enterSpatialAnalysisMode,
        exitSpatialAnalysisMode,
        loadSpatialAnalysis,
        loadProportionalSymbolMap,
        handleMapMoveEnd,
        isSpatialAnalysisMode: () =>
            spatialAnalysisMode
    };
}

export {
    initializeMapSpatial
};