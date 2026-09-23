let schoolsInitialized = false;


// Configura os filtros e seus valores utilizados na listagem de escolas.
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
    /**
     * Inicializa a seção de escolas da ficha administrativa.
     *
     * A inicialização ocorre somente uma vez durante a vida da página.
     */

    // Evita renderizações repetidas da seção.
    if (schoolsInitialized) {
        return;
    }

    schoolsInitialized = true;

    // Constrói os blocos de categorias e configura seus eventos.
    renderSchoolBlocks();
};


function calculateDistanceKm(
    lat1,
    lng1,
    lat2,
    lng2
) {
    /**
     * Calcula a distância aproximada, em quilômetros, entre duas
     * coordenadas geográficas utilizando a fórmula de Haversine.
     *
     * @param {number} lat1 Latitude do primeiro ponto.
     * @param {number} lng1 Longitude do primeiro ponto.
     * @param {number} lat2 Latitude do segundo ponto.
     * @param {number} lng2 Longitude do segundo ponto.
     * @returns {number} Distância entre os pontos em quilômetros.
     */

    // Raio médio da Terra em quilômetros.
    const R = 6371;

    // Converte as diferenças de latitude e longitude para radianos.
    const dLat =
        (lat2 - lat1) * Math.PI / 180;

    const dLng =
        (lng2 - lng1) * Math.PI / 180;

    // Calcula o valor intermediário da fórmula de Haversine.
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;

    // Obtém o ângulo central entre os dois pontos.
    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}


function getSchoolLocationText(school) {
    /**
     * Monta o texto de localização de uma escola.
     *
     * Quando a localização do usuário está disponível e a escola
     * possui coordenadas, acrescenta também a distância aproximada
     * até a escola.
     *
     * @param {Object} school Dados da escola.
     * @returns {string} Texto com município, estado e, quando possível,
     * a distância até a localização do usuário.
     */

    let locationText =
        `${school.cidade} - ${school.estado}`;


    // Recupera a localização do usuário armazenada localmente.
    const savedLocation = localStorage.getItem("userLocation");


    // Calcula a distância quando existem coordenadas válidas
    // tanto para o usuário quanto para a escola.
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
    /**
     * Renderiza os blocos de categorias de escolas na ficha administrativa.
     *
     * As categorias são agrupadas em modalidades, dependência administrativa
     * e localização.
     */

    const schoolsSheet =
        document.getElementById(
            "schoolsSheet"
        );

    if (!schoolsSheet) {
        return;
    }


    // Constrói os três grupos principais de filtros.
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


    // Registra os eventos de abertura e fechamento dos filtros.
    setupSchoolCategoryEvents();
}


function createSchoolCategory(
    title,
    category,
    filters
) {
    /**
     * Cria o HTML de uma categoria de filtros de escolas.
     *
     * @param {string} title Título exibido para a categoria.
     * @param {string} category Identificador da categoria.
     * @param {Object[]} filters Itens disponíveis na categoria.
     * @returns {string} HTML completo da categoria.
     */

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
    /**
     * Configura os eventos dos botões das categorias de escolas.
     *
     * Ao abrir uma categoria, carrega os dados correspondentes.
     * Ao fechá-la, apenas oculta seu conteúdo.
     */

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


                    // Abre o conteúdo da categoria e carrega suas escolas.
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


                    // Fecha o conteúdo quando a categoria já está aberta.
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
    /**
     * Carrega as escolas de uma categoria e filtro específicos.
     *
     * @param {string} category Categoria do filtro.
     * @param {string} filtro Valor específico selecionado.
     * @param {HTMLElement} container Elemento onde os resultados serão
     * renderizados.
     */

    // Exibe o indicador de carregamento enquanto a consulta é realizada.
    container.innerHTML = `
        <div class="px-3 py-3 text-center">
            <div
                class="spinner-border spinner-border-sm text-primary"
                role="status">
            </div>
        </div>
    `;


    try {
        // Monta os parâmetros da consulta paginada.
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


        // Consulta as escolas pertencentes à divisão administrativa.
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


        // Renderiza os resultados obtidos.
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


        // Exibe uma mensagem de erro no bloco correspondente.
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
    /**
     * Renderiza uma página de escolas dentro de uma categoria.
     *
     * @param {HTMLElement} container Elemento onde a lista será exibida.
     * @param {Object[]} schools Escolas retornadas pela API.
     * @param {string} category Categoria do filtro.
     * @param {string} filtro Filtro selecionado.
     * @param {number} limite Quantidade máxima de registros por página.
     * @param {number} offset Deslocamento da paginação.
     * @param {number} quantidade Quantidade efetivamente retornada.
     * @param {number} total Quantidade total de escolas encontradas.
     */

    const countElement =
        document.querySelector(
            `.school-filter-count[data-category="${category}"][data-filtro="${filtro}"]`
        );


    // Atualiza o contador exibido ao lado da categoria.
    if (countElement) {
        countElement.textContent =
            total.toLocaleString("pt-BR");
    }


    // Exibe mensagem quando não existem escolas para o filtro.
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


    // Cria o HTML das escolas retornadas.
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


    // Calcula o próximo deslocamento da paginação.
    const nextOffset =
        offset + quantidade;


    // Exibe o botão de carregamento quando a página foi preenchida.
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


    // Configura o carregamento da próxima página, quando disponível.
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
    /**
     * Configura o botão responsável pelo carregamento de mais escolas.
     *
     * @param {HTMLElement} container Elemento que contém a lista.
     * @param {string} category Categoria do filtro.
     * @param {string} filtro Filtro selecionado.
     * @param {number} offset Deslocamento utilizado na próxima consulta.
     */

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

            // Desabilita o botão enquanto a próxima página é carregada.
            button.disabled = true;

            button.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm"
                    role="status">
                </span>
                Carregando...
            `;


            try {
                // Monta os parâmetros da próxima página.
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


                // Adiciona a nova página ao conteúdo já existente.
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


                // Reabilita o botão caso ocorra um erro.
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
    /**
     * Adiciona uma nova página de escolas à lista já renderizada.
     *
     * Remove o botão atual de carregamento, acrescenta os novos registros
     * e cria um novo botão quando existem mais resultados disponíveis.
     *
     * @param {HTMLElement} container Elemento que contém a lista.
     * @param {Object[]} schools Nova página de escolas.
     * @param {string} category Categoria do filtro.
     * @param {string} filtro Filtro selecionado.
     * @param {number} limite Quantidade máxima de registros por página.
     * @param {number} offset Deslocamento utilizado na consulta atual.
     * @param {number} quantidade Quantidade efetivamente retornada.
     */

    const list =
        container.querySelector(
            ".school-list"
        );

    const oldButton =
        container.querySelector(
            ".load-more-schools"
        );


    // Remove o botão anterior antes de inserir os novos resultados.
    if (oldButton) {
        oldButton.parentElement.remove();
    }


    // Constrói o HTML dos novos registros.
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


    // Acrescenta as novas escolas ao final da lista existente.
    list.insertAdjacentHTML(
        "beforeend",
        schoolsHtml
    );


    // Calcula o deslocamento para a próxima página.
    const nextOffset =
        offset + quantidade;


    // Cria um novo botão quando a página foi preenchida
    // e pode haver mais resultados.
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


        // Configura o novo botão para a página seguinte.
        setupLoadMoreButton(
            container,
            category,
            filtro,
            nextOffset
        );
    }
}