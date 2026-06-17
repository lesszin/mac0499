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
                    "TP_CATEGORIA_ESCOLA_PRIVADA"
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