function initializeMapComparison({
    map,
    selectedLayer,
    mapSearch,
    createPin,
    greenIcon,
    setSelectedSchoolCode
}) {

    // Recupera o estado do modo de comparação da sessão atual.
    let comparisonMapMode =
        sessionStorage.getItem(
            "comparisonMapMode"
        ) === "true";

    // Mantém o marcador e os dados da escola candidata à comparação.
    let comparisonCandidateMarker = null;
    let comparisonPrincipalSchool = null;


    // Recupera os dados da escola principal armazenados na sessão.
    const storedPrincipalSchool =
        sessionStorage.getItem(
            "comparisonPrincipalSchool"
        );

    if (storedPrincipalSchool) {
        try {
            comparisonPrincipalSchool =
                JSON.parse(
                    storedPrincipalSchool
                );
        } catch (error) {
            console.error(
                "Erro ao recuperar escola principal da comparação:",
                error
            );

            comparisonPrincipalSchool =
                null;
        }
    }


    function selectComparisonSchoolFromMap(school) {
        /**
         * Seleciona uma escola como resultado da comparação e retorna
         * para a página que iniciou o processo de comparação.
         *
         * @param {Object} school Dados da escola selecionada.
         */

        // Armazena temporariamente a escola escolhida para comparação.
        sessionStorage.setItem(
            "comparisonSelectedSchool",
            JSON.stringify(school)
        );

        // Encerra o modo de comparação no mapa.
        sessionStorage.removeItem(
            "comparisonMapMode"
        );

        sessionStorage.removeItem(
            "comparisonPrincipalSchoolCode"
        );

        // Recupera a página para a qual o usuário deve retornar.
        const returnUrl =
            sessionStorage.getItem(
                "comparisonReturnUrl"
            );

        // Retorna para a página de origem da comparação.
        window.location.href =
            returnUrl || "/mapa";
    }


    function selectComparisonCandidate(school) {
        /**
         * Seleciona uma escola candidata à comparação no mapa.
         *
         * A escola é marcada com um ícone próprio e seu cartão
         * de informações é exibido em modo de comparação.
         *
         * @param {Object} school Dados da escola candidata.
         */

        // Impede que a escola principal seja selecionada como
        // própria escola de comparação.
        if (
            comparisonPrincipalSchool &&
            school.codigo ===
                comparisonPrincipalSchool.codigo
        ) {
            return;
        }

        // Sem coordenadas, a escola pode ser apresentada no cartão,
        // mas não pode receber um marcador no mapa.
        if (
            school.lat == null ||
            school.lng == null
        ) {
            mapSearch.showSchoolCard(
                school,
                true
            );

            return;
        }

        // Remove o marcador da candidata anterior.
        if (comparisonCandidateMarker) {
            selectedLayer.removeLayer(
                comparisonCandidateMarker
            );
        }

        // Cria o marcador verde utilizado para a escola comparada.
        comparisonCandidateMarker =
            L.marker(
                [school.lat, school.lng],
                {
                    icon: greenIcon
                }
            );

        selectedLayer.addLayer(
            comparisonCandidateMarker
        );

        // Exibe o cartão da escola em modo de comparação.
        mapSearch.showSchoolCard(
            school,
            true
        );
    }


    function handleSchoolMarkerClick(school) {
        /**
         * Trata o clique em um marcador de escola.
         *
         * No modo de comparação, o clique seleciona uma escola candidata.
         * No modo normal, o clique seleciona a escola para exibição de sua ficha.
         *
         * @param {Object} school Dados da escola clicada.
         */

        if (comparisonMapMode) {
            selectComparisonCandidate(
                school
            );

            return;
        }

        mapSearch.selectSchool(
            school
        );
    }


    function clearComparisonCandidate() {
        /**
         * Remove do mapa o marcador da escola candidata à comparação.
         */

        if (comparisonCandidateMarker) {
            selectedLayer.removeLayer(
                comparisonCandidateMarker
            );

            comparisonCandidateMarker = null;
        }
    }


    function isComparisonMapMode() {
        /**
         * Informa se o mapa está atualmente no modo de comparação.
         *
         * @returns {boolean} True quando o modo de comparação está ativo.
         */

        return comparisonMapMode;
    }


    // Restaura a interface e a escola principal quando o mapa
    // é carregado durante um processo de comparação.
    window.addEventListener(
        "load",
        () => {

            const principalSchoolCode =
                sessionStorage.getItem(
                    "comparisonPrincipalSchoolCode"
                );

            // Sem modo de comparação ou sem escola principal armazenada,
            // não há estado a ser restaurado.
            if (
                !comparisonMapMode ||
                !principalSchoolCode
            ) {
                return;
            }


            // Recupera os elementos da interface que serão alterados
            // durante o modo de comparação.
            const schoolSearchBox =
                document.getElementById(
                    "schoolSearchBox"
                );

            const spatialAnalysisEntry =
                document.getElementById(
                    "spatialAnalysisEntry"
                );

            const administrativeFilterPanel =
                document.getElementById(
                    "administrativeFilterPanel"
                );

            const comparisonBackButton =
                document.getElementById(
                    "comparisonBackButton"
                );

            const searchPanel =
                document.querySelector(
                    ".search-panel"
                );


            // Oculta os controles que não são utilizados
            // durante a seleção da escola comparada.
            if (schoolSearchBox) {
                schoolSearchBox.classList.add(
                    "d-none"
                );
            }

            if (spatialAnalysisEntry) {
                spatialAnalysisEntry.classList.add(
                    "d-none"
                );
            }

            if (administrativeFilterPanel) {
                administrativeFilterPanel.classList.add(
                    "d-none"
                );
            }


            // Exibe o botão utilizado para retornar da seleção.
            if (comparisonBackButton) {
                comparisonBackButton.classList.remove(
                    "d-none"
                );
            }


            // Aplica a classe visual específica do modo de comparação.
            if (searchPanel) {
                searchPanel.classList.add(
                    "comparison-map-mode"
                );
            }


            // Recupera os dados da escola principal pelo backend.
            fetch(
                `/api/escola-localizacao/${principalSchoolCode}`
            )
                .then(response => response.json())
                .then(school => {

                    // Trata erros retornados pela API.
                    if (school.erro) {
                        console.error(
                            school.erro
                        );

                        return;
                    }

                    // Mantém os dados da escola principal em memória.
                    comparisonPrincipalSchool =
                        school;

                    setSelectedSchoolCode(
                        school.codigo
                    );


                    // Exibe o pino da escola principal quando existem
                    // coordenadas geográficas disponíveis.
                    if (
                        school.lat != null &&
                        school.lng != null
                    ) {
                        const pin =
                            createPin(
                                school
                            );

                        selectedLayer.clearLayers();

                        selectedLayer.addLayer(
                            pin
                        );

                        // Centraliza o mapa na escola principal.
                        map.setView(
                            [
                                school.lat,
                                school.lng
                            ],
                            14
                        );
                    }
                })
                .catch(
                    console.error
                );
        }
    );


    // Configura o botão utilizado para sair do modo de comparação.
    const comparisonBackButton =
        document.getElementById(
            "comparisonBackButton"
        );

    if (comparisonBackButton) {
        comparisonBackButton.addEventListener(
            "click",
            () => {

                // Recupera a página de origem da comparação.
                const returnUrl =
                    sessionStorage.getItem(
                        "comparisonReturnUrl"
                    );

                // Remove o estado temporário do modo de comparação.
                sessionStorage.removeItem(
                    "comparisonMapMode"
                );

                sessionStorage.removeItem(
                    "comparisonPrincipalSchoolCode"
                );

                // Retorna para a página que iniciou a comparação.
                window.location.href =
                    returnUrl || "/mapa";
            }
        );
    }


    // Expõe somente as operações utilizadas pelos demais módulos.
    return {
        selectComparisonSchoolFromMap,
        selectComparisonCandidate,
        handleSchoolMarkerClick,
        clearComparisonCandidate,
        isComparisonMapMode
    };
}


export {
    initializeMapComparison
};