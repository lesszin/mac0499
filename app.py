from flask import Flask, render_template
from flask_cors import CORS

from routes.school import school_bp
from routes.division import division_bp
from routes.evolution import evolution_bp
from routes.comparison import comparison_bp
from routes.spatial import spatial_bp


# Cria a aplicação Flask principal.
app = Flask(__name__)

# Permite requisições de diferentes origens,
# facilitando a comunicação entre a interface web
# e a API durante o desenvolvimento e a execução da aplicação.
CORS(app)


# Registra os módulos responsáveis pelas diferentes áreas
# da aplicação.
app.register_blueprint(school_bp)
app.register_blueprint(division_bp)
app.register_blueprint(evolution_bp)
app.register_blueprint(comparison_bp)
app.register_blueprint(spatial_bp)


@app.route("/")
def home():
    """
    Renderiza a página inicial da plataforma.

    Returns:
        Página HTML inicial da aplicação.
    """
    return render_template("home.html")


@app.route("/mapa")
def map():
    """
    Renderiza a página principal do mapa.

    Returns:
        Página HTML contendo o mapa e suas funcionalidades.
    """
    return render_template("map.html")


if __name__ == '__main__':
    # Inicia o servidor Flask localmente.
    print("Flask server running at http://localhost:5000")
    app.run(debug=True, port=5000)