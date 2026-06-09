from flask import Flask, jsonify
from flask_cors import CORS
import jwt
import time

app = Flask(__name__)
CORS(app) 

METABASE_SITE_URL = "http://localhost:3000"
METABASE_SECRET_KEY = "e72048d933aee9af95f59b6d59e2da44add528e208c76e6d40bf452e67d3cafe"
DASHBOARD_ID = 2

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