let evolutionCharts = null;
let selectedCategory = null;
let selectedSubcategory = null;


// Define a ordem em que as categorias principais de evolução
// devem ser apresentadas na interface.
const evolutionCategoryOrder = [
    "matriculas",
    "docentes",
    "turmas"
];


// Organiza os indicadores em grupos para cada categoria principal.
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
    /**
     * Carrega do backend o resumo temporal de um indicador
     * de uma divisão administrativa.
     *
     * @param {string} category Categoria do indicador.
     * @param {string} subcategory Indicador específico.
     * @returns {Promise<Object|null>} Resumo retornado pela API
     * ou null quando a requisição falha.
     */

    const response = await fetch(
        `/api/divisoes/evolucao/resumo/${category}/${subcategory}` +
        `?tipo=${encodeURIComponent(DIVISION_TYPE)}` +
        `&codigo=${encodeURIComponent(DIVISION_CODE)}`
    );

    if (!response.ok) {
        return null;
    }

    return await response.json();
}


function renderChartSummary(summary) {
    /**
     * Renderiza o resumo estatístico de um indicador temporal
     * na área reservada abaixo do gráfico.
     *
     * @param {Object|null} summary Dados do resumo temporal.
     */

    const container =
        document.getElementById(
            "chartSummary"
        );

    // Oculta e limpa o resumo quando não existem dados.
    if (!summary) {
        container.classList.add("d-none");
        container.innerHTML = "";
        return;
    }

    container.classList.remove("d-none");

    // Monta os cartões com os principais indicadores da série.
    container.innerHTML = `
        <div class="row g-3">

            <div class="col-md-3">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">
                        <small class="text-muted">
                            Crescimento
                        </small>

                        <h4 class="mb-0">
                            ${
                                summary.crescimento.percentual !== null
                                    ? `${summary.crescimento.percentual}%`
                                    : "—"
                            }
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


async function loadEvolutionCharts() {
    /**
     * Carrega do backend as URLs dos gráficos de evolução
     * disponíveis para a divisão administrativa atual.
     *
     * @returns {Promise<Object|null>} URLs organizadas por categoria
     * ou null quando a API retorna erro.
     */

    const response = await fetch(
        `/api/divisoes/evolucao?tipo=${encodeURIComponent(DIVISION_TYPE)}&codigo=${encodeURIComponent(DIVISION_CODE)}`
    );

    const data = await response.json();

    // Interrompe o processamento quando o backend informa uma falha.
    if (!data.sucesso) {
        console.error(data.erro);
        return null;
    }

    return data.urls;
}


async function initializeEvolution() {
    /**
     * Inicializa a aba de evolução da divisão administrativa.
     *
     * A inicialização ocorre somente uma vez, carregando as URLs
     * dos gráficos e criando os botões das categorias principais.
     */

    // Evita realizar novamente a carga dos gráficos.
    if (evolutionCharts !== null) {
        return;
    }

    const charts =
        await loadEvolutionCharts();

    if (!charts) {
        return;
    }

    evolutionCharts = charts;

    // Renderiza as categorias disponíveis após carregar os gráficos.
    renderMainButtons();
}


function renderMainButtons() {
    /**
     * Renderiza os botões das categorias principais de evolução.
     *
     * As categorias são apresentadas na ordem definida por
     * evolutionCategoryOrder.
     */

    const container =
        document.getElementById(
            "mainCategoryButtons"
        );

    container.innerHTML = "";


    evolutionCategoryOrder.forEach(
        category => {

            // Ignora categorias para as quais não existem gráficos disponíveis.
            if (
                !evolutionCharts[category]
            ) {
                return;
            }

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "btn btn-outline-primary";

            button.textContent =
                formatCategoryName(
                    category
                );


            // Seleciona a categoria e reinicia o indicador escolhido.
            button.onclick = () => {

                selectedCategory =
                    category;

                selectedSubcategory =
                    null;

                resetEvolutionView();

                // Atualiza os botões para refletir a categoria selecionada.
                renderMainButtons();

                clearChart();

                // Exibe os indicadores disponíveis da categoria.
                renderSubButtons();
            };


            // Destaca visualmente a categoria atualmente selecionada.
            if (
                selectedCategory ===
                category
            ) {
                button.classList.remove(
                    "btn-outline-primary"
                );

                button.classList.add(
                    "btn-primary"
                );
            }

            container.appendChild(
                button
            );
        }
    );
}


function renderSubButtons() {
    /**
     * Renderiza os grupos e indicadores disponíveis para a categoria
     * de evolução atualmente selecionada.
     *
     * Os indicadores são organizados em grupos como indicadores gerais,
     * modalidade, gênero e raça/cor.
     */

    const container =
        document.getElementById(
            "subCategoryButtons"
        );

    container.innerHTML = "";


    // Sem categoria selecionada, não existem indicadores a apresentar.
    if (!selectedCategory) {
        return;
    }

    const groups =
        subcategoryGroups[
            selectedCategory
        ];


    // Interrompe caso a categoria não possua configuração de subcategorias.
    if (!groups) {
        return;
    }


    groups.forEach(group => {

        const groupContainer =
            document.createElement(
                "div"
            );

        groupContainer.className =
            "card border bg-light-subtle mb-3";


        // Cria o cabeçalho do grupo de indicadores.
        const header =
            document.createElement(
                "div"
            );

        header.className =
            "card-header fw-semibold";

        header.textContent =
            group.title;

        groupContainer.appendChild(
            header
        );


        const buttonRow =
            document.createElement(
                "div"
            );

        buttonRow.className =
            "d-flex gap-2 flex-wrap";


        // Cria os botões dos indicadores pertencentes ao grupo.
        group.items.forEach(
            subcategory => {

                // Não apresenta indicadores que não possuem
                // um gráfico disponível para a categoria atual.
                if (
                    !evolutionCharts[
                        selectedCategory
                    ][subcategory]
                ) {
                    return;
                }

                const button =
                    document.createElement(
                        "button"
                    );

                button.className =
                    "btn btn-outline-secondary btn-sm";

                button.textContent =
                    formatSubcategoryName(
                        subcategory
                    );


                // Define o indicador selecionado e exibe seu gráfico.
                button.onclick = () => {

                    selectedSubcategory =
                        subcategory;

                    renderSubButtons();

                    showChart();
                };


                // Destaca o indicador atualmente selecionado.
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

                buttonRow.appendChild(
                    button
                );
            }
        );


        const body =
            document.createElement(
                "div"
            );

        body.className =
            "card-body";

        body.appendChild(
            buttonRow
        );

        groupContainer.appendChild(
            body
        );

        container.appendChild(
            groupContainer
        );
    });
}


function formatCategoryName(
    category
) {
    /**
     * Converte o identificador interno de uma categoria
     * para o nome apresentado na interface.
     *
     * @param {string} category Identificador interno da categoria.
     * @returns {string} Nome formatado da categoria.
     */

    const names = {
        matriculas: "Matrículas",
        docentes: "Docentes",
        turmas: "Turmas"
    };

    return (
        names[category] ||
        category
    );
}


function formatSubcategoryName(
    subcategory
) {
    /**
     * Converte o identificador interno de um indicador
     * para o nome apresentado na interface.
     *
     * @param {string} subcategory Identificador interno do indicador.
     * @returns {string} Nome formatado do indicador.
     */

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

    return (
        names[subcategory] ||
        subcategory
    );
}


async function showChart() {
    /**
     * Exibe o gráfico correspondente à categoria e ao indicador
     * atualmente selecionados.
     *
     * Também controla o carregamento do iframe e, para o indicador
     * "total", exibe o resumo temporal associado.
     */

    const separator =
        document.getElementById(
            "evolutionResultSeparator"
        );

    separator.classList.remove(
        "d-none"
    );


    const loader =
        document.getElementById(
            "evolutionLoader"
        );

    const iframe =
        document.getElementById(
            "metabasePlayer"
        );


    // Obtém a URL do gráfico atualmente selecionado.
    const url =
        evolutionCharts[
            selectedCategory
        ][selectedSubcategory];


    // Exibe o carregamento enquanto o iframe não estiver pronto.
    iframe.classList.add(
        "d-none"
    );

    loader.classList.remove(
        "d-none"
    );


    iframe.onload = null;

    iframe.onload = () => {
        loader.classList.add(
            "d-none"
        );

        iframe.classList.remove(
            "d-none"
        );
    };


    // Remove qualquer resumo anterior antes de processar
    // o indicador atualmente selecionado.
    renderChartSummary(
        null
    );


    // O resumo estatístico é disponibilizado apenas para o indicador total.
    if (
        selectedSubcategory ===
        "total"
    ) {
        const summary =
            await loadChartSummary(
                selectedCategory,
                selectedSubcategory
            );

        renderChartSummary(
            summary
        );
    }


    // Atualiza o iframe para carregar o gráfico selecionado.
    iframe.src = url;
}


function clearChart() {
    /**
     * Limpa o gráfico atualmente exibido e restaura o texto
     * de orientação da área de resultados.
     */

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


    // Remove eventos e conteúdo do iframe anterior.
    iframe.onload = null;

    iframe.src = "";

    iframe.classList.add(
        "d-none"
    );

    loader.classList.add(
        "d-none"
    );


    const title =
        document.querySelector(
            "#chartPlaceholder h5"
        );

    const text =
        document.querySelector(
            "#chartPlaceholder p"
        );


    // Define a mensagem inicial ou a orientação
    // correspondente à categoria selecionada.
    if (!selectedCategory) {

        title.textContent =
            "Evolução da Divisão";

        text.textContent =
            "Selecione um tipo de indicador para começar.";

    } else {

        const names = {
            matriculas: "Matrículas",
            docentes: "Docentes",
            turmas: "Turmas"
        };

        const categoryName =
            names[selectedCategory] ||
            selectedCategory;

        title.textContent =
            categoryName;

        text.textContent =
            `Agora escolha um indicador de ${categoryName}.`;
    }


    // Remove o resumo estatístico do gráfico anterior.
    const summary =
        document.getElementById(
            "chartSummary"
        );

    summary.classList.add(
        "d-none"
    );

    summary.innerHTML = "";
}


function resetEvolutionView() {
    /**
     * Oculta o iframe do gráfico ao trocar a categoria
     * de evolução.
     */

    document
        .getElementById(
            "metabasePlayer"
        )
        .classList.add(
            "d-none"
        );
}


// Disponibiliza a inicialização da aba de evolução
// para o módulo principal da ficha.
window.initializeEvolution =
    initializeEvolution;