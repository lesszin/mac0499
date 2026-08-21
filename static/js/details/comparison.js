let selectedComparisonSchool = null;
let selectedComparisonCategory = null;
let selectedComparisonSubcategory = null;
let selectedComparisonFilter = null;
const comparisonCategoryOrder = [
    "matriculas",
    "docentes",
    "turmas"
];
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

function searchComparisonSchools(term) {
    return fetch(`/api/busca/${term}`)
        .then(response => response.json());
}

function createComparisonSuggestion(school) {
    const button = document.createElement("button");

    button.className =
        "list-group-item list-group-item-action text-start py-2";

    button.innerHTML = `
        <div class="fw-bold text-dark">
            ${school.nome}
        </div>

        <small class="text-muted">
            ${school.cidade} - ${school.estado}
        </small>
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

function changeComparisonSchool() {
    resetComparisonView();
}

function formatComparisonCategoryName(category) {
    const names = {
        matriculas: "Matrículas",
        docentes: "Docentes",
        turmas: "Turmas"
    };

    return names[category] || category;
}

function renderComparisonMainButtons() {
    const container = document.getElementById(
        "comparisonMainCategoryButtons"
    );

    container.innerHTML = "";

    comparisonCategoryOrder.forEach(category => {
        if (!comparisonIndicators[category]) {
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

            updateComparisonIndicatorMessage();

            renderComparisonMainButtons();
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

function getComparisonFilterOptions(category, indicator) {
    return comparisonFilterOptions[indicator] || [];
}

function formatComparisonIndicatorName(indicator) {
    const names = {
        total: "Total",
        modalidade: "Evolução por Modalidade",
        genero: "Evolução por Gênero",
        raca: "Evolução por Raça/Cor"
    };

    return names[indicator] || indicator;
}

function showComparisonChart(
    categoria,
    indicador,
    filtro = null
) {
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
        })
        .catch(error => {
            console.error(
                "Erro ao carregar gráfico de comparação:",
                error
            );
        });
}

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

function clearComparisonSummary() {
    const container =
        document.getElementById(
            "comparisonSummary"
        );

    container.innerHTML = "";
    container.classList.add("d-none");
}

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
        turmas: "Turmas"
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

        window.switchTab("comparison");

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

                window.location.href = "/";
            }
        );
    }

    loadSavedComparisonSchool();
}

window.initializeComparison =
    initializeComparison;