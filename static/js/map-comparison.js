function initializeMapComparison({
    map,
    selectedLayer,
    mapSearch,
    createPin,
    greenIcon,
    setSelectedSchoolCode
}) {

    let comparisonMapMode =
        sessionStorage.getItem(
            "comparisonMapMode"
        ) === "true";

    let comparisonCandidateMarker = null;
    let comparisonPrincipalSchool = null;

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
            returnUrl || "/mapa";
    }

    function selectComparisonCandidate(school) {

        if (
            comparisonPrincipalSchool &&
            school.codigo ===
                comparisonPrincipalSchool.codigo
        ) {
            return;
        }

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

        if (comparisonCandidateMarker) {
            selectedLayer.removeLayer(
                comparisonCandidateMarker
            );
        }

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

        mapSearch.showSchoolCard(
            school,
            true
        );
    }

    function handleSchoolMarkerClick(school) {

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

        if (comparisonCandidateMarker) {
            selectedLayer.removeLayer(
                comparisonCandidateMarker
            );

            comparisonCandidateMarker = null;
        }
    }

    function isComparisonMapMode() {
        return comparisonMapMode;
    }

    window.addEventListener(
        "load",
        () => {

            const principalSchoolCode =
                sessionStorage.getItem(
                    "comparisonPrincipalSchoolCode"
                );

            if (
                !comparisonMapMode ||
                !principalSchoolCode
            ) {
                return;
            }

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

            if (comparisonBackButton) {
                comparisonBackButton.classList.remove(
                    "d-none"
                );
            }

            if (searchPanel) {
                searchPanel.classList.add(
                    "comparison-map-mode"
                );
            }

            fetch(
                `/api/escola-localizacao/${principalSchoolCode}`
            )
                .then(response => response.json())
                .then(school => {

                    if (school.erro) {
                        console.error(
                            school.erro
                        );

                        return;
                    }

                    comparisonPrincipalSchool =
                        school;

                    setSelectedSchoolCode(
                        school.codigo
                    );

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

    const comparisonBackButton =
        document.getElementById(
            "comparisonBackButton"
        );

    if (comparisonBackButton) {
        comparisonBackButton.addEventListener(
            "click",
            () => {

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
                    returnUrl || "/mapa";
            }
        );
    }

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