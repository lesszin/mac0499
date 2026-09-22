from flask import Flask, render_template
from flask_cors import CORS

from routes.school import school_bp
from routes.division import division_bp
from routes.evolution import evolution_bp
from routes.comparison import comparison_bp
from routes.spatial import spatial_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(school_bp)
app.register_blueprint(division_bp)
app.register_blueprint(evolution_bp)
app.register_blueprint(comparison_bp)
app.register_blueprint(spatial_bp)


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/mapa")
def map():
    return render_template("map.html")


if __name__ == '__main__':
    print("Flask server running at http://localhost:5000")
    app.run(debug=True, port=5000)