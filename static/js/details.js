function alternarAba(nomeAba) {
    document.getElementById('conteudo-ficha').style.display = 'none';
    document.getElementById('conteudo-evolucao').style.display = 'none';
    
    document.getElementById('btn-ficha').classList.remove('active');
    document.getElementById('btn-evolucao').classList.remove('active');

    if (nomeAba === 'ficha') {
        document.getElementById('conteudo-ficha').style.display = 'block';
        document.getElementById('btn-ficha').classList.add('active');
    } else if (nomeAba === 'evolucao') {
        document.getElementById('conteudo-evolucao').style.display = 'block';
        document.getElementById('btn-evolucao').classList.add('active');
    }
}

function carregarFichaEscola() {
    const divDados = document.getElementById('dados-ficha');
    const txtNome = document.getElementById('nome-escola');
    const txtEndereco = document.getElementById('endereco-escola');

    fetch(`/api/escola/${ESCOLA_CODIGO}/ficha`)
        .then(resposta => {
            if (!resposta.ok) throw new Error("Erro na rede");
            return resposta.json();
        })
        .then(dados => {
            if (dados.erro) {
                txtNome.innerText = "Escola não encontrada";
                txtEndereco.innerText = "Erro ao carregar os dados.";
                divDados.innerHTML = `<div class="alert alert-danger">${dados.erro}</div>`;
                return;
            }

            txtNome.innerText = dados.nome;
            const iden = dados.identificacao;
            const logradouro = iden.endereco || 'Endereço não informado';
            const numero = iden.numero || 'S/N';
            txtEndereco.innerHTML = `<i class="bi bi-geo-alt-fill text-danger"></i> ${logradouro}, ${numero} - ${iden.municipio}, ${iden.uf}`;

            const criarCardGrupo = (titulo, linhas) => {
                if (linhas.length === 0) return ''; 
                
                let html = `
                    <div class="card shadow-sm border-0 rounded-3 mb-4">
                        <div class="card-body p-4">
                            <h5 class="text-primary mb-3">${titulo}</h5>
                `;
                
                linhas.forEach((linha, index) => {
                    const borda = index === linhas.length - 1 ? '' : 'border-bottom';
                    
                    html += `
                        <div class="row py-2 ${borda} mx-0" style="border-color: #e9ecef !important;">
                            <div class="col-sm-5 fw-bold px-0">${linha.rotulo}</div>
                            <div class="col-sm-7 px-0">${linha.valor}</div>
                        </div>
                    `;
                });
                
                html += `</div></div>`; 
                return html;
            };

            const linhasIdentificacao = [
                { rotulo: 'Dependência Administrativa:', valor: iden.dependencia }
            ];
            
            if (iden.dependencia === 'Privada' && iden.categoria_privada) {
                linhasIdentificacao.push({ rotulo: 'Categoria:', valor: iden.categoria_privada });
            }
            
            linhasIdentificacao.push({ rotulo: 'Localização:', valor: iden.localizacao });
            linhasIdentificacao.push({ rotulo: 'Situação de Funcionamento:', valor: iden.situacao });

            const htmlIdentificacao = criarCardGrupo('Identificação', linhasIdentificacao);

            let htmlMatriculas = '';
            
            if (dados.matriculas) {
                const m = dados.matriculas;
                const linhasMatriculas = []; 

                if (m.basica > 0) linhasMatriculas.push({ rotulo: 'Número Total de Matrículas', valor: m.basica });
                if (m.creche > 0) linhasMatriculas.push({ rotulo: 'Número de Matrículas da Educação Infantil - Creche', valor: m.creche });
                if (m.pre_escola > 0) linhasMatriculas.push({ rotulo: 'Número de Matrículas da Educação Infantil - Pré-Escola', valor: m.pre_escola });
                if (m.fund_ai > 0) linhasMatriculas.push({ rotulo: 'Número de Matrículas do Ensino Fundamental - Anos Iniciais', valor: m.fund_ai });
                if (m.fund_af > 0) linhasMatriculas.push({ rotulo: 'Número de Matrículas do Ensino Fundamental - Anos Finais', valor: m.fund_af });
                if (m.medio > 0) linhasMatriculas.push({ rotulo: 'Número de Matrículas do Ensino Médio', valor: m.medio });
                if (m.profissional > 0) linhasMatriculas.push({ rotulo: 'Número de Matrículas da Educação Profissional', valor: m.profissional });
                
                if (m.eja_fund > 0 || m.eja_med > 0) {
                    const totalEja = (m.eja_fund || 0) + (m.eja_med || 0);
                    linhasMatriculas.push({ rotulo: 'Número de Matrículas da Educação de Jovens e Adultos (EJA)', valor: totalEja });
                }
                
                if (m.especial > 0) linhasMatriculas.push({ rotulo: 'Número de Matrículas da Educação Especial', valor: m.especial });

                if (linhasMatriculas.length > 0) {
                    htmlMatriculas = criarCardGrupo('Matrículas', linhasMatriculas);
                } else {
                    htmlMatriculas = `
                        <div class="card shadow-sm border-0 rounded-3 mb-4">
                            <div class="card-body p-4">
                                <h5 class="text-primary mb-3">Matrículas</h5>
                                <p class="text-muted mb-0">Nenhum registro de matrícula encontrado.</p>
                            </div>
                        </div>
                    `;
                }
            }

            divDados.classList.remove('text-center', 'py-5');
            divDados.innerHTML = htmlIdentificacao + htmlMatriculas;
        })
        .catch(erro => {
            console.error(erro);
            divDados.innerHTML = `<div class="alert alert-danger">Erro de conexão ao carregar a ficha técnica.</div>`;
        });
}

carregarFichaEscola();