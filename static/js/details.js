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

function createGroupCard(title, rows, emptyMessage = null) {
    if (rows.length === 0 && !emptyMessage) {
        return "";
    }
    let html = `
        <div class="card shadow-sm border-0 rounded-3 mb-4">
            <div class="card-body p-4">
                <h5 class="text-primary mb-3">${title}</h5>
    `;
    if (rows.length === 0 && emptyMessage) {
        html += `<p class="text-muted mb-0">${emptyMessage}</p>`;
    } else {
        rows.forEach((row, index) => {
            const borderClass = index === rows.length - 1
                ? ""
                : "border-bottom";
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
}

function getBooleanIcon(value) {
    return value === 1
        ? `<i class="bi bi-check-circle-fill text-success fs-5"></i>`
        : `<i class="bi bi-x-circle-fill text-danger fs-5"></i>`;
}

function updateSchoolHeader(data) {
    const nameText = document.getElementById("schoolName");
    const addressText = document.getElementById("schoolAddress");
    const identification = data.identificacao;
    nameText.innerText = data.nome;
    const street =
        identification.endereco || "Endereço não informado";

    const number =
        identification.numero || "S/N";

    addressText.innerHTML =
        `<i class="bi bi-geo-alt-fill text-danger"></i>
        ${street}, ${number} - ${identification.municipio}, ${identification.uf}`;
}

function createIdentificationSection(identificacao) {
    const rows = [
        {
            label: "Dependência Administrativa:",
            value: identificacao.dependencia
        }
    ];
    if (
        identificacao.dependencia === "Privada" &&
        identificacao.categoria_privada
    ) {
        rows.push({
            label: "Categoria:",
            value: identificacao.categoria_privada
        });
    }
    rows.push(
        {
            label: "Localização:",
            value: identificacao.localizacao
        },
        {
            label: "Situação de Funcionamento no Último Censo:",
            value: identificacao.situacao
        }
    );
    rows.push(
        {
            label: "Ano do Último Censo Escolar:",
            value: identificacao.ano_censo
        }
    )
    return {
        title: "Identificação",
        rows
    };
}

function createAttendanceSection(atendimentos) {
    return {
        title: "Atendimentos e Atividades",
        rows: [
            {
                label: "Escola Indígena",
                value: getBooleanIcon(atendimentos.indigena)
            },
            {
                label: "Atendimento Educacional Especializado (AEE)",
                value: atendimentos.aee
            },
            {
                label: "Atividade Complementar",
                value: atendimentos.complementar
            },
            {
                label: "Alimentação escolar para os alunos - PNAE/FNDE",
                value: getBooleanIcon(atendimentos.alimentacao)
            },
            {
                label: "A escola desenvolve ações na área de educação ambiental?",
                value: getBooleanIcon(atendimentos.ambiental)
            }
        ]
    };
}

function createEnrollmentSection(matriculas) {
    const rows = [];
    if (matriculas) {
        if (matriculas.basica > 0) {
            rows.push({
                label: "Número Total de Matrículas",
                value: matriculas.basica
            });
        }
        if (matriculas.creche > 0) {
            rows.push({
                label: "Número de Matrículas da Educação Infantil - Creche",
                value: matriculas.creche
            });
        }
        if (matriculas.pre_escola > 0) {
            rows.push({
                label: "Número de Matrículas da Educação Infantil - Pré-Escola",
                value: matriculas.pre_escola
            });
        }
        if (matriculas.fund_ai > 0) {
            rows.push({
                label: "Número de Matrículas do Ensino Fundamental - Anos Iniciais",
                value: matriculas.fund_ai
            });
        }
        if (matriculas.fund_af > 0) {
            rows.push({
                label: "Número de Matrículas do Ensino Fundamental - Anos Finais",
                value: matriculas.fund_af
            });
        }
        if (matriculas.medio > 0) {
            rows.push({
                label: "Número de Matrículas do Ensino Médio",
                value: matriculas.medio
            });
        }
        if (matriculas.profissional > 0) {
            rows.push({
                label: "Número de Matrículas da Educação Profissional",
                value: matriculas.profissional
            });
        }
        if (matriculas.eja_fund > 0 || matriculas.eja_med > 0) {
            rows.push({
                label: "Número de Matrículas da Educação de Jovens e Adultos (EJA)",
                value: (matriculas.eja_fund || 0) + (matriculas.eja_med || 0)
            });
        }
        if (matriculas.especial > 0) {
            rows.push({
                label: "Número de Matrículas da Educação Especial",
                value: matriculas.especial
            });
        }
    }
    return {
        title: "Matrículas",
        rows,
        emptyMessage: "Nenhum registro de matrícula encontrado."
    };
}

function createInfrastructureSection(infraestrutura) {
    return {
        title: "Infraestrutura",
        rows: [
            {
                label: "Abastecimento de água - Rede pública",
                value: getBooleanIcon(infraestrutura.agua)
            },
            {
                label: "Abastecimento de energia elétrica - Rede pública",
                value: getBooleanIcon(infraestrutura.energia)
            },
            {
                label: "Esgoto sanitário - Rede pública",
                value: getBooleanIcon(infraestrutura.esgoto)
            },
            {
                label: "Destinação do lixo - Serviço de coleta",
                value: getBooleanIcon(infraestrutura.lixo)
            }
        ]
    };
}

function createDependenciesSection(dependencias) {
    return {
        title: "Dependências",
        rows: [
            {
                label: "Área de horta, plantio e/ou produção agricola",
                value: getBooleanIcon(dependencias.plantio)
            },
            {
                label: "Área de vegetação ou gramado",
                value: getBooleanIcon(dependencias.verde)
            },
            {
                label: "Auditório",
                value: getBooleanIcon(dependencias.auditorio)
            },
            {
                label: "Biblioteca",
                value: getBooleanIcon(dependencias.biblioteca)
            },
            {
                label: "Laboratório de ciências",
                value: getBooleanIcon(dependencias.lab_ciencias)
            },
            {
                label: "Laboratório de informática",
                value: getBooleanIcon(dependencias.lab_informatica)
            },
            {
                label: "Quadra de esportes coberta",
                value: getBooleanIcon(dependencias.quadra_coberta)
            },
            {
                label: "Quadra de esportes descoberta",
                value: getBooleanIcon(dependencias.quadra_descoberta)
            },
            {
                label: "Sala/ateliê de artes",
                value: getBooleanIcon(dependencias.artes)
            },
            {
                label: "Sala de música/coral",
                value: getBooleanIcon(dependencias.musica)
            },
            {
                label: "Sala/estúdio de dança",
                value: getBooleanIcon(dependencias.danca)
            },
            {
                label: "Sala multiuso (música, dança e artes)",
                value: getBooleanIcon(dependencias.multiuso)
            },
            {
                label: "Estúdio de gravação e edição",
                value: getBooleanIcon(dependencias.gravacao)
            },
            {
                label: "Sala de professores",
                value: getBooleanIcon(dependencias.professores)
            },
            {
                label: "Sala de Recursos Multifuncionais para Atendimento Educacional Especializado (AEE)",
                value: getBooleanIcon(dependencias.aee)
            },
            {
                label: "Refeitório",
                value: getBooleanIcon(dependencias.refeitorio)
            },
            {
                label: "Número de salas de aula utilizadas na escola (dentro e fora do prédio)",
                value: dependencias.salas_utilizadas
            }
        ]
    };
}

function createAccessibilitySection(acessibilidade) {
    return {
        title: "Recursos de Acessibilidade",
        rows: [
            {
                label: "Banheiro acessível, adequado ao uso de pessoas com deficiência ou mobilidade reduzida",
                value: getBooleanIcon(acessibilidade.banheiro_pne)
            },
            {
                label: "Corrimão e guarda corpos",
                value: getBooleanIcon(acessibilidade.corrimao)
            },
            {
                label: "Elevador",
                value: getBooleanIcon(acessibilidade.elevador)
            },
            {
                label: "Pisos táteis",
                value: getBooleanIcon(acessibilidade.pisos_tateis)
            },
            {
                label: "Portas com vão livre de, no mínimo, 80 cm",
                value: getBooleanIcon(acessibilidade.vao_livre)
            },
            {
                label: "Rampas",
                value: getBooleanIcon(acessibilidade.rampas)
            },
            {
                label: "Sinalização sonora",
                value: getBooleanIcon(acessibilidade.sinal_sonoro)
            },
            {
                label: "Sinalização tátil (piso/paredes)",
                value: getBooleanIcon(acessibilidade.sinal_tatil)
            },
            {
                label: "Sinalização visual (piso/paredes)",
                value: getBooleanIcon(acessibilidade.sinal_visual)
            }
        ]
    };
}

function createCommunitySection(comunidade) {
    const spaceMap = {
        0: "Não",
        1: "Sim",
        9: "Não informado"
    };
    const proposalMap = {
        0: "Não",
        1: "Sim",
        2: "A escola não possui projeto político pedagógico/proposta pedagógica",
        9: "Não informado"
    };
    return {
        title: "Relação escola-comunidade",
        rows: [
            {
                label: "A escola compartilha espaços para atividades de integração escola-comunidade",
                value: spaceMap[comunidade.espaco_atividade] || "Não informado"
            },
            {
                label: "A escola usa espaços e equipamentos do entorno escolar para atividades regulares com os alunos",
                value: spaceMap[comunidade.espaco_equipamento] || "Não informado"
            },
            {
                label: "Órgãos colegiados em funcionamento na escola - Associação de Pais",
                value: getBooleanIcon(comunidade.orgao_pais)
            },
            {
                label: "Órgãos colegiados em funcionamento na escola - Associação de Pais e Mestres",
                value: getBooleanIcon(comunidade.orgao_pais_mestres)
            },
            {
                label: "Órgãos colegiados em funcionamento na escola - Conselho Escolar",
                value: getBooleanIcon(comunidade.orgao_conselho)
            },
            {
                label: "Órgãos colegiados em funcionamento na escola - Grêmio Estudantil",
                value: getBooleanIcon(comunidade.orgao_gremio)
            },
            {
                label: "O projeto político pedagógico ou a proposta pedagógica da escola foi atualizado nos últimos 12 meses até a data de referência",
                value: proposalMap[comunidade.proposta_pedagogica] || "Não informado"
            }
        ]
    };
}

function createTechnologySection(tecnologia) {
    const networkMap = {
        0: "Não há rede local interligando computadores",
        1: "A cabo",
        2: "Wireless",
        3: "A cabo e Wireless",
        9: "Não informado"
    };
    return {
        title: "Internet, Computadores e Equipamentos Multimídia",
        rows: [
            {
                label: "Acesso à Internet",
                value: getBooleanIcon(tecnologia.internet)
            },
            {
                label: "Internet Banda Larga",
                value:
                    tecnologia.banda_larga === null
                        ? "Não aplicável para escolas sem acesso à internet"
                        : tecnologia.banda_larga === 1
                            ? "Sim"
                            : "Não"
            },
            {
                label: "Rede local de interligação de computadores",
                value: networkMap[tecnologia.rede_local] || "Não informado"
            },
            {
                label: "Acesso à Internet - Para uso dos alunos",
                value: getBooleanIcon(tecnologia.internet_alunos)
            },
            {
                label: "Acesso à Internet - Para uso administrativo",
                value: getBooleanIcon(tecnologia.internet_admin)
            },
            {
                label: "Acesso à Internet - Para uso nos processos de ensino e aprendizagem",
                value: getBooleanIcon(tecnologia.internet_aprendizagem)
            },
            {
                label: "Acesso à Internet - Para uso da comunidade",
                value: getBooleanIcon(tecnologia.internet_comunidade)
            },
            {
                label: "Quantidade de computadores em uso pelos alunos - Computador de mesa (desktop)",
                value: tecnologia.desktop_aluno
            },
            {
                label: "Quantidade de computadores em uso pelos alunos - Computador portátil",
                value: tecnologia.portatil_aluno
            },
            {
                label: "Quantidade de computadores em uso pelos alunos - Tablet",
                value: tecnologia.tablet_aluno
            },
            {
                label: "Quantidade de Aparelhos de som",
                value: tecnologia.equip_som
            },
            {
                label: "Quantidade de Aparelhos de televisão",
                value: tecnologia.equip_tv
            },
            {
                label: "Quantidade de Lousas digitais",
                value: tecnologia.lousa_digital
            },
            {
                label: "Quantidade de Projetores Multimídia (Datashow)",
                value: tecnologia.equip_multimidia
            }
        ]
    };
}

function createMaterialsSection(materiais) {
    return {
        title: "Instrumentos e materiais socioculturais e/ou pedagógicos",
        rows: [
            { 
                label: "Acervo multimídia", 
                value: getBooleanIcon(materiais.multimidia) 
            },
            { 
                label: "Brinquedos para Educação Infantil", 
                value: getBooleanIcon(materiais.infantil) 
            },
            { 
                label: "Conjunto de materiais científicos", 
                value: getBooleanIcon(materiais.cientifico) 
            },
            { 
                label: "Equipamento para amplificação e difusão de som/áudio", 
                value: getBooleanIcon(materiais.difusao) 
            },
            { 
                label: "Instrumentos musicais para conjunto, banda/fanfarra e/ou aulas de música", 
                value: getBooleanIcon(materiais.musical) 
            },
            { 
                label: "Jogos Educativos", 
                value: getBooleanIcon(materiais.jogos) 
            },
            { 
                label: "Materiais para atividades culturais e artísticas", 
                value: getBooleanIcon(materiais.artisticas) 
            },
            { 
                label: "Materiais para Educação Profissional", 
                value: getBooleanIcon(materiais.profissional) 
            },
            { 
                label: "Instrumentos e materiais socioculturais e/ou pedagógicos - Indígena", 
                value: getBooleanIcon(materiais.indigena) 
            },
            { 
                label: "Materiais pedagógicos para a educação das relações étnico-raciais", 
                value: getBooleanIcon(materiais.etnico) 
            },
            { 
                label: "Materiais pedagógicos para a educação do campo", 
                value: getBooleanIcon(materiais.campo) 
            },
            { 
                label: "Materiais pedagógicos para a educação bilíngue de surdos", 
                value: getBooleanIcon(materiais.bil_surdos) 
            },
            { 
                label: "Equipamentos e instrumentos para atividades em área de horta, plantio e/ou produção agrícola", 
                value: getBooleanIcon(materiais.agricola) 
            },
            { 
                label: "Materiais pedagógicos para a educação escolar quilombola", 
                value: getBooleanIcon(materiais.quilombola) 
            },
            { 
                label: "Materiais pedagógicos para a educação especial", 
                value: getBooleanIcon(materiais.edu_esp) 
            }
        ]
    };
}

function createTeachersSection(docentes) {
    const rows = [];
    if (docentes.basica > 0) {
        rows.push({
            label: "Número total de Docentes da Educação Básica",
            value: docentes.basica
        });
    }
    if (docentes.creche > 0) {
        rows.push({
            label: "Número de Docentes da Educação Infantil - Creche",
            value: docentes.creche
        });
    }
    if (docentes.pre_escola > 0) {
        rows.push({
            label: "Número de Docentes da Educação Infantil - Pré-Escola",
            value: docentes.pre_escola
        });
    }
    if (docentes.fund_ai > 0) {
        rows.push({
            label: "Número de Docentes do Ensino Fundamental - Anos Iniciais",
            value: docentes.fund_ai
        });
    }
    if (docentes.fund_af > 0) {
        rows.push({
            label: "Número de Docentes do Ensino Fundamental - Anos Finais",
            value: docentes.fund_af
        });
    }
    if (docentes.medio > 0) {
        rows.push({
            label: "Número de Docentes do Ensino Médio",
            value: docentes.medio
        });
    }
    if (docentes.profissional > 0) {
        rows.push({
            label: "Número de Docentes da Educação Profissional",
            value: docentes.profissional
        });
    }
    if (docentes.eja > 0) {
        rows.push({
            label: "Número de Docentes da Educação de Jovens e Adultos (EJA)",
            value: docentes.eja
        });
    }
    return {
        title: "Professores/Docentes",
        rows,
        emptyMessage: "Nenhum registro de docente encontrado."
    };
}

function createProfessionalsSection(profissionais) {
    return {
        title: "Demais profissionais/educadores",
        rows: [
            {
                label: "Auxiliares de secretaria ou auxiliares administrativos, atendentes",
                value: profissionais.administrativos
            },
            {
                label: "Auxiliar de serviços gerais, porteiro(a), zelador(a), faxineiro(a), jardineiro(a)",
                value: profissionais.servicos_gerais
            },
            {
                label: "Bibliotecário(a), auxiliar de biblioteca ou monitor(a) da sala de leitura",
                value: profissionais.bibliotecario
            },
            {
                label: "Bombeiro(a) brigadista, profissionais de assistência à saúde (urgência e emergência), Enfermeiro(a), Técnico(a) de enfermagem e socorrista",
                value: profissionais.saude
            },
            {
                label: "Coordenador(a) de turno/disciplina",
                value: profissionais.coordenador
            },
            {
                label: "Fonoaudiólogo(a)",
                value: profissionais.fonoaudiologo
            },
            {
                label: "Nutricionista",
                value: profissionais.nutricionista
            },
            {
                label: "Psicólogo(a) Escolar",
                value: profissionais.psicologo
            },
            {
                label: "Profissionais de preparação e segurança alimentar, cozinheiro(a), merendeiro(a) e auxiliar de cozinha",
                value: profissionais.alimentacao
            },
            {
                label: "Profissionais de apoio e supervisão pedagógica",
                value: profissionais.pedagogia
            },
            {
                label: "Secretário(a) escolar",
                value: profissionais.secretario
            },
            {
                label: "Segurança, guarda ou segurança patrimonial",
                value: profissionais.seguranca
            },
            {
                label: "Técnicos(as), monitores(as), supervisores(as) ou auxiliares de laboratório(s)",
                value: profissionais.monitores
            },
            {
                label: "Vice-diretor(a) ou diretor(a) adjunto(a)",
                value: profissionais.gestao
            },
            {
                label: "Orientador(a) comunitário(a) ou assistente social",
                value: profissionais.assist_social
            },
            {
                label: "Tradutor e Intérprete de Libras",
                value: profissionais.trad_libras
            },
            {
                label: "Agrônomos(as), horticultores(as) e técnicos agrícolas",
                value: profissionais.agricola
            },
            {
                label: "Revisor de texto Braille",
                value: profissionais.revisor_braille
            }
        ]
    };
}

function buildSections(data) {
    return [
        createIdentificationSection(data.identificacao),
        createAttendanceSection(data.atendimentos),
        createEnrollmentSection(data.matriculas),
        createInfrastructureSection(data.infraestrutura),
        createDependenciesSection(data.dependencias),
        createAccessibilitySection(data.acessibilidade),
        createCommunitySection(data.comunidade),
        createTechnologySection(data.tecnologia),
        createMaterialsSection(data.materiais),
        createTeachersSection(data.docentes),
        createProfessionalsSection(data.profissionais)
    ].filter(Boolean);
}

function renderSections(dataDiv, sections) {
    dataDiv.classList.remove("text-center", "py-5");
    dataDiv.innerHTML = sections
        .map(section =>
            createGroupCard(
                section.title,
                section.rows,
                section.emptyMessage
            )
        )
        .join("");
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
            updateSchoolHeader(data);
            const sections = buildSections(data);
            renderSections(dataDiv, sections);
        })
        .catch(error => {
            console.error(error);
            dataDiv.innerHTML = `<div class="alert alert-danger">Erro de conexão ao carregar a ficha técnica.</div>`;
        });
}

loadSchoolSheet();