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
    // Campo de busca e área onde as sugestões de escolas serão exibidas.
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
        /**
         * Calcula a distância aproximada, em quilômetros, entre duas
         * coordenadas geográficas utilizando a fórmula de Haversine.
         *
         * @param {number} lat1 Latitude do primeiro ponto.
         * @param {number} lng1 Longitude do primeiro ponto.
         * @param {number} lat2 Latitude do segundo ponto.
         * @param {number} lng2 Longitude do segundo ponto.
         * @returns {number} Distância entre os dois pontos em quilômetros.
         */

        // Raio médio da Terra em quilômetros.
        const R = 6371;

        // Converte as diferenças de latitude e longitude para radianos.
        const dLat =
            (lat2 - lat1) * Math.PI / 180;

        const dLng =
            (lng2 - lng1) * Math.PI / 180;

        // Calcula o valor intermediário da fórmula de Haversine.
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(
                lat1 * Math.PI / 180
            ) *
            Math.cos(
                lat2 * Math.PI / 180
            ) *
            Math.sin(dLng / 2) ** 2;

        // Obtém o ângulo central entre os dois pontos.
        const c =
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return R * c;
    }


    function setupClearSchoolInput() {
        /**
         * Configura o botão utilizado para limpar o campo de busca
         * por escolas.
         *
         * O botão é exibido somente quando existe algum texto no campo
         * e, ao ser acionado, limpa o conteúdo e devolve o foco ao campo.
         */

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

        // Atualiza a visibilidade do botão de limpeza.
        const updateButton = () => {
            button.classList.toggle(
                "d-none",
                input.value.trim() === ""
            );
        };

        // Mantém o botão sincronizado com o conteúdo do campo.
        input.addEventListener(
            "input",
            updateButton
        );

        // Limpa o campo e dispara novamente o evento de entrada.
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
        /**
         * Consulta o backend para localizar escolas a partir de um termo
         * de busca.
         *
         * @param {string} term Texto informado pelo usuário.
         * @returns {Promise<Object[]>} Lista de escolas retornada pela API.
         */

        return fetch(
            `/api/busca/${term}`
        )
            .then(response =>
                response.json()
            );
    }


    function showSuggestionsBox() {
        /**
         * Exibe a área de sugestões de escolas.
         */

        suggestionsBox.classList.remove(
            "d-none"
        );
    }


    function hideSuggestionsBox() {
        /**
         * Oculta a área de sugestões de escolas.
         */

        suggestionsBox.classList.add(
            "d-none"
        );
    }


    function clearSuggestions() {
        /**
         * Remove todas as sugestões atualmente exibidas
         * e oculta a área correspondente.
         */

        suggestionsBox.innerHTML = "";

        hideSuggestionsBox();
    }


    function hideSchoolCard() {
        /**
         * Oculta o cartão com as informações da escola selecionada.
         */

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
        /**
         * Exibe as informações resumidas de uma escola no cartão do mapa.
         *
         * Quando uma localização do usuário está disponível, mostra também
         * a distância aproximada até a escola. Em modo de comparação,
         * apresenta a ação para selecionar a escola como comparada.
         *
         * @param {Object} school Dados da escola.
         * @param {boolean} comparisonMode Indica se o cartão está sendo
         * utilizado no modo de comparação.
         */

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

        // Verifica se a escola possui coordenadas geográficas.
        const hasCoordinates =
            school.lat != null &&
            school.lng != null;

        const userLocation =
            getUserLocation();

        // Informa ao usuário quando a escola não pode ser posicionada
        // no mapa por ausência de coordenadas.
        const locationMessage =
            hasCoordinates
                ? ""
                : `
                    <div class="alert alert-warning py-2 mt-2 mb-2">
                        Esta escola não possui coordenadas geográficas cadastradas e, por isso, não pode ser exibida no mapa.
                    </div>
                `;

        let distanceHtml = "";

        // Calcula e exibe a distância até a escola quando possível.
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

        // Define a ação disponível no cartão de acordo com o modo atual.
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

        // Monta o conteúdo apresentado no cartão.
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

        // Exibe o cartão após preencher seu conteúdo.
        card.classList.remove(
            "d-none"
        );

        // No modo de comparação, configura o botão para selecionar
        // a escola atualmente apresentada.
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
        /**
         * Seleciona uma escola no mapa e atualiza o marcador e o cartão
         * de informações correspondentes.
         *
         * @param {Object} schoolData Dados da escola selecionada.
         */

        // Remove a seleção anterior.
        selectedLayer.clearLayers();

        setSelectedSchoolCode(null);

        // Adiciona a escola ao mapa somente quando suas coordenadas existem.
        if (
            schoolData.lat != null &&
            schoolData.lng != null
        ) {
            let marker =
                schoolMarkers.get(
                    schoolData.codigo
                );

            // Cria o marcador caso ele ainda não esteja registrado.
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

        // Atualiza o cartão da escola selecionada.
        showSchoolCard(
            schoolData
        );

        // Registra o código da escola selecionada.
        setSelectedSchoolCode(
            schoolData.codigo
        );
    }


    function createSuggestionButton(
        school
    ) {
        /**
         * Cria o botão correspondente a uma escola na lista de sugestões.
         *
         * @param {Object} school Dados da escola.
         * @returns {HTMLButtonElement} Botão criado para a sugestão.
         */

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

        // Calcula a distância da escola até a localização do usuário,
        // quando ambas as posições estão disponíveis.
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

        // Define o conteúdo visual da sugestão.
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

        // Seleciona a escola quando o usuário clica na sugestão.
        button.onclick = () => {
            hideSuggestionsBox();

            searchInput.value = "";

            // Escolas com coordenadas são centralizadas antes da seleção.
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
                // Quando não há coordenadas, apenas seleciona a escola
                // sem tentar movimentar o mapa.
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
        /**
         * Exibe no campo de busca a lista de escolas retornada pela API.
         *
         * @param {Object[]} schools Lista de escolas encontradas.
         */

        suggestionsBox.innerHTML = "";

        // Informa quando a busca não encontrou resultados.
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

        // Cria um botão de sugestão para cada escola encontrada.
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
        /**
         * Processa as alterações no campo de busca.
         *
         * Consultas com menos de três caracteres são ignoradas;
         * caso contrário, os resultados são solicitados ao backend.
         */

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
        /**
         * Restaura no mapa a escola que originou o retorno da ficha técnica.
         *
         * O código da escola é recuperado do sessionStorage, os dados
         * são obtidos pela API e a escola é selecionada e centralizada
         * novamente no mapa.
         */

        const schoolCode =
            sessionStorage.getItem(
                "returnToSchoolMap"
            );

        if (!schoolCode) {
            return;
        }

        try {
            // Recupera os dados da escola pelo código armazenado.
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

            // Sem coordenadas, não é possível restaurar a posição no mapa.
            if (
                school.lat == null ||
                school.lng == null
            ) {
                return;
            }

            // Restaura o nome da escola no campo de busca.
            searchInput.value =
                school.nome || "";
            
            // Dispara o evento de entrada para atualizar os elementos
            // associados ao campo, como o botão de limpeza.
            searchInput.dispatchEvent(
                new Event("input", {
                    bubbles: true
                })
            );

            // Restaura a escola selecionada e centraliza o mapa.
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
            // Remove o estado temporário após a tentativa de restauração.
            sessionStorage.removeItem(
                "returnToSchoolMap"
            );
        }
    }


    // Configura o botão de limpeza do campo de busca.
    setupClearSchoolInput();

    // Inicia a busca conforme o usuário digita.
    searchInput.addEventListener(
        "input",
        onSearchInput
    );


    // Fecha as sugestões quando o usuário clica fora do campo
    // e da própria área de sugestões.
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


    // Expõe as operações que precisam ser utilizadas por outros módulos.
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