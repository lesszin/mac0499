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
    areaPainel.innerHTML = `<div class="text-center mt-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">A carregar painel...</p></div>`;

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