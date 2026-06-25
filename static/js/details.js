let dashboardLoaded = false;

function switchTab(tabName) {
    document.getElementById('contentSheet').style.display = 'none';
    document.getElementById('contentEvolution').style.display = 'none';
    
    document.getElementById('btnSheet').classList.remove('active');
    document.getElementById('btnEvolution').classList.remove('active');

    if (tabName === 'sheet') {
        document.getElementById('contentSheet').style.display = 'block';
        document.getElementById('btnSheet').classList.add('active');
    } else if (tabName === 'evolution') {
        document.getElementById('contentEvolution').style.display = 'block';
        document.getElementById('btnEvolution').classList.add('active');
        
        if (!dashboardLoaded) {
            loadMetabaseDashboard();
        }
    }
}

function loadMetabaseDashboard() {
    const loader = document.getElementById('evolutionLoader');
    const iframe = document.getElementById('metabasePlayer');

    fetch(`/api/painel/${SCHOOL_CODE}`)
        .then(response => response.json())
        .then(data => {
            if (data.sucesso && data.url) {
                console.log("URL DO METABASE:", data.url);
                
                loader.classList.add('d-none');
                iframe.classList.remove('d-none');
                iframe.src = data.url;
                
                dashboardLoaded = true;
            } else {
                loader.innerHTML = `<div class="alert alert-danger">Erro ao gerar token do painel: ${data.erro}</div>`;
            }
        })
        .catch(error => {
            console.error(error);
            loader.innerHTML = `<div class="alert alert-danger">Erro de conexão com o servidor de gráficos.</div>`;
        });
}

function loadSchoolSheet() {
    const dataDiv = document.getElementById('dataSheet');
    const nameText = document.getElementById('schoolName');
    const addressText = document.getElementById('schoolAddress');

    fetch(`/api/escola/${SCHOOL_CODE}/ficha`)
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
        })
        .then(data => {
            if (data.erro) {
                nameText.innerText = "Escola não encontrada";
                addressText.innerText = "Erro ao carregar os dados.";
                dataDiv.innerHTML = `<div class="alert alert-danger">${data.erro}</div>`;
                return;
            }

            nameText.innerText = data.nome;
            const iden = data.identificacao;
            const street = iden.endereco || 'Endereço não informado';
            const number = iden.numero || 'S/N';
            addressText.innerHTML = `<i class="bi bi-geo-alt-fill text-danger"></i> ${street}, ${number} - ${iden.municipio}, ${iden.uf}`;

            const createGroupCard = (title, rows, emptyMessage = null) => {
                if (rows.length === 0 && !emptyMessage) return ''; 
                
                let html = `
                    <div class="card shadow-sm border-0 rounded-3 mb-4">
                        <div class="card-body p-4">
                            <h5 class="text-primary mb-3">${title}</h5>
                `;
                
                if (rows.length === 0 && emptyMessage) {
                    html += `<p class="text-muted mb-0">${emptyMessage}</p>`;
                } else {
                    rows.forEach((row, index) => {
                        const borderClass = index === rows.length - 1 ? '' : 'border-bottom';
                        html += `
                            <div class="row py-2 ${borderClass} mx-0" style="border-color: #e9ecef !important;">
                                <div class="col-sm-5 fw-bold px-0">${row.label}</div>
                                <div class="col-sm-7 px-0">${row.value}</div>
                            </div>
                        `;
                    });
                }
                
                html += `</div></div>`; 
                return html;
            };

            const getBooleanIcon = (value) => value === 1 
                ? `<i class="bi bi-check-circle-fill text-success fs-5"></i>` 
                : `<i class="bi bi-x-circle-fill text-danger fs-5"></i>`;

            const sections = [];

            const idenRows = [
                { label: 'Dependência Administrativa:', value: iden.dependencia }
            ];
            
            if (iden.dependencia === 'Privada' && iden.categoria_privada) {
                idenRows.push({ label: 'Categoria:', value: iden.categoria_privada });
            }
            
            idenRows.push({ label: 'Localização:', value: iden.localizacao });
            idenRows.push({ label: 'Situação de Funcionamento:', value: iden.situacao });

            sections.push({ title: 'Identificação', rows: idenRows });

            const a = data.atendimentos;
            sections.push({
                title: 'Atendimentos e Atividades',
                rows: [
                    { label: 'Escola Indígena', value: getBooleanIcon(a.indigena) },
                    { label: 'Atendimento Educacional Especializado (AEE)', value: a.aee },
                    { label: 'Atividade Complementar', value: a.complementar },
                    { label: 'Alimentação escolar para os alunos - PNAE/FNDE', value: getBooleanIcon(a.alimentacao) },
                    { label: 'A escola desenvolve ações na área de educação ambiental?', value: getBooleanIcon(a.ambiental) }
                ]
            });

            const enrollmentRows = [];
            if (data.matriculas) {
                const m = data.matriculas;
                if (m.basica > 0) enrollmentRows.push({ label: 'Número Total de Matrículas', value: m.basica });
                if (m.creche > 0) enrollmentRows.push({ label: 'Número de Matrículas da Educação Infantil - Creche', value: m.creche });
                if (m.pre_escola > 0) enrollmentRows.push({ label: 'Número de Matrículas da Educação Infantil - Pré-Escola', value: m.pre_escola });
                if (m.fund_ai > 0) enrollmentRows.push({ label: 'Número de Matrículas do Ensino Fundamental - Anos Iniciais', value: m.fund_ai });
                if (m.fund_af > 0) enrollmentRows.push({ label: 'Número de Matrículas do Ensino Fundamental - Anos Finais', value: m.fund_af });
                if (m.medio > 0) enrollmentRows.push({ label: 'Número de Matrículas do Ensino Médio', value: m.medio });
                if (m.profissional > 0) enrollmentRows.push({ label: 'Número de Matrículas da Educação Profissional', value: m.profissional });
                
                if (m.eja_fund > 0 || m.eja_med > 0) {
                    const totalEja = (m.eja_fund || 0) + (m.eja_med || 0);
                    enrollmentRows.push({ label: 'Número de Matrículas da Educação de Jovens e Adultos (EJA)', value: totalEja });
                }
                
                if (m.especial > 0) enrollmentRows.push({ label: 'Número de Matrículas da Educação Especial', value: m.especial });
            }
            sections.push({ 
                title: 'Matrículas', 
                rows: enrollmentRows, 
                emptyMessage: 'Nenhum registro de matrícula encontrado.' 
            });

            const inf = data.infraestrutura;
            sections.push({
                title: 'Infraestrutura',
                rows: [
                    { label: 'Abastecimento de água - Rede pública', value: getBooleanIcon(inf.agua) },
                    { label: 'Abastecimento de energia elétrica - Rede pública', value: getBooleanIcon(inf.energia) },
                    { label: 'Esgoto sanitário - Rede pública', value: getBooleanIcon(inf.esgoto) },
                    { label: 'Destinação do lixo - Serviço de coleta', value: getBooleanIcon(inf.lixo) }
                ]
            });

            const dep = data.dependencias;
            sections.push({
                title: 'Dependências',
                rows: [
                    { label: 'Área de horta, plantio e/ou produção agricola', value: getBooleanIcon(dep.plantio) },
                    { label: 'Área de vegetação ou gramado', value: getBooleanIcon(dep.verde) },
                    { label: 'Auditório', value: getBooleanIcon(dep.auditorio) },
                    { label: 'Biblioteca', value: getBooleanIcon(dep.biblioteca) },
                    { label: 'Laboratório de ciências', value: getBooleanIcon(dep.lab_ciencias) },
                    { label: 'Laboratório de informática', value: getBooleanIcon(dep.lab_informatica) },
                    { label: 'Quadra de esportes coberta', value: getBooleanIcon(dep.quadra_coberta) },
                    { label: 'Quadra de esportes descoberta', value: getBooleanIcon(dep.quadra_descoberta) },
                    { label: 'Sala/ateliê de artes', value: getBooleanIcon(dep.artes) },
                    { label: 'Sala de música/coral', value: getBooleanIcon(dep.musica) },
                    { label: 'Sala/estúdio de dança', value: getBooleanIcon(dep.danca) },
                    { label: 'Sala multiuso (música, dança e artes)', value: getBooleanIcon(dep.multiuso) },
                    { label: 'Estúdio de gravação e edição', value: getBooleanIcon(dep.gravacao) },
                    { label: 'Sala de professores', value: getBooleanIcon(dep.professores) },
                    { label: 'Sala de Recursos Multifuncionais para Atendimento Educacional Especializado (AEE)', value: getBooleanIcon(dep.aee) },
                    { label: 'Refeitório', value: getBooleanIcon(dep.refeitorio) },
                    { label: 'Número de salas de aula utilizadas na escola (dentro e fora do prédio)', value: dep.salas_utilizadas }
                ]
            });

            const ac = data.acessibilidade;
            sections.push({
                title: 'Recursos de Acessibilidade',
                rows: [
                    { label: 'Banheiro acessível, adequado ao uso de pessoas com deficiência ou mobilidade reduzida', value: getBooleanIcon(ac.banheiro_pne) },
                    { label: 'Corrimão e guarda corpos', value: getBooleanIcon(ac.corrimao) },
                    { label: 'Elevador', value: getBooleanIcon(ac.elevador) },
                    { label: 'Pisos táteis', value: getBooleanIcon(ac.pisos_tateis) },
                    { label: 'Portas com vão livre de, no mínimo, 80 cm', value: getBooleanIcon(ac.vao_livre) },
                    { label: 'Rampas', value: getBooleanIcon(ac.rampas) },
                    { label: 'Sinalização sonora', value: getBooleanIcon(ac.sinal_sonoro) },
                    { label: 'Sinalização tátil (piso/paredes)', value: getBooleanIcon(ac.sinal_tatil) },
                    { label: 'Sinalização visual (piso/paredes)', value: getBooleanIcon(ac.sinal_visual) }
                ]
            });

            const com = data.comunidade;
            const spaceMap = { 0: 'Não', 1: 'Sim', 9: 'Não informado' };
            const proposalMap = { 
                0: 'Não', 
                1: 'Sim', 
                2: 'A escola não possui projeto político pedagógico/proposta pedagógica', 
                9: 'Não informado' 
            };
            sections.push({
                title: 'Relação escola-comunidade',
                rows: [
                    { label: 'A escola compartilha espaços para atividades de integração escola-comunidade', value: spaceMap[com.espaco_atividade] || 'Não informado' },
                    { label: 'A escola usa espaços e equipamentos do entorno escolar para atividades regulares com os alunos', value: spaceMap[com.espaco_equipamento] || 'Não informado' },
                    { label: 'Órgãos colegiados em funcionamento na escola - Associação de Pais', value: getBooleanIcon(com.orgao_pais) },
                    { label: 'Órgãos colegiados em funcionamento na escola - Associação de Pais e Mestres', value: getBooleanIcon(com.orgao_pais_mestres) },
                    { label: 'Órgãos colegiados em funcionamento na escola - Conselho Escolar', value: getBooleanIcon(com.orgao_conselho) },
                    { label: 'Órgãos colegiados em funcionamento na escola - Grêmio Estudantil', value: getBooleanIcon(com.orgao_gremio) },
                    { label: 'O projeto político pedagógico ou a proposta pedagógica da escola foi atualizado nos últimos 12 meses até a data de referência', value: proposalMap[com.proposta_pedagogica] || 'Não informado' }
                ]
            });

            const tec = data.tecnologia;
            const networkMap = { 
                0: 'Não há rede local interligando computadores', 
                1: 'A cabo', 
                2: 'Wireless', 
                3: 'A cabo e Wireless', 
                9: 'Não informado' 
            };
            sections.push({
                title: 'Internet, Computadores e Equipamentos Multimídia',
                rows: [
                    { label: 'Acesso à Internet', value: getBooleanIcon(tec.internet) },
                    { label: 'Internet Banda Larga', value: tec.banda_larga === null ? 'Não aplicável para escolas sem acesso à internet' : (tec.banda_larga === 1 ? 'Sim' : 'Não') },
                    { label: 'Rede local de interligação de computadores', value: networkMap[tec.rede_local] || 'Não informado' },
                    { label: 'Acesso à Internet - Para uso dos alunos', value: getBooleanIcon(tec.internet_alunos) },
                    { label: 'Acesso à Internet - Para uso administrativo', value: getBooleanIcon(tec.internet_admin) },
                    { label: 'Acesso à Internet - Para uso nos processos de ensino e aprendizagem', value: getBooleanIcon(tec.internet_aprendizagem) },
                    { label: 'Acesso à Internet - Para uso da comunidade', value: getBooleanIcon(tec.internet_comunidade) },
                    { label: 'Quantidade de computadores em uso pelos alunos - Computador de mesa (desktop)', value: tec.desktop_aluno },
                    { label: 'Quantidade de computadores em uso pelos alunos - Computador portátil', value: tec.portatil_aluno },
                    { label: 'Quantidade de computadores em uso pelos alunos - Tablet', value: tec.tablet_aluno },
                    { label: 'Quantidade de Aparelhos de som', value: tec.equip_som },
                    { label: 'Quantidade de Aparelhos de televisão', value: tec.equip_tv },
                    { label: 'Quantidade de Lousas digitais', value: tec.lousa_digital },
                    { label: 'Quantidade de Projetores Multimídia (Datashow)', value: tec.equip_multimidia }
                ]
            });

            const mat = data.materiais;
            sections.push({
                title: 'Instrumentos e materiais socioculturais e/ou pedagógicos',
                rows: [
                    { label: 'Acervo multimídia', value: getBooleanIcon(mat.multimidia) },
                    { label: 'Brinquedos para Educação Infantil', value: getBooleanIcon(mat.infantil) },
                    { label: 'Conjunto de materiais científicos', value: getBooleanIcon(mat.cientifico) },
                    { label: 'Equipamento para amplificação e difusão de som/áudio', value: getBooleanIcon(mat.difusao) },
                    { label: 'Instrumentos musicais para conjunto, banda/fanfarra e/ou aulas de música', value: getBooleanIcon(mat.musical) },
                    { label: 'Jogos Educativos', value: getBooleanIcon(mat.jogos) },
                    { label: 'Materiais para atividades culturais e artísticas', value: getBooleanIcon(mat.artisticas) },
                    { label: 'Materiais para Educação Profissional', value: getBooleanIcon(mat.profissional) },
                    { label: 'Instrumentos e materiais socioculturais e/ou pedagógicos - Indígena', value: getBooleanIcon(mat.indigena) },
                    { label: 'Materiais pedagógicos para a educação das relações étnico-raciais', value: getBooleanIcon(mat.etnico) },
                    { label: 'Materiais pedagógicos para a educação do campo', value: getBooleanIcon(mat.campo) },
                    { label: 'Materiais pedagógicos para a educação bilíngue de surdos', value: getBooleanIcon(mat.bil_surdos) },
                    { label: 'Equipamentos e instrumentos para atividades em área de horta, plantio e/ou produção agrícola', value: getBooleanIcon(mat.agricola) },
                    { label: 'Materiais pedagógicos para a educação escolar quilombola', value: getBooleanIcon(mat.quilombola) },
                    { label: 'Materiais pedagógicos para a educação especial', value: getBooleanIcon(mat.edu_esp) }
                ]
            });

            const teacherRows = [];
            if (data.docentes) {
                const d = data.docentes;
                if (d.basica > 0) teacherRows.push({ label: 'Número de total de Docentes da Educação Básica', value: d.basica });
                if (d.creche > 0) teacherRows.push({ label: 'Número de Docentes da Educação Infantil - Creche', value: d.creche });
                if (d.pre_escola > 0) teacherRows.push({ label: 'Número de Docentes da Educação Infantil - Pré-Escola', value: d.pre_escola });
                if (d.fund_ai > 0) teacherRows.push({ label: 'Número de Docentes do Ensino Fundamental - Anos Iniciais', value: d.fund_ai });
                if (d.fund_af > 0) teacherRows.push({ label: 'Número de Docentes do Ensino Fundamental - Anos Finais', value: d.fund_af });
                if (d.medio > 0) teacherRows.push({ label: 'Número de Docentes do Ensino Médio', value: d.medio });
                if (d.profissional > 0) teacherRows.push({ label: 'Número de Docentes da Educação Profissional', value: d.profissional });
                if (d.eja > 0) teacherRows.push({ label: 'Número de Docentes da Educação de Jovens e Adultos (EJA)', value: d.eja });
            }
            sections.push({ 
                title: 'Professores/Docentes', 
                rows: teacherRows, 
                emptyMessage: 'Nenhum registro de docente encontrado.' 
            });

            if (data.profissionais) {
                const p = data.profissionais;
                sections.push({
                    title: 'Demais profissionais/educadores',
                    rows: [
                        { label: 'Auxiliares de secretaria ou auxiliares administrativos, atendentes', value: p.administrativos },
                        { label: 'Auxiliar de serviços gerais, porteiro(a), zelador(a), faxineiro(a), jardineiro(a)', value: p.servicos_gerais },
                        { label: 'Bibliotecário(a), auxiliar de biblioteca ou monitor(a) da sala de leitura', value: p.bibliotecario },
                        { label: 'Bombeiro(a) brigadista, profissionais de assistência à saúde (urgência e emergência), Enfermeiro(a), Técnico(a) de enfermagem e socorrista', value: p.saude },
                        { label: 'Coordenador(a) de turno/disciplina', value: p.coordenador },
                        { label: 'Fonoaudiólogo(a)', value: p.fonoaudiologo },
                        { label: 'Nutricionista', value: p.nutricionista },
                        { label: 'Psicólogo(a) Escolar', value: p.psicologo },
                        { label: 'Profissionais de preparação e segurança alimentar, cozinheiro(a), merendeiro(a) e auxiliar de cozinha', value: p.alimentacao },
                        { label: 'Profissionais de apoio e supervisão pedagógica: pedagogo(a), coordenador(a) pedagógico(a), orientador(a) educacional, supervisor(a) escolar e coordenador(a) de área de ensino', value: p.pedagogia },
                        { label: 'Secretário(a) escolar', value: p.secretario },
                        { label: 'Segurança, guarda ou segurança patrimonial', value: p.seguranca },
                        { label: 'Técnicos(as), monitores(as), supervisores(as) ou auxiliares de laboratório(s), de apoio a tecnologias educacionais ou em multimeios/multimídias eletrônico/digitais', value: p.monitores },
                        { label: 'Vice-diretor(a) ou diretor(a) adjunto(a), profissionais responsáveis pela gestão administrativa e/ou financeira', value: p.gestao },
                        { label: 'Orientador(a) comunitário(a) ou assistente social', value: p.assist_social },
                        { label: 'Tradutor e Intérprete de Libras para atendimento em outros ambientes da escola que não seja sala de aula', value: p.trad_libras },
                        { label: 'Agrônomos(as), horticultores(as), técnicos ou monitores(as) responsáveis pela gestão da área de horta, plantio e/ou produção agrícola', value: p.agricola },
                        { label: 'Revisor de texto Braille, assistente vidente (assistente de revisão do texto em Braille)', value: p.revisor_braille }
                    ]
                });
            }

            let finalHtml = '';
            sections.forEach(section => {
                finalHtml += createGroupCard(section.title, section.rows, section.emptyMessage);
            });

            dataDiv.classList.remove('text-center', 'py-5');
            dataDiv.innerHTML = finalHtml;
        })
        .catch(error => {
            console.error(error);
            dataDiv.innerHTML = `<div class="alert alert-danger">Erro de conexão ao carregar a ficha técnica.</div>`;
        });
}

loadSchoolSheet();