let selectedComparisonDivision = null;
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

function renderComparisonSummary(data) {
    const container =
        document.getElementById(
            "comparisonSummary"
        );

    if (
        !data ||
        !data.comparacao ||
        !selectedComparisonDivision
    ) {
        container.innerHTML = "";
        container.classList.add("d-none");
        return;
    }

    const comparison =
        data.comparacao;

    const divisionName =
        document.getElementById(
            "divisionName"
        ).textContent;

    const comparisonName =
        selectedComparisonDivision.nome;

    container.innerHTML = `
        <div class="row g-3">

            <div class="col-md-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">

                        <small class="text-muted">
                            ${divisionName}
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
                            ${comparisonName}
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

                        <h4 class="mb-0 mt-2 ${
                            comparison.diferenca > 0
                                ? "text-success"
                                : comparison.diferenca < 0
                                    ? "text-danger"
                                    : "text-muted"
                        }">

                            ${
                                comparison.diferenca > 0
                                    ? "+"
                                    : ""
                            }

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

function searchComparisonDivisions(term) {
    const encodedTerm =
        encodeURIComponent(term);

    return fetch(
        `/api/busca-divisao/` +
        `${encodeURIComponent(window.DIVISION_TYPE)}/` +
        `${encodedTerm}?codigo=${encodeURIComponent(window.DIVISION_CODE)}`
    )
        .then(response => response.json());
}

function createComparisonSuggestion(division) {
    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "list-group-item list-group-item-action text-start py-2";

    button.innerHTML = `
        <div class="fw-bold text-dark">
            ${division.nome}
        </div>

        <div class="text-muted">
            <small>
                ${division.descricao}
            </small>
        </div>
    `;

    button.onclick = () => {
        selectedComparisonDivision =
            division;

        document
            .getElementById("comparisonSearchState")
            .classList.add("d-none");

        document
            .getElementById("comparisonSelectedState")
            .classList.remove("d-none");

        document
            .getElementById("comparisonIndicators")
            .classList.remove("d-none");

        document.getElementById(
            "comparisonSelectedName"
        ).textContent =
            division.nome;

        document.getElementById(
            "comparisonSelectedDescription"
        ).textContent =
            division.descricao;

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

function showComparisonSuggestions(divisions) {
    const container =
        document.getElementById(
            "comparisonSuggestions"
        );

    container.innerHTML = "";

    if (!divisions || divisions.length === 0) {
        container.innerHTML = `
            <div class="list-group-item text-muted">
                Nenhuma divisão encontrada
            </div>
        `;

        container.classList.remove("d-none");

        return;
    }

    divisions.forEach(division => {
        container.appendChild(
            createComparisonSuggestion(division)
        );
    });

    container.classList.remove("d-none");
}

function onComparisonSearchInput() {
    const input =
        document.getElementById(
            "comparisonSearchInput"
        );

    const term =
        input.value.trim();

    if (term.length < 3) {
        document
            .getElementById("comparisonSuggestions")
            .classList.add("d-none");

        return;
    }

    searchComparisonDivisions(term)
        .then(data => {
            console.log(
                "Resposta da busca de divisão:",
                data
            );

            showComparisonSuggestions(data);
        })
        .catch(error => {
            console.error(
                "Erro ao buscar divisões para comparação:",
                error
            );

            showComparisonSuggestions([]);
        });
}

function changeComparisonDivision() {
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

function formatComparisonIndicatorName(indicator) {
    const names = {
        total: "Total",
        modalidade: "Evolução por Modalidade",
        genero: "Evolução por Gênero",
        raca: "Evolução por Raça/Cor"
    };

    return names[indicator] || indicator;
}

function getComparisonFilterOptions(
    category,
    indicator
) {
    return comparisonFilterOptions[indicator] || [];
}

function updateComparisonIndicatorMessage() {
    const container =
        document.getElementById(
            "comparisonIndicatorMessage"
        );

    const title =
        container.querySelector("h5");

    const text =
        container.querySelector("p");

    if (!selectedComparisonCategory) {
        title.textContent =
            "O que deseja comparar?";

        text.textContent =
            "Selecione um indicador para comparar.";

        return;
    }

    const name =
        formatComparisonCategoryName(
            selectedComparisonCategory
        );

    title.textContent = name;

    text.textContent =
        `Agora escolha um indicador de ${name}.`;
}

function clearDynamicComparisonFilters() {
    document
        .querySelectorAll(
            ".comparison-dynamic-filter"
        )
        .forEach(select => {
            select.remove();
        });
}

function renderComparisonMainButtons() {
    const container =
        document.getElementById(
            "comparisonMainCategoryButtons"
        );

    container.innerHTML = "";

    comparisonCategoryOrder.forEach(category => {
        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "btn btn-outline-primary";

        button.textContent =
            formatComparisonCategoryName(
                category
            );

        if (
            selectedComparisonCategory === category
        ) {
            button.classList.remove(
                "btn-outline-primary"
            );

            button.classList.add(
                "btn-primary"
            );
        }

        button.onclick = () => {
            selectedComparisonCategory =
                category;

            selectedComparisonSubcategory =
                null;

            selectedComparisonFilter =
                null;

            clearComparisonChart();

            clearDynamicComparisonFilters();

            document
                .getElementById(
                    "comparisonSubCategoryButtons"
                )
                .innerHTML = "";

            updateComparisonIndicatorMessage();

            renderComparisonMainButtons();

            renderComparisonSubButtons(
                category
            );
        };

        container.appendChild(button);
    });
}

function renderComparisonSubButtons(
    category
) {
    const container =
        document.getElementById(
            "comparisonSubCategoryButtons"
        );

    container.innerHTML = "";

    if (!comparisonIndicators[category]) {
        return;
    }

    comparisonIndicators[category].forEach(
        group => {

            const groupContainer =
                document.createElement("div");

            groupContainer.className =
                "card border bg-light-subtle mb-3";

            const header =
                document.createElement("div");

            header.className =
                "card-header fw-semibold";

            header.textContent =
                group.title;

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
                    document.createElement(
                        "button"
                    );

                button.type = "button";

                button.className =
                    "btn btn-outline-secondary btn-sm";

                button.textContent =
                    formatComparisonIndicatorName(
                        indicator
                    );

                if (
                    selectedComparisonSubcategory ===
                    indicator
                ) {
                    button.classList.remove(
                        "btn-outline-secondary"
                    );

                    button.classList.add(
                        "btn-secondary"
                    );
                }

                button.onclick = () => {

                    clearDynamicComparisonFilters();

                    selectedComparisonSubcategory =
                        indicator;

                    selectedComparisonFilter =
                        null;

                    clearComparisonChart();

                    container
                        .querySelectorAll(
                            "button.btn-secondary"
                        )
                        .forEach(otherButton => {

                            otherButton.classList.remove(
                                "btn-secondary"
                            );

                            otherButton.classList.add(
                                "btn-outline-secondary"
                            );
                        });

                    button.classList.remove(
                        "btn-outline-secondary"
                    );

                    button.classList.add(
                        "btn-secondary"
                    );

                    if (
                        indicator === "total"
                    ) {
                        showComparisonChart(
                            selectedComparisonCategory,
                            selectedComparisonSubcategory
                        );

                        return;
                    }

                    const select =
                        document.createElement(
                            "select"
                        );

                    select.className =
                        "form-select form-select-sm comparison-dynamic-filter";

                    select.style.width =
                        "280px";

                    const placeholder =
                        document.createElement(
                            "option"
                        );

                    placeholder.value = "";

                    placeholder.textContent =
                        "Selecione...";

                    placeholder.selected =
                        true;

                    select.appendChild(
                        placeholder
                    );

                    getComparisonFilterOptions(
                        selectedComparisonCategory,
                        indicator
                    ).forEach(optionValue => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            optionValue;

                        option.textContent =
                            optionValue;

                        select.appendChild(
                            option
                        );
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

                buttonRow.appendChild(
                    button
                );
            });

            body.appendChild(
                buttonRow
            );

            groupContainer.appendChild(
                header
            );

            groupContainer.appendChild(
                body
            );

            container.appendChild(
                groupContainer
            );
        }
    );
}

function clearComparisonSummary() {
    const container =
        document.getElementById(
            "comparisonSummary"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";
    container.classList.add("d-none");
}

function clearComparisonChart() {
    const iframe =
        document.getElementById(
            "comparisonMetabasePlayer"
        );

    if (iframe) {
        iframe.src = "";
        iframe.classList.add("d-none");
    }

    const separator =
        document.getElementById(
            "comparisonResultSeparator"
        );

    if (separator) {
        separator.classList.add("d-none");
    }

    clearComparisonSummary();
}

function showComparisonChart(
    categoria,
    indicador,
    filtro = null
) {
    if (!selectedComparisonDivision) {
        return;
    }

    clearComparisonChart();

    const params =
        new URLSearchParams();

    params.set(
        "tipo",
        window.DIVISION_TYPE
    );

    params.set(
        "codigo",
        window.DIVISION_CODE
    );

    params.set(
        "tipo_comparacao",
        window.DIVISION_TYPE
    );

    params.set(
        "codigo_comparacao",
        selectedComparisonDivision.codigo
    );

    if (filtro) {
        params.set(
            "filtro",
            filtro
        );
    }

    const query =
        `?${params.toString()}`;

    fetch(
        `/api/divisoes/comparacao/` +
        `${encodeURIComponent(categoria)}/` +
        `${encodeURIComponent(indicador)}` +
        query
    )
        .then(response => {
            if (!response.ok) {
                throw new Error(
                    "Erro ao carregar resumo da comparação."
                );
            }

            return response.json();
        })
        .then(data => {
            renderComparisonSummary(data);
        })
        .catch(error => {
            console.error(
                "Erro ao carregar resumo da comparação:",
                error
            );

            clearComparisonSummary();
        });

    const url =
        `/api/divisoes/comparacao/grafico/` +
        `${encodeURIComponent(categoria)}/` +
        `${encodeURIComponent(indicador)}` +
        query;

    const separator =
        document.getElementById(
            "comparisonResultSeparator"
        );

    const iframe =
        document.getElementById(
            "comparisonMetabasePlayer"
        );

    separator.classList.remove(
        "d-none"
    );

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(
                    "Erro ao carregar o gráfico de comparação."
                );
            }

            return response.json();
        })
        .then(data => {
            if (!data.sucesso) {
                throw new Error(
                    data.erro ||
                    "Erro ao gerar o gráfico de comparação."
                );
            }

            iframe.src =
                data.url;

            iframe.classList.remove(
                "d-none"
            );
        })
        .catch(error => {
            console.error(
                "Erro ao carregar gráfico de comparação:",
                error
            );

            iframe.src = "";

            iframe.classList.add(
                "d-none"
            );
        });
}

function resetComparisonView() {
    selectedComparisonDivision = null;
    selectedComparisonCategory = null;
    selectedComparisonSubcategory = null;
    selectedComparisonFilter = null;

    document
        .getElementById("comparisonSelectedState")
        .classList.add("d-none");

    document
        .getElementById("comparisonSearchState")
        .classList.remove("d-none");

    document
        .getElementById("comparisonSearchInput")
        .value = "";

    document
        .getElementById("comparisonSuggestions")
        .innerHTML = "";

    document
        .getElementById("comparisonSuggestions")
        .classList.add("d-none");

    document
        .getElementById("comparisonIndicators")
        .classList.add("d-none");

    document
        .getElementById("comparisonMainCategoryButtons")
        .innerHTML = "";

    clearDynamicComparisonFilters();

    document
        .getElementById("comparisonSubCategoryButtons")
        .innerHTML = "";

    document
        .getElementById("comparisonResultSeparator")
        .classList.add("d-none");

    document
        .getElementById("comparisonSummary")
        .innerHTML = "";

    document
        .getElementById("comparisonSummary")
        .classList.add("d-none");

    const iframe =
        document.getElementById(
            "comparisonMetabasePlayer"
        );

    iframe.src = "";
    iframe.classList.add("d-none");

    document
        .getElementById("comparisonIndicatorMessage")
        .querySelector("h5")
        .textContent =
            "O que deseja comparar?";

    document
        .getElementById("comparisonIndicatorMessage")
        .querySelector("p")
        .textContent =
            "Selecione um indicador para comparar.";
}

function setupComparisonSearch() {
    const input =
        document.getElementById(
            "comparisonSearchInput"
        );

    const changeButton =
        document.getElementById(
            "changeComparisonDivision"
        );

    const clearButton =
        document.getElementById(
            "clearComparisonSearchInput"
        );

    if (input) {
        input.addEventListener(
            "input",
            onComparisonSearchInput
        );
    }

    if (changeButton) {
        changeButton.addEventListener(
            "click",
            changeComparisonDivision
        );
    }

    if (input && clearButton) {
        const updateClearButton = () => {
            clearButton.classList.toggle(
                "d-none",
                input.value.trim() === ""
            );
        };

        input.addEventListener(
            "input",
            updateClearButton
        );

        clearButton.addEventListener(
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

        updateClearButton();
    }
}

function initializeComparison() {
    if (window.DIVISION_TYPE === "pais") {
        return;
    }

    setupComparisonSearch();
}

window.initializeComparison =
    initializeComparison;