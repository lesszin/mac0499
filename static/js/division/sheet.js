const DIVISION_TYPE =
    window.DIVISION_TYPE;

const DIVISION_CODE =
    window.DIVISION_CODE;

const CHILD_LIMIT = 10;


// Controle da paginação das divisões administrativas filhas.
let childDivisionOffset = 0;
let childDivisionTotal = 0;
let childDivisionLoading = false;


async function loadDivisionCharts() {
    /**
     * Carrega as URLs dos gráficos associados à divisão administrativa.
     *
     * @returns {Promise<Object|null>} URLs dos gráficos retornadas pela API,
     * ou null quando ocorre algum erro informado pelo backend.
     */

    const response = await fetch(
        `/api/divisoes/graficos?tipo=${encodeURIComponent(DIVISION_TYPE)}&codigo=${encodeURIComponent(DIVISION_CODE)}`
    );

    const data = await response.json();

    // Interrompe o processamento quando a API informa uma falha.
    if (!data.sucesso) {
        console.error(data.erro);
        return null;
    }

    return data.urls;
}


function updateDivisionHeader(data) {
    /**
     * Atualiza o nome e a descrição exibidos no cabeçalho da ficha
     * da divisão administrativa.
     *
     * O conteúdo apresentado depende do nível administrativo da divisão:
     * país, grande região, unidade federativa ou município.
     *
     * @param {Object} data Dados da divisão administrativa.
     */

    const nameText =
        document.getElementById(
            "divisionName"
        );

    const descriptionText =
        document.getElementById(
            "divisionDescription"
        );

    if (!nameText || !descriptionText) {
        return;
    }

    let name =
        "Divisão administrativa";

    let description =
        "Brasil";


    // Define o nome e a descrição de acordo com o nível administrativo.
    switch (DIVISION_TYPE) {

        case "pais":
            name =
                data.Pais ||
                "Brasil";

            description =
                "País";

            break;

        case "regiao":
            name =
                data.NM_REGIAO ||
                "Região";

            description =
                "Brasil";

            break;

        case "uf":
            name =
                data.NM_UF ||
                "Unidade Federativa";

            description =
                `${data.NM_REGIAO || "Região"}, Brasil`;

            break;

        case "municipio":
            name =
                data.NM_MUN ||
                "Município";

            description =
                `${data.NM_UF || "UF"}, ${
                    data.NM_REGIAO || "Região"
                }, Brasil`;

            break;
    }

    nameText.innerText =
        name;

    descriptionText.innerHTML =
        `<i class="bi bi-geo-alt-fill text-danger"></i>
        ${description}`;
}


function getDivisionTypeLabel() {
    /**
     * Retorna o rótulo correspondente ao tipo da divisão administrativa.
     *
     * @returns {string} Nome do nível administrativo.
     */

    const labels = {
        pais: "País",
        regiao: "Grande Região",
        uf: "Unidade Federativa",
        municipio: "Município"
    };

    return (
        labels[DIVISION_TYPE] ||
        "Divisão administrativa"
    );
}


function getChildDivisionType() {
    /**
     * Determina o tipo de divisão administrativa imediatamente abaixo
     * da divisão atual na hierarquia.
     *
     * @returns {string|null} Tipo da divisão filha ou null quando
     * a divisão atual não possui um nível inferior.
     */

    const types = {
        pais: "regiao",
        regiao: "uf",
        uf: "municipio"
    };

    return types[DIVISION_TYPE] || null;
}


function createIdentificationSection(
    data
) {
    /**
     * Cria a estrutura de dados utilizada para renderizar a seção
     * de identificação da divisão administrativa.
     *
     * @param {Object} data Dados da divisão administrativa.
     * @returns {Object} Configuração da seção de identificação.
     */

    const rows = [
        {
            label: "Divisão Administrativa:",
            value: getDivisionTypeLabel()
        },
        {
            label: "Área (km²):",
            value:
                data.AREA_KM2 != null
                    ? Number(
                        data.AREA_KM2
                    ).toLocaleString(
                        "pt-BR",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )
                    : "Não informado"
        }
    ];

    const childType =
        getChildDivisionType();


    // Adiciona à seção o bloco que permite consultar as divisões filhas.
    if (childType) {
        rows.push({
            custom: true,
            value: createChildDivisionBlock(
                childType
            )
        });
    }

    return {
        title: "Identificação",
        rows
    };
}


function createChildDivisionBlock(
    childType
) {
    /**
     * Cria o bloco HTML utilizado para listar as divisões administrativas
     * que compõem a divisão atual.
     *
     * @param {string} childType Tipo da divisão filha.
     * @returns {string} HTML do bloco de divisões filhas.
     */

    const labelMap = {
        regiao: "Grande Regiões",
        uf: "Unidades Federativas",
        municipio: "Municípios"
    };

    const label =
        labelMap[childType] ||
        "Divisões";


    return `
        <div
            id="childDivisionSection"
            class="pt-3 mt-2">

            <button
                id="childDivisionToggle"
                type="button"
                class="btn btn-link text-decoration-none text-dark p-0 w-100 d-flex justify-content-between align-items-center">

                <span class="fw-bold">
                    Composto por
                </span>

                <i
                    id="childDivisionArrow"
                    class="bi bi-chevron-down">
                </i>

            </button>

            <div
                id="childDivisionContent"
                class="d-none mt-3">

                <div
                    id="childDivisionLabel"
                    class="small text-muted mb-2">
                    ${label}
                </div>

                <div
                    id="childDivisionList">
                </div>

                <button
                    id="loadMoreChildDivisions"
                    type="button"
                    class="btn btn-outline-primary btn-sm d-none mt-2">
                    Carregar mais
                </button>

            </div>
        </div>
    `;
}


function setupChildDivisionEvents() {
    /**
     * Configura os eventos do bloco de divisões administrativas filhas.
     *
     * Controla a abertura e o fechamento da lista e configura o botão
     * responsável pelo carregamento de páginas adicionais.
     */

    const toggle =
        document.getElementById(
            "childDivisionToggle"
        );

    const content =
        document.getElementById(
            "childDivisionContent"
        );

    const arrow =
        document.getElementById(
            "childDivisionArrow"
        );

    if (!toggle || !content || !arrow) {
        return;
    }


    // Alterna a visibilidade da lista de divisões filhas.
    toggle.addEventListener(
        "click",
        async () => {

            const isHidden =
                content.classList.contains(
                    "d-none"
                );

            content.classList.toggle(
                "d-none",
                !isHidden
            );

            arrow.classList.toggle(
                "bi-chevron-down",
                !isHidden
            );

            arrow.classList.toggle(
                "bi-chevron-up",
                isHidden
            );


            // Carrega a primeira página somente na abertura inicial da lista.
            if (
                isHidden &&
                childDivisionOffset === 0
            ) {
                await loadChildDivisions();
            }
        }
    );


    const loadMoreButton =
        document.getElementById(
            "loadMoreChildDivisions"
        );

    if (loadMoreButton) {
        loadMoreButton.addEventListener(
            "click",
            loadChildDivisions
        );
    }
}


async function loadChildDivisions() {
    /**
     * Carrega uma página de divisões administrativas filhas e adiciona
     * os resultados à lista existente.
     *
     * A função utiliza paginação para limitar a quantidade de registros
     * carregados por vez e evita chamadas simultâneas enquanto uma
     * requisição está em andamento.
     */

    // Evita requisições simultâneas.
    if (
        childDivisionLoading
    ) {
        return;
    }

    const childType =
        getChildDivisionType();

    // Não existem divisões filhas para o nível atual.
    if (!childType) {
        return;
    }

    childDivisionLoading = true;

    const list =
        document.getElementById(
            "childDivisionList"
        );

    const loadMoreButton =
        document.getElementById(
            "loadMoreChildDivisions"
        );

    if (!list) {
        childDivisionLoading = false;
        return;
    }


    // Atualiza o estado visual do botão durante o carregamento.
    if (loadMoreButton) {
        loadMoreButton.disabled = true;
        loadMoreButton.textContent =
            "Carregando...";
    }


    try {
        // Monta a consulta paginada para a API.
        const url =
            `/api/divisoes/filhas?tipo=${encodeURIComponent(DIVISION_TYPE)}&codigo=${encodeURIComponent(DIVISION_CODE)}&limite=${CHILD_LIMIT}&offset=${childDivisionOffset}`;

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Erro ao carregar divisões: ${response.status}`
            );
        }

        const result =
            await response.json();

        if (result.erro) {
            throw new Error(
                result.erro
            );
        }


        // Atualiza o total conhecido de divisões filhas.
        childDivisionTotal =
            result.total;


        // Adiciona cada divisão retornada à lista.
        result.divisoes.forEach(division => {

            const row =
                document.createElement("div");

            row.className =
                "py-2 border-bottom";

            row.innerHTML = `
                <a
                    href="/divisao/${childType}/${division.codigo}"
                    class="text-decoration-none text-primary fw-semibold">
                    ${division.nome}
                </a>
            `;

            list.appendChild(row);
        });


        // Avança o deslocamento de paginação de acordo com
        // a quantidade efetivamente retornada.
        childDivisionOffset +=
            result.divisoes.length;


        if (
            loadMoreButton
        ) {
            const hasMore =
                result.tem_mais;

            // Exibe o botão somente quando existem mais resultados.
            loadMoreButton.classList.toggle(
                "d-none",
                !hasMore
            );

            loadMoreButton.disabled =
                false;

            loadMoreButton.textContent =
                "Carregar mais";
        }

    } catch (error) {

        console.error(
            "Erro ao carregar divisões filhas:",
            error
        );

        // Oculta o botão quando ocorre erro no carregamento.
        if (
            loadMoreButton
        ) {
            loadMoreButton.classList.add(
                "d-none"
            );
        }

    } finally {
        childDivisionLoading =
            false;
    }
}


function createEnrollmentSection(
    matriculas,
    charts
) {
    /**
     * Cria a seção de matrículas da ficha administrativa.
     *
     * Organiza os indicadores de matrícula por modalidade, gênero
     * e raça/cor, associando também os gráficos correspondentes.
     *
     * @param {Object|null} matriculas Indicadores de matrícula.
     * @param {Object} charts URLs dos gráficos de matrícula.
     * @returns {Object} Configuração da seção de matrículas.
     */

    const modalityRows = [];
    const genderRows = [];
    const raceRows = [];


    // Sem dados, retorna uma seção vazia com mensagem apropriada.
    if (!matriculas) {
        return {
            title: "Matrículas",
            rows: [],
            emptyMessage:
                "Nenhum registro de matrícula encontrado."
        };
    }


    // Adiciona os indicadores de matrícula com valores positivos.
    if (matriculas.basica > 0) {
        modalityRows.push({
            label: "Número Total de Matrículas",
            value: matriculas.basica
        });
    }

    if (matriculas.creche > 0) {
        modalityRows.push({
            label:
                "Número de Matrículas da Educação Infantil - Creche",
            value: matriculas.creche
        });
    }

    if (matriculas.pre_escola > 0) {
        modalityRows.push({
            label:
                "Número de Matrículas da Educação Infantil - Pré-Escola",
            value: matriculas.pre_escola
        });
    }

    if (matriculas.fund_ai > 0) {
        modalityRows.push({
            label:
                "Número de Matrículas do Ensino Fundamental - Anos Iniciais",
            value: matriculas.fund_ai
        });
    }

    if (matriculas.fund_af > 0) {
        modalityRows.push({
            label:
                "Número de Matrículas do Ensino Fundamental - Anos Finais",
            value: matriculas.fund_af
        });
    }

    if (matriculas.medio > 0) {
        modalityRows.push({
            label:
                "Número de Matrículas do Ensino Médio",
            value: matriculas.medio
        });
    }

    if (matriculas.profissional > 0) {
        modalityRows.push({
            label:
                "Número de Matrículas da Educação Profissional",
            value: matriculas.profissional
        });
    }


    // Consolida as modalidades de EJA em um único indicador.
    const eja =
        Number(matriculas.eja_fund || 0) +
        Number(matriculas.eja_med || 0);

    if (eja > 0) {
        modalityRows.push({
            label:
                "Número de Matrículas da Educação de Jovens e Adultos (EJA)",
            value: eja
        });
    }

    if (matriculas.especial > 0) {
        modalityRows.push({
            label:
                "Número de Matrículas da Educação Especial",
            value: matriculas.especial
        });
    }


    // Organiza os indicadores por gênero.
    if (matriculas.masculino > 0) {
        genderRows.push({
            label: "Número de Matrículas Masculino",
            value: matriculas.masculino
        });
    }

    if (matriculas.feminino > 0) {
        genderRows.push({
            label: "Número de Matrículas Feminino",
            value: matriculas.feminino
        });
    }


    // Organiza os indicadores por raça/cor.
    if (matriculas.nao_declarado > 0) {
        raceRows.push({
            label: "Número de Matrículas Não Declarada",
            value: matriculas.nao_declarado
        });
    }

    if (matriculas.branca > 0) {
        raceRows.push({
            label: "Número de Matrículas Branca",
            value: matriculas.branca
        });
    }

    if (matriculas.preta > 0) {
        raceRows.push({
            label: "Número de Matrículas Preta",
            value: matriculas.preta
        });
    }

    if (matriculas.parda > 0) {
        raceRows.push({
            label: "Número de Matrículas Parda",
            value: matriculas.parda
        });
    }

    if (matriculas.amarela > 0) {
        raceRows.push({
            label: "Número de Matrículas Amarela",
            value: matriculas.amarela
        });
    }

    if (matriculas.indigena > 0) {
        raceRows.push({
            label: "Número de Matrículas Indígena",
            value: matriculas.indigena
        });
    }


    return {
        title: "Matrículas",
        rows: [
            {
                subgroup: "Modalidades",
                rows: modalityRows,
                chart: charts?.modalidade
            },
            {
                subgroup: "Gênero",
                rows: genderRows,
                chart: charts?.genero
            },
            {
                subgroup: "Raça/Cor",
                rows: raceRows,
                chart: charts?.raca
            }
        ].filter(
            subgroup =>
                subgroup.rows.length > 0
        ),
        emptyMessage:
            "Nenhum registro de matrícula encontrado."
    };
}


function createTeachersSection(
    docentes,
    charts
) {
    /**
     * Cria a seção de docentes da ficha administrativa.
     *
     * Organiza os dados por modalidade, gênero e raça/cor e associa
     * os gráficos correspondentes.
     *
     * @param {Object|null} docentes Indicadores de docentes.
     * @param {Object} charts URLs dos gráficos de docentes.
     * @returns {Object} Configuração da seção de docentes.
     */

    const modalityRows = [];
    const genderRows = [];
    const raceRows = [];


    // Sem dados, retorna uma seção vazia com mensagem apropriada.
    if (!docentes) {
        return {
            title: "Docentes",
            rows: [],
            emptyMessage:
                "Nenhum registro de docente encontrado."
        };
    }


    // Adiciona os indicadores de docentes com valores positivos.
    if (docentes.basica > 0) {
        modalityRows.push({
            label:
                "Número Total de Docentes da Educação Básica",
            value: docentes.basica
        });
    }

    if (docentes.creche > 0) {
        modalityRows.push({
            label:
                "Número de Docentes da Educação Infantil - Creche",
            value: docentes.creche
        });
    }

    if (docentes.pre_escola > 0) {
        modalityRows.push({
            label:
                "Número de Docentes da Educação Infantil - Pré-Escola",
            value: docentes.pre_escola
        });
    }

    if (docentes.fund_ai > 0) {
        modalityRows.push({
            label:
                "Número de Docentes do Ensino Fundamental - Anos Iniciais",
            value: docentes.fund_ai
        });
    }

    if (docentes.fund_af > 0) {
        modalityRows.push({
            label:
                "Número de Docentes do Ensino Fundamental - Anos Finais",
            value: docentes.fund_af
        });
    }

    if (docentes.medio > 0) {
        modalityRows.push({
            label:
                "Número de Docentes do Ensino Médio",
            value: docentes.medio
        });
    }

    if (docentes.profissional > 0) {
        modalityRows.push({
            label:
                "Número de Docentes da Educação Profissional",
            value: docentes.profissional
        });
    }

    if (docentes.eja > 0) {
        modalityRows.push({
            label:
                "Número de Docentes da Educação de Jovens e Adultos (EJA)",
            value: docentes.eja
        });
    }

    if (docentes.especial > 0) {
        modalityRows.push({
            label:
                "Número de Docentes da Educação Especial",
            value: docentes.especial
        });
    }


    // Organiza os indicadores de docentes por gênero.
    if (docentes.masculino > 0) {
        genderRows.push({
            label: "Número de Docentes Masculino",
            value: docentes.masculino
        });
    }

    if (docentes.feminino > 0) {
        genderRows.push({
            label: "Número de Docentes Feminino",
            value: docentes.feminino
        });
    }


    // Organiza os indicadores de docentes por raça/cor.
    if (docentes.nao_declarado > 0) {
        raceRows.push({
            label: "Número de Docentes Não Declarada",
            value: docentes.nao_declarado
        });
    }

    if (docentes.branca > 0) {
        raceRows.push({
            label: "Número de Docentes Branca",
            value: docentes.branca
        });
    }

    if (docentes.preta > 0) {
        raceRows.push({
            label: "Número de Docentes Preta",
            value: docentes.preta
        });
    }

    if (docentes.parda > 0) {
        raceRows.push({
            label: "Número de Docentes Parda",
            value: docentes.parda
        });
    }

    if (docentes.amarela > 0) {
        raceRows.push({
            label: "Número de Docentes Amarela",
            value: docentes.amarela
        });
    }

    if (docentes.indigena > 0) {
        raceRows.push({
            label: "Número de Docentes Indígena",
            value: docentes.indigena
        });
    }


    return {
        title: "Docentes",
        rows: [
            {
                subgroup: "Modalidades",
                rows: modalityRows,
                chart: charts?.modalidade
            },
            {
                subgroup: "Gênero",
                rows: genderRows,
                chart: charts?.genero
            },
            {
                subgroup: "Raça/Cor",
                rows: raceRows,
                chart: charts?.raca
            }
        ].filter(
            subgroup =>
                subgroup.rows.length > 0
        ),
        emptyMessage:
            "Nenhum registro de docente encontrado."
    };
}


function createClassesSection(
    turmas,
    charts
) {
    /**
     * Cria a seção de turmas da ficha administrativa.
     *
     * Organiza as turmas por modalidade de ensino e associa
     * o gráfico correspondente.
     *
     * @param {Object|null} turmas Indicadores de turmas.
     * @param {Object} charts URLs dos gráficos de turmas.
     * @returns {Object} Configuração da seção de turmas.
     */

    const rows = [];


    // Sem dados, retorna uma seção vazia com mensagem apropriada.
    if (!turmas) {
        return {
            title: "Turmas",
            rows: [],
            emptyMessage:
                "Nenhum registro de turma encontrado."
        };
    }


    // Adiciona as modalidades que possuem turmas registradas.
    if (turmas.creche > 0) {
        rows.push({
            label:
                "Número de Turmas da Educação Infantil - Creche",
            value: turmas.creche
        });
    }

    if (turmas.pre_escola > 0) {
        rows.push({
            label:
                "Número de Turmas da Educação Infantil - Pré-Escola",
            value: turmas.pre_escola
        });
    }

    if (turmas.fund_ai > 0) {
        rows.push({
            label:
                "Número de Turmas do Ensino Fundamental - Anos Iniciais",
            value: turmas.fund_ai
        });
    }

    if (turmas.fund_af > 0) {
        rows.push({
            label:
                "Número de Turmas do Ensino Fundamental - Anos Finais",
            value: turmas.fund_af
        });
    }

    if (turmas.medio > 0) {
        rows.push({
            label:
                "Número de Turmas do Ensino Médio",
            value: turmas.medio
        });
    }

    if (turmas.profissional > 0) {
        rows.push({
            label:
                "Número de Turmas da Educação Profissional",
            value: turmas.profissional
        });
    }

    if (turmas.eja > 0) {
        rows.push({
            label:
                "Número de Turmas da Educação de Jovens e Adultos (EJA)",
            value: turmas.eja
        });
    }

    if (turmas.especial > 0) {
        rows.push({
            label:
                "Número de Turmas da Educação Especial",
            value: turmas.especial
        });
    }


    return {
        title: "Turmas",
        rows: [
            {
                subgroup: "Modalidades",
                rows,
                chart: charts?.modalidade
            }
        ],
        emptyMessage:
            "Nenhum registro de turma encontrado."
    };
}


function buildSections(
    data,
    indicadores,
    charts
) {
    /**
     * Monta, em ordem, as seções exibidas na ficha administrativa.
     *
     * @param {Object} data Dados cadastrais da divisão.
     * @param {Object} indicadores Indicadores estatísticos da divisão.
     * @param {Object} charts URLs dos gráficos disponíveis.
     * @returns {Object[]} Lista de seções prontas para renderização.
     */

    return [
        createIdentificationSection(
            data
        ),
        createEnrollmentSection(
            indicadores.matriculas,
            charts.matriculas
        ),
        createTeachersSection(
            indicadores.docentes,
            charts.docentes
        ),
        createClassesSection(
            indicadores.turmas,
            charts.turmas
        )
    ].filter(Boolean);
}


function renderSections(
    dataDiv,
    sections
) {
    /**
     * Renderiza no DOM as seções construídas da ficha administrativa.
     *
     * @param {HTMLElement} dataDiv Elemento que receberá o conteúdo.
     * @param {Object[]} sections Seções preparadas por buildSections().
     */

    dataDiv.classList.remove(
        "text-center",
        "py-5"
    );

    dataDiv.innerHTML =
        sections
            .map(section => {

                let rowsHtml = "";


                // Constrói o HTML das linhas pertencentes à seção.
                section.rows.forEach((row, index) => {

                    // Linhas personalizadas recebem seu próprio HTML.
                    if (row.custom) {
                        rowsHtml += `
                            <div class="py-2">
                                ${row.value}
                            </div>
                        `;

                        return;
                    }


                    // Subgrupos são renderizados em cartões internos
                    // com suas respectivas linhas e gráficos.
                    if (row.subgroup) {
                        const subgroupRows =
                            row.rows || [];

                        if (
                            subgroupRows.length === 0
                        ) {
                            return;
                        }

                        let subgroupHtml =
                            subgroupRows
                                .map(
                                    (
                                        subgroupRow,
                                        subgroupIndex
                                    ) => {

                                        const borderClass =
                                            subgroupIndex ===
                                            subgroupRows.length - 1
                                                ? ""
                                                : "border-bottom";

                                        return `
                                            <div
                                                class="row py-2 ${borderClass}">

                                                <div
                                                    class="col-sm-5 fw-bold">
                                                    ${subgroupRow.label}
                                                </div>

                                                <div
                                                    class="col-sm-7">
                                                    ${subgroupRow.value}
                                                </div>

                                            </div>
                                        `;
                                    }
                                )
                                .join("");


                        rowsHtml += `
                            <div
                                class="card border bg-light-subtle rounded-3 overflow-hidden mb-3">

                                <div
                                    class="card-header fw-semibold">
                                    ${row.subgroup}
                                </div>

                                <div
                                    class="card-body py-2">

                                    ${subgroupHtml}

                                    ${
                                        row.chart
                                            ? `
                                                <div class="mt-3 pt-3 border-top">
                                                    <iframe
                                                        src="${row.chart}"
                                                        frameborder="0"
                                                        width="100%"
                                                        height="420"
                                                        allowtransparency="true"
                                                        loading="lazy">
                                                    </iframe>
                                                </div>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>
                        `;

                        return;
                    }


                    // Determina se a linha deve possuir uma borda inferior.
                    const nextRow =
                        section.rows[index + 1];

                    const borderClass =
                        nextRow &&
                        !nextRow.custom
                            ? "border-bottom"
                            : "";


                    rowsHtml += `
                        <div
                            class="row py-2 ${borderClass}">

                            <div
                                class="col-sm-5 fw-bold">
                                ${row.label}
                            </div>

                            <div
                                class="col-sm-7">
                                ${row.value}
                            </div>

                        </div>
                    `;
                });


                // Monta o cartão externo da seção.
                return `
                    <div
                        class="card shadow-sm border-0 rounded-3 mb-4">

                        <div
                            class="card-body p-4">

                            <h5
                                class="text-primary mb-4">
                                ${section.title}
                            </h5>

                            ${
                                rowsHtml ||
                                `<p class="text-muted mb-0">
                                    ${section.emptyMessage || "Nenhum registro encontrado."}
                                </p>`
                            }

                        </div>

                    </div>
                `;
            })
            .join("");


    // Configura os eventos do bloco de divisões filhas
    // depois que seu HTML foi inserido no documento.
    setupChildDivisionEvents();
}


async function loadDivisionSheet() {
    /**
     * Carrega todos os dados necessários para montar a ficha administrativa.
     *
     * A função realiza simultaneamente as consultas da ficha, dos
     * indicadores e dos gráficos, atualiza o cabeçalho e renderiza
     * as seções correspondentes.
     */

    const dataDiv =
        document.getElementById(
            "dataSheet"
        );

    const nameText =
        document.getElementById(
            "divisionName"
        );

    const descriptionText =
        document.getElementById(
            "divisionDescription"
        );


    try {
        // Carrega em paralelo os dados cadastrais, indicadores e gráficos.
        const [
            divisionResponse,
            indicatorsResponse,
            charts
        ] = await Promise.all([
            fetch(
                `/api/divisoes/ficha?tipo=${encodeURIComponent(DIVISION_TYPE)}&codigo=${encodeURIComponent(DIVISION_CODE)}`
            ),
            fetch(
                `/api/divisoes/indicadores?tipo=${encodeURIComponent(DIVISION_TYPE)}&codigo=${encodeURIComponent(DIVISION_CODE)}`
            ),
            loadDivisionCharts()
        ]);


        // Valida a resposta dos dados cadastrais.
        if (!divisionResponse.ok) {
            throw new Error(
                `Erro ao carregar ficha: ${divisionResponse.status}`
            );
        }


        // Valida a resposta dos indicadores.
        if (!indicatorsResponse.ok) {
            throw new Error(
                `Erro ao carregar indicadores: ${indicatorsResponse.status}`
            );
        }


        const result =
            await divisionResponse.json();

        const indicadores =
            await indicatorsResponse.json();


        // Trata erros informados pelas APIs.
        if (result.erro) {
            throw new Error(
                result.erro
            );
        }

        if (indicadores.erro) {
            throw new Error(
                indicadores.erro
            );
        }


        // Atualiza o cabeçalho da ficha.
        updateDivisionHeader(
            result.dados
        );


        // Constrói as seções com os dados obtidos.
        const sections =
            buildSections(
                result.dados,
                indicadores,
                charts
            );


        // Renderiza as seções no documento.
        renderSections(
            dataDiv,
            sections
        );

    } catch (error) {
        console.error(
            "Erro ao carregar ficha administrativa:",
            error
        );


        // Atualiza o cabeçalho para indicar que a divisão não foi encontrada.
        if (nameText) {
            nameText.innerText =
                "Divisão não encontrada";
        }

        if (descriptionText) {
            descriptionText.innerText =
                "Erro ao carregar os dados.";
        }


        // Exibe a mensagem de erro na área principal da ficha.
        if (dataDiv) {
            dataDiv.innerHTML = `
                <div class="alert alert-danger">
                    Erro ao carregar a ficha administrativa.
                </div>
            `;
        }
    }
}


function setupBackToMap() {
    /**
     * Configura o retorno da ficha administrativa para o mapa.
     *
     * Antes de retornar, armazena na sessão o tipo e o código da divisão
     * para que o mapa possa restaurar a seleção anterior.
     */

    const button =
        document.getElementById(
            "backToMapButton"
        );

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {
            // Salva o estado necessário para restaurar a divisão no mapa.
            sessionStorage.setItem(
                "returnToAdministrativeMap",
                JSON.stringify({
                    tipo: DIVISION_TYPE,
                    codigo: DIVISION_CODE
                })
            );
        }
    );
}


// Configura o retorno ao mapa e carrega a ficha administrativa.
setupBackToMap();
loadDivisionSheet();