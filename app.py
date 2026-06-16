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
    """Retorna os dados cadastrais da dim_escola para a aba Ficha"""
    try:
        with engine.connect() as conexao:
            query = text("""
                SELECT 
                    "DS_ENDERECO", 
                    "NU_ENDERECO", 
                    "NO_MUNICIPIO", 
                    "SG_UF", 
                    "TP_DEPENDENCIA", 
                    "TP_LOCALIZACAO", 
                    "TP_SITUACAO_FUNCIONAMENTO"
                FROM dim_escola
                WHERE "CO_ENTIDADE" = :codigo
            """)
            
            resultado = conexao.execute(query, {"codigo": codigo}).fetchone()
            
            if resultado:
                map_dependencia = {1: 'Federal', 2: 'Estadual', 3: 'Municipal', 4: 'Privada'}
                map_localizacao = {1: 'Urbana', 2: 'Rural'}
                map_situacao = {1: 'Em Atividade', 2: 'Paralisada', 3: 'Extinta', 4: 'Escola extinta em anos anteriores'}

                return jsonify({
                    'endereco': resultado[0],
                    'numero': resultado[1],
                    'municipio': resultado[2],
                    'uf': resultado[3],
                    'dependencia': map_dependencia.get(resultado[4], f'Código {resultado[4]}'),
                    'localizacao': map_localizacao.get(resultado[5], f'Código {resultado[5]}'),
                    'situacao': map_situacao.get(resultado[6], f'Código {resultado[6]}')
                })
            else:
                return jsonify({'erro': 'Escola não encontrada no banco de dados.'}), 404

    except Exception as e:
        print(f"Erro ao buscar ficha da escola {codigo}: {e}")
        return jsonify({'erro': 'Falha interna no servidor.'}), 500

if __name__ == '__main__':
    print("Servidor Flask a correr em http://localhost:5000")
    app.run(debug=True, port=5000)