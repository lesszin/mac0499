const DIVISION_TYPE =
    window.DIVISION_TYPE;

const DIVISION_CODE =
    window.DIVISION_CODE;

const CHILD_LIMIT = 10;

let childDivisionOffset = 0;
let childDivisionTotal = 0;
let childDivisionLoading = false;


function updateDivisionHeader(data) {
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
    if (
        childDivisionLoading
    ) {
        return;
    }

    const childType =
        getChildDivisionType();

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

    if (loadMoreButton) {
        loadMoreButton.disabled = true;
        loadMoreButton.textContent =
            "Carregando...";
    }

    try {
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

        childDivisionTotal =
            result.total;

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

        childDivisionOffset +=
            result.divisoes.length;

        if (
            loadMoreButton
        ) {
            const hasMore =
                result.tem_mais;

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

function createEnrollmentSection(matriculas) {
    const rows = [];

    if (!matriculas) {
        return {
            title: "Matrículas",
            rows: [],
            emptyMessage:
                "Nenhum registro de matrícula encontrado."
        };
    }

    if (matriculas.basica > 0) {
        rows.push({
            label: "Número Total de Matrículas",
            value: matriculas.basica
        });
    }

    if (matriculas.creche > 0) {
        rows.push({
            label:
                "Número de Matrículas da Educação Infantil - Creche",
            value: matriculas.creche
        });
    }

    if (matriculas.pre_escola > 0) {
        rows.push({
            label:
                "Número de Matrículas da Educação Infantil - Pré-Escola",
            value: matriculas.pre_escola
        });
    }

    if (matriculas.fund_ai > 0) {
        rows.push({
            label:
                "Número de Matrículas do Ensino Fundamental - Anos Iniciais",
            value: matriculas.fund_ai
        });
    }

    if (matriculas.fund_af > 0) {
        rows.push({
            label:
                "Número de Matrículas do Ensino Fundamental - Anos Finais",
            value: matriculas.fund_af
        });
    }

    if (matriculas.medio > 0) {
        rows.push({
            label:
                "Número de Matrículas do Ensino Médio",
            value: matriculas.medio
        });
    }

    if (matriculas.profissional > 0) {
        rows.push({
            label:
                "Número de Matrículas da Educação Profissional",
            value: matriculas.profissional
        });
    }

    const eja =
        Number(matriculas.eja_fund || 0) +
        Number(matriculas.eja_med || 0);

    if (eja > 0) {
        rows.push({
            label:
                "Número de Matrículas da Educação de Jovens e Adultos (EJA)",
            value: eja
        });
    }

    if (matriculas.especial > 0) {
        rows.push({
            label:
                "Número de Matrículas da Educação Especial",
            value: matriculas.especial
        });
    }

    return {
        title: "Matrículas",
        rows: [
            {
                subgroup: "Modalidades",
                rows
            }
        ],
        emptyMessage:
            "Nenhum registro de matrícula encontrado."
    };
}

function createTeachersSection(docentes) {
    const rows = [];

    if (!docentes) {
        return {
            title: "Docentes",
            rows: [],
            emptyMessage:
                "Nenhum registro de docente encontrado."
        };
    }

    if (docentes.basica > 0) {
        rows.push({
            label:
                "Número Total de Docentes da Educação Básica",
            value: docentes.basica
        });
    }

    if (docentes.creche > 0) {
        rows.push({
            label:
                "Número de Docentes da Educação Infantil - Creche",
            value: docentes.creche
        });
    }

    if (docentes.pre_escola > 0) {
        rows.push({
            label:
                "Número de Docentes da Educação Infantil - Pré-Escola",
            value: docentes.pre_escola
        });
    }

    if (docentes.fund_ai > 0) {
        rows.push({
            label:
                "Número de Docentes do Ensino Fundamental - Anos Iniciais",
            value: docentes.fund_ai
        });
    }

    if (docentes.fund_af > 0) {
        rows.push({
            label:
                "Número de Docentes do Ensino Fundamental - Anos Finais",
            value: docentes.fund_af
        });
    }

    if (docentes.medio > 0) {
        rows.push({
            label:
                "Número de Docentes do Ensino Médio",
            value: docentes.medio
        });
    }

    if (docentes.profissional > 0) {
        rows.push({
            label:
                "Número de Docentes da Educação Profissional",
            value: docentes.profissional
        });
    }

    if (docentes.eja > 0) {
        rows.push({
            label:
                "Número de Docentes da Educação de Jovens e Adultos (EJA)",
            value: docentes.eja
        });
    }

    if (docentes.especial > 0) {
        rows.push({
            label:
                "Número de Docentes da Educação Especial",
            value: docentes.especial
        });
    }

    return {
        title: "Docentes",
        rows: [
            {
                subgroup: "Modalidades",
                rows
            }
        ],
        emptyMessage:
            "Nenhum registro de docente encontrado."
    };
}

function createClassesSection(turmas) {
    const rows = [];

    if (!turmas) {
        return {
            title: "Turmas",
            rows: [],
            emptyMessage:
                "Nenhum registro de turma encontrado."
        };
    }

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
                rows
            }
        ],
        emptyMessage:
            "Nenhum registro de turma encontrado."
    };
}

function buildSections(
    data,
    indicadores
) {
    return [
        createIdentificationSection(
            data
        ),
        createEnrollmentSection(
            indicadores.matriculas
        ),
        createTeachersSection(
            indicadores.docentes
        ),
        createClassesSection(
            indicadores.turmas
        )
    ].filter(Boolean);
}

function renderSections(
    dataDiv,
    sections
) {
    dataDiv.classList.remove(
        "text-center",
        "py-5"
    );

    dataDiv.innerHTML =
        sections
            .map(section => {

                let rowsHtml = "";

                section.rows.forEach(
                    (row, index) => {

                        if (row.custom) {
                            rowsHtml += `
                                <div class="py-2">
                                    ${row.value}
                                </div>
                            `;

                            return;
                        }

                        if (row.subgroup) {
                            const subgroupRows =
                                row.rows || [];

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

                                        ${
                                            subgroupHtml ||
                                            `<p class="text-muted mb-0">
                                                Nenhum registro encontrado.
                                            </p>`
                                        }

                                    </div>

                                </div>
                            `;

                            return;
                        }

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
                    }
                );

                return `
                    <div
                        class="card shadow-sm border-0 rounded-3 mb-4">

                        <div
                            class="card-body p-4">

                            <h5
                                class="text-primary mb-4">
                                ${section.title}
                            </h5>

                            ${rowsHtml}

                        </div>

                    </div>
                `;
            })
            .join("");

    setupChildDivisionEvents();
}

async function loadDivisionSheet() {
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
        const [
            divisionResponse,
            indicatorsResponse
        ] = await Promise.all([
            fetch(
                `/api/divisoes/ficha?tipo=${encodeURIComponent(DIVISION_TYPE)}&codigo=${encodeURIComponent(DIVISION_CODE)}`
            ),
            fetch(
                `/api/divisoes/indicadores?tipo=${encodeURIComponent(DIVISION_TYPE)}&codigo=${encodeURIComponent(DIVISION_CODE)}`
            )
        ]);

        if (!divisionResponse.ok) {
            throw new Error(
                `Erro ao carregar ficha: ${divisionResponse.status}`
            );
        }

        if (!indicatorsResponse.ok) {
            throw new Error(
                `Erro ao carregar indicadores: ${indicatorsResponse.status}`
            );
        }

        const result =
            await divisionResponse.json();

        const indicadores =
            await indicatorsResponse.json();

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

        updateDivisionHeader(
            result.dados
        );

        const sections =
            buildSections(
                result.dados,
                indicadores
            );

        renderSections(
            dataDiv,
            sections
        );

    } catch (error) {
        console.error(
            "Erro ao carregar ficha administrativa:",
            error
        );

        if (nameText) {
            nameText.innerText =
                "Divisão não encontrada";
        }

        if (descriptionText) {
            descriptionText.innerText =
                "Erro ao carregar os dados.";
        }

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


setupBackToMap();
loadDivisionSheet();