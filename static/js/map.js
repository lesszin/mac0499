import {
    initializeMapSearch
} from "./map-search.js";
import {
    initializeMapFilters
} from "./map-filters.js";
import {
    initializeMapAdministrative
} from "./map-administrative.js";
import {
    initializeMapSpatial
} from "./map-spatial.js";
import {
    initializeMapComparison
} from "./map-comparison.js";


// Mantém o marcador e as coordenadas da localização do usuário.
let userLocationMarker = null;
let userLocation = null;


// Inicializa o mapa na posição central de São Paulo.
const map = L.map('mapContainer', { zoomControl: false }).setView([-23.55052, -46.633308], 13);

// Posiciona os controles de zoom no canto inferior esquerdo.
L.control.zoom({ position: 'bottomleft' }).addTo(map);


// Adiciona o mapa base do OpenStreetMap.
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }
).addTo(map);


// Camadas utilizadas para organizar os marcadores do mapa.
const schoolLayer = L.layerGroup().addTo(map);
const selectedLayer = L.layerGroup().addTo(map);


// Mantém os marcadores das escolas associados aos seus códigos.
const schoolMarkers = new Map();


// Código da escola atualmente selecionada.
let selectedSchoolCode = null;


// Inicializa o módulo responsável pela busca de escolas.
const mapSearch =
    initializeMapSearch({
        map,
        schoolLayer,
        selectedLayer,
        schoolMarkers,
        addMarker,
        createPin,
        getUserLocation: () =>
            userLocation,
        onComparisonSchoolSelected:
            school =>
                mapComparison.selectComparisonSchoolFromMap(
                    school
                ),
        setSelectedSchoolCode: value => {
            selectedSchoolCode = value;
        }
    });


// Inicializa o módulo responsável pelos filtros normais do mapa.
const mapFilters =
    initializeMapFilters({
        map,
        schoolLayer,
        schoolMarkers,
        addMarker,
        getSelectedSchoolCode: () =>
            selectedSchoolCode
    });


// Inicializa o módulo responsável pela análise administrativa.
const mapAdministrative =
    initializeMapAdministrative({
        map,
        hideSchoolCard:
            mapSearch.hideSchoolCard
    });


// Inicializa o módulo responsável pela análise espacial.
const mapSpatial =
    initializeMapSpatial({
        map,
        mapSearch,
        mapAdministrative,
        schoolLayer,
        selectedLayer,
        schoolMarkers,
        setSelectedSchoolCode: value => {
            selectedSchoolCode = value;
        }
    });


// Estilo utilizado para os marcadores circulares das escolas.
const dotStyle = {
    radius: 5,
    fillColor: "#007bff",
    color: "#fff",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};


// Ícone utilizado para representar a escola principal selecionada.
const redIcon = L.divIcon({
    className: 'marker-no-bg',
    html: `
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 384 512" 
            width="28" 
            height="40" 
            style="filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.3));">
            <path 
                fill="#dc3545" 
                d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/>
        </svg>
    `,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
});


// Ícone utilizado para representar a escola comparada.
const greenIcon = L.divIcon({
    className: "marker-no-bg",
    html: `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 384 512"
            width="28"
            height="40"
            style="filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.3));">
            <path
                fill="#198754"
                d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/>
        </svg>
    `,
    iconSize: [28, 40],
    iconAnchor: [14, 40]
});


// Inicializa o módulo responsável pelo modo de comparação.
const mapComparison =
    initializeMapComparison({
        map,
        selectedLayer,
        mapSearch,
        createPin,
        greenIcon,
        setSelectedSchoolCode: value => {
            selectedSchoolCode = value;
        }
    });


// Recupera a localização do usuário armazenada anteriormente.
const savedUserLocation = localStorage.getItem("userLocation");

if (savedUserLocation) {
    try {
        userLocation = JSON.parse(savedUserLocation);
    } catch (error) {
        console.error(
            "Erro ao recuperar localização:",
            error
        );

        localStorage.removeItem("userLocation");
    }
}


// Atualiza as setas dos elementos de filtros expansíveis
// de acordo com o estado atual dos componentes Bootstrap.
document
    .querySelectorAll(".filter-header-cursor, .filter-subheader")
    .forEach(header => {
        const targetSelector =
            header.getAttribute("data-bs-target");
        const target =
            document.querySelector(targetSelector);
        const arrow =
            header.querySelector(".collapse-arrow");

        if (!target || !arrow) {
            return;
        }

        const updateArrow = () => {
            const isOpen = target.classList.contains("show");

            arrow.classList.toggle(
                "bi-chevron-up",
                isOpen
            );
            arrow.classList.toggle(
                "bi-chevron-down",
                !isOpen
            );
        };

        target.addEventListener(
            "shown.bs.collapse",
            updateArrow
        );

        target.addEventListener(
            "hidden.bs.collapse",
            updateArrow
        );

        updateArrow();
    });


function renderSavedUserLocation() {
    /**
     * Renderiza no mapa a localização do usuário armazenada localmente.
     *
     * Recupera a localização do localStorage e cria ou atualiza
     * o marcador correspondente no mapa.
     */
    const savedLocation = localStorage.getItem("userLocation");

    if (!savedLocation) {
        return;
    }

    try {
        // Recupera as coordenadas armazenadas.
        userLocation = JSON.parse(savedLocation);

        // Cria o ícone utilizado para representar a localização do usuário.
        const userIcon = L.divIcon({
            className: "user-location-marker",
            html: '<div class="user-location-dot"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });

        const latLng = [
            userLocation.lat,
            userLocation.lng
        ];

        // Atualiza o marcador existente ou cria um novo marcador.
        if (userLocationMarker) {
            userLocationMarker.setLatLng(latLng);
        } else {
            userLocationMarker = L.marker(
                latLng,
                { icon: userIcon }
            ).addTo(map);
        }

    } catch (error) {
        console.error(
            "Erro ao recuperar localização salva:",
            error
        );

        // Remove uma localização inválida do armazenamento.
        localStorage.removeItem("userLocation");
        userLocation = null;
    }
}


function createMarker(school) {
    /**
     * Cria o marcador circular utilizado para representar uma escola.
     *
     * Args:
     *     school: Objeto contendo os dados da escola, incluindo suas
     *         coordenadas geográficas.
     *
     * Returns:
     *     O marcador Leaflet criado para a escola.
     */

    const marker = L.circleMarker(
        [school.lat, school.lng],
        dotStyle
    );

    // Armazena os dados da escola no próprio marcador.
    marker.options.schoolData =
        school;

    // Encaminha o clique do marcador para o módulo de comparação.
    marker.on(
        "click",
        () => {
            mapComparison.handleSchoolMarkerClick(
                school
            );
        }
    );

    return marker;
}


function createPin(school) {
    /**
     * Cria um marcador em formato de pino para uma escola.
     *
     * Args:
     *     school: Objeto contendo os dados da escola e suas coordenadas.
     *
     * Returns:
     *     O marcador Leaflet criado para a escola.
     */

    const pin = L.marker(
        [school.lat, school.lng],
        { icon: redIcon }
    );

    // Exibe a ficha da escola quando o pino é selecionado.
    pin.on("click", () => mapSearch.showSchoolCard(school));

    return pin;
}


function addMarker(school) {
    /**
     * Cria e adiciona um marcador de escola ao mapa.
     *
     * Args:
     *     school: Objeto contendo os dados da escola.
     *
     * Returns:
     *     O marcador criado e adicionado à camada de escolas.
     */

    const marker = createMarker(school);

    // Associa o código da escola ao marcador para facilitar seu acesso.
    schoolMarkers.set(school.codigo, marker);

    // Adiciona o marcador à camada de escolas.
    schoolLayer.addLayer(marker);

    return marker;
}


// Atualiza os dados exibidos quando o mapa termina uma movimentação.
map.on('moveend', () => {

    // Durante a análise espacial, o movimento do mapa
    // deve atualizar os dados espaciais visíveis.
    if (mapSpatial.isSpatialAnalysisMode()) {
        mapSpatial.handleMapMoveEnd();
        return;
    }

    // Fora da análise espacial, recarrega as escolas
    // correspondentes aos filtros atuais.
    mapFilters.loadSchoolsOnMap();
});


// Inicializa o estado do mapa após o carregamento da página.
window.addEventListener("load", () => {

    // Limpa os filtros selecionáveis para iniciar em estado neutro.
    document
        .querySelectorAll(
            ".modality-filter, " +
            ".administrative-filter, " +
            ".private-category-filter, " +
            ".location-filter"
        )
        .forEach(filter => {
            filter.checked = false;
        });

    // Remove os marcadores existentes das camadas do mapa.
    schoolLayer.clearLayers();

    selectedLayer.clearLayers();

    schoolMarkers.clear();

    // Recupera e exibe a localização previamente salva.
    renderSavedUserLocation();

    selectedSchoolCode = null;


    // Recupera os elementos utilizados pelos filtros administrativos.
    const administrativeCountryFilter =
        document.getElementById(
            "administrativeCountryFilter"
        );

    const administrativeRegionFilter =
        document.getElementById(
            "administrativeRegionFilter"
        );

    const administrativeUfFilter =
        document.getElementById(
            "administrativeUfFilter"
        );

    const administrativeMunicipalityFilter =
        document.getElementById(
            "administrativeMunicipalityFilter"
        );


    // Reinicia o filtro de país.
    if (administrativeCountryFilter) {
        administrativeCountryFilter.value = "";
    }


    // Reinicia e desabilita o filtro de região.
    if (administrativeRegionFilter) {
        administrativeRegionFilter.innerHTML = `
            <option value="" selected disabled>
                Selecione...
            </option>
        `;

        administrativeRegionFilter.value = "";
        administrativeRegionFilter.disabled = true;
    }


    // Reinicia e desabilita o filtro de UF.
    if (administrativeUfFilter) {
        administrativeUfFilter.innerHTML = `
            <option value="" selected disabled>
                Selecione...
            </option>
        `;

        administrativeUfFilter.value = "";
        administrativeUfFilter.disabled = true;
    }


    // Reinicia e desabilita o filtro de município.
    if (administrativeMunicipalityFilter) {
        administrativeMunicipalityFilter.innerHTML = `
            <option value="" selected disabled>
                Selecione...
            </option>
        `;

        administrativeMunicipalityFilter.value = "";
        administrativeMunicipalityFilter.disabled = true;
    }


    // Garante que os cartões inicialmente estejam ocultos.
    mapSearch.hideSchoolCard();


    // Carrega as opções iniciais de divisão administrativa.
    mapAdministrative.loadAdministrativeCountries();

    // Atualiza o estado do botão de confirmação da análise administrativa.
    mapAdministrative.updateAdministrativeConfirmButton();


    // Restaura o estado anterior da busca por escola, quando aplicável.
    mapSearch.restoreSchoolFromSheet();

    // Restaura a divisão administrativa utilizada anteriormente.
    mapAdministrative.restoreAdministrativeDivisionFromSheet();
});


// Configura o botão utilizado para fechar o cartão de divisão administrativa.
document
    .getElementById(
        "closeAdministrativeDivisionCard"
    )
    .addEventListener(
        "click",
        mapAdministrative.hideAdministrativeDivisionCard
    );


// Configura o botão utilizado para fechar o cartão da escola.
document
    .getElementById("closeSchoolCard")
    .addEventListener(
        "click",
        () => {

            mapSearch.hideSchoolCard();

            // No modo de comparação, o fechamento do cartão
            // também remove a escola candidata selecionada.
            if (
                mapComparison.isComparisonMapMode()
            ) {
                mapComparison.clearComparisonCandidate();

                return;
            }

            // Fora do modo de comparação, limpa a escola selecionada.
            selectedLayer.clearLayers();

            selectedSchoolCode = null;
        }
    );


// Botão utilizado para solicitar a localização do usuário.
const locateButton =
    document.getElementById("locateButton");

locateButton.addEventListener("click", () => {

    // Solicita a localização atual ao navegador e centraliza o mapa.
    map.locate({
        setView: true,
        maxZoom: 16
    });
});


// Processa o resultado da geolocalização do navegador.
map.on("locationfound", function (e) {

    // Armazena as coordenadas encontradas.
    userLocation = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
    };

    // Persiste a localização para uso posterior.
    localStorage.setItem(
        "userLocation",
        JSON.stringify(userLocation)
    );

    // Atualiza o marcador exibido no mapa.
    renderSavedUserLocation();
});


// Trata erros ocorridos durante a tentativa de obter a localização.
map.on("locationerror", function (e) {
    console.error(
        "Não foi possível obter a localização:",
        e.message
    );
});