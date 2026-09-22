function initializeMapSearch({
    map,
    schoolLayer,
    selectedLayer,
    schoolMarkers,
    addMarker,
    createPin,
    getUserLocation,
    onComparisonSchoolSelected,
    setSelectedSchoolCode
}) {
    const searchInput =
        document.getElementById(
            "schoolInput"
        );

    const suggestionsBox =
        document.getElementById(
            "searchSuggestions"
        );

    function calculateDistanceKm(
        lat1,
        lng1,
        lat2,
        lng2
    ) {
        const R = 6371;

        const dLat =
            (lat2 - lat1) * Math.PI / 180;

        const dLng =
            (lng2 - lng1) * Math.PI / 180;

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(
                lat1 * Math.PI / 180
            ) *
            Math.cos(
                lat2 * Math.PI / 180
            ) *
            Math.sin(dLng / 2) ** 2;

        const c =
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return R * c;
    }


    function setupClearSchoolInput() {
        const input =
            document.getElementById(
                "schoolInput"
            );

        const button =
            document.getElementById(
                "clearSchoolInput"
            );

        if (!input || !button) {
            return;
        }

        const updateButton = () => {
            button.classList.toggle(
                "d-none",
                input.value.trim() === ""
            );
        };

        input.addEventListener(
            "input",
            updateButton
        );

        button.addEventListener(
            "click",
            () => {
                input.value = "";

                input.dispatchEvent(
                    new Event("input", {
                        bubbles: true
                    })
                );

                input.focus();
            }
        );

        updateButton();
    }


    function searchSchools(term) {
        return fetch(
            `/api/busca/${term}`
        )
            .then(response =>
                response.json()
            );
    }


    function showSuggestionsBox() {
        suggestionsBox.classList.remove(
            "d-none"
        );
    }


    function hideSuggestionsBox() {
        suggestionsBox.classList.add(
            "d-none"
        );
    }


    function clearSuggestions() {
        suggestionsBox.innerHTML = "";

        hideSuggestionsBox();
    }


    function hideSchoolCard() {
        const card =
            document.getElementById(
                "schoolCard"
            );

        if (card) {
            card.classList.add(
                "d-none"
            );
        }
    }


    function showSchoolCard(
        school,
        comparisonMode = false
    ) {
        const card =
            document.getElementById(
                "schoolCard"
            );

        const body =
            document.getElementById(
                "schoolCardBody"
            );

        if (!card || !body) {
            return;
        }

        const hasCoordinates =
            school.lat != null &&
            school.lng != null;

        const userLocation =
            getUserLocation();

        const locationMessage =
            hasCoordinates
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
            const distance =
                calculateDistanceKm(
                    userLocation.lat,
                    userLocation.lng,
                    school.lat,
                    school.lng
                );

            distanceHtml = `
                <span class="text-muted">
                    ${distance
                        .toFixed(1)
                        .replace(".", ",")} km
                </span>
            `;
        }

        const actionHtml =
            comparisonMode
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

        card.classList.remove(
            "d-none"
        );

        if (comparisonMode) {
            const compareButton =
                document.getElementById(
                    "compareSelectedSchool"
                );

            if (compareButton) {
                compareButton.addEventListener(
                    "click",
                    () => {
                        onComparisonSchoolSelected(
                            school
                        );
                    }
                );
            }
        }
    }


    function selectSchool(schoolData) {
        selectedLayer.clearLayers();

        setSelectedSchoolCode(null);

        if (
            schoolData.lat != null &&
            schoolData.lng != null
        ) {
            let marker =
                schoolMarkers.get(
                    schoolData.codigo
                );

            if (!marker) {
                marker =
                    addMarker(
                        schoolData
                    );
            }

            const pin =
                createPin(
                    schoolData
                );

            selectedLayer.addLayer(
                pin
            );
        }

        showSchoolCard(
            schoolData
        );

        setSelectedSchoolCode(
            schoolData.codigo
        );
    }


    function createSuggestionButton(
        school
    ) {
        const button =
            document.createElement(
                "button"
            );

        button.type = "button";

        button.className =
            "list-group-item " +
            "list-group-item-action " +
            "text-start py-2";

        let distanceHtml = "";

        const userLocation =
            getUserLocation();

        if (
            userLocation &&
            school.lat != null &&
            school.lng != null
        ) {
            const distance =
                calculateDistanceKm(
                    userLocation.lat,
                    userLocation.lng,
                    school.lat,
                    school.lng
                );

            distanceHtml = `
                <span class="text-muted">
                    ${distance
                        .toFixed(1)
                        .replace(".", ",")} km
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
            hideSuggestionsBox();

            searchInput.value = "";

            if (
                school.lat != null &&
                school.lng != null
            ) {
                map.once(
                    "moveend",
                    () => {
                        setTimeout(
                            () => {
                                selectSchool(
                                    school
                                );
                            },
                            100
                        );
                    }
                );

                map.flyTo(
                    [
                        school.lat,
                        school.lng
                    ],
                    16
                );

            } else {
                selectSchool(
                    school
                );
            }
        };

        return button;
    }


    function showSuggestions(
        schools
    ) {
        suggestionsBox.innerHTML = "";

        if (
            !schools ||
            schools.length === 0
        ) {
            suggestionsBox.innerHTML =
                `
                    <div class="list-group-item text-muted">
                        Nenhuma escola encontrada
                    </div>
                `;

            showSuggestionsBox();

            return;
        }

        schools.forEach(
            school => {
                suggestionsBox.appendChild(
                    createSuggestionButton(
                        school
                    )
                );
            }
        );

        showSuggestionsBox();
    }


    function onSearchInput() {
        const term =
            searchInput.value.trim();

        if (term.length < 3) {
            clearSuggestions();

            return;
        }

        searchSchools(term)
            .then(
                showSuggestions
            )
            .catch(
                console.error
            );
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
                throw new Error(
                    school.erro
                );
            }

            if (
                school.lat == null ||
                school.lng == null
            ) {
                return;
            }

            searchInput.value =
                school.nome || "";

            selectSchool(
                school
            );

            map.flyTo(
                [
                    school.lat,
                    school.lng
                ],
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


    setupClearSchoolInput();

    searchInput.addEventListener(
        "input",
        onSearchInput
    );


    document.addEventListener(
        "click",
        event => {
            if (
                !searchInput.contains(
                    event.target
                ) &&
                !suggestionsBox.contains(
                    event.target
                )
            ) {
                hideSuggestionsBox();
            }
        }
    );


    return {
        clearSuggestions,
        hideSchoolCard,
        showSchoolCard,
        selectSchool,
        restoreSchoolFromSheet
    };
}


export {
    initializeMapSearch
};