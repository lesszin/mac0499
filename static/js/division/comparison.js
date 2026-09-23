let selectedComparisonDivision = null;
let selectedComparisonCategory = null;
let selectedComparisonSubcategory = null;
let selectedComparisonFilter = null;


// Define a ordem das categorias principais disponíveis para comparação.
const comparisonCategoryOrder = [
    "matriculas",
    "docentes",
    "turmas"
];


// Organiza os indicadores disponíveis para cada categoria de comparação.
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


// Define as opções válidas dos filtros dos indicadores comparativos.
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
    /**
     * Renderiza o resumo numérico da comparação entre duas divisões.
     *
     * Exibe os valores da divisão atual, da divisão comparada e
     * a diferença entre elas para o último ano comum disponível.
     *
     * @param {Object|null} data Dados retornados pela API de comparação.
     */

    const container =
        document.getElementById(
            "comparisonSummary"
        );


    // Sem dados de comparação ou sem divisão selecionada,
    // oculta e limpa o resumo.
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


    // Obtém os nomes das duas divisões que participam da comparação.
    const divisionName =
        document.getElementById(
            "divisionName"
        ).textContent;

    const comparisonName =
        selectedComparisonDivision.nome;


    // Monta os cartões com os valores comparados.
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


    // Torna o resumo visível.
    container.classList.remove("d-none");
}


function searchComparisonDivisions(term) {
    /**
     * Busca divisões administrativas para utilização na comparação.
     *
     * A busca é realizada considerando o tipo da divisão administrativa
     * atual e seu código, para limitar os resultados ao contexto apropriado.
     *
     * @param {string} term Termo informado para a busca.
     * @returns {Promise<Object[]>} Divisões retornadas pela API.
     */

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
    /**
     * Cria um botão de sugestão para uma divisão administrativa encontrada.
     *
     * @param {Object} division Dados da divisão administrativa.
     * @returns {HTMLButtonElement} Botão criado para a sugestão.
     */

    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "list-group-item list-group-item-action text-start py-2";


    // Define o nome e a descrição da divisão exibida na sugestão.
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


    // Seleciona a divisão quando a sugestão é acionada.
    button.onclick = () => {
        selectedComparisonDivision =
            division;


        // Alterna da busca para o estado da divisão selecionada.
        document
            .getElementById("comparisonSearchState")
            .classList.add("d-none");

        document
            .getElementById("comparisonSelectedState")
            .classList.remove("d-none");

        document
            .getElementById("comparisonIndicators")
            .classList.remove("d-none");


        // Atualiza as informações da divisão escolhida.
        document.getElementById(
            "comparisonSelectedName"
        ).textContent =
            division.nome;

        document.getElementById(
            "comparisonSelectedDescription"
        ).textContent =
            division.descricao;


        // Limpa e oculta as sugestões da busca.
        document
            .getElementById("comparisonSuggestions")
            .classList.add("d-none");

        document.getElementById(
            "comparisonSearchInput"
        ).value = "";


        // Exibe as categorias disponíveis para comparação.
        renderComparisonMainButtons();
    };

    return button;
}


function showComparisonSuggestions(divisions) {
    /**
     * Renderiza a lista de sugestões de divisões administrativas.
     *
     * @param {Object[]} divisions Divisões retornadas pela busca.
     */

    const container =
        document.getElementById(
            "comparisonSuggestions"
        );

    container.innerHTML = "";


    // Informa quando nenhuma divisão correspondente foi encontrada.
    if (!divisions || divisions.length === 0) {
        container.innerHTML = `
            <div class="list-group-item text-muted">
                Nenhuma divisão encontrada
            </div>
        `;

        container.classList.remove("d-none");

        return;
    }


    // Cria uma sugestão para cada divisão retornada.
    divisions.forEach(division => {
        container.appendChild(
            createComparisonSuggestion(division)
        );
    });

    container.classList.remove("d-none");
}


function onComparisonSearchInput() {
    /**
     * Processa a entrada de texto utilizada para buscar uma divisão
     * administrativa para comparação.
     *
     * Consultas com menos de três caracteres não são realizadas.
     */

    const input =
        document.getElementById(
            "comparisonSearchInput"
        );

    const term =
        input.value.trim();


    // Aguarda uma quantidade mínima de caracteres antes da busca.
    if (term.length < 3) {
        document
            .getElementById("comparisonSuggestions")
            .classList.add("d-none");

        return;
    }


    // Executa a busca e atualiza as sugestões.
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
    /**
     * Reinicia a seleção atual para permitir a escolha de outra divisão
     * administrativa para comparação.
     */

    resetComparisonView();
}


function formatComparisonCategoryName(category) {
    /**
     * Converte o identificador interno de uma categoria para o nome
     * apresentado na interface.
     *
     * @param {string} category Identificador interno da categoria.
     * @returns {string} Nome formatado da categoria.
     */

    const names = {
        matriculas: "Matrículas",
        docentes: "Docentes",
        turmas: "Turmas"
    };

    return names[category] || category;
}


function formatComparisonIndicatorName(indicator) {
    /**
     * Converte o identificador interno de um indicador para o nome
     * apresentado na interface.
     *
     * @param {string} indicator Identificador interno do indicador.
     * @returns {string} Nome formatado do indicador.
     */

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
    /**
     * Retorna as opções de filtro disponíveis para um indicador.
     *
     * @param {string} category Categoria da comparação.
     * @param {string} indicator Indicador selecionado.
     * @returns {string[]} Lista de opções de filtro.
     */

    return comparisonFilterOptions[indicator] || [];
}


function updateComparisonIndicatorMessage() {
    /**
     * Atualiza o texto de orientação apresentado acima dos indicadores
     * de comparação.
     *
     * Quando nenhuma categoria foi selecionada, exibe uma orientação
     * inicial. Depois da seleção, informa qual categoria deve ser detalhada.
     */

    const container =
        document.getElementById(
            "comparisonIndicatorMessage"
        );

    const title =
        container.querySelector("h5");

    const text =
        container.querySelector("p");


    // Define a mensagem inicial quando nenhuma categoria foi selecionada.
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
    /**
     * Remove os filtros dinâmicos criados para indicadores que
     * possuem uma dimensão adicional de seleção.
     */

    document
        .querySelectorAll(
            ".comparison-dynamic-filter"
        )
        .forEach(select => {
            select.remove();
        });
}


function renderComparisonMainButtons() {
    /**
     * Renderiza os botões das categorias principais disponíveis
     * para comparação.
     */

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


        // Destaca visualmente a categoria atualmente selecionada.
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


        // Seleciona a categoria e reinicia o indicador anterior.
        button.onclick = () => {
            selectedComparisonCategory =
                category;

            selectedComparisonSubcategory =
                null;

            selectedComparisonFilter =
                null;


            // Limpa qualquer resultado ou filtro da seleção anterior.
            clearComparisonChart();

            clearDynamicComparisonFilters();

            document
                .getElementById(
                    "comparisonSubCategoryButtons"
                )
                .innerHTML = "";


            updateComparisonIndicatorMessage();

            // Atualiza o estado visual dos botões.
            renderComparisonMainButtons();

            // Exibe os indicadores da categoria escolhida.
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
    /**
     * Renderiza os indicadores disponíveis para uma categoria
     * de comparação.
     *
     * @param {string} category Categoria selecionada.
     */

    const container =
        document.getElementById(
            "comparisonSubCategoryButtons"
        );

    container.innerHTML = "";


    // Interrompe quando a categoria não possui indicadores configurados.
    if (!comparisonIndicators[category]) {
        return;
    }


    comparisonIndicators[category].forEach(
        group => {

            const groupContainer =
                document.createElement("div");

            groupContainer.className =
                "card border bg-light-subtle mb-3";


            // Cria o cabeçalho do grupo de indicadores.
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


                // Destaca o indicador atualmente selecionado.
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

                    // Remove qualquer filtro dinâmico criado anteriormente.
                    clearDynamicComparisonFilters();

                    selectedComparisonSubcategory =
                        indicator;

                    selectedComparisonFilter =
                        null;


                    clearComparisonChart();


                    // Atualiza o destaque do indicador selecionado.
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


                    // O indicador total não necessita de filtro adicional.
                    if (
                        indicator === "total"
                    ) {
                        showComparisonChart(
                            selectedComparisonCategory,
                            selectedComparisonSubcategory
                        );

                        return;
                    }


                    // Cria o seletor de filtro adicional para os demais indicadores.
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


                    // Adiciona as opções válidas do indicador.
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


                    // Insere o seletor logo após o botão do indicador.
                    button.insertAdjacentElement(
                        "afterend",
                        select
                    );


                    // Atualiza a comparação conforme a opção é selecionada.
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
    /**
     * Remove e oculta o resumo numérico da comparação.
     */

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
    /**
     * Limpa o gráfico e o resumo da comparação atualmente exibidos.
     */

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
    /**
     * Carrega o resumo e o gráfico correspondentes à comparação
     * entre a divisão atual e a divisão selecionada.
     *
     * @param {string} categoria Categoria do indicador.
     * @param {string} indicador Indicador selecionado.
     * @param {string|null} filtro Filtro adicional, quando necessário.
     */

    // Sem divisão selecionada, não é possível realizar a comparação.
    if (!selectedComparisonDivision) {
        return;
    }


    clearComparisonChart();


    const params =
        new URLSearchParams();


    // Define os dados da divisão principal.
    params.set(
        "tipo",
        window.DIVISION_TYPE
    );

    params.set(
        "codigo",
        window.DIVISION_CODE
    );


    // Define os dados da divisão comparada.
    params.set(
        "tipo_comparacao",
        window.DIVISION_TYPE
    );

    params.set(
        "codigo_comparacao",
        selectedComparisonDivision.codigo
    );


    // Adiciona o filtro específico quando informado.
    if (filtro) {
        params.set(
            "filtro",
            filtro
        );
    }


    const query =
        `?${params.toString()}`;


    // Solicita o resumo numérico da comparação.
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


    // Monta a URL do endpoint responsável pela geração do gráfico.
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


    // Exibe a área de resultado antes de carregar o gráfico.
    separator.classList.remove(
        "d-none"
    );


    // Solicita ao backend a URL de incorporação do Metabase.
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
    /**
     * Restaura a interface da comparação para seu estado inicial.
     *
     * Remove a divisão selecionada, indicadores, filtros dinâmicos,
     * resumo, gráfico e sugestões anteriormente exibidas.
     */

    // Limpa todo o estado da comparação.
    selectedComparisonDivision = null;
    selectedComparisonCategory = null;
    selectedComparisonSubcategory = null;
    selectedComparisonFilter = null;


    // Retorna para o estado de busca de uma divisão.
    document
        .getElementById("comparisonSelectedState")
        .classList.add("d-none");

    document
        .getElementById("comparisonSearchState")
        .classList.remove("d-none");


    // Limpa o campo e as sugestões de busca.
    document
        .getElementById("comparisonSearchInput")
        .value = "";

    document
        .getElementById("comparisonSuggestions")
        .innerHTML = "";

    document
        .getElementById("comparisonSuggestions")
        .classList.add("d-none");


    // Oculta os indicadores até que uma nova divisão seja selecionada.
    document
        .getElementById("comparisonIndicators")
        .classList.add("d-none");


    // Limpa as categorias e indicadores atuais.
    document
        .getElementById("comparisonMainCategoryButtons")
        .innerHTML = "";

    clearDynamicComparisonFilters();

    document
        .getElementById("comparisonSubCategoryButtons")
        .innerHTML = "";


    // Remove o resultado gráfico e o resumo da comparação.
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


    // Restaura a mensagem inicial da seção de comparação.
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
    /**
     * Configura os eventos da interface de busca e seleção
     * da divisão administrativa comparada.
     */

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


    // Inicia a busca conforme o usuário digita.
    if (input) {
        input.addEventListener(
            "input",
            onComparisonSearchInput
        );
    }


    // Permite trocar a divisão comparada.
    if (changeButton) {
        changeButton.addEventListener(
            "click",
            changeComparisonDivision
        );
    }


    // Configura o botão de limpeza do campo de busca.
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
    /**
     * Inicializa o módulo de comparação da divisão administrativa.
     *
     * A comparação não é disponibilizada para a ficha do país.
     * Nos demais níveis administrativos, configura os eventos da busca.
     */

    // O nível de país não possui comparação nesta interface.
    if (window.DIVISION_TYPE === "pais") {
        return;
    }

    setupComparisonSearch();
}


// Disponibiliza a inicialização para o módulo principal da ficha.
window.initializeComparison =
    initializeComparison;