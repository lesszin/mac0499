from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import jwt
import time
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import datetime

load_dotenv()

app = Flask(__name__)
CORS(app) 

METABASE_SITE_URL = "http://localhost:3000"
METABASE_SECRET_KEY = os.getenv("METABASE_SECRET_KEY")

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT", "5432")

engine = create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

def build_school_data(school_result, enrollment_result, teacher_result, class_result):
    dependency_map = {1: 'Federal', 2: 'Estadual', 3: 'Municipal', 4: 'Privada'}
    location_map = {1: 'Urbana', 2: 'Rural'}
    status_map = {1: 'Em Atividade', 2: 'Paralisada', 3: 'Extinta', 4: 'Escola extinta em anos anteriores'}
    private_category_map = {1: 'Particular', 2: 'Comunitária', 3: 'Confessional', 4: 'Filantrópica'}
    aee_map = {0: 'Não oferece', 1: 'Não exclusivamente', 2: 'Exclusivamente'}
    school_data = {
        'nome': school_result[0],
        'identificacao': {
            'endereco': school_result[1],
            'numero': school_result[2],
            'municipio': school_result[3],
            'uf': school_result[4],
            'dependencia': dependency_map.get(school_result[5], f'Código {school_result[5]}'),
            'localizacao': location_map.get(school_result[6], f'Código {school_result[6]}'),
            'situacao': status_map.get(school_result[7], f'Código {school_result[7]}'),
            'categoria_privada': private_category_map.get(school_result[8], None) if school_result[8] else None,
            'ano_censo': school_result[98]
        },
            'atendimentos': { 
            'indigena': int(school_result[9] or 0),
            'aee': aee_map.get(school_result[10], 'Não informado'),
            'complementar': aee_map.get(school_result[11], 'Não informado'),
            'alimentacao': int(school_result[12] or 0),
            'ambiental': int(school_result[13] or 0)
        },
        'infraestrutura': {
            'agua': int(school_result[14] or 0),
            'energia': int(school_result[15] or 0),
            'esgoto': int(school_result[16] or 0),
            'lixo': int(school_result[17] or 0)
        },
        'dependencias': {
            'plantio': int(school_result[18] or 0),
            'verde': int(school_result[19] or 0),
            'auditorio': int(school_result[20] or 0),
            'biblioteca': int(school_result[21] or 0),
            'lab_ciencias': int(school_result[22] or 0),
            'lab_informatica': int(school_result[23] or 0),
            'quadra_coberta': int(school_result[24] or 0),
            'quadra_descoberta': int(school_result[25] or 0),
            'artes': int(school_result[26] or 0),
            'musica': int(school_result[27] or 0),
            'danca': int(school_result[28] or 0),
            'multiuso': int(school_result[29] or 0),
            'gravacao': int(school_result[30] or 0),
            'professores': int(school_result[31] or 0),
            'aee': int(school_result[32] or 0),
            'refeitorio': int(school_result[33] or 0),
            'salas_utilizadas': int(school_result[34] or 0)
        },
        'acessibilidade': {
            'banheiro_pne': int(school_result[35] or 0),
            'corrimao': int(school_result[36] or 0),
            'elevador': int(school_result[37] or 0),
            'pisos_tateis': int(school_result[38] or 0),
            'vao_livre': int(school_result[39] or 0),
            'rampas': int(school_result[40] or 0),
            'sinal_sonoro': int(school_result[41] or 0),
            'sinal_tatil': int(school_result[42] or 0),
            'sinal_visual': int(school_result[43] or 0)
        },
            'comunidade': {
            'espaco_atividade': int(school_result[44] if school_result[44] is not None else 9),
            'espaco_equipamento': int(school_result[45] if school_result[45] is not None else 9),
            'orgao_pais': int(school_result[46] or 0),
            'orgao_pais_mestres': int(school_result[47] or 0),
            'orgao_conselho': int(school_result[48] or 0),
            'orgao_gremio': int(school_result[49] or 0),
            'proposta_pedagogica': int(school_result[50] if school_result[50] is not None else 9)
        },
        'tecnologia': {
            'internet': int(school_result[51] or 0),
            'banda_larga': int(school_result[52]) if school_result[52] is not None else None,
            'rede_local': int(school_result[53] if school_result[53] is not None else 9),
            'internet_alunos': int(school_result[54] or 0),
            'internet_admin': int(school_result[55] or 0),
            'internet_aprendizagem': int(school_result[56] or 0),
            'internet_comunidade': int(school_result[57] or 0),
            'desktop_aluno': int(school_result[58] or 0),
            'portatil_aluno': int(school_result[59] or 0),
            'tablet_aluno': int(school_result[60] or 0),
            'equip_som': int(school_result[61] or 0),
            'equip_tv': int(school_result[62] or 0),
            'lousa_digital': int(school_result[63] or 0),
            'equip_multimidia': int(school_result[64] or 0)
        },
        'materiais': {
            'multimidia': int(school_result[65] or 0),
            'infantil': int(school_result[66] or 0),
            'cientifico': int(school_result[67] or 0),
            'difusao': int(school_result[68] or 0),
            'musical': int(school_result[69] or 0),
            'jogos': int(school_result[70] or 0),
            'artisticas': int(school_result[71] or 0),
            'profissional': int(school_result[72] or 0),
            'indigena': int(school_result[73] or 0),
            'etnico': int(school_result[74] or 0),
            'campo': int(school_result[75] or 0),
            'bil_surdos': int(school_result[76] or 0),
            'agricola': int(school_result[77] or 0),
            'quilombola': int(school_result[78] or 0),
            'edu_esp': int(school_result[79] or 0)
        },
        'profissionais': {
            'administrativos': int(school_result[80] or 0),
            'servicos_gerais': int(school_result[81] or 0),
            'bibliotecario': int(school_result[82] or 0),
            'saude': int(school_result[83] or 0),
            'coordenador': int(school_result[84] or 0),
            'fonoaudiologo': int(school_result[85] or 0),
            'nutricionista': int(school_result[86] or 0),
            'psicologo': int(school_result[87] or 0),
            'alimentacao': int(school_result[88] or 0),
            'pedagogia': int(school_result[89] or 0),
            'secretario': int(school_result[90] or 0),
            'seguranca': int(school_result[91] or 0),
            'monitores': int(school_result[92] or 0),
            'gestao': int(school_result[93] or 0),
            'assist_social': int(school_result[94] or 0),
            'trad_libras': int(school_result[95] or 0),
            'agricola': int(school_result[96] or 0),
            'revisor_braille': int(school_result[97] or 0)
        },
        'docentes': {
            'basica': int(teacher_result[0] or 0),
            'creche': int(teacher_result[1] or 0),
            'pre_escola': int(teacher_result[2] or 0),
            'fund_ai': int(teacher_result[3] or 0),
            'fund_af': int(teacher_result[4] or 0),
            'medio': int(teacher_result[5] or 0),
            'profissional': int(teacher_result[6] or 0),
            'eja': int(teacher_result[7] or 0),
            'especial': int(teacher_result[16] or 0),
            'masculino': int(teacher_result[8] or 0),
            'feminino': int(teacher_result[9] or 0),
            'nao_declarado': int(teacher_result[10] or 0),
            'branca': int(teacher_result[11] or 0),
            'preta': int(teacher_result[12] or 0),
            'parda': int(teacher_result[13] or 0),
            'amarela': int(teacher_result[14] or 0),
            'indigena': int(teacher_result[15] or 0)
        } if teacher_result else None,
        'matriculas': None
    }
        
    if enrollment_result:
        school_data['matriculas'] = {
            'basica': int(enrollment_result[0] or 0),
            'creche': int(enrollment_result[1] or 0),
            'pre_escola': int(enrollment_result[2] or 0),
            'fund_ai': int(enrollment_result[3] or 0),
            'fund_af': int(enrollment_result[4] or 0),
            'medio': int(enrollment_result[5] or 0),
            'profissional': int(enrollment_result[6] or 0),
            'eja_fund': int(enrollment_result[7] or 0),
            'eja_med': int(enrollment_result[8] or 0),
            'especial': int(enrollment_result[9] or 0),
            'masculino': int(enrollment_result[10] or 0),
            'feminino': int(enrollment_result[11] or 0),
            'nao_declarado': int(enrollment_result[12] or 0),
            'branca': int(enrollment_result[13] or 0),
            'preta': int(enrollment_result[14] or 0),
            'parda': int(enrollment_result[15] or 0),
            'amarela': int(enrollment_result[16] or 0),
            'indigena': int(enrollment_result[17] or 0)
        }
    if class_result:
        school_data['turmas'] = {
            'creche': int(class_result[0] or 0),
            'pre_escola': int(class_result[1] or 0),
            'fund_ai': int(class_result[2] or 0),
            'fund_af': int(class_result[3] or 0),
            'medio': int(class_result[4] or 0),
            'profissional': int(class_result[5] or 0),
            'eja': int(class_result[6] or 0),
            'especial': int(class_result[7] or 0)
        }
    return school_data


def get_school_technical_sheet(school_code):
    with engine.connect() as connection:
        school_query = text("""
            SELECT 
                "NO_ENTIDADE", "DS_ENDERECO", "NU_ENDERECO", "NO_MUNICIPIO", "SG_UF", 
                "TP_DEPENDENCIA", "TP_LOCALIZACAO", "TP_SITUACAO_FUNCIONAMENTO",
                "TP_CATEGORIA_ESCOLA_PRIVADA",
                "IN_EDUCACAO_INDIGENA", "TP_AEE", "TP_ATIVIDADE_COMPLEMENTAR",
                "IN_ALIMENTACAO", "IN_EDUC_AMBIENTAL",
                "IN_AGUA_REDE_PUBLICA", "IN_ENERGIA_REDE_PUBLICA", 
                "IN_ESGOTO_REDE_PUBLICA", "IN_LIXO_SERVICO_COLETA",
                "IN_AREA_PLANTIO", "IN_AREA_VERDE", "IN_AUDITORIO", "IN_BIBLIOTECA",
                "IN_LABORATORIO_CIENCIAS", "IN_LABORATORIO_INFORMATICA",
                "IN_QUADRA_ESPORTES_COBERTA", "IN_QUADRA_ESPORTES_DESCOBERTA",
                "IN_SALA_ATELIE_ARTES", "IN_SALA_MUSICA_CORAL", "IN_SALA_ESTUDIO_DANCA",
                "IN_SALA_MULTIUSO", "IN_SALA_ESTUDIO_GRAVACAO", "IN_SALA_PROFESSOR",
                "IN_SALA_ATENDIMENTO_ESPECIAL", "IN_REFEITORIO", "QT_SALAS_UTILIZADAS",
                "IN_BANHEIRO_PNE", "IN_ACESSIBILIDADE_CORRIMAO", "IN_ACESSIBILIDADE_ELEVADOR",
                "IN_ACESSIBILIDADE_PISOS_TATEIS", "IN_ACESSIBILIDADE_VAO_LIVRE", "IN_ACESSIBILIDADE_RAMPAS",
                "IN_ACESSIBILIDADE_SINAL_SONORO", "IN_ACESSIBILIDADE_SINAL_TATIL", "IN_ACESSIBILIDADE_SINAL_VISUAL",
                "IN_ESPACO_ATIVIDADE", "IN_ESPACO_EQUIPAMENTO", "IN_ORGAO_ASS_PAIS", 
                "IN_ORGAO_ASS_PAIS_MESTRES", "IN_ORGAO_CONSELHO_ESCOLAR", 
                "IN_ORGAO_GREMIO_ESTUDANTIL", "TP_PROPOSTA_PEDAGOGICA",
                "IN_INTERNET", "IN_BANDA_LARGA", "TP_REDE_LOCAL", "IN_INTERNET_ALUNOS",
                "IN_INTERNET_ADMINISTRATIVO", "IN_INTERNET_APRENDIZAGEM", "IN_INTERNET_COMUNIDADE",
                "QT_DESKTOP_ALUNO", "QT_COMP_PORTATIL_ALUNO", "QT_TABLET_ALUNO",
                "QT_EQUIP_SOM", "QT_EQUIP_TV", "QT_EQUIP_LOUSA_DIGITAL", "QT_EQUIP_MULTIMIDIA",
                "IN_MATERIAL_PED_MULTIMIDIA", "IN_MATERIAL_PED_INFANTIL", "IN_MATERIAL_PED_CIENTIFICO",
                "IN_MATERIAL_PED_DIFUSAO", "IN_MATERIAL_PED_MUSICAL", "IN_MATERIAL_PED_JOGOS",
                "IN_MATERIAL_PED_ARTISTICAS", "IN_MATERIAL_PED_PROFISSIONAL", "IN_MATERIAL_PED_INDIGENA",
                "IN_MATERIAL_PED_ETNICO", "IN_MATERIAL_PED_CAMPO", "IN_MATERIAL_PED_BIL_SURDOS",
                "IN_MATERIAL_PED_AGRICOLA", "IN_MATERIAL_PED_QUILOMBOLA", "IN_MATERIAL_PED_EDU_ESP",
                "QT_PROF_ADMINISTRATIVOS", "QT_PROF_SERVICOS_GERAIS", "QT_PROF_BIBLIOTECARIO",
                "QT_PROF_SAUDE", "QT_PROF_COORDENADOR", "QT_PROF_FONAUDIOLOGO",
                "QT_PROF_NUTRICIONISTA", "QT_PROF_PSICOLOGO", "QT_PROF_ALIMENTACAO",
                "QT_PROF_PEDAGOGIA", "QT_PROF_SECRETARIO", "QT_PROF_SEGURANCA",
                "QT_PROF_MONITORES", "QT_PROF_GESTAO", "QT_PROF_ASSIST_SOCIAL",
                "QT_PROF_TRAD_LIBRAS", "QT_PROF_AGRICOLA", "QT_PROF_REVISOR_BRAILLE",
                "NU_ANO_CENSO"
            FROM dim_escola
            WHERE "CO_ENTIDADE" = :codigo
        """)
        school_result = connection.execute(school_query, {"codigo": school_code}).fetchone()
        
        if not school_result:
            return None
        
        enrollment_query = text("""
            SELECT 
                "QT_MAT_BAS", "QT_MAT_INF_CRE", "QT_MAT_INF_PRE", 
                "QT_MAT_FUND_AI", "QT_MAT_FUND_AF", "QT_MAT_MED", 
                "QT_MAT_PROF", "QT_MAT_EJA_FUND", "QT_MAT_EJA_MED",
                "QT_MAT_ESP", "QT_MAT_BAS_MASC", "QT_MAT_BAS_FEM",
                "QT_MAT_BAS_ND", "QT_MAT_BAS_BRANCA", "QT_MAT_BAS_PRETA",
                "QT_MAT_BAS_PARDA", "QT_MAT_BAS_AMARELA", "QT_MAT_BAS_INDIGENA"
            FROM fato_matricula
            WHERE "CO_ENTIDADE" = :codigo
            ORDER BY "NU_ANO_CENSO" DESC
            LIMIT 1
        """)
        enrollment_result = connection.execute(enrollment_query, {"codigo": school_code}).fetchone()

        teacher_query = text("""
            SELECT 
                "QT_DOC_BAS", "QT_DOC_INF_CRE", "QT_DOC_INF_PRE", 
                "QT_DOC_FUND_AI", "QT_DOC_FUND_AF", "QT_DOC_MED", 
                "QT_DOC_PROF", "QT_DOC_EJA", "QT_DOC_BAS_MASC",
                "QT_DOC_BAS_FEM", "QT_DOC_BAS_ND", "QT_DOC_BAS_BRANCA",
                "QT_DOC_BAS_PRETA", "QT_DOC_BAS_PARDA", "QT_DOC_BAS_AMARELA",
                "QT_DOC_BAS_INDIGENA", "QT_DOC_ESP"
            FROM fato_docente
            WHERE "CO_ENTIDADE" = :codigo
            ORDER BY "NU_ANO_CENSO" DESC
            LIMIT 1
        """)
        teacher_result = connection.execute(teacher_query, {"codigo": school_code}).fetchone()

        class_query = text("""
            SELECT 
                "QT_TUR_INF_CRE", "QT_TUR_INF_PRE", "QT_TUR_FUND_AI",
                "QT_TUR_FUND_AF", "QT_TUR_MED", "QT_TUR_PROF",
                "QT_TUR_EJA", "QT_TUR_ESP"
            FROM fato_turma
            WHERE "CO_ENTIDADE" = :codigo
            ORDER BY "NU_ANO_CENSO" DESC
            LIMIT 1
        """)
        class_result = connection.execute(class_query, {"codigo": school_code}).fetchone()

        return build_school_data(
            school_result,
            enrollment_result,
            teacher_result,
            class_result
        )

def calculate_time_series_summary(data):
    if len(data) < 2:
        return None
    inicio = data[0]
    fim = data[-1]
    crescimento = fim["valor"] - inicio["valor"]
    if inicio["valor"] == 0:
        crescimento_percentual = None
    else:
        crescimento_percentual = round(
            crescimento / inicio["valor"] * 100,
            1
        )
    maior_alta = None
    maior_queda = None
    anos_crescimento = 0
    anos_queda = 0
    anos_estavel = 0
    maximo = inicio
    minimo = inicio
    for i in range(1, len(data)):
        anterior = data[i - 1]
        atual = data[i]
        diferenca = atual["valor"] - anterior["valor"]
        if diferenca > 0:
            anos_crescimento += 1
        elif diferenca < 0:
            anos_queda += 1
        else:
            anos_estavel += 1
        if maior_alta is None or diferenca > maior_alta["valor"]:
            maior_alta = {
                "de": anterior["ano"],
                "para": atual["ano"],
                "valor": diferenca
            }
        if maior_queda is None or diferenca < maior_queda["valor"]:
            maior_queda = {
                "de": anterior["ano"],
                "para": atual["ano"],
                "valor": diferenca
            }
        if atual["valor"] > maximo["valor"]:
            maximo = atual
        if atual["valor"] < minimo["valor"]:
            minimo = atual
    return {
        "inicio": inicio,
        "fim": fim,
        "crescimento": {
            "absoluto": crescimento,
            "percentual": crescimento_percentual
        },
        "maior_alta": maior_alta,
        "maior_queda": maior_queda,
        "anos": {
            "crescimento": anos_crescimento,
            "queda": anos_queda,
            "estavel": anos_estavel
        },
        "maximo": maximo,
        "minimo": minimo
    }

def get_evolution_summary(school_code, categoria, indicador):
    queries = {
        "matriculas": {
            "total": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    "QT_MAT_BAS" AS valor
                FROM fato_matricula
                WHERE "CO_ENTIDADE" = :codigo
                ORDER BY "NU_ANO_CENSO"
            """)
        },
        "docentes": {
            "total": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    "QT_DOC_BAS" AS valor
                FROM fato_docente
                WHERE "CO_ENTIDADE" = :codigo
                ORDER BY "NU_ANO_CENSO";
            """)
        },
        "turmas": {
            "total": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    "QT_TUR_BAS" AS valor
                FROM fato_turma
                WHERE "CO_ENTIDADE" = :codigo
                ORDER BY "NU_ANO_CENSO";
            """)
        }
    }
    if categoria not in queries:
        return None
    if indicador not in queries[categoria]:
        return None
    with engine.connect() as connection:
        result = connection.execute(
            queries[categoria][indicador],
            {
                "codigo": school_code
            }
        ).fetchall()
    data = [
        {
            "ano": row.ano,
            "valor": row.valor
        }
        for row in result
    ]
    return calculate_time_series_summary(data)

def get_comparison_data(school_code, comparison_school_code, categoria, indicador, filtro=None):
    queries = {
        "matriculas": {
            "total": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    "QT_MAT_BAS" AS valor
                FROM fato_matricula
                WHERE "CO_ENTIDADE" = :codigo
                ORDER BY "NU_ANO_CENSO"
            """),
            "modalidade": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    CASE
                        WHEN :filtro = 'Educação Infantil - Creche'
                            THEN "QT_MAT_INF_CRE"
                        WHEN :filtro = 'Educação Infantil - Pré-Escola'
                            THEN "QT_MAT_INF_PRE"
                        WHEN :filtro = 'Ensino Fundamental - Anos Iniciais'
                            THEN "QT_MAT_FUND_AI"
                        WHEN :filtro = 'Ensino Fundamental - Anos Finais'
                            THEN "QT_MAT_FUND_AF"
                        WHEN :filtro = 'Ensino Médio'
                            THEN "QT_MAT_MED"
                        WHEN :filtro = 'Educação Profissional'
                            THEN "QT_MAT_PROF"
                        WHEN :filtro = 'Educação de Jovens e Adultos (EJA)'
                            THEN "QT_MAT_EJA"
                        WHEN :filtro = 'Educação Especial'
                            THEN "QT_MAT_ESP"
                        ELSE 0
                    END AS valor
                FROM fato_matricula
                WHERE "CO_ENTIDADE" = :codigo
                ORDER BY "NU_ANO_CENSO"
            """),
            "genero": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    CASE
                        WHEN :filtro = 'Masculino'
                            THEN "QT_MAT_BAS_MASC"
                        WHEN :filtro = 'Feminino'
                            THEN "QT_MAT_BAS_FEM"
                        ELSE 0
                    END AS valor
                FROM fato_matricula
                WHERE "CO_ENTIDADE" = :codigo
                ORDER BY "NU_ANO_CENSO"
            """),
            "raca": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    CASE
                        WHEN :filtro = 'Não Declarada'
                            THEN "QT_MAT_BAS_ND"
                        WHEN :filtro = 'Branca'
                            THEN "QT_MAT_BAS_BRANCA"
                        WHEN :filtro = 'Preta'
                            THEN "QT_MAT_BAS_PRETA"
                        WHEN :filtro = 'Parda'
                            THEN "QT_MAT_BAS_PARDA"
                        WHEN :filtro = 'Amarela'
                            THEN "QT_MAT_BAS_AMARELA"
                        WHEN :filtro = 'Indígena'
                            THEN "QT_MAT_BAS_INDIGENA"
                        ELSE 0
                    END AS valor
                FROM fato_matricula
                WHERE "CO_ENTIDADE" = :codigo
                ORDER BY "NU_ANO_CENSO"
            """)
        },
        "docentes": {
            "total": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    "QT_DOC_BAS" AS valor
                FROM fato_docente
                WHERE "CO_ENTIDADE" = :codigo
                ORDER BY "NU_ANO_CENSO"
            """),
            "modalidade": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    CASE
                        WHEN :filtro = 'Educação Infantil - Creche'
                            THEN "QT_DOC_INF_CRE"
                        WHEN :filtro = 'Educação Infantil - Pré-Escola'
                            THEN "QT_DOC_INF_PRE"
                        WHEN :filtro = 'Ensino Fundamental - Anos Iniciais'
                            THEN "QT_DOC_FUND_AI"
                        WHEN :filtro = 'Ensino Fundamental - Anos Finais'
                            THEN "QT_DOC_FUND_AF"
                        WHEN :filtro = 'Ensino Médio'
                            THEN "QT_DOC_MED"
                        WHEN :filtro = 'Educação Profissional'
                            THEN "QT_DOC_PROF"
                        WHEN :filtro = 'Educação de Jovens e Adultos (EJA)'
                            THEN "QT_DOC_EJA"
                        WHEN :filtro = 'Educação Especial'
                            THEN "QT_DOC_ESP"
                        ELSE 0
                    END AS valor
                FROM fato_docente
                WHERE "CO_ENTIDADE" = :codigo
                ORDER BY "NU_ANO_CENSO"
            """)
        },
        "turmas": {
            "total": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    "QT_TUR_BAS" AS valor
                FROM fato_turma
                WHERE "CO_ENTIDADE" = :codigo
                ORDER BY "NU_ANO_CENSO"
            """),
            "modalidade": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    CASE
                        WHEN :filtro = 'Educação Infantil - Creche'
                            THEN "QT_TUR_INF_CRE"
                        WHEN :filtro = 'Educação Infantil - Pré-Escola'
                            THEN "QT_TUR_INF_PRE"
                        WHEN :filtro = 'Ensino Fundamental - Anos Iniciais'
                            THEN "QT_TUR_FUND_AI"
                        WHEN :filtro = 'Ensino Fundamental - Anos Finais'
                            THEN "QT_TUR_FUND_AF"
                        WHEN :filtro = 'Ensino Médio'
                            THEN "QT_TUR_MED"
                        WHEN :filtro = 'Educação Profissional'
                            THEN "QT_TUR_PROF"
                        WHEN :filtro = 'Educação de Jovens e Adultos (EJA)'
                            THEN "QT_TUR_EJA"
                        WHEN :filtro = 'Educação Especial'
                            THEN "QT_TUR_ESP"
                        ELSE 0
                    END AS valor
                FROM fato_turma
                WHERE "CO_ENTIDADE" = :codigo
                ORDER BY "NU_ANO_CENSO"
            """)
        }
    }
    if categoria not in queries:
        return None
    if indicador not in queries[categoria]:
        return None
    query = queries[categoria][indicador]
    params_main = {
        "codigo": school_code,
        "filtro": filtro
    }
    params_comparison = {
        "codigo": comparison_school_code,
        "filtro": filtro
    }
    with engine.connect() as connection:
        result_main = connection.execute(
            query,
            params_main
        ).fetchall()
        result_comparison = connection.execute(
            query,
            params_comparison
        ).fetchall()
    main_data = [
        {
            "ano": row.ano,
            "valor": row.valor
        }
        for row in result_main
    ]
    comparison_data = [
        {
            "ano": row.ano,
            "valor": row.valor
        }
        for row in result_comparison
    ]
    main_by_year = {
        item["ano"]: item["valor"]
        for item in main_data
    }
    comparison_by_year = {
        item["ano"]: item["valor"]
        for item in comparison_data
    }
    common_years = sorted(
        set(main_by_year) & set(comparison_by_year)
    )
    comparison = None
    if common_years:
        ano = common_years[-1]
        valor_principal = main_by_year[ano]
        valor_comparado = comparison_by_year[ano]
        diferenca = valor_principal - valor_comparado
        comparison = {
            "ano": ano,
            "valor_principal": valor_principal,
            "valor_comparado": valor_comparado,
            "diferenca": diferenca
        }
    return {
        "escola_principal": main_data,
        "escola_comparada": comparison_data,
        "comparacao": comparison
    }

@app.route("/api/comparacao/<int:school_code>/<int:comparison_school_code>/<categoria>/<indicador>")
def comparison_data(school_code, comparison_school_code, categoria, indicador):
    filtro = request.args.get("filtro")
    data = get_comparison_data(
        school_code,
        comparison_school_code,
        categoria,
        indicador,
        filtro
    )
    if data is None:
        return jsonify({
            "erro": "Categoria ou indicador inválido."
        }), 404
    return jsonify(data)

@app.route("/api/evolucao/resumo/<int:school_code>/<categoria>/<indicador>")
def evolution_summary(school_code, categoria, indicador):
    summary = get_evolution_summary(
        school_code,
        categoria,
        indicador
    )
    if summary is None:
        return jsonify({
            "erro": "Categoria ou indicador inválido."
        }), 404
    return jsonify(summary)

@app.route('/')
def render_index():
    return render_template('index.html')

@app.route('/api/busca/<string:text_query>')
def search_schools(text_query):
    try:
        words = text_query.split()

        search_clauses = " AND ".join(
            ['"NO_ENTIDADE" ILIKE :word_{}'.format(i)
             for i in range(len(words))]
        )

        query = text(f"""
            SELECT
                "CO_ENTIDADE",
                "NO_ENTIDADE",
                "NO_MUNICIPIO",
                "SG_UF",
                "LATITUDE",
                "LONGITUDE"
            FROM dim_escola
            WHERE {search_clauses}
            LIMIT 100
        """)

        params = {
            f"word_{i}": f"%{word}%"
            for i, word in enumerate(words)
        }

        with engine.connect() as connection:
            results = connection.execute(
                query,
                params
            ).fetchall()

        schools = [
            {
                "codigo": row[0],
                "nome": row[1],
                "cidade": row[2],
                "estado": row[3],
                "lat": (
                    float(row[4])
                    if row[4] is not None
                    else None
                ),
                "lng": (
                    float(row[5])
                    if row[5] is not None
                    else None
                )
            }
            for row in results
        ]

        return jsonify(schools)

    except Exception as e:
        print(f"Error in search route: {e}")
        return jsonify({
            "erro": str(e)
        }), 500

@app.route('/api/ficha/<int:school_code>')
def generate_sheet_charts(school_code):
    try:
        questions = {
            "matriculas": {
                "modalidade": 48,
                "genero": 49,
                "raca": 50
            },
            "docentes": {
                "modalidade": 53,
                "genero": 52,
                "raca": 51
            },
            "turmas": {
                "modalidade": 74
            }
        }
        urls = {}
        for categoria, perguntas in questions.items():
            urls[categoria] = {}
            for nome, question_id in perguntas.items():
                payload = {
                    "resource": {
                        "question": question_id
                    },
                    "params": {
                        "escola": school_code
                    },
                    "exp": round(
                        (
                            datetime.datetime.now(datetime.timezone.utc)
                            + datetime.timedelta(minutes=30)
                        ).timestamp()
                    )
                }
                token = jwt.encode(
                    payload,
                    METABASE_SECRET_KEY,
                    algorithm="HS256"
                )
                urls[categoria][nome] = (
                    f"{METABASE_SITE_URL}/embed/question/{token}"
                    "?bordered=false&titled=false"
                )
        return jsonify({
            "sucesso": True,
            "urls": urls
        })
    except Exception as e:
        return jsonify({
            "sucesso": False,
            "erro": str(e)
        }), 500

@app.route('/api/evolucao/<int:school_code>')
def generate_evolution_charts(school_code):
    try:
        questions = {
            "matriculas": {
                "total": 54,
                "variacao":55,
                "evolucao_modalidade": 56,
                "participacao_modalidade": 57,
                "crescimento_modalidade": 58,
                "evolucao_genero": 59,
                "participacao_genero": 61,
                "evolucao_raca": 60,
                "participacao_raca": 62,
                "crescimento_raca": 63
            },
            "docentes": {
                "total": 64,
                "variacao": 66,
                "evolucao_modalidade": 68,
                "participacao_modalidade": 70,
                "crescimento_modalidade": 72
            },
            "turmas": {
                "total": 65,
                "variacao": 67,
                "evolucao_modalidade": 69,
                "participacao_modalidade": 71,
                "crescimento_modalidade": 73
            }
        }
        urls = {}
        for categoria, perguntas in questions.items():
            urls[categoria] = {}
            for nome, question_id in perguntas.items():
                payload = {
                    "resource": {
                        "question": question_id
                    },
                    "params": {
                        "escola": school_code
                    },
                    "exp": round(
                        (
                            datetime.datetime.now(datetime.timezone.utc)
                            + datetime.timedelta(minutes=30)
                        ).timestamp()
                    )
                }
                token = jwt.encode(
                    payload,
                    METABASE_SECRET_KEY,
                    algorithm="HS256"
                )
                urls[categoria][nome] = (
                    f"{METABASE_SITE_URL}/embed/question/{token}"
                    "?bordered=false&titled=false"
                )
        return jsonify({
            "sucesso": True,
            "urls": urls
        })
    except Exception as e:
        return jsonify({
            "sucesso": False,
            "erro": str(e)
        }), 500

@app.route('/api/comparacao/grafico/<int:school_code>/<int:comparison_code>/<string:categoria>/<string:indicador>')
def generate_comparison_chart(school_code, comparison_code, categoria, indicador):
    try:
        filtro = request.args.get("filtro")
        questions = { 
            "matriculas": { 
                "total": 75,
                "modalidade": 78,
                "genero": 81,
                "raca": 82
            }, 
            "docentes": { 
                "total": 76,
                "modalidade": 79
            }, 
            "turmas": { 
                "total": 77,
                "modalidade": 80 
            } 
        }
        if categoria not in questions:
            return jsonify({
                "sucesso": False,
                "erro": "Categoria inválida."
            }), 400
        if indicador not in questions[categoria]:
            return jsonify({
                "sucesso": False,
                "erro": "Indicador inválido."
            }), 400
        question_id = questions[categoria][indicador]
        filter_options = {
            "modalidade": [
                "Educação Infantil - Creche",
                "Educação Infantil - Pré-Escola",
                "Ensino Fundamental - Anos Iniciais",
                "Ensino Fundamental - Anos Finais",
                "Ensino Médio",
                "Educação Profissional",
                "Educação de Jovens e Adultos (EJA)",
                "Educação Especial"
            ],
            "genero": [
                "Masculino",
                "Feminino"
            ],
            "raca": [
                "Não Declarada",
                "Branca",
                "Preta",
                "Parda",
                "Amarela",
                "Indígena"
            ]
        }
        if indicador in filter_options:
            if not filtro:
                return jsonify({
                    "sucesso": False,
                    "erro": "É necessário informar um filtro para este indicador."
                }), 400
            if filtro not in filter_options[indicador]:
                return jsonify({
                    "sucesso": False,
                    "erro": "Filtro inválido."
                }), 400
        params = {
            "escola": school_code,
            "escola_comparacao": comparison_code
        }
        if indicador == "modalidade":
            params["modalidade"] = filtro
        elif indicador == "genero":
            params["genero"] = filtro
        elif indicador == "raca":
            params["raca"] = filtro
        payload = {
            "resource": {
                "question": question_id
            },
            "params": params,
            "exp": round(
                (
                    datetime.datetime.now(datetime.timezone.utc)
                    + datetime.timedelta(minutes=30)
                ).timestamp()
            )
        }
        token = jwt.encode(
            payload,
            METABASE_SECRET_KEY,
            algorithm="HS256"
        )
        url = (
            f"{METABASE_SITE_URL}/embed/question/{token}"
            "?bordered=false&titled=false"
        )
        return jsonify({
            "sucesso": True,
            "url": url
        })
    except Exception as e:
        return jsonify({
            "sucesso": False,
            "erro": str(e)
        }), 500

@app.route('/api/escolas-mapa')
def get_map_schools():
    try:
        dependencia_map = {
            "federal": 1,
            "estadual": 2,
            "municipal": 3,
            "privada": 4
        }
        categoria_privada_map = {
            "particular": 1,
            "comunitaria": 2,
            "confessional": 3,
            "filantropica": 4
        }
        localizacao_map = {
            "urbano": 1,
            "rural": 2
        }

        modalities_str = request.args.get('modalidades', '')
        dependencias_str = request.args.get('dependencias', '')
        categorias_str = request.args.get('categorias_privadas', '')
        localizacoes_str = request.args.get('localizacoes', '')

        lat_min = request.args.get('lat_min')
        lat_max = request.args.get('lat_max')
        lng_min = request.args.get('lng_min')
        lng_max = request.args.get('lng_max')

        modalities = (
            modalities_str.split(",")
            if modalities_str
            else []
        )

        dependencias_raw = (
            dependencias_str.split(",")
            if dependencias_str
            else []
        )

        categorias_raw = (
            categorias_str.split(",")
            if categorias_str
            else []
        )

        localizacoes_raw = (
            localizacoes_str.split(",")
            if localizacoes_str
            else []
        )

        dependencias = [
            dependencia_map[value]
            for value in dependencias_raw
            if value in dependencia_map
        ]

        categorias = [
            categoria_privada_map[value]
            for value in categorias_raw
            if value in categoria_privada_map
        ]

        localizacoes = [
            localizacao_map[value]
            for value in localizacoes_raw
            if value in localizacao_map
        ]

        has_bounds = all(
            v is not None
            for v in [lat_min, lat_max, lng_min, lng_max]
        )

        if has_bounds:
            lat_min = float(lat_min)
            lat_max = float(lat_max)
            lng_min = float(lng_min)
            lng_max = float(lng_max)

        filter_map = {
            'creche': 't."QT_TUR_INF_CRE" > 0',
            'pre_escola': 't."QT_TUR_INF_PRE" > 0',
            'fund_ai': 't."QT_TUR_FUND_AI" > 0',
            'fund_af': 't."QT_TUR_FUND_AF" > 0',
            'medio': 't."QT_TUR_MED" > 0',
            'medio_int': 't."QT_TUR_PROF" > 0',
            'eja_fund': 't."QT_TUR_EJA_FUND" > 0',
            'eja_med': 't."QT_TUR_EJA_MED" > 0'
        }

        query = """
            SELECT
                "CO_ENTIDADE",
                "NO_ENTIDADE",
                "NO_MUNICIPIO",
                "SG_UF",
                "LATITUDE",
                "LONGITUDE"
            FROM dim_escola e
            WHERE "LATITUDE" IS NOT NULL
              AND "LONGITUDE" IS NOT NULL
        """

        params = {}

        if has_bounds:
            query += """
                AND "LATITUDE" BETWEEN :lat_min AND :lat_max
                AND "LONGITUDE" BETWEEN :lng_min AND :lng_max
            """

            params.update({
                "lat_min": lat_min,
                "lat_max": lat_max,
                "lng_min": lng_min,
                "lng_max": lng_max
            })

        class_filters = [
            filter_map[mod]
            for mod in modalities
            if mod in filter_map
        ]

        if class_filters:
            class_clauses = " OR ".join(class_filters)

            query += f"""
                AND EXISTS (
                    SELECT 1
                    FROM fato_turma t
                    WHERE t."CO_ENTIDADE" = e."CO_ENTIDADE"
                      AND t."NU_ANO_CENSO" = 2025
                      AND ({class_clauses})
                )
            """

        if "tecnico" in modalities:
            query += """
                AND EXISTS (
                    SELECT 1
                    FROM fato_curso c
                    WHERE c."CO_ENTIDADE" = e."CO_ENTIDADE"
                      AND c."NU_ANO_CENSO" = 2025
                )
            """

        if dependencias:
            placeholders = []

            for i, dependencia in enumerate(dependencias):
                key = f"dependencia_{i}"
                placeholders.append(f":{key}")
                params[key] = dependencia

            query += f"""
                AND e."TP_DEPENDENCIA" IN (
                    {", ".join(placeholders)}
                )
            """

        if categorias:
            placeholders = []

            for i, categoria in enumerate(categorias):
                key = f"categoria_privada_{i}"
                placeholders.append(f":{key}")
                params[key] = categoria

            query += f"""
                AND e."TP_CATEGORIA_ESCOLA_PRIVADA" IN (
                    {", ".join(placeholders)}
                )
            """

        if localizacoes:
            placeholders = []

            for i, localizacao in enumerate(localizacoes):
                key = f"localizacao_{i}"
                placeholders.append(f":{key}")
                params[key] = localizacao

            query += f"""
                AND e."TP_LOCALIZACAO" IN (
                    {", ".join(placeholders)}
                )
            """

        if has_bounds:
            query += " LIMIT 5000"

        with engine.connect() as connection:
            results = connection.execute(
                text(query),
                params
            ).fetchall()

        schools = [
            {
                "codigo": row[0],
                "nome": row[1],
                "cidade": row[2],
                "estado": row[3],
                "lat": float(row[4]),
                "lng": float(row[5])
            }
            for row in results
        ]

        return jsonify(schools)

    except Exception as e:
        print(f"Error in map schools route: {e}")
        return jsonify({"erro": str(e)}), 500

@app.route('/api/escola/<int:school_code>/ficha')
def get_school_sheet(school_code):
    try:
        school_data = get_school_technical_sheet(school_code)
        
        if not school_data:
            return jsonify({'erro': 'Escola não encontrada no banco de dados.'}), 404
            
        return jsonify(school_data)

    except Exception as e:
        print(f"Error fetching school sheet for {school_code}: {e}")
        return jsonify({'erro': str(e)}), 500

@app.route('/escola/<int:school_code>')
def render_details(school_code):
    return render_template('details.html', codigo=school_code)

@app.route('/api/escola-localizacao/<int:school_code>')
def get_school_location(school_code):
    try:
        query = text("""
            SELECT
                "CO_ENTIDADE",
                "NO_ENTIDADE",
                "NO_MUNICIPIO",
                "SG_UF",
                "LATITUDE",
                "LONGITUDE"
            FROM dim_escola
            WHERE "CO_ENTIDADE" = :codigo
        """)

        with engine.connect() as connection:
            row = connection.execute(
                query,
                {"codigo": school_code}
            ).fetchone()

        if row is None:
            return jsonify({
                "erro": "Escola não encontrada."
            }), 404

        return jsonify({
            "codigo": row[0],
            "nome": row[1],
            "cidade": row[2],
            "estado": row[3],
            "lat": float(row[4]) if row[4] is not None else None,
            "lng": float(row[5]) if row[5] is not None else None
        })

    except Exception as e:
        return jsonify({
            "erro": str(e)
        }), 500

if __name__ == '__main__':
    print("Flask server running at http://localhost:5000")
    app.run(debug=True, port=5000)