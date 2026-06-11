from flask import Flask, jsonify, render_template
from flask_cors import CORS
import jwt
import time
import psycopg2

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/busca/<string:texto>')
def buscar_escolas(texto):
    try:
        conn = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
        cur = conn.cursor()
        
        query = """
            SELECT "CO_ENTIDADE", "NO_ENTIDADE", "NO_MUNICIPIO", "SG_UF"
            FROM dim_escola 
            WHERE "NO_ENTIDADE" ILIKE %s 
            LIMIT 10
        """
        cur.execute(query, (f"%{texto}%",))
        resultados = cur.fetchall()
        
        escolas = [
            {
                "codigo": linha[0], 
                "nome": linha[1],
                "cidade": linha[2],
                "estado": linha[3]
            } for linha in resultados
        ]
        
        cur.close()
        conn.close()
        return jsonify(escolas)
        
    except Exception as e:
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

if __name__ == '__main__':
    print("Servidor Flask a correr em http://localhost:5000")
    app.run(debug=True, port=5000)