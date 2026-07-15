from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import jwt
import time
import psycopg2
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import datetime

load_dotenv()

app = Flask(__name__)
CORS(app) 

METABASE_SITE_URL = "http://localhost:3000"
DASHBOARD_ID = 2

METABASE_SECRET_KEY = os.getenv("METABASE_SECRET_KEY")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT", "5432")

engine = create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

def build_school_data(school_result, enrollment_result, teacher_result):
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
            'eja': int(teacher_result[7] or 0)
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
            'especial': int(enrollment_result[9] or 0)
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
                "QT_MAT_ESP"
            FROM fato_matricula
            WHERE "CO_ENTIDADE" = :codigo AND "NU_ANO_CENSO" = 2025
        """)
        enrollment_result = connection.execute(enrollment_query, {"codigo": school_code}).fetchone()

        teacher_query = text("""
            SELECT 
                "QT_DOC_BAS", "QT_DOC_INF_CRE", "QT_DOC_INF_PRE", 
                "QT_DOC_FUND_AI", "QT_DOC_FUND_AF", "QT_DOC_MED", 
                "QT_DOC_PROF", "QT_DOC_EJA"
            FROM fato_docente
            WHERE "CO_ENTIDADE" = :codigo
            ORDER BY "NU_ANO_CENSO" DESC
            LIMIT 1
        """)
        teacher_result = connection.execute(teacher_query, {"codigo": school_code}).fetchone()

        return build_school_data(
            school_result,
            enrollment_result,
            teacher_result
        )

@app.route('/')
def render_index():
    return render_template('index.html')

@app.route('/api/busca/<string:text_query>')
def search_schools(text_query):
    try:
        connection = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
        cursor = connection.cursor()
        
        words = text_query.split()
        search_clauses = ' AND '.join(['"NO_ENTIDADE" ILIKE %s'] * len(words))
        
        query = f"""
            SELECT "CO_ENTIDADE", "NO_ENTIDADE", "NO_MUNICIPIO", "SG_UF", "LATITUDE", "LONGITUDE"
            FROM dim_escola 
            WHERE {search_clauses}
            LIMIT 100
        """
        
        parameters = tuple(f"%{word}%" for word in words)
        
        cursor.execute(query, parameters)
        results = cursor.fetchall()
        
        schools = []
        for row in results:
            schools.append({
                "codigo": row[0], 
                "nome": row[1],
                "cidade": row[2],
                "estado": row[3],
                "lat": float(row[4]) if row[4] is not None else None,
                "lng": float(row[5]) if row[5] is not None else None
            })
        
        cursor.close()
        connection.close()
        return jsonify(schools)
        
    except Exception as e:
        print(f"Error in search route: {e}")
        return jsonify({"erro": str(e)}), 500

@app.route('/api/painel/<int:school_code>')
def generate_dashboard_link(school_code):
    try:
        payload = {
            "resource": {"dashboard": 2},
            "params": {
                "number": school_code 
            },
            "exp": round((datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)).timestamp())
        }
        
        token = jwt.encode(payload, METABASE_SECRET_KEY, algorithm="HS256")
        iframe_url = f"{METABASE_SITE_URL}/embed/dashboard/{token}#bordered=true&titled=true"
        
        return jsonify({"sucesso": True, "url": iframe_url})

    except Exception as e:
        print(f"Error generating dashboard link: {e}")
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@app.route('/api/escolas-mapa')
def get_map_schools():
    try:
        modalities_str = request.args.get('modalidades', '')

        if not modalities_str:
            return jsonify([])

        lat_min = request.args.get('lat_min')
        lat_max = request.args.get('lat_max')
        lng_min = request.args.get('lng_min')
        lng_max = request.args.get('lng_max')

        has_bounds = all(v is not None for v in [lat_min, lat_max, lng_min, lng_max])

        if has_bounds:
            lat_min = float(lat_min)
            lat_max = float(lat_max)
            lng_min = float(lng_min)
            lng_max = float(lng_max)

        modalities_str = request.args.get('modalidades', '')
        modalities = modalities_str.split(',') if modalities_str else []

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
            SELECT "CO_ENTIDADE", "NO_ENTIDADE", "NO_MUNICIPIO", "SG_UF", "LATITUDE", "LONGITUDE"
            FROM dim_escola e
            WHERE 1=1
                AND "LATITUDE" IS NOT NULL
                AND "LONGITUDE" IS NOT NULL
        """

        if has_bounds:
            query += """
                AND "LATITUDE" BETWEEN :lat_min AND :lat_max
                AND "LONGITUDE" BETWEEN :lng_min AND :lng_max
            """

        class_filters = [filter_map[mod] for mod in modalities if mod in filter_map]
        
        if class_filters:
            class_clauses = " OR ".join(class_filters)
            
            query += f"""
              AND EXISTS (
                  SELECT 1 FROM fato_turma t 
                  WHERE t."CO_ENTIDADE" = e."CO_ENTIDADE" 
                    AND t."NU_ANO_CENSO" = 2025 
                    AND {class_clauses}
              )
            """

        if 'tecnico' in modalities:
            query += """
              AND EXISTS (
                  SELECT 1 FROM fato_curso c 
                  WHERE c."CO_ENTIDADE" = e."CO_ENTIDADE" 
                    AND c."NU_ANO_CENSO" = 2025
              )
            """

        if has_bounds:
            query += " LIMIT 5000"

        with engine.connect() as connection:
            params = {}

            if has_bounds:
                params = {
                    "lat_min": lat_min,
                    "lat_max": lat_max,
                    "lng_min": lng_min,
                    "lng_max": lng_max
                }

            results = connection.execute(
                text(query),
                params
            ).fetchall()

            schools = []
            for row in results:
                schools.append({
                    "codigo": row[0],
                    "nome": row[1],
                    "cidade": row[2],
                    "estado": row[3],
                    "lat": float(row[4]),
                    "lng": float(row[5])
                })

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

if __name__ == '__main__':
    print("Flask server running at http://localhost:5000")
    app.run(debug=True, port=5000)