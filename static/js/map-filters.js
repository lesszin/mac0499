function initializeMapFilters({
    map,
    schoolLayer,
    schoolMarkers,
    addMarker,
    getSelectedSchoolCode
}) {
    const allMapFilters =
        document.querySelectorAll(
            ".modality-filter, " +
            ".administrative-filter, " +
            ".private-category-filter, " +
            ".location-filter"
        );


    function getSelectedFilters() {
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
        const selectedSchoolCode =
            getSelectedSchoolCode();

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
        const selectedSchoolCode =
            getSelectedSchoolCode();

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
        const bounds =
            map.getBounds();

        const params =
            new URLSearchParams();

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

        return (
            `/api/escolas-mapa?` +
            `${params.toString()}`
        );
    }


    function fetchSchools(filters) {
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
        const visibleSchools =
            new Set();

        schools.forEach(
            school => {
                visibleSchools.add(
                    school.codigo
                );

                const selectedSchoolCode =
                    getSelectedSchoolCode();

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

                if (
                    !schoolMarkers.has(
                        school.codigo
                    )
                ) {
                    addMarker(school);
                }
            }
        );

        removeInvisibleMarkers(
            visibleSchools
        );
    }


    function loadSchoolsOnMap() {
        const filters =
            getSelectedFilters();

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
        const privateCategories =
            document.querySelectorAll(
                ".private-category-filter"
            );

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


    return {
        loadSchoolsOnMap,
        clearVisibleMarkers,
        updatePrivateCategoryDependency
    };
}


export {
    initializeMapFilters
};