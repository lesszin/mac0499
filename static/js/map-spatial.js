function initializeMapSpatial({
    map,
    mapSearch,
    mapAdministrative,
    schoolLayer,
    selectedLayer,
    schoolMarkers,
    setSelectedSchoolCode
}) {

    // Camada utilizada pela análise espacial baseada em mapa de calor.
    let spatialAnalysisLayer = null;

    // Indica se o mapa está atualmente no modo de análise espacial.
    let spatialAnalysisMode = false;

    // Camada utilizada pela visualização de símbolos proporcionais.
    let proportionalSymbolLayer = null;


    // Filtro de modalidade utilizado na análise espacial por mapa de calor.
    const spatialModalityFilter =
        document.getElementById(
            "spatialModalityFilter"
        );

    // Filtro de dependência administrativa utilizado na análise espacial.
    const spatialDependencyFilter =
        document.getElementById(
            "spatialDependencyFilter"
        );

    // Filtros utilizados na visualização por símbolos proporcionais.
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


    // Agrupa os filtros de símbolos proporcionais para facilitar
    // o controle de exclusividade entre eles.
    const proportionalFilters = [
        spatialProportionalModalityFilter,
        spatialProportionalGenderFilter,
        spatialProportionalRaceFilter
    ];


    function resetSpatialFilters() {
        /**
         * Restaura todos os filtros da análise espacial para o estado
         * inicial, sem nenhum indicador selecionado.
         */

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
        /**
         * Trata a seleção de um filtro de símbolos proporcionais.
         *
         * Garante que apenas um indicador proporcional permaneça
         * selecionado e recarrega a visualização correspondente.
         *
         * @param {HTMLElement} selectedFilter
         * Filtro proporcional que foi alterado.
         */

        // Remove uma eventual camada anterior da análise espacial.
        if (spatialAnalysisLayer) {
            map.removeLayer(
                spatialAnalysisLayer
            );

            spatialAnalysisLayer = null;
        }

        // Limpa os filtros utilizados no mapa de calor.
        if (spatialModalityFilter) {
            spatialModalityFilter.value = "";
        }

        if (spatialDependencyFilter) {
            spatialDependencyFilter.value = "";
        }

        // Mantém somente o filtro proporcional selecionado.
        proportionalFilters.forEach(filter => {
            if (
                filter &&
                filter !== selectedFilter
            ) {
                filter.value = "";
            }
        });

        // Atualiza o mapa com o novo indicador.
        loadProportionalSymbolMap();
    }


    async function loadSpatialAnalysis() {
        /**
         * Carrega as escolas correspondentes aos filtros de análise
         * espacial e as apresenta como um mapa de calor.
         *
         * A consulta considera dependência administrativa ou modalidade
         * e utiliza as coordenadas geográficas das escolas.
         */

        try {
            // Recupera os filtros atualmente selecionados.
            const dependency =
                spatialDependencyFilter
                    ? spatialDependencyFilter.value
                    : "";

            const modality =
                spatialModalityFilter
                    ? spatialModalityFilter.value
                    : "";


            // Sem nenhum filtro, remove a camada existente e encerra.
            if (!dependency && !modality) {

                if (spatialAnalysisLayer) {
                    map.removeLayer(
                        spatialAnalysisLayer
                    );

                    spatialAnalysisLayer = null;
                }

                return;
            }


            // Remove uma eventual visualização de símbolos proporcionais,
            // pois somente uma análise espacial deve permanecer ativa.
            if (proportionalSymbolLayer) {
                map.removeLayer(
                    proportionalSymbolLayer
                );

                proportionalSymbolLayer = null;
            }

            if (spatialProportionalModalityFilter) {
                spatialProportionalModalityFilter.value = "";
            }


            // Define a rota da API responsável pelos dados espaciais.
            let url =
                "/api/analise-espacial/escolas";

            const params =
                new URLSearchParams();


            // Adiciona o filtro de dependência quando necessário.
            if (
                dependency &&
                dependency !== "todas"
            ) {
                params.set(
                    "dependencia",
                    dependency
                );
            }


            // Adiciona o filtro de modalidade quando necessário.
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


            // Solicita os dados filtrados ao backend.
            const response =
                await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Erro ao carregar dados da análise espacial: ${response.status}`
                );
            }


            const schools =
                await response.json();


            // Converte cada escola em um ponto para o mapa de calor.
            const points =
                schools.map(school => [
                    school.lat,
                    school.lng,
                    1
                ]);


            // Remove uma camada anterior antes de criar a nova.
            if (spatialAnalysisLayer) {
                map.removeLayer(
                    spatialAnalysisLayer
                );

                spatialAnalysisLayer = null;
            }


            // Cria o mapa de calor com os pontos encontrados.
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

            // Registra o erro e remove uma eventual camada incompleta.
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
        /**
         * Carrega os dados de matrículas do indicador selecionado
         * e os representa no mapa por meio de símbolos proporcionais.
         *
         * O tamanho de cada símbolo é determinado pelo valor do
         * indicador associado à escola.
         */

        try {

            // Recupera os filtros disponíveis para a visualização.
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


            // Determina o tipo e o indicador a partir do filtro selecionado.
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


            // Sem indicador selecionado, remove a camada e encerra.
            if (!tipo || !indicador) {

                if (proportionalSymbolLayer) {
                    map.removeLayer(
                        proportionalSymbolLayer
                    );

                    proportionalSymbolLayer = null;
                }

                return;
            }


            // Obtém a área atualmente visível do mapa para limitar
            // a consulta aos estabelecimentos presentes nessa região.
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


            // Monta a URL da API com os filtros selecionados.
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


            // Remove uma camada anterior antes de reconstruir
            // os símbolos proporcionais.
            if (proportionalSymbolLayer) {
                map.removeLayer(
                    proportionalSymbolLayer
                );

                proportionalSymbolLayer = null;
            }


            // Não cria uma camada quando não existem escolas
            // com valores para o indicador selecionado.
            if (schools.length === 0) {
                console.log(
                    "Nenhuma escola encontrada para o indicador selecionado."
                );

                return;
            }


            // Obtém o maior valor da série para servir de referência
            // na definição dos tamanhos dos símbolos.
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


            // Cria um símbolo proporcional para cada escola.
            schools.forEach(school => {

                const value =
                    school.valor;

                let radius =
                    radiusMin;


                // Calcula o raio proporcional ao valor do indicador.
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


                // Cria o círculo que representa a escola.
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


            // Adiciona a camada completa ao mapa.
            proportionalSymbolLayer.addTo(
                map
            );


            console.log(
                `Mapa proporcional: tipo=${tipo}, indicador=${indicador}, escolas=${schools.length}, valor máximo=${maxValue}`
            );

        } catch (error) {

            // Registra o erro e remove a camada proporcional atual.
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
        /**
         * Ativa o modo de análise espacial do mapa.
         *
         * Oculta os controles e cartões utilizados pelo modo normal
         * do mapa, apresenta as opções específicas de análise espacial
         * e limpa as camadas e seleções anteriores.
         */

        if (spatialAnalysisMode) {
            return;
        }

        spatialAnalysisMode = true;


        // Remove qualquer divisão administrativa desenhada no mapa.
        mapAdministrative.clearAdministrativeDivisionLayer();


        // Recupera os elementos da interface que serão alternados.
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


        // Limpa a interface utilizada para busca e seleção de escolas.
        mapSearch.clearSuggestions();

        mapSearch.hideSchoolCard();

        mapAdministrative.hideAdministrativeDivisionCard();


        // Oculta os painéis que pertencem ao modo normal.
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


        // Exibe o painel específico da análise espacial.
        if (spatialOptionsPanel) {
            spatialOptionsPanel.classList.remove(
                "d-none"
            );
        }


        // Oculta o campo de busca e os cartões do modo normal.
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


        // Oculta a entrada para análise espacial e apresenta
        // o botão utilizado para sair desse modo.
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


        // Marca visualmente o contêiner do mapa como pertencente
        // ao modo de análise espacial.
        if (mapContainer) {
            mapContainer.classList.add(
                "spatial-analysis-mode"
            );
        }


        // Limpa marcadores e escola selecionada do modo anterior.
        schoolLayer.clearLayers();

        selectedLayer.clearLayers();

        schoolMarkers.clear();

        setSelectedSchoolCode(null);


        // Remove uma eventual camada de análise anterior.
        if (spatialAnalysisLayer) {
            map.removeLayer(
                spatialAnalysisLayer
            );

            spatialAnalysisLayer = null;
        }


        // Reinicia a exibição das opções do mapa de calor.
        const heatmapOptions =
            document.getElementById(
                "heatmapOptions"
            );

        if (heatmapOptions) {
            heatmapOptions.classList.remove(
                "show"
            );
        }


        // Limpa o filtro de dependência administrativa.
        if (spatialDependencyFilter) {
            spatialDependencyFilter.value = "";
        }
    }


    function exitSpatialAnalysisMode() {
        /**
         * Encerra o modo de análise espacial e restaura o estado
         * normal do mapa.
         *
         * Remove as camadas específicas da análise espacial,
         * restaura os painéis da interface e limpa os filtros e
         * seleções utilizados durante a análise.
         */

        if (!spatialAnalysisMode) {
            return;
        }

        spatialAnalysisMode = false;


        // Remove qualquer camada de divisão administrativa.
        mapAdministrative.clearAdministrativeDivisionLayer();


        // Recupera os elementos da interface que serão restaurados.
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


        // Remove as camadas específicas da análise espacial.
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


        // Remove a indicação visual do modo de análise espacial.
        if (mapContainer) {
            mapContainer.classList.remove(
                "spatial-analysis-mode"
            );
        }


        // Oculta novamente o painel de opções espaciais.
        if (spatialOptionsPanel) {
            spatialOptionsPanel.classList.add(
                "d-none"
            );
        }


        // Restaura os painéis utilizados pelo modo normal do mapa.
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


        // Restaura a entrada da análise espacial e oculta
        // o botão utilizado para retornar ao mapa normal.
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


        // Limpa os filtros gerais do mapa.
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


        // Limpa busca, cartões, marcadores e escola selecionada.
        mapSearch.hideSchoolCard();

        mapSearch.clearSuggestions();

        selectedLayer.clearLayers();

        schoolLayer.clearLayers();

        schoolMarkers.clear();

        setSelectedSchoolCode(null);


        // Reinicia todos os filtros específicos da análise espacial.
        resetSpatialFilters();


        // Recupera os filtros administrativos utilizados no modo normal.
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


        // Reinicia o filtro de país.
        if (administrativeCountryFilter) {
            administrativeCountryFilter.value = "";
        }


        // Reinicia e desabilita o filtro de região.
        if (administrativeRegionFilter) {
            administrativeRegionFilter.innerHTML = `
                <option value="" selected disabled>
                    Selecione...
                </option>
            `;

            administrativeRegionFilter.value = "";

            administrativeRegionFilter.disabled = true;
        }


        // Reinicia e desabilita o filtro de UF.
        if (administrativeUfFilter) {
            administrativeUfFilter.innerHTML = `
                <option value="" selected disabled>
                    Selecione...
                </option>
            `;

            administrativeUfFilter.value = "";

            administrativeUfFilter.disabled = true;
        }


        // Reinicia e desabilita o filtro de município.
        if (administrativeMunicipalityFilter) {
            administrativeMunicipalityFilter.innerHTML = `
                <option value="" selected disabled>
                    Selecione...
                </option>
            `;

            administrativeMunicipalityFilter.value = "";

            administrativeMunicipalityFilter.disabled = true;
        }


        // Atualiza o estado do botão de confirmação administrativo.
        mapAdministrative.updateAdministrativeConfirmButton();
    }


    function handleMapMoveEnd() {
        /**
         * Atualiza a análise espacial quando o mapa termina
         * de se movimentar.
         *
         * Quando existe um filtro proporcional ativo, atualiza
         * os símbolos proporcionais. Caso contrário, recarrega
         * o mapa de calor.
         */

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


        // Verifica se algum dos filtros proporcionais está ativo.
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


        // Atualiza o tipo de análise correspondente ao estado atual.
        if (proportionalFilterSelected) {
            loadProportionalSymbolMap();
            return;
        }

        loadSpatialAnalysis();
    }


    // Atualiza os filtros do mapa de calor mantendo a seleção exclusiva.
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


    // Registra os eventos dos filtros de símbolos proporcionais.
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


    // Entrada para ativar o modo de análise espacial.
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


    // Botão utilizado para retornar ao modo normal do mapa.
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


    // Garante que os filtros espaciais sejam reiniciados
    // quando a página for carregada.
    window.addEventListener(
        "load",
        resetSpatialFilters
    );


    // Expõe apenas as operações que precisam ser utilizadas
    // por outros módulos do mapa.
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