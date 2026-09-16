let schoolsInitialized = false;

const schoolFilters = {
    modalidades: [
        {
            label: "Creche",
            filtro: "creche"
        },
        {
            label: "Pré-Escola",
            filtro: "pre_escola"
        },
        {
            label: "Ensino Fundamental - Anos Iniciais",
            filtro: "fund_ai"
        },
        {
            label: "Ensino Fundamental - Anos Finais",
            filtro: "fund_af"
        },
        {
            label: "Ensino Médio",
            filtro: "medio"
        },
        {
            label: "Ensino Médio Integrado",
            filtro: "medio_int"
        },
        {
            label: "Ensino Profissionalizante",
            filtro: "tecnico"
        },
        {
            label: "Ensino EJA Fundamental",
            filtro: "eja_fund"
        },
        {
            label: "Ensino EJA Médio",
            filtro: "eja_med"
        }
    ],

    dependencia: [
        {
            label: "Federal",
            filtro: "federal"
        },
        {
            label: "Estadual",
            filtro: "estadual"
        },
        {
            label: "Municipal",
            filtro: "municipal"
        },
        {
            label: "Privada",
            filtro: "privada"
        }
    ],

    localizacao: [
        {
            label: "Urbana",
            filtro: "urbano"
        },
        {
            label: "Rural",
            filtro: "rural"
        }
    ]
};

window.initializeSchools = function () {
    if (schoolsInitialized) {
        return;
    }

    schoolsInitialized = true;

    renderSchoolBlocks();
};

function calculateDistanceKm(
    lat1,
    lng1,
    lat2,
    lng2
) {
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

function getSchoolLocationText(school) {
    let locationText =
        `${school.cidade} - ${school.estado}`;

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

            locationText +=
                ` · ${distance.toFixed(1).replace(".", ",")} km`;

        } catch (error) {
            console.error(
                "Erro ao calcular distância:",
                error
            );
        }
    }

    return locationText;
}

function renderSchoolBlocks() {
    const schoolsSheet =
        document.getElementById(
            "schoolsSheet"
        );

    if (!schoolsSheet) {
        return;
    }

    schoolsSheet.innerHTML = `
        ${createSchoolCategory(
            "Modalidades",
            "modalidades",
            schoolFilters.modalidades
        )}

        ${createSchoolCategory(
            "Dependência Administrativa",
            "dependencia",
            schoolFilters.dependencia
        )}

        ${createSchoolCategory(
            "Localização",
            "localizacao",
            schoolFilters.localizacao
        )}
    `;

    setupSchoolCategoryEvents();
}

function createSchoolCategory(
    title,
    category,
    filters
) {
    const itemsHtml =
        filters
            .map(
                item => `
                    <div
                        class="school-filter-item border rounded-3 overflow-hidden mb-2"
                        data-category="${category}"
                        data-filtro="${item.filtro}">

                        <button
                            type="button"
                            class="btn w-100 text-start d-flex justify-content-between align-items-center school-filter-button"
                            data-category="${category}"
                            data-filtro="${item.filtro}">

                            <span class="fw-semibold">
                                ${item.label}
                            </span>

                            <span class="d-flex align-items-center gap-2">

                                <span
                                    class="school-filter-count text-muted small"
                                    data-category="${category}"
                                    data-filtro="${item.filtro}">
                                </span>

                                <i
                                    class="bi bi-chevron-down text-primary small">
                                </i>

                            </span>

                        </button>

                        <div
                            class="school-filter-content d-none"
                            data-category="${category}"
                            data-filtro="${item.filtro}">

                            <div class="px-3 py-3">
                                <div
                                    class="text-center text-muted py-2">
                                    Selecione para carregar as escolas.
                                </div>
                            </div>

                        </div>
                    </div>
                `
            )
            .join("");

    return `
        <div class="card shadow-sm border-0 rounded-3 mb-4">

            <div class="card-body p-4">

                <h5 class="text-primary mb-4">
                    ${title}
                </h5>

                ${itemsHtml}

            </div>

        </div>
    `;
}

function setupSchoolCategoryEvents() {
    document
        .querySelectorAll(
            ".school-filter-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const category =
                        button.dataset.category;

                    const filtro =
                        button.dataset.filtro;

                    const container =
                        document.querySelector(
                            `.school-filter-content[data-category="${category}"][data-filtro="${filtro}"]`
                        );

                    const icon =
                        button.querySelector(
                            "i"
                        );

                    const isHidden =
                        container.classList.contains(
                            "d-none"
                        );

                    if (isHidden) {

                        container.classList.remove(
                            "d-none"
                        );

                        icon.classList.remove(
                            "bi-chevron-down"
                        );

                        icon.classList.add(
                            "bi-chevron-up"
                        );

                        await loadSchools(
                            category,
                            filtro,
                            container
                        );

                    } else {

                        container.classList.add(
                            "d-none"
                        );

                        icon.classList.remove(
                            "bi-chevron-up"
                        );

                        icon.classList.add(
                            "bi-chevron-down"
                        );
                    }
                }
            );
        });
}

async function loadSchools(
    category,
    filtro,
    container
) {
    container.innerHTML = `
        <div class="px-3 py-3 text-center">
            <div
                class="spinner-border spinner-border-sm text-primary"
                role="status">
            </div>
        </div>
    `;

    try {
        const params =
            new URLSearchParams({
                tipo: DIVISION_TYPE,
                codigo: DIVISION_CODE,
                categoria:
                    category === "modalidades"
                        ? "modalidade"
                        : category,
                filtro: filtro,
                limite: 10,
                offset: 0
            });

        const response =
            await fetch(
                `/api/divisoes/escolas?${params.toString()}`
            );

        if (!response.ok) {
            throw new Error(
                `Erro ao carregar escolas: ${response.status}`
            );
        }

        const data =
            await response.json();

        if (!data.sucesso) {
            throw new Error(
                data.erro
            );
        }

        renderSchoolList(
            container,
            data.escolas,
            category,
            filtro,
            data.limite,
            data.offset,
            data.quantidade,
            data.total
        );

    } catch (error) {

        console.error(
            "Erro ao carregar escolas:",
            error
        );

        container.innerHTML = `
            <div class="px-3 py-3">
                <div class="alert alert-danger mb-0">
                    Erro ao carregar as escolas.
                </div>
            </div>
        `;
    }
}

function renderSchoolList(
    container,
    schools,
    category,
    filtro,
    limite,
    offset,
    quantidade,
    total
) {
    const countElement =
        document.querySelector(
            `.school-filter-count[data-category="${category}"][data-filtro="${filtro}"]`
        );

    if (countElement) {
        countElement.textContent =
            total.toLocaleString("pt-BR");
    }

    if (!schools.length) {
        container.innerHTML = `
            <div class="px-3 py-3">
                <p class="text-muted mb-0">
                    Nenhuma escola encontrada.
                </p>
            </div>
        `;

        return;
    }

    const schoolsHtml =
        schools
            .map(
                school => `
                    <div class="py-2 border-bottom">

                        <a
                            href="/escola/${school.codigo}"
                            class="text-decoration-none text-primary fw-semibold">
                            ${school.nome}
                        </a>

                        <div class="small text-muted">
                            ${getSchoolLocationText(school)}
                        </div>

                    </div>
                `
            )
            .join("");

    const nextOffset =
        offset + quantidade;

    const loadMoreHtml =
        quantidade === limite
            ? `
                <div class="pt-3">
                    <button
                        type="button"
                        class="btn btn-outline-primary btn-sm load-more-schools"
                        data-category="${category}"
                        data-filtro="${filtro}"
                        data-offset="${nextOffset}">
                        Carregar mais
                    </button>
                </div>
            `
            : "";

    container.innerHTML = `
        <div class="px-3 py-2">

            <div class="school-list">
                ${schoolsHtml}
            </div>

            ${loadMoreHtml}

        </div>
    `;

    setupLoadMoreButton(
        container,
        category,
        filtro,
        nextOffset
    );
}

function setupLoadMoreButton(
    container,
    category,
    filtro,
    offset
) {
    const button =
        container.querySelector(
            ".load-more-schools"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async () => {

            button.disabled = true;

            button.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm"
                    role="status">
                </span>
                Carregando...
            `;

            try {
                const params =
                    new URLSearchParams({
                        tipo: DIVISION_TYPE,
                        codigo: DIVISION_CODE,
                        categoria:
                            category === "modalidades"
                                ? "modalidade"
                                : category,
                        filtro: filtro,
                        limite: 10,
                        offset: offset
                    });

                const response =
                    await fetch(
                        `/api/divisoes/escolas?${params.toString()}`
                    );

                if (!response.ok) {
                    throw new Error(
                        `Erro ao carregar escolas: ${response.status}`
                    );
                }

                const data =
                    await response.json();

                if (!data.sucesso) {
                    throw new Error(
                        data.erro
                    );
                }

                appendSchools(
                    container,
                    data.escolas,
                    category,
                    filtro,
                    data.limite,
                    data.offset,
                    data.quantidade
                );

            } catch (error) {

                console.error(
                    "Erro ao carregar mais escolas:",
                    error
                );

                button.disabled = false;

                button.innerHTML =
                    "Carregar mais";
            }
        }
    );
}

function appendSchools(
    container,
    schools,
    category,
    filtro,
    limite,
    offset,
    quantidade
) {
    const list =
        container.querySelector(
            ".school-list"
        );

    const oldButton =
        container.querySelector(
            ".load-more-schools"
        );

    if (oldButton) {
        oldButton.parentElement.remove();
    }

    const schoolsHtml =
        schools
            .map(
                school => `
                    <div class="py-2 border-bottom">

                        <a
                            href="/escola/${school.codigo}"
                            class="text-decoration-none text-primary fw-semibold">
                            ${school.nome}
                        </a>

                        <div class="small text-muted">
                            ${getSchoolLocationText(school)}
                        </div>

                    </div>
                `
            )
            .join("");

    list.insertAdjacentHTML(
        "beforeend",
        schoolsHtml
    );

    const nextOffset =
        offset + quantidade;

    if (quantidade === limite) {

        list.insertAdjacentHTML(
            "afterend",
            `
                <div class="pt-3">
                    <button
                        type="button"
                        class="btn btn-outline-primary btn-sm load-more-schools"
                        data-category="${category}"
                        data-filtro="${filtro}"
                        data-offset="${nextOffset}">
                        Carregar mais
                    </button>
                </div>
            `
        );

        setupLoadMoreButton(
            container,
            category,
            filtro,
            nextOffset
        );
    }
}