let idEscolaAtiva = null;

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

    const checkboxes = document.querySelectorAll('.filtro-modalidade:checked');
    const modalidades = Array.from(checkboxes).map(cb => cb.value).join(',');

    fetch(`/api/escolas-mapa?lat_min=${lat_min}&lat_max=${lat_max}&lng_min=${lng_min}&lng_max=${lng_max}&modalidades=${modalidades}`)
        .then(resposta => resposta.json())
        .then(escolas => {
            grupoMarcadores.clearLayers();

            escolas.forEach(escola => {
                const marcador = L.marker([escola.lat, escola.lng]);
                
                const nomeEscolaEscapado = escola.nome.replace(/'/g, "\\'");
                marcador.bindPopup(`
                    <strong>${escola.nome}</strong><br>
                    <button class="btn btn-sm btn-primary mt-2" onclick="carregarPainel(${escola.codigo}, '${nomeEscolaEscapado}')">
                        Ver Detalhes
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
                                
                                const nomeEscolaEscapado = escola.nome.replace(/'/g, "\\'");
                                const conteudoPopup = `
                                    <strong>${escola.nome}</strong><br>
                                    <button class="btn btn-sm btn-primary mt-2" onclick="carregarPainel(${escola.codigo}, '${nomeEscolaEscapado}')">
                                        Ver Detalhes
                                    </button>
                                `;

                                mapa.once('moveend', function() {
                                    L.popup()
                                        .setLatLng([escola.lat, escola.lng])
                                        .setContent(conteudoPopup)
                                        .openOn(mapa);
                                });
                            } else {
                                alert("A localização exata desta escola não foi informada pelo Censo.");
                            }
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


function carregarPainel(codigo, nomeDaEscola) {
    idEscolaAtiva = codigo; 
    
    document.getElementById('txt-nome-escola').innerText = nomeDaEscola;
    document.getElementById('painel-escola').style.display = 'block';
    
    document.getElementById('painel-escola').scrollIntoView({ behavior: 'smooth', block: 'start' });

    alternarAba('ficha');
}

function alternarAba(nomeAba) {
    document.getElementById('conteudo-ficha').style.display = 'none';
    document.getElementById('conteudo-evolucao').style.display = 'none';
    
    document.getElementById('btn-ficha').classList.remove('active');
    document.getElementById('btn-evolucao').classList.remove('active');

    if (nomeAba === 'ficha') {
        document.getElementById('conteudo-ficha').style.display = 'block';
        document.getElementById('btn-ficha').classList.add('active');
        carregarDadosFicha(idEscolaAtiva);
    } else if (nomeAba === 'evolucao') {
        document.getElementById('conteudo-evolucao').style.display = 'block';
        document.getElementById('btn-evolucao').classList.add('active');
        carregarDadosEvolucao(idEscolaAtiva);
    }
}

function carregarDadosFicha(codigo) {
    const divDados = document.getElementById('dados-ficha');
    const txtEndereco = document.getElementById('txt-endereco-escola');
    
    divDados.innerHTML = `<div class="spinner-border text-primary" role="status"></div><span class="ms-2">Buscando dados no banco...</span>`;
    txtEndereco.innerText = "Carregando localização...";
    
    fetch(`/api/escola/${codigo}/ficha`)
        .then(resposta => resposta.json())
        .then(dados => {
            if(dados.erro) {
                divDados.innerHTML = `<div class="text-danger">Erro: ${dados.erro}</div>`;
                txtEndereco.innerText = "Endereço indisponível";
                return;
            }
            
            const logradouro = dados.endereco || 'Endereço não informado';
            const numero = dados.numero || 'S/N';
            txtEndereco.innerText = `${logradouro}, ${numero} - ${dados.municipio}, ${dados.uf}`;

            divDados.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Dependência Administrativa:</strong> ${dados.dependencia}</p>
                        <p><strong>Localização:</strong> ${dados.localizacao}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Situação de Funcionamento:</strong> ${dados.situacao}</p>
                    </div>
                </div>
            `;
        })
        .catch(erro => {
            divDados.innerHTML = `<div class="text-danger">Erro de conexão com o servidor.</div>`;
            txtEndereco.innerText = "Erro ao carregar endereço";
        });
}

function carregarDadosEvolucao(codigo) {
    const divEvolucao = document.getElementById('dados-evolucao');
    divEvolucao.innerHTML = `<div class="spinner-border text-primary" role="status"></div><span class="ms-2">Gerando painel analítico...</span>`;

    fetch(`/api/painel/${codigo}`)
        .then(resposta => resposta.json())
        .then(dados => {
            if(dados.sucesso) {
                divEvolucao.innerHTML = `<iframe id="iframe-metabase" src="${dados.url}" allowtransparency></iframe>`;
            } else {
                divEvolucao.innerHTML = `<div class="text-danger">Erro ao gerar o painel: ${dados.erro}</div>`;
            }
        })
        .catch(erro => {
            divEvolucao.innerHTML = `<div class="text-danger">Erro de conexão com o servidor Metabase.</div>`;
        });
}

document.querySelectorAll('.filtro-modalidade').forEach(checkbox => {
    checkbox.addEventListener('change', carregarEscolasNoMapa);
});