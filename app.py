from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import jwt
import time
import psycopg2
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/busca/<string:texto>')
def buscar_escolas(texto):
    try:
        conn = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
        cur = conn.cursor()
        
        palavras = texto.split()
        
        clausulas_busca = ' AND '.join(['"NO_ENTIDADE" ILIKE %s'] * len(palavras))
        
        query = f"""
            SELECT "CO_ENTIDADE", "NO_ENTIDADE", "NO_MUNICIPIO", "SG_UF", "LATITUDE", "LONGITUDE"
            FROM dim_escola 
            WHERE {clausulas_busca}
            LIMIT 100
        """
        
        parametros = tuple(f"%{palavra}%" for palavra in palavras)
        
        cur.execute(query, parametros)
        resultados = cur.fetchall()
        
        escolas = []
        for linha in resultados:
            escolas.append({
                "codigo": linha[0], 
                "nome": linha[1],
                "cidade": linha[2],
                "estado": linha[3],
                "lat": float(linha[4]) if linha[4] is not None else None,
                "lng": float(linha[5]) if linha[5] is not None else None
            })
        
        cur.close()
        conn.close()
        return jsonify(escolas)
        
    except Exception as e:
        print(f"Erro na rota de busca: {e}")
        return jsonify({"erro": str(e)}), 500

@app.route('/api/painel/<int:codigo_escola>')
def gerar_link_painel(codigo_escola):
    try:
        payload = {
            "resource": {"dashboard": DASHBOARD_ID},
            "params": {
                "number": codigo_escola
            },
            "exp": round(time.time()) + (10 * 60)
        }
        
        token = jwt.encode(payload, METABASE_SECRET_KEY, algorithm="HS256")
        
        iframe_url = f"{METABASE_SITE_URL}/embed/dashboard/{token}#bordered=true&titled=true"
        
        return jsonify({"sucesso": True, "url": iframe_url})

    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@app.route('/api/escolas-mapa')
def escolas_mapa():
    try:
        lat_min = float(request.args.get('lat_min'))
        lat_max = float(request.args.get('lat_max'))
        lng_min = float(request.args.get('lng_min'))
        lng_max = float(request.args.get('lng_max'))

        modalidades_str = request.args.get('modalidades', '')
        modalidades = modalidades_str.split(',') if modalidades_str else []

        mapa_filtros = {
            'creche': 't."QT_TUR_INF_CRE" > 0',
            'pre_escola': 't."QT_TUR_INF_PRE" > 0',
            'fund_ai': 't."QT_TUR_FUND_AI" > 0',
            'fund_af': 't."QT_TUR_FUND_AF" > 0',
            'medio': 't."QT_TUR_MED" > 0',
            'medio_int': 't."QT_TUR_MED_IFTP_CT" > 0',
            'eja_fund': 't."QT_TUR_EJA_FUND" > 0',
            'eja_med': 't."QT_TUR_EJA_MED" > 0'
        }

        query = """
            SELECT "CO_ENTIDADE", "NO_ENTIDADE", "LATITUDE", "LONGITUDE"
            FROM dim_escola e
            WHERE "LATITUDE" BETWEEN :lat_min AND :lat_max
              AND "LONGITUDE" BETWEEN :lng_min AND :lng_max
        """

        filtros_turma = [mapa_filtros[mod] for mod in modalidades if mod in mapa_filtros]
        
        if filtros_turma:
            clausulas_turma = " AND ".join(filtros_turma)
            
            query += f"""
              AND EXISTS (
                  SELECT 1 FROM fato_turma t 
                  WHERE t."CO_ENTIDADE" = e."CO_ENTIDADE" 
                    AND t."NU_ANO_CENSO" = 2025 
                    AND {clausulas_turma}
              )
            """

        if 'tecnico' in modalidades:
            query += """
              AND EXISTS (
                  SELECT 1 FROM fato_curso c 
                  WHERE c."CO_ENTIDADE" = e."CO_ENTIDADE" 
                    AND c."NU_ANO_CENSO" = 2025
              )
            """

        query += " LIMIT 1500"

        with engine.connect() as conexao:
            resultados = conexao.execute(text(query), {
                "lat_min": lat_min, "lat_max": lat_max,
                "lng_min": lng_min, "lng_max": lng_max
            }).fetchall()

            escolas = []
            for linha in resultados:
                escolas.append({
                    "codigo": linha[0],
                    "nome": linha[1],
                    "lat": float(linha[2]),
                    "lng": float(linha[3])
                })

            return jsonify(escolas)

    except Exception as e:
        print(f"Erro na rota escolas-mapa: {e}")
        return jsonify({"erro": str(e)}), 500

@app.route('/api/escola/<int:codigo>/ficha')
def ficha_escola(codigo):
    try:
        with engine.connect() as conexao:
            query_escola = text("""
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
                    "IN_MATERIAL_PED_AGRICOLA", "IN_MATERIAL_PED_QUILOMBOLA", "IN_MATERIAL_PED_EDU_ESP"
                FROM dim_escola
                WHERE "CO_ENTIDADE" = :codigo
            """)
            res_escola = conexao.execute(query_escola, {"codigo": codigo}).fetchone()
            
            if not res_escola:
                return jsonify({'erro': 'Escola não encontrada no banco de dados.'}), 404
            
            query_matricula = text("""
                SELECT 
                    "QT_MAT_BAS", "QT_MAT_INF_CRE", "QT_MAT_INF_PRE", 
                    "QT_MAT_FUND_AI", "QT_MAT_FUND_AF", "QT_MAT_MED", 
                    "QT_MAT_MED_IFTP_CT", "QT_MAT_EJA_FUND", "QT_MAT_EJA_MED",
                    "QT_MAT_ESP"
                FROM fato_matricula
                WHERE "CO_ENTIDADE" = :codigo AND "NU_ANO_CENSO" = 2025
            """)
            res_mat = conexao.execute(query_matricula, {"codigo": codigo}).fetchone()

            map_dependencia = {1: 'Federal', 2: 'Estadual', 3: 'Municipal', 4: 'Privada'}
            map_localizacao = {1: 'Urbana', 2: 'Rural'}
            map_situacao = {1: 'Em Atividade', 2: 'Paralisada', 3: 'Extinta', 4: 'Escola extinta em anos anteriores'}
            map_categoria_privada = {1: 'Particular', 2: 'Comunitária', 3: 'Confessional', 4: 'Filantrópica'}

            map_aee_comp = {0: 'Não oferece', 1: 'Não exclusivamente', 2: 'Exclusivamente'}

            dados_ficha = {
                'nome': res_escola[0],
                'identificacao': {
                    'endereco': res_escola[1],
                    'numero': res_escola[2],
                    'municipio': res_escola[3],
                    'uf': res_escola[4],
                    'dependencia': map_dependencia.get(res_escola[5], f'Código {res_escola[5]}'),
                    'localizacao': map_localizacao.get(res_escola[6], f'Código {res_escola[6]}'),
                    'situacao': map_situacao.get(res_escola[7], f'Código {res_escola[7]}'),
                    'categoria_privada': map_categoria_privada.get(res_escola[8], None) if res_escola[8] else None
                },
                'atendimentos': {
                    'indigena': int(res_escola[9] or 0),
                    'aee': map_aee_comp.get(res_escola[10], 'Não informado'),
                    'complementar': map_aee_comp.get(res_escola[11], 'Não informado'),
                    'alimentacao': int(res_escola[12] or 0),
                    'ambiental': int(res_escola[13] or 0)
                },
                'infraestrutura': {
                    'agua': int(res_escola[14] or 0),
                    'energia': int(res_escola[15] or 0),
                    'esgoto': int(res_escola[16] or 0),
                    'lixo': int(res_escola[17] or 0)
                },
                'dependencias': {
                    'plantio': int(res_escola[18] or 0),
                    'verde': int(res_escola[19] or 0),
                    'auditorio': int(res_escola[20] or 0),
                    'biblioteca': int(res_escola[21] or 0),
                    'lab_ciencias': int(res_escola[22] or 0),
                    'lab_informatica': int(res_escola[23] or 0),
                    'quadra_coberta': int(res_escola[24] or 0),
                    'quadra_descoberta': int(res_escola[25] or 0),
                    'artes': int(res_escola[26] or 0),
                    'musica': int(res_escola[27] or 0),
                    'danca': int(res_escola[28] or 0),
                    'multiuso': int(res_escola[29] or 0),
                    'gravacao': int(res_escola[30] or 0),
                    'professores': int(res_escola[31] or 0),
                    'aee': int(res_escola[32] or 0),
                    'refeitorio': int(res_escola[33] or 0),
                    'salas_utilizadas': int(res_escola[34] or 0)
                },
                'acessibilidade': {
                    'banheiro_pne': int(res_escola[35] or 0),
                    'corrimao': int(res_escola[36] or 0),
                    'elevador': int(res_escola[37] or 0),
                    'pisos_tateis': int(res_escola[38] or 0),
                    'vao_livre': int(res_escola[39] or 0),
                    'rampas': int(res_escola[40] or 0),
                    'sinal_sonoro': int(res_escola[41] or 0),
                    'sinal_tatil': int(res_escola[42] or 0),
                    'sinal_visual': int(res_escola[43] or 0)
                },
                'comunidade': {
                    'espaco_atividade': int(res_escola[44] if res_escola[44] is not None else 9),
                    'espaco_equipamento': int(res_escola[45] if res_escola[45] is not None else 9),
                    'orgao_pais': int(res_escola[46] or 0),
                    'orgao_pais_mestres': int(res_escola[47] or 0),
                    'orgao_conselho': int(res_escola[48] or 0),
                    'orgao_gremio': int(res_escola[49] or 0),
                    'proposta_pedagogica': int(res_escola[50] if res_escola[50] is not None else 9)
                },
                'tecnologia': {
                    'internet': int(res_escola[51] or 0),
                    'banda_larga': int(res_escola[52]) if res_escola[52] is not None else None,
                    'rede_local': int(res_escola[53] if res_escola[53] is not None else 9),
                    'internet_alunos': int(res_escola[54] or 0),
                    'internet_admin': int(res_escola[55] or 0),
                    'internet_aprendizagem': int(res_escola[56] or 0),
                    'internet_comunidade': int(res_escola[57] or 0),
                    'desktop_aluno': int(res_escola[58] or 0),
                    'portatil_aluno': int(res_escola[59] or 0),
                    'tablet_aluno': int(res_escola[60] or 0),
                    'equip_som': int(res_escola[61] or 0),
                    'equip_tv': int(res_escola[62] or 0),
                    'lousa_digital': int(res_escola[63] or 0),
                    'equip_multimidia': int(res_escola[64] or 0)
                },
                'materiais': {
                    'multimidia': int(res_escola[65] or 0),
                    'infantil': int(res_escola[66] or 0),
                    'cientifico': int(res_escola[67] or 0),
                    'difusao': int(res_escola[68] or 0),
                    'musical': int(res_escola[69] or 0),
                    'jogos': int(res_escola[70] or 0),
                    'artisticas': int(res_escola[71] or 0),
                    'profissional': int(res_escola[72] or 0),
                    'indigena': int(res_escola[73] or 0),
                    'etnico': int(res_escola[74] or 0),
                    'campo': int(res_escola[75] or 0),
                    'bil_surdos': int(res_escola[76] or 0),
                    'agricola': int(res_escola[77] or 0),
                    'quilombola': int(res_escola[78] or 0),
                    'edu_esp': int(res_escola[79] or 0)
                },
                'matriculas': None
            }
            
            if res_mat:
                dados_ficha['matriculas'] = {
                    'basica': int(res_mat[0] or 0),
                    'creche': int(res_mat[1] or 0),
                    'pre_escola': int(res_mat[2] or 0),
                    'fund_ai': int(res_mat[3] or 0),
                    'fund_af': int(res_mat[4] or 0),
                    'medio': int(res_mat[5] or 0),
                    'profissional': int(res_mat[6] or 0),
                    'eja_fund': int(res_mat[7] or 0),
                    'eja_med': int(res_mat[8] or 0),
                    'especial': int(res_mat[9] or 0)
                }

            return jsonify(dados_ficha)

    except Exception as e:
        print(f"Erro ao buscar ficha da escola {codigo}: {e}")
        return jsonify({'erro': str(e)}), 500

@app.route('/escola/<int:codigo>')
def pagina_detalhes(codigo):
    return render_template('details.html', codigo=codigo)

if __name__ == '__main__':
    print("Servidor Flask a correr em http://localhost:5000")
    app.run(debug=True, port=5000)