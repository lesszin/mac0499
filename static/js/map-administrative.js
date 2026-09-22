function initializeMapAdministrative({
    map,
    hideSchoolCard
}) {
    let administrativeDivisionLayer = null;


    function updateAdministrativeConfirmButton() {
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

        if (confirmButton) {
            confirmButton.disabled =
                !hasSelection;
        }

        if (clearButton) {
            clearButton.disabled =
                !hasSelection &&
                !administrativeDivisionLayer;
        }
    }


    function clearAdministrativeDivisionLayer() {
        if (administrativeDivisionLayer) {
            map.removeLayer(
                administrativeDivisionLayer
            );

            administrativeDivisionLayer = null;
        }
    }


    function clearAdministrativeFilter() {
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

        if (countryFilter) {
            countryFilter.value = "";
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

        clearAdministrativeDivisionLayer();

        hideAdministrativeDivisionCard();

        updateAdministrativeConfirmButton();
    }


    function showAdministrativeDivisionCard(
        tipo,
        codigo,
        nome
    ) {
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

        card.classList.remove(
            "d-none"
        );
    }


    function hideAdministrativeDivisionCard() {
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
        const countryFilter =
            document.getElementById(
                "administrativeCountryFilter"
            );

        if (!countryFilter) {
            return;
        }

        try {
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

            countryFilter.innerHTML = `
                <option value="" selected disabled>
                    Selecione...
                </option>
            `;

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
        hideAdministrativeDivisionCard();

        try {
            const url =
                `/api/divisoes/geometria?` +
                `tipo=${encodeURIComponent(tipo)}` +
                `&codigo=${encodeURIComponent(codigo)}`;

            const response =
                await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Erro ao carregar geometria: ${response.status}`
                );
            }

            const geojson =
                await response.json();

            clearAdministrativeDivisionLayer();

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

            const bounds =
                administrativeDivisionLayer
                    .getBounds();

            if (bounds.isValid()) {
                map.fitBounds(
                    bounds,
                    {
                        padding: [30, 30]
                    }
                );
            }

            hideSchoolCard();

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

            clearAdministrativeDivisionLayer();

            hideAdministrativeDivisionCard();
        }

        updateAdministrativeConfirmButton();
    }


    async function restoreAdministrativeDivisionFromSheet() {
        const saved =
            sessionStorage.getItem(
                "returnToAdministrativeMap"
            );

        if (!saved) {
            return;
        }

        try {
            const state =
                JSON.parse(saved);

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

            if (
                !countryFilter ||
                !regionFilter ||
                !ufFilter ||
                !municipalityFilter
            ) {
                return;
            }

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

            countryFilter.value = "1";

            let regionCode = null;
            let ufCode = null;
            let municipalityCode = null;

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

                if (ufCode != null) {
                    ufFilter.value =
                        String(ufCode);
                }

                ufFilter.disabled =
                    ufs.length === 0;
            }

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

            if (state.tipo === "municipio") {
                nome = data.NM_MUN;

            } else if (state.tipo === "uf") {
                nome = data.NM_UF;

            } else if (state.tipo === "regiao") {
                nome = data.NM_REGIAO;

            } else if (state.tipo === "pais") {
                nome = data.Pais;
            }

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
            sessionStorage.removeItem(
                "returnToAdministrativeMap"
            );
        }
    }


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

                if (!tipo || !codigo) {
                    return;
                }

                await loadAdministrativeDivision(
                    tipo,
                    codigo,
                    nome
                );
            }
        );
    }


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