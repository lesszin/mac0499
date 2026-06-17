const mapa = L.map('mapa-brasil', { zoomControl: false }).setView([-23.55052, -46.633308], 13);
L.control.zoom({ position: 'bottomleft' }).addTo(mapa);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(mapa);

const grupoMarcadores = L.markerClusterGroup({
    disableClusteringAtZoom: 14
});
mapa.addLayer(grupoMarcadores);

const iconeVermelho = L.divIcon({
    className: 'marcador-sem-fundo',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="28" height="40" style="filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.3));"><path fill="#dc3545" d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/></svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40] 
});

function carregarEscolasNoMapa() {
    const limites = mapa.getBounds();
    const lat_min = limites.getSouth();
    const lat_max = limites.getNorth();
    const lng_min = limites.getWest();
    const lng_max = limites.getEast();

    const checkboxes = document.querySelectorAll('.filtro-modalidade:checked');
    const modalidades = Array.from(checkboxes).map(cb => cb.value).join(',');

    fetch(`/api/escolas-mapa?lat_min=${lat_min}&lat_max=${lat_max}&lng_min=${lng_min}&lng_max=${lng_max}&modalidades=${modalidades}`)
        .then(resposta => resposta.json())
        .then(escolas => {
            grupoMarcadores.clearLayers();

            escolas.forEach(escola => {
                const marcador = L.marker([escola.lat, escola.lng], { icon: iconeVermelho });
                
                const nomeEscolaEscapado = escola.nome.replace(/'/g, "\\'");
                marcador.bindPopup(`
                    <strong>${escola.nome}</strong><br>
                    <button class="btn btn-sm btn-primary mt-2" onclick="window.open('/escola/${escola.codigo}', '_blank')">
                        Ver Detalhes
                    </button>
                `);
                
                grupoMarcadores.addLayer(marcador);
            });
        })
        .catch(erro => console.error("Erro ao carregar mapa:", erro));
}

mapa.on('moveend', carregarEscolasNoMapa);

document.querySelectorAll('.filtro-modalidade').forEach(checkbox => {
    checkbox.addEventListener('change', carregarEscolasNoMapa);
});

carregarEscolasNoMapa();

const inputBusca = document.getElementById('escolaInput');
const caixaSugestoes = document.getElementById('sugestoesBusca');

inputBusca.addEventListener('input', function() {
    const termo = this.value.trim();
    
    if (termo.length < 3) {
        caixaSugestoes.innerHTML = '';
        caixaSugestoes.classList.add('d-none');
        return;
    }

    fetch(`/api/busca/${termo}`)
        .then(resposta => resposta.json())
        .then(escolas => {
            caixaSugestoes.innerHTML = '';
            
            if (escolas.length === 0) {
                caixaSugestoes.innerHTML = '<div class="list-group-item text-muted">Nenhuma escola encontrada</div>';
                caixaSugestoes.classList.remove('d-none');
                return;
            }

            escolas.forEach(escola => {
                const botao = document.createElement('button');
                botao.className = 'list-group-item list-group-item-action text-start py-2';
                botao.innerHTML = `
                    <div class="fw-bold text-dark">${escola.nome}</div>
                    <small class="text-muted">${escola.cidade} - ${escola.estado}</small>
                `;
                
                botao.onclick = () => {
                    caixaSugestoes.classList.add('d-none');
                    inputBusca.value = ''; 
                    
                    mapa.flyTo([escola.lat, escola.lng], 16);
                    
                    setTimeout(() => {
                        L.popup({ offset: [0, -32] })
                            .setLatLng([escola.lat, escola.lng])
                            .setContent(`
                                <strong>${escola.nome}</strong><br>
                                <button class="btn btn-sm btn-primary mt-2" onclick="window.open('/escola/${escola.codigo}', '_blank')">
                                    Ver Detalhes
                                </button>
                            `)
                            .openOn(mapa);
                    }, 500);
                };
                
                caixaSugestoes.appendChild(botao);
            });
            
            caixaSugestoes.classList.remove('d-none');
        })
        .catch(erro => console.error("Erro na busca:", erro));
});

document.addEventListener('click', (e) => {
    if (!inputBusca.contains(e.target) && !caixaSugestoes.contains(e.target)) {
        caixaSugestoes.classList.add('d-none');
    }
});