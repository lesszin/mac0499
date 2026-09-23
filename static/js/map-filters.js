function initializeMapFilters({
    map,
    schoolLayer,
    schoolMarkers,
    addMarker,
    getSelectedSchoolCode
}) {
    // Reúne todos os filtros utilizados pelo modo normal do mapa.
    const allMapFilters =
        document.querySelectorAll(
            ".modality-filter, " +
            ".administrative-filter, " +
            ".private-category-filter, " +
            ".location-filter"
        );


    function getSelectedFilters() {
        /**
         * Obtém os valores atualmente selecionados nos filtros do mapa.
         *
         * Returns:
         *     Um objeto contendo as modalidades, dependências,
         *     categorias privadas e localizações selecionadas.
         */

        // Obtém os valores marcados para um determinado conjunto de filtros.
        const getValues = selector => {
            return Array.from(
                document.querySelectorAll(
                    selector
                )
            )
                .filter(
                    filter => filter.checked
                )
                .map(
                    filter => filter.value
                );
        };

        return {
            modalidades:
                getValues(
                    ".modality-filter"
                ),

            dependencias:
                getValues(
                    ".administrative-filter"
                ),

            categorias_privadas:
                getValues(
                    ".private-category-filter"
                ),

            localizacoes:
                getValues(
                    ".location-filter"
                )
        };
    }


    function clearVisibleMarkers() {
        /**
         * Remove do mapa os marcadores das escolas que não devem
         * permanecer visíveis, preservando a escola atualmente selecionada.
         */

        const selectedSchoolCode =
            getSelectedSchoolCode();

        // Percorre os marcadores existentes e remove todos,
        // exceto o marcador da escola selecionada.
        schoolMarkers.forEach(
            (marker, codigo) => {
                if (
                    codigo !==
                    selectedSchoolCode
                ) {
                    schoolLayer.removeLayer(
                        marker
                    );

                    schoolMarkers.delete(
                        codigo
                    );
                }
            }
        );
    }


    function removeInvisibleMarkers(
        visibleSchools
    ) {
        /**
         * Remove os marcadores das escolas que não estão presentes
         * no conjunto de resultados atualmente visível.
         *
         * @param {Set} visibleSchools
         * Conjunto de códigos das escolas que devem permanecer no mapa.
         */

        const selectedSchoolCode =
            getSelectedSchoolCode();

        // Remove marcadores ausentes nos resultados, mantendo
        // a escola selecionada quando houver uma.
        schoolMarkers.forEach(
            (marker, codigo) => {
                if (
                    !visibleSchools.has(
                        codigo
                    ) &&
                    codigo !==
                        selectedSchoolCode
                ) {
                    schoolLayer.removeLayer(
                        marker
                    );

                    schoolMarkers.delete(
                        codigo
                    );
                }
            }
        );
    }


    function canLoadSchools(filters) {
        /**
         * Verifica se existem condições suficientes para carregar
         * escolas no mapa.
         *
         * A consulta somente é realizada quando existe pelo menos
         * um filtro ativo e o mapa está em um nível de zoom adequado.
         *
         * @param {Object} filters Filtros atualmente selecionados.
         * @returns {boolean} Indica se as escolas podem ser carregadas.
         */

        // Verifica se existe pelo menos um filtro selecionado.
        const hasFilters =
            filters.modalidades.length > 0 ||
            filters.dependencias.length > 0 ||
            filters.categorias_privadas.length > 0 ||
            filters.localizacoes.length > 0;

        if (!hasFilters) {
            clearVisibleMarkers();

            return false;
        }

        // Em níveis de zoom muito distantes, os marcadores não são carregados.
        if (map.getZoom() < 5) {
            clearVisibleMarkers();

            return false;
        }

        return true;
    }


    function createSchoolsUrl(filters) {
        /**
         * Monta a URL da API responsável por buscar as escolas
         * de acordo com os filtros e com a área atualmente visível do mapa.
         *
         * @param {Object} filters Filtros atualmente selecionados.
         * @returns {string} URL completa da consulta à API.
         */

        const bounds =
            map.getBounds();

        const params =
            new URLSearchParams();


        // Adiciona os filtros selecionados aos parâmetros da consulta.
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


        // Adiciona os limites geográficos da região atualmente visível.
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


        return (
            `/api/escolas-mapa?` +
            `${params.toString()}`
        );
    }


    function fetchSchools(filters) {
        /**
         * Solicita ao backend as escolas correspondentes aos filtros atuais.
         *
         * @param {Object} filters Filtros utilizados na consulta.
         * @returns {Promise<Object[]>} Lista de escolas retornada pela API.
         */

        return fetch(
            createSchoolsUrl(
                filters
            )
        )
            .then(
                response =>
                    response.json()
            );
    }


    function updateVisibleSchools(
        schools
    ) {
        /**
         * Atualiza os marcadores das escolas exibidas no mapa.
         *
         * Adiciona os novos resultados e remove os marcadores que deixaram
         * de fazer parte do conjunto de escolas visíveis.
         *
         * @param {Object[]} schools Lista de escolas retornada pela API.
         */

        const visibleSchools =
            new Set();

        // Registra as escolas retornadas e garante que cada uma
        // possua um marcador no mapa.
        schools.forEach(
            school => {
                visibleSchools.add(
                    school.codigo
                );

                const selectedSchoolCode =
                    getSelectedSchoolCode();


                // Garante a permanência do marcador da escola selecionada.
                if (
                    school.codigo ===
                    selectedSchoolCode
                ) {
                    if (
                        !schoolMarkers.has(
                            school.codigo
                        )
                    ) {
                        addMarker(school);
                    }

                    return;
                }


                // Adiciona o marcador caso a escola ainda não esteja registrada.
                if (
                    !schoolMarkers.has(
                        school.codigo
                    )
                ) {
                    addMarker(school);
                }
            }
        );


        // Remove os marcadores que não estão mais visíveis.
        removeInvisibleMarkers(
            visibleSchools
        );
    }


    function loadSchoolsOnMap() {
        /**
         * Carrega as escolas correspondentes aos filtros atuais
         * e atualiza os marcadores exibidos no mapa.
         *
         * Returns:
         *     A promise da consulta quando os dados são carregados,
         *     ou undefined quando a consulta não é necessária.
         */

        const filters =
            getSelectedFilters();


        // Evita realizar consultas quando não há filtros válidos
        // ou quando o nível de zoom não permite a visualização.
        if (
            !canLoadSchools(filters)
        ) {
            return;
        }


        return fetchSchools(
            filters
        )
            .then(
                updateVisibleSchools
            )
            .catch(
                console.error
            );
    }


    function updatePrivateCategoryDependency() {
        /**
         * Sincroniza a seleção de categoria de escola privada com
         * o filtro de dependência administrativa correspondente.
         *
         * Quando uma categoria privada é selecionada, a dependência
         * "privada" é marcada e as demais dependências são desmarcadas.
         */

        const privateCategories =
            document.querySelectorAll(
                ".private-category-filter"
            );

        // Verifica se alguma categoria de escola privada está selecionada.
        const hasPrivateCategory =
            Array.from(
                privateCategories
            ).some(
                filter => filter.checked
            );


        const dependencyFilters =
            document.querySelectorAll(
                ".administrative-filter"
            );

        const privateDependency =
            document.querySelector(
                '.administrative-filter[value="privada"]'
            );


        // Mantém somente a dependência "privada" selecionada
        // quando há uma categoria privada ativa.
        if (hasPrivateCategory) {
            dependencyFilters.forEach(
                filter => {
                    filter.checked =
                        filter ===
                        privateDependency;
                }
            );
        }
    }


    // Registra a atualização dos dados para os filtros gerais.
    // Os filtros de categoria privada possuem tratamento próprio.
    allMapFilters.forEach(
        filter => {
            if (
                filter.classList.contains(
                    "private-category-filter"
                )
            ) {
                return;
            }

            filter.addEventListener(
                "change",
                loadSchoolsOnMap
            );
        }
    );


    // Registra os eventos específicos dos filtros de categoria privada.
    document
        .querySelectorAll(
            ".private-category-filter"
        )
        .forEach(
            filter => {
                filter.addEventListener(
                    "change",
                    () => {
                        updatePrivateCategoryDependency();

                        loadSchoolsOnMap();
                    }
                );
            }
        );


    // Expõe somente as funções utilizadas por outros módulos do mapa.
    return {
        loadSchoolsOnMap,
        clearVisibleMarkers,
        updatePrivateCategoryDependency
    };
}


export {
    initializeMapFilters
};