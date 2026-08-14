let evolutionCharts = null;
let selectedCategory = null;
let selectedSubcategory = null;
const evolutionCategoryOrder = [
    "matriculas",
    "docentes",
    "turmas"
];
const subcategoryGroups = {
    matriculas: [
        {
            title: "Indicadores Gerais",
            items: [
                "total",
                "variacao"
            ]
        },
        {
            title: "Modalidade",
            items: [
                "evolucao_modalidade",
                "participacao_modalidade",
                "crescimento_modalidade"
            ]
        },
        {
            title: "Gênero",
            items: [
                "evolucao_genero",
                "participacao_genero"
            ]
        },
        {
            title: "Raça/Cor",
            items: [
                "evolucao_raca",
                "participacao_raca",
                "crescimento_raca"
            ]
        }
    ],

    docentes: [
        {
            title: "Indicadores Gerais",
            items: [
                "total",
                "variacao"
            ]
        },
        {
            title: "Modalidade",
            items: [
                "evolucao_modalidade",
                "participacao_modalidade",
                "crescimento_modalidade"
            ]
        }
    ],

    turmas: [
        {
            title: "Indicadores Gerais",
            items: [
                "total",
                "variacao"
            ]
        },
        {
            title: "Modalidade",
            items: [
                "evolucao_modalidade",
                "participacao_modalidade",
                "crescimento_modalidade"
            ]
        }
    ]
};

async function loadChartSummary(
    category,
    subcategory
) {
    const response = await fetch(
        `/api/evolucao/resumo/${window.SCHOOL_CODE}/${category}/${subcategory}`
    );

    if (!response.ok) {
        return null;
    }

    return await response.json();
}

async function loadEvolutionCharts() {
    const response = await fetch(
        `/api/evolucao/${window.SCHOOL_CODE}`
    );

    const data = await response.json();

    if (!data.sucesso) {
        console.error(data.erro);
        return null;
    }

    return data.urls;
}

async function initializeEvolution() {
    if (evolutionCharts !== null) {
        return;
    }

    const charts = await loadEvolutionCharts();

    if (!charts) {
        return;
    }

    evolutionCharts = charts;

    renderMainButtons();
}

function renderMainButtons() {
    const container =
        document.getElementById(
            "mainCategoryButtons"
        );

    container.innerHTML = "";

    evolutionCategoryOrder.forEach(category => {
        if (!evolutionCharts[category]) {
            return;
        }

        const button =
            document.createElement("button");

        button.className =
            "btn btn-outline-primary";

        button.textContent =
            formatCategoryName(category);

        button.onclick = () => {
            selectedCategory = category;
            selectedSubcategory = null;

            resetEvolutionView();
            renderMainButtons();
            renderSubButtons();
            clearChart();
        };

        if (
            selectedCategory === category
        ) {
            button.classList.remove(
                "btn-outline-primary"
            );

            button.classList.add(
                "btn-primary"
            );
        }

        container.appendChild(button);
    });
}

function renderSubButtons() {
    const container =
        document.getElementById(
            "subCategoryButtons"
        );

    container.innerHTML = "";

    if (!selectedCategory) {
        return;
    }

    subcategoryGroups[
        selectedCategory
    ].forEach(group => {

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

        groupContainer.appendChild(header);

        const buttonRow =
            document.createElement("div");

        buttonRow.className =
            "d-flex gap-2 flex-wrap";

        group.items.forEach(subcategory => {

            if (
                !evolutionCharts[
                    selectedCategory
                ][subcategory]
            ) {
                return;
            }

            const button =
                document.createElement("button");

            button.className =
                "btn btn-outline-secondary btn-sm";

            button.textContent =
                formatSubcategoryName(
                    subcategory
                );

            button.onclick = () => {
                selectedSubcategory =
                    subcategory;

                renderSubButtons();
                showChart();
            };

            if (
                selectedSubcategory ===
                subcategory
            ) {
                button.classList.remove(
                    "btn-outline-secondary"
                );

                button.classList.add(
                    "btn-secondary"
                );
            }

            buttonRow.appendChild(button);
        });

        const body =
            document.createElement("div");

        body.className =
            "card-body";

        body.appendChild(buttonRow);

        groupContainer.appendChild(body);

        container.appendChild(
            groupContainer
        );
    });
}

function formatCategoryName(category) {
    const names = {
        matriculas: "Matrículas",
        docentes: "Docentes",
        turmas: "Turmas"
    };

    return names[category] || category;
}

function formatSubcategoryName(subcategory) {
    const names = {
        total: "Total",
        variacao: "Variação Anual",
        evolucao_modalidade:
            "Evolução por Modalidade",
        participacao_modalidade:
            "Participação por Modalidade",
        crescimento_modalidade:
            "Crescimento por Modalidade",
        evolucao_genero:
            "Evolução por Gênero",
        participacao_genero:
            "Participação por Gênero",
        evolucao_raca:
            "Evolução por Raça/Cor",
        participacao_raca:
            "Participação por Raça/Cor",
        crescimento_raca:
            "Crescimento por Raça/Cor"
    };

    return names[subcategory] ||
        subcategory;
}

async function showChart() {
    document
        .getElementById(
            "evolutionResultSeparator"
        )
        .classList.remove("d-none");

    const loader =
        document.getElementById(
            "evolutionLoader"
        );

    const iframe =
        document.getElementById(
            "metabasePlayer"
        );

    const url =
        evolutionCharts[
            selectedCategory
        ][selectedSubcategory];

    iframe.classList.add("d-none");

    loader.classList.remove("d-none");

    iframe.onload = null;

    iframe.onload = () => {
        loader.classList.add("d-none");
        iframe.classList.remove("d-none");
    };

    const summary =
        await loadChartSummary(
            selectedCategory,
            selectedSubcategory
        );

    renderChartSummary(summary);

    iframe.src = url;
}

function clearChart() {
    document
        .getElementById(
            "evolutionResultSeparator"
        )
        .classList.add("d-none");

    const loader =
        document.getElementById(
            "evolutionLoader"
        );

    const iframe =
        document.getElementById(
            "metabasePlayer"
        );

    iframe.onload = null;

    iframe.src = "";

    iframe.classList.add("d-none");

    loader.classList.add("d-none");

    const title =
        document.querySelector(
            "#chartPlaceholder h5"
        );

    const text =
        document.querySelector(
            "#chartPlaceholder p"
        );

    if (!selectedCategory) {
        title.textContent =
            "Evolução da Escola";

        text.textContent =
            "Selecione um tipo de indicador para começar.";
    } else {
        const names = {
            matriculas: "Matrículas",
            docentes: "Docentes",
            turmas: "Turmas"
        };

        title.textContent =
            names[selectedCategory];

        text.textContent =
            `Agora escolha um indicador de ${names[selectedCategory]}.`;
    }

    const summary =
        document.getElementById(
            "chartSummary"
        );

    summary.classList.add("d-none");
    summary.innerHTML = "";
}

function renderChartSummary(summary) {
    const container =
        document.getElementById(
            "chartSummary"
        );

    if (!summary) {
        container.classList.add("d-none");
        return;
    }

    container.classList.remove("d-none");

    container.innerHTML = `
        <div class="row g-3">

            <div class="col-md-3">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">
                        <small class="text-muted">
                            Crescimento
                        </small>

                        <h4 class="mb-0">
                            ${summary.crescimento.percentual}%
                        </h4>

                        <small>
                            ${
                                summary.crescimento.absoluto > 0
                                    ? "+"
                                    : ""
                            }
                            ${summary.crescimento.absoluto}
                        </small>
                    </div>
                </div>
            </div>

            <div class="col-md-3">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">
                        <small class="text-muted">
                            Pico histórico
                        </small>

                        <h4 class="mb-0">
                            ${summary.maximo.valor}
                        </h4>

                        <small>
                            ${summary.maximo.ano}
                        </small>
                    </div>
                </div>
            </div>

            <div class="col-md-3">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">
                        <small class="text-muted">
                            Maior alta
                        </small>

                        <h4 class="mb-0 text-success">
                            ${
                                summary.maior_alta.valor > 0
                                    ? "+"
                                    : ""
                            }
                            ${summary.maior_alta.valor}
                        </h4>

                        <small>
                            ${summary.maior_alta.de}
                            →
                            ${summary.maior_alta.para}
                        </small>
                    </div>
                </div>
            </div>

            <div class="col-md-3">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">
                        <small class="text-muted">
                            Maior queda
                        </small>

                        <h4 class="mb-0 text-danger">
                            ${summary.maior_queda.valor}
                        </h4>

                        <small>
                            ${summary.maior_queda.de}
                            →
                            ${summary.maior_queda.para}
                        </small>
                    </div>
                </div>
            </div>

        </div>
    `;
}

function resetEvolutionView() {
    document
        .getElementById(
            "chartSummary"
        )
        .classList.add("d-none");

    document
        .getElementById(
            "metabasePlayer"
        )
        .classList.add("d-none");

    document
        .getElementById(
            "chartPlaceholder"
        )
        .classList.remove("d-none");
}

window.initializeEvolution =
    initializeEvolution;