const mapa = L.map('mapa-brasil').setView([-15.7801, -47.9292], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

const grupoMarcadores = L.markerClusterGroup({
    disableClusteringAtZoom: 14
});
mapa.addLayer(grupoMarcadores);

function carregarEscolasNoMapa() {
    const limites = mapa.getBounds();
    const lat_min = limites.getSouth();
    const lat_max = limites.getNorth();
    const lng_min = limites.getWest();
    const lng_max = limites.getEast();

    fetch(`/api/escolas-mapa?lat_min=${lat_min}&lat_max=${lat_max}&lng_min=${lng_min}&lng_max=${lng_max}`)
        .then(resposta => resposta.json())
        .then(escolas => {
            grupoMarcadores.clearLayers();

            escolas.forEach(escola => {
                const marcador = L.marker([escola.lat, escola.lng]);
                
                marcador.bindPopup(`
                    <strong>${escola.nome}</strong><br>
                    <button class="btn btn-sm btn-primary mt-2" onclick="carregarPainel(${escola.codigo})">
                        Ver Ficha Técnica
                    </button>
                `);
                
                grupoMarcadores.addLayer(marcador);
            });
        })
        .catch(erro => console.error("Erro ao carregar mapa:", erro));
}

mapa.on('moveend', carregarEscolasNoMapa);

carregarEscolasNoMapa();

const input = document.getElementById('escolaInput');
const caixaSugestoes = document.getElementById('caixaSugestoes');

input.addEventListener('input', function() {
    const texto = this.value;
    if(texto.length >= 3) {
        fetch(`/api/busca/${texto}`)
            .then(resposta => resposta.json())
            .then(escolas => {
                caixaSugestoes.innerHTML = ''; 
                if(escolas.length > 0) {
                    caixaSugestoes.classList.remove('d-none');
                    escolas.forEach(escola => {
                        const botao = document.createElement('button');
                        botao.className = "list-group-item list-group-item-action text-start py-2";
                        botao.innerHTML = `
                            <div class="fw-bold text-dark">${escola.nome}</div>
                            <small class="text-muted">${escola.cidade} - ${escola.estado}</small>
                        `;
                        botao.onclick = function() {
                            input.value = escola.nome; 
                            caixaSugestoes.classList.add('d-none'); 
                            
                            if(escola.lat && escola.lng) {
                                mapa.flyTo([escola.lat, escola.lng], 16);
                            }
                            
                            carregarPainel(escola.codigo); 
                        };
                        caixaSugestoes.appendChild(botao);
                    });
                } else {
                    caixaSugestoes.classList.add('d-none');
                }
            });
    } else {
        caixaSugestoes.classList.add('d-none');
    }
});

function carregarPainel(codigo) {
    const mensagemErro = document.getElementById('mensagem-erro');
    const areaPainel = document.getElementById('area-painel');
    
    mensagemErro.classList.add('d-none');
    areaPainel.innerHTML = `<div class="text-center mt-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Carregando painel analítico...</p></div>`;

    areaPainel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    fetch(`/api/painel/${codigo}`)
        .then(resposta => resposta.json())
        .then(dados => {
            if(dados.sucesso) {
                areaPainel.innerHTML = `<iframe id="iframe-metabase" src="${dados.url}" allowtransparency></iframe>`;
            } else {
                mensagemErro.textContent = "Erro ao gerar o painel: " + dados.erro;
                mensagemErro.classList.remove('d-none');
            }
        });
}