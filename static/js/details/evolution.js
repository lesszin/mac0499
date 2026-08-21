let evolutionCharts = null;
let selectedCategory = null;
let selectedSubcategory = null;
const evolutionCategoryOrder = [
    "matriculas",
    "docentes",
    "turmas",
    "dependencias",
    "acessibilidade"
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
const structureSnapshotConfig = {
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
            clearChart();
            renderSubButtons();

            if (
                category === "acessibilidade" ||
                category === "dependencias"
            ) {
                selectedSubcategory = "total";
                showChart();
                return;
            }
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

    if (!subcategoryGroups[selectedCategory]) {
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
        turmas: "Turmas",
        dependencias: "Dependências",
        acessibilidade: "Acessibilidade"
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
    clearStructureSnapshot();
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

    if (
        selectedCategory === "acessibilidade" ||
        selectedCategory === "dependencias"
    ) {
        try {
            const currentSnapshot =
                await loadStructureSnapshot();

            const currentYear =
                Number(currentSnapshot.ano);

            const comparisonYear =
                currentSnapshot.anos_disponiveis
                    .map(Number)
                    .filter(year => year < currentYear)
                    .sort((a, b) => b - a)[0];

            const comparisonSnapshot =
                comparisonYear !== undefined
                    ? await loadStructureSnapshot(
                        comparisonYear
                    )
                    : currentSnapshot;

            renderStructureSnapshot(
                selectedCategory,
                currentSnapshot,
                comparisonSnapshot
            );

        } catch (error) {
            console.error(
                "Erro ao carregar recorte histórico:",
                error
            );
        }
    }
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
            turmas: "Turmas",
            dependencias: "Dependências",
            acessibilidade: "Acessibilidade"
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

function getStructureBooleanIcon(value) {
    return value === 1
        ? `<i class="bi bi-check-circle-fill text-success fs-5"></i>`
        : `<i class="bi bi-x-circle-fill text-danger fs-5"></i>`;
}

async function loadStructureSnapshot(year = null) {
    let url =
        `/api/evolucao/estrutura/${window.SCHOOL_CODE}`;

    if (year !== null) {
        url += `?ano=${encodeURIComponent(year)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            "Erro ao carregar o histórico da estrutura."
        );
    }

    return await response.json();
}

function renderStructureSnapshot(
    category,
    firstData,
    secondData
) {
    const container =
        document.getElementById(
            "structureSnapshot"
        );

    const config =
        structureSnapshotConfig[category];

    if (
        !container ||
        !config ||
        !firstData ||
        !secondData
    ) {
        return;
    }

    const firstValues =
        firstData[category] || {};

    const secondValues =
        secondData[category] || {};

    const years =
        firstData.anos_disponiveis
            .map(Number)
            .sort((a, b) => b - a);

    const firstYear =
        Number(firstData.ano);

    const secondYear =
        Number(secondData.ano);

    const rows =
        config.fields
            .map(field => {
                const firstValue =
                    firstValues[field.key];

                const secondValue =
                    secondValues[field.key];

                return `
                    <div class="row py-2 border-bottom align-items-center">

                        <div class="col-sm-6 fw-bold">
                            ${field.label}
                        </div>

                        <div class="col-sm-3 text-center">
                            ${getStructureBooleanIcon(
                                firstValue
                            )}
                        </div>

                        <div class="col-sm-3 text-center">
                            ${getStructureBooleanIcon(
                                secondValue
                            )}
                        </div>

                    </div>
                `;
            })
            .join("");

    const firstOptions =
        years
            .map(year => `
                <option
                    value="${year}"
                    ${year === firstYear ? "selected" : ""}
                    ${year === secondYear ? "disabled" : ""}>
                    ${year}
                </option>
            `)
            .join("");

    const secondOptions =
        years
            .map(year => `
                <option
                    value="${year}"
                    ${year === secondYear ? "selected" : ""}
                    ${year === firstYear ? "disabled" : ""}>
                    ${year}
                </option>
            `)
            .join("");

    container.innerHTML = `
        <div class="card shadow-sm border-0 rounded-3">
            <div class="card-body p-4">

                <div class="d-flex justify-content-between align-items-center mb-4">

                    <h5 class="text-primary mb-0">
                        ${config.title}
                    </h5>

                </div>

                <div class="row py-2 border-bottom align-items-center">

                    <div class="col-sm-6 fw-bold">
                        Recurso
                    </div>

                    <div class="col-sm-3 text-center">

                        <select
                            id="structureYearSelect1"
                            class="form-select form-select-sm">
                            ${firstOptions}
                        </select>

                    </div>

                    <div class="col-sm-3 text-center">

                        <select
                            id="structureYearSelect2"
                            class="form-select form-select-sm">
                            ${secondOptions}
                        </select>

                    </div>

                </div>

                ${rows}

            </div>
        </div>
    `;

    const firstSelect =
        document.getElementById(
            "structureYearSelect1"
        );

    const secondSelect =
        document.getElementById(
            "structureYearSelect2"
        );

    firstSelect.addEventListener(
        "change",
        async () => {
            try {
                const newFirstData =
                    await loadStructureSnapshot(
                        firstSelect.value
                    );

                renderStructureSnapshot(
                    category,
                    newFirstData,
                    secondData
                );

            } catch (error) {
                console.error(
                    "Erro ao carregar o primeiro ano:",
                    error
                );
            }
        }
    );

    secondSelect.addEventListener(
        "change",
        async () => {
            try {
                const newSecondData =
                    await loadStructureSnapshot(
                        secondSelect.value
                    );

                renderStructureSnapshot(
                    category,
                    firstData,
                    newSecondData
                );

            } catch (error) {
                console.error(
                    "Erro ao carregar o segundo ano:",
                    error
                );
            }
        }
    );

    container.classList.remove("d-none");
}

function clearStructureSnapshot() {
    const container =
        document.getElementById(
            "structureSnapshot"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";
    container.classList.add("d-none");
}

window.initializeEvolution =
    initializeEvolution;