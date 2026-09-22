from flask import Blueprint, jsonify, request
import datetime
import jwt
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

from routes.school import get_school_structure_snapshot

load_dotenv()

evolution_bp = Blueprint(
    "evolution",
    __name__
)

METABASE_SITE_URL = "http://localhost:3000"
METABASE_SECRET_KEY = os.getenv(
    "METABASE_SECRET_KEY"
)

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv(
    "DB_PORT",
    "5432"
)

engine = create_engine(
    f"postgresql://{DB_USER}:{DB_PASS}@"
    f"{DB_HOST}:{DB_PORT}/{DB_NAME}"
)


def calculate_time_series_summary(data):
    if len(data) < 2:
        return None

    inicio = data[0]
    fim = data[-1]

    crescimento = (
        fim["valor"] -
        inicio["valor"]
    )

    if inicio["valor"] == 0:
        crescimento_percentual = None

    else:
        crescimento_percentual = round(
            crescimento /
            inicio["valor"] *
            100,
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

        diferenca = (
            atual["valor"] -
            anterior["valor"]
        )

        if diferenca > 0:
            anos_crescimento += 1

        elif diferenca < 0:
            anos_queda += 1

        else:
            anos_estavel += 1

        if (
            maior_alta is None or
            diferenca > maior_alta["valor"]
        ):
            maior_alta = {
                "de": anterior["ano"],
                "para": atual["ano"],
                "valor": diferenca
            }

        if (
            maior_queda is None or
            diferenca < maior_queda["valor"]
        ):
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
            "percentual":
                crescimento_percentual
        },
        "maior_alta": maior_alta,
        "maior_queda": maior_queda,
        "anos": {
            "crescimento":
                anos_crescimento,
            "queda":
                anos_queda,
            "estavel":
                anos_estavel
        },
        "maximo": maximo,
        "minimo": minimo
    }


def get_evolution_summary(
    school_code,
    categoria,
    indicador
):
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

    return calculate_time_series_summary(
        data
    )


def get_division_evolution_summary(
    tipo,
    codigo,
    categoria,
    indicador
):
    queries = {
        "matriculas": {
            "total": text("""
                SELECT
                    m."NU_ANO_CENSO" AS ano,
                    SUM(
                        COALESCE(
                            m."QT_MAT_BAS",
                            0
                        )
                    ) AS valor

                FROM fato_matricula m

                JOIN dim_escola e
                    ON e."CO_ENTIDADE" =
                       m."CO_ENTIDADE"

                WHERE
                    (
                        :tipo = 'pais'

                        OR (
                            :tipo = 'regiao'
                            AND e."CO_REGIAO" =
                                :codigo
                        )

                        OR (
                            :tipo = 'uf'
                            AND e."CO_UF" =
                                :codigo
                        )

                        OR (
                            :tipo = 'municipio'
                            AND e."CO_MUNICIPIO" =
                                :codigo
                        )
                    )

                GROUP BY
                    m."NU_ANO_CENSO"

                ORDER BY
                    m."NU_ANO_CENSO"
            """)
        },

        "docentes": {
            "total": text("""
                SELECT
                    d."NU_ANO_CENSO" AS ano,
                    SUM(
                        COALESCE(
                            d."QT_DOC_BAS",
                            0
                        )
                    ) AS valor

                FROM fato_docente d

                JOIN dim_escola e
                    ON e."CO_ENTIDADE" =
                       d."CO_ENTIDADE"

                WHERE
                    (
                        :tipo = 'pais'

                        OR (
                            :tipo = 'regiao'
                            AND e."CO_REGIAO" =
                                :codigo
                        )

                        OR (
                            :tipo = 'uf'
                            AND e."CO_UF" =
                                :codigo
                        )

                        OR (
                            :tipo = 'municipio'
                            AND e."CO_MUNICIPIO" =
                                :codigo
                        )
                    )

                GROUP BY
                    d."NU_ANO_CENSO"

                ORDER BY
                    d."NU_ANO_CENSO"
            """)
        },

        "turmas": {
            "total": text("""
                SELECT
                    t."NU_ANO_CENSO" AS ano,
                    SUM(
                        COALESCE(
                            t."QT_TUR_BAS",
                            0
                        )
                    ) AS valor

                FROM fato_turma t

                JOIN dim_escola e
                    ON e."CO_ENTIDADE" =
                       t."CO_ENTIDADE"

                WHERE
                    (
                        :tipo = 'pais'

                        OR (
                            :tipo = 'regiao'
                            AND e."CO_REGIAO" =
                                :codigo
                        )

                        OR (
                            :tipo = 'uf'
                            AND e."CO_UF" =
                                :codigo
                        )

                        OR (
                            :tipo = 'municipio'
                            AND e."CO_MUNICIPIO" =
                                :codigo
                        )
                    )

                GROUP BY
                    t."NU_ANO_CENSO"

                ORDER BY
                    t."NU_ANO_CENSO"
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
                "tipo": tipo,
                "codigo": codigo
            }
        ).fetchall()

    data = [
        {
            "ano": row.ano,
            "valor": row.valor
        }
        for row in result
    ]

    return calculate_time_series_summary(
        data
    )


@evolution_bp.route('/api/divisoes/evolucao')
def generate_division_evolution_charts():
    try:
        tipo = request.args.get("tipo")
        codigo = request.args.get(
            "codigo",
            type=int
        )

        if not tipo or codigo is None:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Parâmetros 'tipo' e 'codigo' "
                    "são obrigatórios."
            }), 400

        tipos_validos = {
            "pais",
            "regiao",
            "uf",
            "municipio"
        }

        if tipo not in tipos_validos:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Tipo de divisão administrativa inválido."
            }), 400

        questions = {
            "matriculas": {
                "total": 95,
                "variacao": 98,
                "evolucao_modalidade": 101,
                "participacao_modalidade": 104,
                "crescimento_modalidade": 108,
                "evolucao_genero": 107,
                "participacao_genero": 111,
                "evolucao_raca": 112,
                "participacao_raca": 113,
                "crescimento_raca": 114
            },

            "docentes": {
                "total": 96,
                "variacao": 99,
                "evolucao_modalidade": 102,
                "participacao_modalidade": 105,
                "crescimento_modalidade": 109
            },

            "turmas": {
                "total": 97,
                "variacao": 100,
                "evolucao_modalidade": 103,
                "participacao_modalidade": 106,
                "crescimento_modalidade": 110
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
                        "tipo": tipo,
                        "codigo": codigo
                    },

                    "exp": round(
                        (
                            datetime.datetime.now(
                                datetime.timezone.utc
                            )
                            + datetime.timedelta(
                                minutes=30
                            )
                        ).timestamp()
                    )
                }

                token = jwt.encode(
                    payload,
                    METABASE_SECRET_KEY,
                    algorithm="HS256"
                )

                urls[categoria][nome] = (
                    f"{METABASE_SITE_URL}/embed/"
                    f"question/{token}"
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


@evolution_bp.route('/api/evolucao/<int:school_code>')
def generate_evolution_charts(school_code):
    try:
        questions = {
            "matriculas": {
                "total": 54,
                "variacao": 55,
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
            },

            "dependencias": {
                "total": 84
            },

            "acessibilidade": {
                "total": 83
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
                            datetime.datetime.now(
                                datetime.timezone.utc
                            )
                            + datetime.timedelta(
                                minutes=30
                            )
                        ).timestamp()
                    )
                }

                token = jwt.encode(
                    payload,
                    METABASE_SECRET_KEY,
                    algorithm="HS256"
                )

                urls[categoria][nome] = (
                    f"{METABASE_SITE_URL}/embed/"
                    f"question/{token}"
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


@evolution_bp.route(
    '/api/evolucao/resumo/<int:school_code>/<categoria>/<indicador>'
)
def evolution_summary(
    school_code,
    categoria,
    indicador
):
    summary = get_evolution_summary(
        school_code,
        categoria,
        indicador
    )

    if summary is None:
        return jsonify({
            "erro":
                "Categoria ou indicador inválido."
        }), 404

    return jsonify(summary)


@evolution_bp.route(
    "/api/divisoes/evolucao/resumo/<categoria>/<indicador>"
)
def division_evolution_summary(
    categoria,
    indicador
):
    try:
        tipo = request.args.get("tipo")

        codigo = request.args.get(
            "codigo",
            type=int
        )

        tipos_validos = {
            "pais",
            "regiao",
            "uf",
            "municipio"
        }

        if tipo not in tipos_validos:
            return jsonify({
                "erro":
                    "Tipo de divisão administrativa inválido."
            }), 400

        if codigo is None:
            return jsonify({
                "erro":
                    "Código da divisão é obrigatório."
            }), 400

        summary = get_division_evolution_summary(
            tipo,
            codigo,
            categoria,
            indicador
        )

        if summary is None:
            return jsonify({
                "erro":
                    "Categoria ou indicador inválido."
            }), 404

        return jsonify(summary)

    except Exception as e:

        return jsonify({
            "erro": str(e)
        }), 500


@evolution_bp.route(
    '/api/evolucao/estrutura/<int:school_code>'
)
def evolution_structure(school_code):
    try:
        year_param = request.args.get(
            "ano"
        )

        if year_param:

            try:
                year = int(
                    year_param
                )

            except ValueError:

                return jsonify({
                    "erro":
                        "Ano inválido."
                }), 400

        else:
            year = None

        data = get_school_structure_snapshot(
            school_code,
            year
        )

        if data is None:
            return jsonify({
                "erro":
                    "Nenhum dado de estrutura "
                    "encontrado para esta escola."
            }), 404

        return jsonify(data)

    except Exception as e:

        print(
            f"Error fetching structure evolution "
            f"for {school_code}: {e}"
        )

        return jsonify({
            "erro": str(e)
        }), 500