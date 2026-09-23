// Estado da escola selecionada para comparação e dos filtros de indicadores.
let selectedComparisonSchool = null;
let selectedComparisonCategory = null;
let selectedComparisonSubcategory = null;
let selectedComparisonFilter = null;

// Ordem de exibição das categorias disponíveis para comparação.
const comparisonCategoryOrder = [
    "matriculas",
    "docentes",
    "turmas",
    "dependencias",
    "acessibilidade"
];

// Indicadores disponíveis dentro de cada categoria de comparação.
const comparisonIndicators = {
    matriculas: [
        {
            title: "Indicadores Gerais",
            items: ["total"]
        },
        {
            title: "Modalidade",
            items: ["modalidade"]
        },
        {
            title: "Gênero",
            items: ["genero"]
        },
        {
            title: "Raça/Cor",
            items: ["raca"]
        }
    ],

    docentes: [
        {
            title: "Indicadores Gerais",
            items: ["total"]
        },
        {
            title: "Modalidade",
            items: ["modalidade"]
        }
    ],

    turmas: [
        {
            title: "Indicadores Gerais",
            items: ["total"]
        },
        {
            title: "Modalidade",
            items: ["modalidade"]
        }
    ]
};

// Opções apresentadas ao usuário para os indicadores que possuem filtro adicional.
const comparisonFilterOptions = {
    modalidade: [
        "Educação Infantil - Creche",
        "Educação Infantil - Pré-Escola",
        "Ensino Fundamental - Anos Iniciais",
        "Ensino Fundamental - Anos Finais",
        "Ensino Médio",
        "Educação Profissional",
        "Educação de Jovens e Adultos (EJA)",
        "Educação Especial"
    ],

    genero: [
        "Masculino",
        "Feminino"
    ],

    raca: [
        "Não Declarada",
        "Branca",
        "Preta",
        "Parda",
        "Amarela",
        "Indígena"
    ]
};

// Configuração das comparações estruturais que não utilizam indicadores subordinados.
const comparisonStructureSnapshotConfig = {
    acessibilidade: {
        title: "Recursos de Acessibilidade",
        fields: [
            {
                key: "banheiro_pne",
                label: "Banheiro acessível, adequado ao uso de pessoas com deficiência ou mobilidade reduzida"
            },
            {
                key: "corrimao",
                label: "Corrimão e guarda corpos"
            },
            {
                key: "elevador",
                label: "Elevador"
            },
            {
                key: "pisos_tateis",
                label: "Pisos táteis"
            },
            {
                key: "vao_livre",
                label: "Portas com vão livre de, no mínimo, 80 cm"
            },
            {
                key: "rampas",
                label: "Rampas"
            },
            {
                key: "sinal_sonoro",
                label: "Sinalização sonora"
            },
            {
                key: "sinal_tatil",
                label: "Sinalização tátil (piso/paredes)"
            },
            {
                key: "sinal_visual",
                label: "Sinalização visual (piso/paredes)"
            }
        ]
    },

    dependencias: {
        title: "Dependências",
        fields: [
            {
                key: "plantio",
                label: "Área de horta, plantio e/ou produção agrícola"
            },
            {
                key: "verde",
                label: "Área de vegetação ou gramado"
            },
            {
                key: "auditorio",
                label: "Auditório"
            },
            {
                key: "biblioteca",
                label: "Biblioteca"
            },
            {
                key: "lab_ciencias",
                label: "Laboratório de ciências"
            },
            {
                key: "lab_informatica",
                label: "Laboratório de informática"
            },
            {
                key: "quadra_coberta",
                label: "Quadra de esportes coberta"
            },
            {
                key: "quadra_descoberta",
                label: "Quadra de esportes descoberta"
            },
            {
                key: "artes",
                label: "Sala/ateliê de artes"
            },
            {
                key: "musica",
                label: "Sala de música/coral"
            },
            {
                key: "danca",
                label: "Sala/estúdio de dança"
            },
            {
                key: "multiuso",
                label: "Sala multiuso (música, dança e artes)"
            },
            {
                key: "gravacao",
                label: "Estúdio de gravação e edição"
            },
            {
                key: "professores",
                label: "Sala de professores"
            },
            {
                key: "aee",
                label: "Sala de Recursos Multifuncionais para Atendimento Educacional Especializado (AEE)"
            },
            {
                key: "refeitorio",
                label: "Refeitório"
            }
        ]
    }
};

/**
 * Calcula a distância, em quilômetros, entre duas coordenadas geográficas.
 *
 * Utiliza a fórmula de Haversine para determinar a distância sobre a
 * superfície terrestre a partir das latitudes e longitudes informadas.
 *
 * @param {number} lat1 Latitude do primeiro ponto.
 * @param {number} lng1 Longitude do primeiro ponto.
 * @param {number} lat2 Latitude do segundo ponto.
 * @param {number} lng2 Longitude do segundo ponto.
 * @returns {number} Distância entre os dois pontos em quilômetros.
 */
function calculateDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;

    const dLat =
        (lat2 - lat1) * Math.PI / 180;

    const dLng =
        (lng2 - lng1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}

/**
 * Busca escolas disponíveis para comparação a partir de um termo de pesquisa.
 *
 * Encaminha o termo para o endpoint responsável pela busca de escolas.
 *
 * @param {string} term Termo digitado pelo usuário.
 * @returns {Promise<Object[]>} Lista de escolas retornada pela API.
 */
function searchComparisonSchools(term) {
    return fetch(`/api/busca/${term}`)
        .then(response => response.json());
}

/**
 * Cria o botão de uma escola apresentada nas sugestões de comparação.
 *
 * Além dos dados básicos da escola, exibe a distância até a localização
 * previamente armazenada do usuário quando essa informação estiver disponível.
 *
 * Ao selecionar a escola, atualiza o estado da comparação e exibe as categorias.
 *
 * @param {Object} school Dados da escola apresentada na sugestão.
 * @returns {HTMLButtonElement} Botão configurado para a sugestão.
 */
function createComparisonSuggestion(school) {
    const button = document.createElement("button");

    button.className =
        "list-group-item list-group-item-action text-start py-2";

    let distanceHtml = "";

    const savedLocation = localStorage.getItem("userLocation");

    if (
        savedLocation &&
        school.lat != null &&
        school.lng != null
    ) {
        try {
            const userLocation =
                JSON.parse(savedLocation);

            const distance =
                calculateDistanceKm(
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

        } catch (error) {
            console.error(
                "Erro ao calcular distância da escola:",
                error
            );
        }
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
        selectedComparisonSchool = school;

        document
            .getElementById("comparisonSearchState")
            .classList.add("d-none");

        document
            .getElementById("comparisonSelectedState")
            .classList.remove("d-none");

        document.getElementById(
            "comparisonSchoolName"
        ).textContent = school.nome;

        document.getElementById(
            "comparisonSchoolLocation"
        ).textContent =
            `${school.cidade} - ${school.estado}`;

        document
            .getElementById("comparisonSuggestions")
            .classList.add("d-none");

        document.getElementById(
            "comparisonSearchInput"
        ).value = "";

        renderComparisonMainButtons();
    };

    return button;
}

/**
 * Exibe as escolas encontradas na área de sugestões de comparação.
 *
 * Quando nenhuma escola é encontrada, apresenta uma mensagem informativa.
 *
 * @param {Object[]} schools Lista de escolas retornada pela busca.
 * @returns {void}
 */
function showComparisonSuggestions(schools) {
    const box = document.getElementById(
        "comparisonSuggestions"
    );

    box.innerHTML = "";

    if (schools.length === 0) {
        box.innerHTML = `
            <div class="list-group-item text-muted">
                Nenhuma escola encontrada
            </div>
        `;

        box.classList.remove("d-none");
        return;
    }

    schools.forEach(school => {
        box.appendChild(
            createComparisonSuggestion(school)
        );
    });

    box.classList.remove("d-none");
}

/**
 * Processa a alteração do campo de busca da escola comparada.
 *
 * A consulta à API só é realizada quando o termo possui pelo menos
 * três caracteres.
 *
 * @returns {void}
 */
function onComparisonSearchInput() {
    const input = document.getElementById(
        "comparisonSearchInput"
    );

    const term = input.value.trim();

    if (term.length < 3) {
        document
            .getElementById("comparisonSuggestions")
            .classList.add("d-none");

        return;
    }

    searchComparisonSchools(term)
        .then(showComparisonSuggestions)
        .catch(console.error);
}

/**
 * Inicia o fluxo para selecionar outra escola de comparação.
 *
 * Reseta a visualização atual e retorna ao estado de seleção da escola.
 *
 * @returns {void}
 */
function changeComparisonSchool() {
    resetComparisonView();
}

/**
 * Converte o identificador interno de uma categoria para o nome apresentado na interface.
 *
 * @param {string} category Identificador da categoria.
 * @returns {string} Nome formatado da categoria.
 */
function formatComparisonCategoryName(category) {
    const names = {
        matriculas: "Matrículas",
        docentes: "Docentes",
        turmas: "Turmas",
        dependencias: "Dependências",
        acessibilidade: "Acessibilidade"
    };

    return names[category] || category;
}

/**
 * Renderiza os botões principais das categorias disponíveis para comparação.
 *
 * Dependências e acessibilidade são tratadas como categorias diretas,
 * enquanto as demais podem possuir indicadores subordinados.
 *
 * @returns {void}
 */
function renderComparisonMainButtons() {
    const container = document.getElementById(
        "comparisonMainCategoryButtons"
    );

    container.innerHTML = "";

    comparisonCategoryOrder.forEach(category => {
        const isDirectCategory =
            category === "dependencias" ||
            category === "acessibilidade";

        if (
            !comparisonIndicators[category] &&
            !isDirectCategory
        ) {
            return;
        }

        const button = document.createElement("button");

        button.className =
            "btn btn-outline-primary";

        button.textContent =
            formatComparisonCategoryName(category);

        button.onclick = () => {
            selectedComparisonCategory = category;
            selectedComparisonSubcategory = null;
            selectedComparisonFilter = null;

            clearComparisonChart();
            clearComparisonSummary();
            clearComparisonStructureSnapshot();
            clearComparisonSubButtons();

            updateComparisonIndicatorMessage();
            renderComparisonMainButtons();

            const isDirectCategory =
                category === "dependencias" ||
                category === "acessibilidade";

            if (isDirectCategory) {
                selectedComparisonSubcategory = "total";

                showComparisonChart(
                    selectedComparisonCategory,
                    selectedComparisonSubcategory
                );

                return;
            }

            renderComparisonSubButtons(category);
        };

        if (
            selectedComparisonCategory === category
        ) {
            button.classList.remove(
                "btn-outline-primary"
            );

            button.classList.add("btn-primary");
        }

        container.appendChild(button);
    });
}

/**
 * Configura o botão responsável por limpar o campo de busca da escola comparada.
 *
 * Mantém a visibilidade do botão sincronizada com o conteúdo do campo
 * e devolve o foco para o campo após a limpeza.
 *
 * @returns {void}
 */
function setupClearComparisonSearchInput() {
    const input = document.getElementById("comparisonSearchInput");
    const button = document.getElementById("clearComparisonSearchInput");

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

/**
 * Renderiza os indicadores disponíveis para a categoria selecionada.
 *
 * Cada grupo é apresentado como um card e os indicadores são exibidos
 * como botões. Indicadores diferentes de "total" recebem posteriormente
 * um seletor adicional para o filtro correspondente.
 *
 * @param {string} category Categoria atualmente selecionada.
 * @returns {void}
 */
function renderComparisonSubButtons(category) {
    const container = document.getElementById(
        "comparisonSubCategoryButtons"
    );

    container.innerHTML = "";

    if (!comparisonIndicators[category]) {
        return;
    }

    comparisonIndicators[category].forEach(group => {
        const groupContainer =
            document.createElement("div");

        groupContainer.className =
            "card border bg-light-subtle mb-3";

        const header =
            document.createElement("div");

        header.className =
            "card-header fw-semibold";

        header.textContent = group.title;

        const body =
            document.createElement("div");

        body.className =
            "card-body";

        const buttonRow =
            document.createElement("div");

        buttonRow.className =
            "d-flex gap-2 flex-wrap";

        group.items.forEach(indicator => {
            const button =
                document.createElement("button");

            button.className =
                "btn btn-outline-secondary btn-sm";

            button.textContent =
                formatComparisonIndicatorName(indicator);

            if (
                selectedComparisonSubcategory === indicator
            ) {
                button.classList.remove(
                    "btn-outline-secondary"
                );

                button.classList.add(
                    "btn-secondary"
                );
            }

            button.onclick = () => {
                // Remove seletores anteriores antes de construir
                // o filtro correspondente ao novo indicador.
                container
                    .querySelectorAll("select")
                    .forEach(select =>
                        select.remove()
                    );

                container
                    .querySelectorAll(".btn-secondary")
                    .forEach(btn => {
                        btn.classList.remove(
                            "btn-secondary"
                        );

                        btn.classList.add(
                            "btn-outline-secondary"
                        );
                    });

                selectedComparisonSubcategory =
                    indicator;

                selectedComparisonFilter = null;

                button.classList.remove(
                    "btn-outline-secondary"
                );

                button.classList.add(
                    "btn-secondary"
                );

                clearComparisonChart();
                clearComparisonSummary();

                if (indicator === "total") {
                    showComparisonChart(
                        selectedComparisonCategory,
                        selectedComparisonSubcategory
                    );

                    return;
                }

                // Indicadores específicos precisam de uma opção
                // adicional para definir o recorte da comparação.
                const select =
                    document.createElement("select");

                select.className =
                    "form-select form-select-sm";

                select.style.width = "280px";

                const placeholder =
                    document.createElement("option");

                placeholder.value = "";
                placeholder.textContent =
                    "Selecione...";
                placeholder.selected = true;

                select.appendChild(
                    placeholder
                );

                getComparisonFilterOptions(
                    selectedComparisonCategory,
                    indicator
                ).forEach(optionValue => {
                    const option =
                        document.createElement("option");

                    option.value = optionValue;
                    option.textContent = optionValue;

                    select.appendChild(option);
                });

                button.insertAdjacentElement(
                    "afterend",
                    select
                );

                select.addEventListener(
                    "change",
                    () => {
                        if (!select.value) {
                            selectedComparisonFilter =
                                null;

                            clearComparisonChart();
                            clearComparisonSummary();

                            return;
                        }

                        selectedComparisonFilter =
                            select.value;

                        showComparisonChart(
                            selectedComparisonCategory,
                            selectedComparisonSubcategory,
                            selectedComparisonFilter
                        );
                    }
                );
            };

            buttonRow.appendChild(button);
        });

        body.appendChild(buttonRow);

        groupContainer.appendChild(header);
        groupContainer.appendChild(body);

        container.appendChild(groupContainer);
    });
}

/**
 * Obtém as opções de filtro disponíveis para um indicador.
 *
 * @param {string} category Categoria do indicador.
 * @param {string} indicator Indicador selecionado.
 * @returns {string[]} Opções disponíveis para o filtro.
 */
function getComparisonFilterOptions(category, indicator) {
    return comparisonFilterOptions[indicator] || [];
}

/**
 * Converte o identificador interno de um indicador para o nome exibido na interface.
 *
 * @param {string} indicator Identificador do indicador.
 * @returns {string} Nome formatado do indicador.
 */
function formatComparisonIndicatorName(indicator) {
    const names = {
        total: "Total",
        modalidade: "Evolução por Modalidade",
        genero: "Evolução por Gênero",
        raca: "Evolução por Raça/Cor"
    };

    return names[indicator] || indicator;
}

/**
 * Carrega e exibe os dados e o gráfico da comparação entre as duas escolas.
 *
 * O resumo numérico e o gráfico do Metabase são carregados separadamente.
 * Para acessibilidade e dependências, também é carregado o recorte estrutural
 * correspondente às duas escolas.
 *
 * @param {string} categoria Categoria selecionada.
 * @param {string} indicador Indicador selecionado.
 * @param {string|null} filtro Filtro adicional do indicador, quando aplicável.
 * @returns {void}
 */
function showComparisonChart(
    categoria,
    indicador,
    filtro = null
) {
    clearComparisonStructureSnapshot();

    if (!selectedComparisonSchool) {
        return;
    }

    document
        .getElementById(
            "comparisonResultSeparator"
        )
        .classList.remove("d-none");

    const schoolCode =
        window.SCHOOL_CODE;

    const comparisonCode =
        selectedComparisonSchool.codigo;

    const iframe =
        document.getElementById(
            "comparisonMetabasePlayer"
        );

    iframe.classList.add("d-none");

    let dataUrl =
        `/api/comparacao/${schoolCode}/${comparisonCode}/${categoria}/${indicador}`;

    let chartUrl =
        `/api/comparacao/grafico/${schoolCode}/${comparisonCode}/${categoria}/${indicador}`;

    // O mesmo filtro é enviado tanto para o resumo quanto para o gráfico,
    // garantindo que as duas representações utilizem o mesmo recorte.
    if (filtro) {
        const encodedFilter =
            encodeURIComponent(filtro);

        dataUrl += `?filtro=${encodedFilter}`;
        chartUrl += `?filtro=${encodedFilter}`;
    }

    fetch(dataUrl)
        .then(response => response.json())
        .then(data => {
            renderComparisonSummary(data);
        })
        .catch(error => {
            console.error(
                "Erro ao carregar resumo da comparação:",
                error
            );
        });

    fetch(chartUrl)
        .then(response => response.json())
        .then(data => {
            if (!data.sucesso) {
                console.error(data.erro);
                return;
            }

            iframe.src = data.url;
            iframe.classList.remove("d-none");

            // Categorias estruturais utilizam, além do gráfico,
            // uma comparação direta dos recursos das duas escolas.
            if (
                categoria === "acessibilidade" ||
                categoria === "dependencias"
            ) {
                loadComparisonStructureSnapshot()
                    .then(data => {
                        renderComparisonStructureSnapshot(
                            categoria,
                            data.escola_principal,
                            data.escola_comparada
                        );
                    })
                    .catch(error => {
                        console.error(
                            "Erro ao carregar recorte da estrutura:",
                            error
                        );
                    });
            }
        })
        .catch(error => {
            console.error(
                "Erro ao carregar gráfico de comparação:",
                error
            );
        });
}

/**
 * Reseta completamente o estado da área de comparação.
 *
 * Remove a escola selecionada, indicadores, filtros, resultados,
 * sugestões de busca e elementos visuais associados à comparação.
 *
 * @returns {void}
 */
function resetComparisonView() {
    selectedComparisonSchool = null;
    selectedComparisonCategory = null;
    selectedComparisonSubcategory = null;
    selectedComparisonFilter = null;

    clearComparisonSummary();

    updateComparisonIndicatorMessage();

    const iframe =
        document.getElementById(
            "comparisonMetabasePlayer"
        );

    iframe.src = "";
    iframe.classList.add("d-none");

    document.getElementById(
        "comparisonResultSeparator"
    ).classList.add("d-none");

    document.getElementById(
        "comparisonMainCategoryButtons"
    ).innerHTML = "";

    document.getElementById(
        "comparisonSubCategoryButtons"
    ).innerHTML = "";

    document.getElementById(
        "comparisonSelectedState"
    ).classList.add("d-none");

    document.getElementById(
        "comparisonSearchState"
    ).classList.remove("d-none");

    document.getElementById(
        "comparisonSearchInput"
    ).value = "";

    document.getElementById(
        "comparisonSuggestions"
    ).innerHTML = "";

    document.getElementById(
        "comparisonSuggestions"
    ).classList.add("d-none");
}

/**
 * Remove o gráfico atualmente exibido na área de comparação.
 *
 * @returns {void}
 */
function clearComparisonChart() {
    const iframe =
        document.getElementById(
            "comparisonMetabasePlayer"
        );

    iframe.src = "";
    iframe.classList.add("d-none");

    document
        .getElementById(
            "comparisonResultSeparator"
        )
        .classList.add("d-none");
}

/**
 * Remove o resumo numérico atualmente exibido.
 *
 * @returns {void}
 */
function clearComparisonSummary() {
    const container =
        document.getElementById(
            "comparisonSummary"
        );

    container.innerHTML = "";
    container.classList.add("d-none");
}

/**
 * Renderiza os cartões com os valores da comparação entre as escolas.
 *
 * São exibidos o valor da escola principal, o valor da escola comparada
 * e a diferença entre ambos.
 *
 * @param {Object} data Dados retornados pelo endpoint de comparação.
 * @returns {void}
 */
function renderComparisonSummary(data) {
    const container =
        document.getElementById(
            "comparisonSummary"
        );

    if (
        !data ||
        !data.comparacao
    ) {
        container.classList.add("d-none");
        container.innerHTML = "";
        return;
    }

    const comparison = data.comparacao;

    const schoolName =
        document.getElementById(
            "schoolName"
        ).textContent;

    container.innerHTML = `
        <div class="row g-3">

            <div class="col-md-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">
                        <small class="text-muted">
                            ${schoolName}
                        </small>

                        <h4 class="mb-0 mt-2">
                            ${comparison.valor_principal}
                        </h4>

                        <small class="text-muted">
                            ${comparison.ano}
                        </small>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">
                        <small class="text-muted">
                            ${selectedComparisonSchool.nome}
                        </small>

                        <h4 class="mb-0 mt-2">
                            ${comparison.valor_comparado}
                        </h4>

                        <small class="text-muted">
                            ${comparison.ano}
                        </small>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">
                        <small class="text-muted">
                            Diferença
                        </small>

                        <h4 class="mb-0 ${
                            comparison.diferenca > 0
                                ? "text-success"
                                : comparison.diferenca < 0
                                    ? "text-danger"
                                    : "text-muted"
                        }">
                            ${comparison.diferenca > 0 ? "+" : ""}
                            ${comparison.diferenca}
                        </h4>

                        <small class="text-muted">
                            ${comparison.ano}
                        </small>
                    </div>
                </div>
            </div>

        </div>
    `;

    container.classList.remove("d-none");
}

/**
 * Atualiza a mensagem orientadora exibida acima dos indicadores de comparação.
 *
 * Quando nenhuma categoria foi escolhida, orienta o usuário a iniciar a seleção.
 * Após a escolha da categoria, informa que um indicador deve ser selecionado.
 *
 * @returns {void}
 */
function updateComparisonIndicatorMessage() {
    const title =
        document.querySelector(
            "#comparisonIndicatorMessage h5"
        );

    const text =
        document.querySelector(
            "#comparisonIndicatorMessage p"
        );

    const names = {
        matriculas: "Matrículas",
        docentes: "Docentes",
        turmas: "Turmas",
        dependencias: "Dependências",
        acessibilidade: "Acessibilidade"

    };

    if (!selectedComparisonCategory) {
        title.textContent =
            "O que deseja comparar?";

        text.textContent =
            "Selecione um tipo de indicador para começar.";

        return;
    }

    const name =
        names[selectedComparisonCategory];

    title.textContent = name;

    text.textContent =
        `Agora escolha um indicador de ${name}.`;
}

/**
 * Recupera a escola de comparação armazenada temporariamente na sessão.
 *
 * Esse mecanismo permite retornar ao mapa para selecionar uma escola
 * e depois restaurar automaticamente a escola escolhida na tela de comparação.
 *
 * @returns {void}
 */
function loadSavedComparisonSchool() {
    const savedSchool =
        sessionStorage.getItem(
            "comparisonSelectedSchool"
        );

    if (!savedSchool) {
        return;
    }

    try {
        selectedComparisonSchool =
            JSON.parse(savedSchool);

        document
            .getElementById(
                "comparisonSearchState"
            )
            .classList.add("d-none");

        document
            .getElementById(
                "comparisonSelectedState"
            )
            .classList.remove("d-none");

        document.getElementById(
            "comparisonSchoolName"
        ).textContent =
            selectedComparisonSchool.nome;

        document.getElementById(
            "comparisonSchoolLocation"
        ).textContent =
            `${selectedComparisonSchool.cidade} - ${selectedComparisonSchool.estado}`;

        document
            .getElementById(
                "comparisonSuggestions"
            )
            .classList.add("d-none");

        document.getElementById(
            "comparisonSearchInput"
        ).value = "";

        // Entra diretamente na aba de comparação sem disparar
        // uma nova inicialização das demais abas.
        window.switchTab(
            "comparison",
            false
        );

        renderComparisonMainButtons();

        sessionStorage.removeItem(
            "comparisonSelectedSchool"
        );

    } catch (error) {
        console.error(
            "Erro ao recuperar escola de comparação:",
            error
        );

        sessionStorage.removeItem(
            "comparisonSelectedSchool"
        );
    }
}

/**
 * Inicializa os eventos e o estado inicial da área de comparação.
 *
 * Configura a busca de escolas, os botões de troca e seleção pelo mapa,
 * o botão de limpeza do campo de busca e a restauração de uma escola
 * previamente selecionada.
 *
 * @returns {void}
 */
function initializeComparison() {
    const searchInput =
        document.getElementById(
            "comparisonSearchInput"
        );

    const changeButton =
        document.getElementById(
            "changeComparisonSchool"
        );

    const mapButton =
        document.getElementById(
            "chooseComparisonOnMap"
        );

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            onComparisonSearchInput
        );
    }

    if (changeButton) {
        changeButton.addEventListener(
            "click",
            changeComparisonSchool
        );
    }

    if (mapButton) {
        mapButton.addEventListener(
            "click",
            () => {
                // Armazena o contexto necessário para retornar do mapa
                // para a comparação da escola atualmente aberta.
                sessionStorage.setItem(
                    "comparisonMapMode",
                    "true"
                );

                sessionStorage.setItem(
                    "comparisonPrincipalSchoolCode",
                    window.SCHOOL_CODE
                );

                sessionStorage.setItem(
                    "comparisonReturnUrl",
                    window.location.href
                );

                window.location.href = "/mapa";
            }
        );
    }

    setupClearComparisonSearchInput();

    loadSavedComparisonSchool();
}

/**
 * Retorna o ícone correspondente a um valor booleano da estrutura escolar.
 *
 * @param {number} value Valor utilizado pela API para indicar presença ou ausência.
 * @returns {string} HTML do ícone correspondente.
 */
function getComparisonStructureBooleanIcon(value) {
    return value === 1
        ? `<i class="bi bi-check-circle-fill text-success fs-5"></i>`
        : `<i class="bi bi-x-circle-fill text-danger fs-5"></i>`;
}

/**
 * Limpa e oculta o recorte estrutural da comparação.
 *
 * @returns {void}
 */
function clearComparisonStructureSnapshot() {
    const container =
        document.getElementById(
            "comparisonStructureSnapshot"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";
    container.classList.add("d-none");
}

/**
 * Carrega os dados estruturais das duas escolas comparadas.
 *
 * Quando informados, os anos desejados são enviados para cada escola
 * por meio dos parâmetros correspondentes da requisição.
 *
 * @param {number|string|null} yearPrincipal Ano da escola principal.
 * @param {number|string|null} yearComparada Ano da escola comparada.
 * @returns {Promise<Object>} Dados estruturais retornados pela API.
 */
function loadComparisonStructureSnapshot(
    yearPrincipal = null,
    yearComparada = null
) {
    const schoolCode =
        window.SCHOOL_CODE;

    const comparisonCode =
        selectedComparisonSchool.codigo;

    const params =
        new URLSearchParams();

    if (yearPrincipal !== null) {
        params.set(
            "ano_principal",
            yearPrincipal
        );
    }

    if (yearComparada !== null) {
        params.set(
            "ano_comparacao",
            yearComparada
        );
    }

    const query =
        params.toString();

    const url =
        `/api/comparacao/estrutura/` +
        `${schoolCode}/${comparisonCode}` +
        (query ? `?${query}` : "");

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(
                    "Erro ao carregar estrutura da comparação."
                );
            }

            return response.json();
        });
}

/**
 * Renderiza a comparação estrutural lado a lado entre as duas escolas.
 *
 * Os recursos estruturais são apresentados uma única vez à esquerda,
 * enquanto cada escola possui sua própria coluna com o respectivo ano.
 * Os anos disponíveis são organizados em ordem decrescente.
 *
 * @param {string} category Categoria estrutural comparada.
 * @param {Object} mainData Dados estruturais da escola principal.
 * @param {Object} comparisonData Dados estruturais da escola comparada.
 * @returns {void}
 */
function renderComparisonStructureSnapshot(
    category,
    mainData,
    comparisonData
) {
    const container =
        document.getElementById(
            "comparisonStructureSnapshot"
        );

    if (
        !container ||
        !mainData ||
        !comparisonData
    ) {
        return;
    }

    const config =
        comparisonStructureSnapshotConfig[category];

    if (!config) {
        return;
    }

    const mainValues =
        mainData[category] || {};

    const comparisonValues =
        comparisonData[category] || {};

    const mainYears =
        mainData.anos_disponiveis
            .map(Number)
            .sort((a, b) => b - a);

    const comparisonYears =
        comparisonData.anos_disponiveis
            .map(Number)
            .sort((a, b) => b - a);

    const mainYear =
        Number(mainData.ano);

    const comparisonYear =
        Number(comparisonData.ano);

    const mainSchoolName =
        document.getElementById(
            "schoolName"
        ).textContent;

    const comparisonSchoolName =
        selectedComparisonSchool.nome;

    // Constrói cada linha do quadro com o mesmo recurso
    // sendo exibido nas duas escolas.
    const rows =
        config.fields
            .map(field => {
                const mainValue =
                    mainValues[field.key];

                const comparisonValue =
                    comparisonValues[field.key];

                return `
                    <div class="row py-2 border-bottom align-items-center">

                        <div class="col-sm-6 fw-bold">
                            ${field.label}
                        </div>

                        <div class="col-sm-3 text-center">
                            ${getComparisonStructureBooleanIcon(
                                mainValue
                            )}
                        </div>

                        <div class="col-sm-3 text-center">
                            ${getComparisonStructureBooleanIcon(
                                comparisonValue
                            )}
                        </div>

                    </div>
                `;
            })
            .join("");

    const mainOptions =
        mainYears
            .map(year => `
                <option
                    value="${year}"
                    ${year === mainYear ? "selected" : ""}>
                    ${year}
                </option>
            `)
            .join("");

    const comparisonOptions =
        comparisonYears
            .map(year => `
                <option
                    value="${year}"
                    ${year === comparisonYear ? "selected" : ""}>
                    ${year}
                </option>
            `)
            .join("");

    container.innerHTML = `
        <div class="card shadow-sm border-0 rounded-3">
            <div class="card-body p-4">

                <h5 class="text-primary mb-4">
                    ${config.title}
                </h5>

                <div class="row py-2 border-bottom align-items-center">

                    <div class="col-sm-6 fw-bold">
                        Recurso
                    </div>

                    <div class="col-sm-3 text-center">

                        <div class="small text-muted mb-1">
                            ${mainSchoolName}
                        </div>

                        <select
                            id="comparisonStructureYear1"
                            class="form-select form-select-sm">
                            ${mainOptions}
                        </select>

                    </div>

                    <div class="col-sm-3 text-center">

                        <div class="small text-muted mb-1">
                            ${comparisonSchoolName}
                        </div>

                        <select
                            id="comparisonStructureYear2"
                            class="form-select form-select-sm">
                            ${comparisonOptions}
                        </select>

                    </div>

                </div>

                ${rows}

            </div>
        </div>
    `;

    const mainSelect =
        document.getElementById(
            "comparisonStructureYear1"
        );

    const comparisonSelect =
        document.getElementById(
            "comparisonStructureYear2"
        );

    mainSelect.addEventListener(
        "change",
        async () => {
            try {
                const data =
                    await loadComparisonStructureSnapshot(
                        mainSelect.value,
                        comparisonSelect.value
                    );

                renderComparisonStructureSnapshot(
                    category,
                    data.escola_principal,
                    data.escola_comparada
                );

            } catch (error) {
                console.error(
                    "Erro ao carregar estrutura da escola principal:",
                    error
                );
            }
        }
    );

    comparisonSelect.addEventListener(
        "change",
        async () => {
            try {
                const data =
                    await loadComparisonStructureSnapshot(
                        mainSelect.value,
                        comparisonSelect.value
                    );

                renderComparisonStructureSnapshot(
                    category,
                    data.escola_principal,
                    data.escola_comparada
                );

            } catch (error) {
                console.error(
                    "Erro ao carregar estrutura da escola comparada:",
                    error
                );
            }
        }
    );

    container.classList.remove("d-none");
}

/**
 * Remove os botões e controles dos indicadores subordinados.
 *
 * @returns {void}
 */
function clearComparisonSubButtons() {
    const container =
        document.getElementById(
            "comparisonSubCategoryButtons"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";
}

// Expõe a inicialização para ser chamada pelo carregamento da ficha escolar.
window.initializeComparison =
    initializeComparison;