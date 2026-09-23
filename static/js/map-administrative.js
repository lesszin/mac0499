function initializeMapAdministrative({
    map,
    hideSchoolCard
}) {
    // Mantém a camada responsável pela geometria da divisão
    // administrativa atualmente exibida no mapa.
    let administrativeDivisionLayer = null;


    function updateAdministrativeConfirmButton() {
        /**
         * Atualiza o estado dos botões de confirmação e limpeza
         * da seleção de divisão administrativa.
         *
         * O botão de confirmação é habilitado quando existe alguma
         * divisão selecionada. O botão de limpeza permanece habilitado
         * enquanto houver uma seleção ou uma geometria desenhada no mapa.
         */

        const countryFilter =
            document.getElementById(
                "administrativeCountryFilter"
            );

        const regionFilter =
            document.getElementById(
                "administrativeRegionFilter"
            );

        const ufFilter =
            document.getElementById(
                "administrativeUfFilter"
            );

        const municipalityFilter =
            document.getElementById(
                "administrativeMunicipalityFilter"
            );

        const confirmButton =
            document.getElementById(
                "confirmAdministrativeFilter"
            );

        const clearButton =
            document.getElementById(
                "clearAdministrativeFilter"
            );


        // Verifica se existe alguma divisão administrativa selecionada.
        const hasSelection =
            Boolean(
                (countryFilter &&
                    countryFilter.value) ||
                (regionFilter &&
                    regionFilter.value) ||
                (ufFilter &&
                    ufFilter.value) ||
                (municipalityFilter &&
                    municipalityFilter.value)
            );


        // Atualiza o estado do botão de confirmação.
        if (confirmButton) {
            confirmButton.disabled =
                !hasSelection;
        }


        // O botão de limpeza também considera a existência
        // de uma camada administrativa desenhada.
        if (clearButton) {
            clearButton.disabled =
                !hasSelection &&
                !administrativeDivisionLayer;
        }
    }


    function clearAdministrativeDivisionLayer() {
        /**
         * Remove do mapa a camada correspondente à divisão
         * administrativa atualmente desenhada.
         */

        if (administrativeDivisionLayer) {
            map.removeLayer(
                administrativeDivisionLayer
            );

            administrativeDivisionLayer = null;
        }
    }


    function clearAdministrativeFilter() {
        /**
         * Limpa todos os filtros de divisão administrativa,
         * remove a geometria do mapa e oculta o cartão correspondente.
         */

        const countryFilter =
            document.getElementById(
                "administrativeCountryFilter"
            );

        const regionFilter =
            document.getElementById(
                "administrativeRegionFilter"
            );

        const ufFilter =
            document.getElementById(
                "administrativeUfFilter"
            );

        const municipalityFilter =
            document.getElementById(
                "administrativeMunicipalityFilter"
            );


        // Limpa a seleção de país.
        if (countryFilter) {
            countryFilter.value = "";
        }


        // Reinicia e desabilita o filtro de região.
        if (regionFilter) {
            regionFilter.innerHTML = `
                <option value="" selected disabled>
                    Selecione...
                </option>
            `;

            regionFilter.value = "";
            regionFilter.disabled = true;
        }


        // Reinicia e desabilita o filtro de UF.
        if (ufFilter) {
            ufFilter.innerHTML = `
                <option value="" selected disabled>
                    Selecione...
                </option>
            `;

            ufFilter.value = "";
            ufFilter.disabled = true;
        }


        // Reinicia e desabilita o filtro de município.
        if (municipalityFilter) {
            municipalityFilter.innerHTML = `
                <option value="" selected disabled>
                    Selecione...
                </option>
            `;

            municipalityFilter.value = "";
            municipalityFilter.disabled = true;
        }


        // Remove a divisão atualmente desenhada.
        clearAdministrativeDivisionLayer();

        // Esconde o cartão da divisão.
        hideAdministrativeDivisionCard();

        // Atualiza os botões após a limpeza.
        updateAdministrativeConfirmButton();
    }


    function showAdministrativeDivisionCard(
        tipo,
        codigo,
        nome
    ) {
        /**
         * Exibe o cartão de informações da divisão administrativa.
         *
         * @param {string} tipo Tipo da divisão administrativa.
         * @param {string|number} codigo Código da divisão.
         * @param {string} nome Nome exibido da divisão.
         */

        const card =
            document.getElementById(
                "administrativeDivisionCard"
            );

        const body =
            document.getElementById(
                "administrativeDivisionCardBody"
            );

        if (!card || !body) {
            return;
        }


        // Preenche o cartão com o nome da divisão
        // e o link para sua ficha técnica.
        body.innerHTML = `
            <h6 class="fw-bold mb-3">
                ${nome}
            </h6>

            <a
                href="/divisao/${tipo}/${codigo}"
                class="btn btn-primary btn-sm">
                Ver ficha técnica
            </a>
        `;

        // Torna o cartão visível.
        card.classList.remove(
            "d-none"
        );
    }


    function hideAdministrativeDivisionCard() {
        /**
         * Oculta o cartão de informações da divisão administrativa.
         */

        const card =
            document.getElementById(
                "administrativeDivisionCard"
            );

        if (card) {
            card.classList.add(
                "d-none"
            );
        }
    }


    async function loadAdministrativeCountries() {
        /**
         * Carrega do backend os países disponíveis e os insere
         * no filtro de país.
         */

        const countryFilter =
            document.getElementById(
                "administrativeCountryFilter"
            );

        if (!countryFilter) {
            return;
        }

        try {
            // Solicita os países disponíveis à API.
            const response =
                await fetch(
                    "/api/divisoes/pais"
                );

            if (!response.ok) {
                throw new Error(
                    `Erro ao carregar país: ${response.status}`
                );
            }

            const countries =
                await response.json();


            // Reinicia as opções do filtro antes de adicionar
            // os resultados retornados pelo backend.
            countryFilter.innerHTML = `
                <option value="" selected disabled>
                    Selecione...
                </option>
            `;


            // Cria uma opção para cada país retornado.
            countries.forEach(country => {
                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    country.codigo;

                option.textContent =
                    country.nome;

                countryFilter.appendChild(
                    option
                );
            });

        } catch (error) {
            console.error(
                "Erro ao carregar países:",
                error
            );
        }
    }


    async function loadAdministrativeDivision(
        tipo,
        codigo,
        nome
    ) {
        /**
         * Carrega e desenha no mapa a geometria de uma divisão
         * administrativa.
         *
         * @param {string} tipo Tipo da divisão administrativa.
         * @param {string|number} codigo Código da divisão.
         * @param {string} nome Nome da divisão utilizado no cartão.
         */

        // Remove o cartão anterior antes de carregar a nova divisão.
        hideAdministrativeDivisionCard();

        try {
            // Monta a URL da API que fornece a geometria da divisão.
            const url =
                `/api/divisoes/geometria?` +
                `tipo=${encodeURIComponent(tipo)}` +
                `&codigo=${encodeURIComponent(codigo)}`;


            // Solicita a geometria ao backend.
            const response =
                await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Erro ao carregar geometria: ${response.status}`
                );
            }

            const geojson =
                await response.json();


            // Remove a geometria anterior antes de desenhar a nova.
            clearAdministrativeDivisionLayer();


            // Cria a camada GeoJSON com o estilo da divisão administrativa.
            administrativeDivisionLayer =
                L.geoJSON(
                    geojson,
                    {
                        style: {
                            color: "#007bff",
                            weight: 2,
                            opacity: 0.9,
                            fillColor: "#007bff",
                            fillOpacity: 0.12
                        }
                    }
                ).addTo(map);


            // Obtém os limites da geometria para ajustar a visualização.
            const bounds =
                administrativeDivisionLayer
                    .getBounds();


            // Centraliza e dimensiona o mapa para enquadrar a divisão.
            if (bounds.isValid()) {
                map.fitBounds(
                    bounds,
                    {
                        padding: [30, 30]
                    }
                );
            }


            // Esconde o cartão de escola para dar lugar ao
            // cartão da divisão administrativa.
            hideSchoolCard();


            // Exibe as informações da divisão selecionada.
            showAdministrativeDivisionCard(
                tipo,
                codigo,
                nome
            );

        } catch (error) {
            console.error(
                "Erro ao desenhar divisão administrativa:",
                error
            );

            // Remove qualquer camada que possa ter sido criada
            // antes da ocorrência do erro.
            clearAdministrativeDivisionLayer();

            hideAdministrativeDivisionCard();
        }


        // Atualiza os botões após o carregamento da divisão.
        updateAdministrativeConfirmButton();
    }


    async function restoreAdministrativeDivisionFromSheet() {
        /**
         * Restaura no mapa a divisão administrativa que originou
         * o retorno de uma ficha técnica.
         *
         * O estado temporário é recuperado do sessionStorage,
         * os filtros hierárquicos são reconstruídos e a geometria
         * da divisão é desenhada novamente.
         */

        const saved =
            sessionStorage.getItem(
                "returnToAdministrativeMap"
            );

        if (!saved) {
            return;
        }

        try {
            // Recupera o estado salvo antes do acesso à ficha técnica.
            const state =
                JSON.parse(saved);


            // Recupera os filtros administrativos da interface.
            const countryFilter =
                document.getElementById(
                    "administrativeCountryFilter"
                );

            const regionFilter =
                document.getElementById(
                    "administrativeRegionFilter"
                );

            const ufFilter =
                document.getElementById(
                    "administrativeUfFilter"
                );

            const municipalityFilter =
                document.getElementById(
                    "administrativeMunicipalityFilter"
                );


            // Sem os elementos necessários, não é possível restaurar o estado.
            if (
                !countryFilter ||
                !regionFilter ||
                !ufFilter ||
                !municipalityFilter
            ) {
                return;
            }


            // Recupera os dados da divisão administrativa.
            const response =
                await fetch(
                    `/api/divisoes/ficha?` +
                    `tipo=${encodeURIComponent(state.tipo)}` +
                    `&codigo=${encodeURIComponent(state.codigo)}`
                );

            if (!response.ok) {
                throw new Error(
                    `Erro ao recuperar divisão: ${response.status}`
                );
            }

            const result =
                await response.json();

            if (result.erro) {
                throw new Error(
                    result.erro
                );
            }

            const data =
                result.dados;


            // O mapa administrativo considera o país como Brasil
            // durante a reconstrução da hierarquia.
            countryFilter.value = "1";


            let regionCode = null;
            let ufCode = null;
            let municipalityCode = null;


            // Determina os códigos dos níveis administrativos
            // necessários para reconstruir os filtros.
            if (state.tipo === "regiao") {
                regionCode =
                    state.codigo;

            } else if (state.tipo === "uf") {
                regionCode =
                    data.CD_REGIAO;

                ufCode =
                    state.codigo;

            } else if (state.tipo === "municipio") {
                regionCode =
                    data.CD_REGIAO;

                ufCode =
                    data.CD_UF;

                municipalityCode =
                    state.codigo;
            }


            // Quando o estado salvo é o país, carrega todas as regiões
            // para reconstruir o próximo nível da hierarquia.
            if (state.tipo === "pais") {
                const regionResponse =
                    await fetch(
                        "/api/divisoes/regioes"
                    );

                if (!regionResponse.ok) {
                    throw new Error(
                        `Erro ao carregar regiões: ${regionResponse.status}`
                    );
                }

                const regions =
                    await regionResponse.json();

                regionFilter.innerHTML = `
                    <option value="" selected disabled>
                        Selecione...
                    </option>
                `;


                // Adiciona as regiões disponíveis ao filtro.
                regions.forEach(region => {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        region.codigo;

                    option.textContent =
                        region.nome;

                    regionFilter.appendChild(
                        option
                    );
                });

                regionFilter.disabled =
                    regions.length === 0;


            // Quando há uma região associada à divisão salva,
            // carrega as regiões e restaura sua seleção.
            } else if (regionCode != null) {
                const regionResponse =
                    await fetch(
                        "/api/divisoes/regioes"
                    );

                if (!regionResponse.ok) {
                    throw new Error(
                        `Erro ao carregar regiões: ${regionResponse.status}`
                    );
                }

                const regions =
                    await regionResponse.json();

                regionFilter.innerHTML = `
                    <option value="" disabled>
                        Selecione...
                    </option>
                `;


                regions.forEach(region => {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        region.codigo;

                    option.textContent =
                        region.nome;

                    regionFilter.appendChild(
                        option
                    );
                });

                regionFilter.value =
                    String(regionCode);

                regionFilter.disabled =
                    false;
            }


            // Para regiões, UFs e municípios, recupera as UFs
            // pertencentes à região correspondente.
            if (
                state.tipo === "regiao" ||
                state.tipo === "uf" ||
                state.tipo === "municipio"
            ) {
                const ufResponse =
                    await fetch(
                        `/api/divisoes/ufs?regiao=${encodeURIComponent(regionCode)}`
                    );

                if (!ufResponse.ok) {
                    throw new Error(
                        `Erro ao carregar UFs: ${ufResponse.status}`
                    );
                }

                const ufs =
                    await ufResponse.json();

                ufFilter.innerHTML = `
                    <option value="" selected disabled>
                        Selecione...
                    </option>
                `;


                // Adiciona as UFs retornadas ao filtro.
                ufs.forEach(uf => {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        uf.codigo;

                    option.textContent =
                        uf.nome;

                    ufFilter.appendChild(
                        option
                    );
                });


                // Restaura a UF quando ela faz parte do estado salvo.
                if (ufCode != null) {
                    ufFilter.value =
                        String(ufCode);
                }

                ufFilter.disabled =
                    ufs.length === 0;
            }


            // Para UFs e municípios, recupera os municípios
            // pertencentes à UF correspondente.
            if (
                state.tipo === "uf" ||
                state.tipo === "municipio"
            ) {
                const municipalityResponse =
                    await fetch(
                        `/api/divisoes/municipios?uf=${encodeURIComponent(ufCode)}`
                    );

                if (!municipalityResponse.ok) {
                    throw new Error(
                        `Erro ao carregar municípios: ${municipalityResponse.status}`
                    );
                }

                const municipalities =
                    await municipalityResponse.json();

                municipalityFilter.innerHTML = `
                    <option value="" selected disabled>
                        Selecione...
                    </option>
                `;


                // Adiciona os municípios retornados ao filtro.
                municipalities.forEach(municipio => {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        municipio.codigo;

                    option.textContent =
                        municipio.nome;

                    municipalityFilter.appendChild(
                        option
                    );
                });


                // Restaura o município quando ele faz parte do estado salvo.
                if (municipalityCode != null) {
                    municipalityFilter.value =
                        String(
                            municipalityCode
                        );
                }

                municipalityFilter.disabled =
                    municipalities.length === 0;
            }


            let nome = "";


            // Determina o nome a ser utilizado no cartão
            // de acordo com o nível administrativo restaurado.
            if (state.tipo === "municipio") {
                nome = data.NM_MUN;

            } else if (state.tipo === "uf") {
                nome = data.NM_UF;

            } else if (state.tipo === "regiao") {
                nome = data.NM_REGIAO;

            } else if (state.tipo === "pais") {
                nome = data.Pais;
            }


            // Redesenha a divisão administrativa restaurada.
            await loadAdministrativeDivision(
                state.tipo,
                state.codigo,
                nome
            );


            updateAdministrativeConfirmButton();

        } catch (error) {
            console.error(
                "Erro ao restaurar divisão administrativa:",
                error
            );

        } finally {
            // Remove o estado temporário depois da restauração.
            sessionStorage.removeItem(
                "returnToAdministrativeMap"
            );
        }
    }


    // Configura o filtro de país e o carregamento das regiões.
    const countryFilter =
        document.getElementById(
            "administrativeCountryFilter"
        );

    if (countryFilter) {
        countryFilter.addEventListener(
            "change",
            async () => {
                const regionFilter =
                    document.getElementById(
                        "administrativeRegionFilter"
                    );

                const ufFilter =
                    document.getElementById(
                        "administrativeUfFilter"
                    );

                const municipalityFilter =
                    document.getElementById(
                        "administrativeMunicipalityFilter"
                    );


                // Ao trocar o país, os níveis inferiores são reiniciados.
                if (ufFilter) {
                    ufFilter.innerHTML = `
                        <option value="" selected disabled>
                            Selecione...
                        </option>
                    `;

                    ufFilter.value = "";
                    ufFilter.disabled = true;
                }

                if (municipalityFilter) {
                    municipalityFilter.innerHTML = `
                        <option value="" selected disabled>
                            Selecione...
                        </option>
                    `;

                    municipalityFilter.value = "";
                    municipalityFilter.disabled = true;
                }

                if (regionFilter) {
                    regionFilter.innerHTML = `
                        <option value="" selected disabled>
                            Selecione...
                        </option>
                    `;

                    regionFilter.value = "";
                    regionFilter.disabled = true;
                }


                updateAdministrativeConfirmButton();


                if (
                    !countryFilter.value ||
                    !regionFilter
                ) {
                    return;
                }

                try {
                    // Carrega as regiões disponíveis para o país selecionado.
                    const response =
                        await fetch(
                            "/api/divisoes/regioes"
                        );

                    if (!response.ok) {
                        throw new Error(
                            `Erro ao carregar regiões: ${response.status}`
                        );
                    }

                    const regions =
                        await response.json();


                    // Adiciona cada região ao filtro.
                    regions.forEach(
                        region => {
                            const option =
                                document.createElement(
                                    "option"
                                );

                            option.value =
                                region.codigo;

                            option.textContent =
                                region.nome;

                            regionFilter.appendChild(
                                option
                            );
                        }
                    );

                    regionFilter.disabled =
                        regions.length === 0;

                    updateAdministrativeConfirmButton();

                } catch (error) {
                    console.error(
                        "Erro ao carregar regiões:",
                        error
                    );
                }
            }
        );
    }


    // Configura o filtro de região e o carregamento das UFs.
    const regionFilter =
        document.getElementById(
            "administrativeRegionFilter"
        );

    if (regionFilter) {
        regionFilter.addEventListener(
            "change",
            async () => {
                const region =
                    regionFilter.value;

                const ufFilter =
                    document.getElementById(
                        "administrativeUfFilter"
                    );

                const municipalityFilter =
                    document.getElementById(
                        "administrativeMunicipalityFilter"
                    );


                // Ao trocar a região, reinicia a UF e o município.
                if (ufFilter) {
                    ufFilter.innerHTML = `
                        <option value="" selected disabled>
                            Selecione...
                        </option>
                    `;

                    ufFilter.disabled = true;
                }

                if (municipalityFilter) {
                    municipalityFilter.innerHTML = `
                        <option value="" selected disabled>
                            Selecione...
                        </option>
                    `;

                    municipalityFilter.disabled = true;
                }


                if (!region || !ufFilter) {
                    return;
                }

                try {
                    // Carrega as UFs pertencentes à região selecionada.
                    const response =
                        await fetch(
                            `/api/divisoes/ufs?regiao=${encodeURIComponent(region)}`
                        );

                    if (!response.ok) {
                        throw new Error(
                            `Erro ao carregar UFs: ${response.status}`
                        );
                    }

                    const ufs =
                        await response.json();


                    // Adiciona cada UF ao filtro correspondente.
                    ufs.forEach(
                        uf => {
                            const option =
                                document.createElement(
                                    "option"
                                );

                            option.value =
                                uf.codigo;

                            option.textContent =
                                uf.nome;

                            ufFilter.appendChild(
                                option
                            );
                        }
                    );

                    ufFilter.disabled =
                        ufs.length === 0;

                    updateAdministrativeConfirmButton();

                } catch (error) {
                    console.error(
                        "Erro ao carregar UFs:",
                        error
                    );
                }
            }
        );
    }


    // Configura o filtro de UF e o carregamento dos municípios.
    const ufFilter =
        document.getElementById(
            "administrativeUfFilter"
        );

    if (ufFilter) {
        ufFilter.addEventListener(
            "change",
            async () => {
                const uf =
                    ufFilter.value;

                const municipalityFilter =
                    document.getElementById(
                        "administrativeMunicipalityFilter"
                    );

                if (!municipalityFilter) {
                    return;
                }


                // Reinicia o filtro de município ao trocar a UF.
                municipalityFilter.innerHTML = `
                    <option value="" selected disabled>
                        Selecione...
                    </option>
                `;

                municipalityFilter.disabled =
                    true;


                if (!uf) {
                    return;
                }

                try {
                    // Carrega os municípios pertencentes à UF selecionada.
                    const response =
                        await fetch(
                            `/api/divisoes/municipios?uf=${encodeURIComponent(uf)}`
                        );

                    if (!response.ok) {
                        throw new Error(
                            `Erro ao carregar municípios: ${response.status}`
                        );
                    }

                    const municipios =
                        await response.json();


                    // Adiciona cada município ao filtro.
                    municipios.forEach(
                        municipio => {
                            const option =
                                document.createElement(
                                    "option"
                                );

                            option.value =
                                municipio.codigo;

                            option.textContent =
                                municipio.nome;

                            municipalityFilter.appendChild(
                                option
                            );
                        }
                    );

                    municipalityFilter.disabled =
                        municipios.length === 0;

                    updateAdministrativeConfirmButton();

                } catch (error) {
                    console.error(
                        "Erro ao carregar municípios:",
                        error
                    );
                }
            }
        );
    }


    // Atualiza o botão de confirmação quando o município é selecionado.
    const municipalityFilter =
        document.getElementById(
            "administrativeMunicipalityFilter"
        );

    if (municipalityFilter) {
        municipalityFilter.addEventListener(
            "change",
            updateAdministrativeConfirmButton
        );
    }


    // Configura o botão para confirmar a divisão administrativa selecionada.
    const confirmButton =
        document.getElementById(
            "confirmAdministrativeFilter"
        );

    if (confirmButton) {
        confirmButton.addEventListener(
            "click",
            async () => {
                const countryFilter =
                    document.getElementById(
                        "administrativeCountryFilter"
                    );

                const regionFilter =
                    document.getElementById(
                        "administrativeRegionFilter"
                    );

                const ufFilter =
                    document.getElementById(
                        "administrativeUfFilter"
                    );

                const municipalityFilter =
                    document.getElementById(
                        "administrativeMunicipalityFilter"
                    );

                let tipo = "";
                let codigo = "";
                let nome = "";


                // Prioriza o nível administrativo mais específico selecionado.
                if (
                    municipalityFilter &&
                    municipalityFilter.value
                ) {
                    tipo = "municipio";
                    codigo =
                        municipalityFilter.value;

                    nome =
                        municipalityFilter.options[
                            municipalityFilter.selectedIndex
                        ].text;

                } else if (
                    ufFilter &&
                    ufFilter.value
                ) {
                    tipo = "uf";
                    codigo =
                        ufFilter.value;

                    nome =
                        ufFilter.options[
                            ufFilter.selectedIndex
                        ].text;

                } else if (
                    regionFilter &&
                    regionFilter.value
                ) {
                    tipo = "regiao";
                    codigo =
                        regionFilter.value;

                    nome =
                        regionFilter.options[
                            regionFilter.selectedIndex
                        ].text;

                } else if (
                    countryFilter &&
                    countryFilter.value
                ) {
                    tipo = "pais";
                    codigo =
                        countryFilter.value;

                    nome =
                        countryFilter.options[
                            countryFilter.selectedIndex
                        ].text;
                }


                // Sem uma divisão selecionada, não há ação a executar.
                if (!tipo || !codigo) {
                    return;
                }


                // Carrega a geometria e exibe o cartão da divisão selecionada.
                await loadAdministrativeDivision(
                    tipo,
                    codigo,
                    nome
                );
            }
        );
    }


    // Configura o botão responsável por limpar a seleção administrativa.
    const clearButton =
        document.getElementById(
            "clearAdministrativeFilter"
        );

    if (clearButton) {
        clearButton.addEventListener(
            "click",
            clearAdministrativeFilter
        );
    }


    // Expõe as funções utilizadas por outros módulos do mapa.
    return {
        updateAdministrativeConfirmButton,
        clearAdministrativeFilter,
        clearAdministrativeDivisionLayer,
        loadAdministrativeCountries,
        loadAdministrativeDivision,
        restoreAdministrativeDivisionFromSheet,
        hideAdministrativeDivisionCard
    };
}


export {
    initializeMapAdministrative
};