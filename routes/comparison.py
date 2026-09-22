from flask import Blueprint, jsonify, request
import datetime
import jwt
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

from routes.school import get_school_structure_snapshot

load_dotenv()

comparison_bp = Blueprint(
    "comparison",
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


def get_comparison_data(
    school_code,
    comparison_school_code,
    categoria,
    indicador,
    filtro=None
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
        },

        "dependencias": {
            "total": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    (
                        COALESCE("IN_AREA_PLANTIO", 0) +
                        COALESCE("IN_AREA_VERDE", 0) +
                        COALESCE("IN_AUDITORIO", 0) +
                        COALESCE("IN_BIBLIOTECA", 0) +
                        COALESCE("IN_LABORATORIO_CIENCIAS", 0) +
                        COALESCE("IN_LABORATORIO_INFORMATICA", 0) +
                        COALESCE("IN_QUADRA_ESPORTES_COBERTA", 0) +
                        COALESCE("IN_QUADRA_ESPORTES_DESCOBERTA", 0) +
                        COALESCE("IN_SALA_ATELIE_ARTES", 0) +
                        COALESCE("IN_SALA_MUSICA_CORAL", 0) +
                        COALESCE("IN_SALA_ESTUDIO_DANCA", 0) +
                        COALESCE("IN_SALA_MULTIUSO", 0) +
                        COALESCE("IN_SALA_ESTUDIO_GRAVACAO", 0) +
                        COALESCE("IN_SALA_PROFESSOR", 0) +
                        COALESCE("IN_SALA_ATENDIMENTO_ESPECIAL", 0) +
                        COALESCE("IN_REFEITORIO", 0)
                    ) AS valor
                FROM fato_estrutura
                WHERE "CO_ENTIDADE" = :codigo
                ORDER BY "NU_ANO_CENSO"
            """)
        },

        "acessibilidade": {
            "total": text("""
                SELECT
                    "NU_ANO_CENSO" AS ano,
                    (
                        COALESCE("IN_BANHEIRO_PNE", 0) +
                        COALESCE("IN_ACESSIBILIDADE_CORRIMAO", 0) +
                        COALESCE("IN_ACESSIBILIDADE_ELEVADOR", 0) +
                        COALESCE("IN_ACESSIBILIDADE_PISOS_TATEIS", 0) +
                        COALESCE("IN_ACESSIBILIDADE_VAO_LIVRE", 0) +
                        COALESCE("IN_ACESSIBILIDADE_RAMPAS", 0) +
                        COALESCE("IN_ACESSIBILIDADE_SINAL_SONORO", 0) +
                        COALESCE("IN_ACESSIBILIDADE_SINAL_TATIL", 0) +
                        COALESCE("IN_ACESSIBILIDADE_SINAL_VISUAL", 0)
                    ) AS valor
                FROM fato_estrutura
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
        set(main_by_year) &
        set(comparison_by_year)
    )

    comparison = None

    if common_years:

        ano = common_years[-1]

        valor_principal = (
            main_by_year[ano]
        )

        valor_comparado = (
            comparison_by_year[ano]
        )

        diferenca = (
            valor_principal -
            valor_comparado
        )

        comparison = {
            "ano": ano,
            "valor_principal":
                valor_principal,
            "valor_comparado":
                valor_comparado,
            "diferenca":
                diferenca
        }

    return {
        "escola_principal":
            main_data,

        "escola_comparada":
            comparison_data,

        "comparacao":
            comparison
    }


def get_division_comparison_data(
    tipo,
    codigo,
    tipo_comparacao,
    codigo_comparacao,
    categoria,
    indicador,
    filtro=None
):
    metric_queries = {
        "matriculas": {
            "total": """
                SUM(m."QT_MAT_BAS")
            """,

            "modalidade": """
                SUM(
                    CASE
                        WHEN :filtro = 'Educação Infantil - Creche'
                            THEN m."QT_MAT_INF_CRE"
                        WHEN :filtro = 'Educação Infantil - Pré-Escola'
                            THEN m."QT_MAT_INF_PRE"
                        WHEN :filtro = 'Ensino Fundamental - Anos Iniciais'
                            THEN m."QT_MAT_FUND_AI"
                        WHEN :filtro = 'Ensino Fundamental - Anos Finais'
                            THEN m."QT_MAT_FUND_AF"
                        WHEN :filtro = 'Ensino Médio'
                            THEN m."QT_MAT_MED"
                        WHEN :filtro = 'Educação Profissional'
                            THEN m."QT_MAT_PROF"
                        WHEN :filtro = 'Educação de Jovens e Adultos (EJA)'
                            THEN m."QT_MAT_EJA"
                        WHEN :filtro = 'Educação Especial'
                            THEN m."QT_MAT_ESP"
                        ELSE 0
                    END
                )
            """,

            "genero": """
                SUM(
                    CASE
                        WHEN :filtro = 'Masculino'
                            THEN m."QT_MAT_BAS_MASC"
                        WHEN :filtro = 'Feminino'
                            THEN m."QT_MAT_BAS_FEM"
                        ELSE 0
                    END
                )
            """,

            "raca": """
                SUM(
                    CASE
                        WHEN :filtro = 'Não Declarada'
                            THEN m."QT_MAT_BAS_ND"
                        WHEN :filtro = 'Branca'
                            THEN m."QT_MAT_BAS_BRANCA"
                        WHEN :filtro = 'Preta'
                            THEN m."QT_MAT_BAS_PRETA"
                        WHEN :filtro = 'Parda'
                            THEN m."QT_MAT_BAS_PARDA"
                        WHEN :filtro = 'Amarela'
                            THEN m."QT_MAT_BAS_AMARELA"
                        WHEN :filtro = 'Indígena'
                            THEN m."QT_MAT_BAS_INDIGENA"
                        ELSE 0
                    END
                )
            """
        },

        "docentes": {
            "total": """
                SUM(d."QT_DOC_BAS")
            """,

            "modalidade": """
                SUM(
                    CASE
                        WHEN :filtro = 'Educação Infantil - Creche'
                            THEN d."QT_DOC_INF_CRE"
                        WHEN :filtro = 'Educação Infantil - Pré-Escola'
                            THEN d."QT_DOC_INF_PRE"
                        WHEN :filtro = 'Ensino Fundamental - Anos Iniciais'
                            THEN d."QT_DOC_FUND_AI"
                        WHEN :filtro = 'Ensino Fundamental - Anos Finais'
                            THEN d."QT_DOC_FUND_AF"
                        WHEN :filtro = 'Ensino Médio'
                            THEN d."QT_DOC_MED"
                        WHEN :filtro = 'Educação Profissional'
                            THEN d."QT_DOC_PROF"
                        WHEN :filtro = 'Educação de Jovens e Adultos (EJA)'
                            THEN d."QT_DOC_EJA"
                        WHEN :filtro = 'Educação Especial'
                            THEN d."QT_DOC_ESP"
                        ELSE 0
                    END
                )
            """
        },

        "turmas": {
            "total": """
                SUM(t."QT_TUR_BAS")
            """,

            "modalidade": """
                SUM(
                    CASE
                        WHEN :filtro = 'Educação Infantil - Creche'
                            THEN t."QT_TUR_INF_CRE"
                        WHEN :filtro = 'Educação Infantil - Pré-Escola'
                            THEN t."QT_TUR_INF_PRE"
                        WHEN :filtro = 'Ensino Fundamental - Anos Iniciais'
                            THEN t."QT_TUR_FUND_AI"
                        WHEN :filtro = 'Ensino Fundamental - Anos Finais'
                            THEN t."QT_TUR_FUND_AF"
                        WHEN :filtro = 'Ensino Médio'
                            THEN t."QT_TUR_MED"
                        WHEN :filtro = 'Educação Profissional'
                            THEN t."QT_TUR_PROF"
                        WHEN :filtro = 'Educação de Jovens e Adultos (EJA)'
                            THEN t."QT_TUR_EJA"
                        WHEN :filtro = 'Educação Especial'
                            THEN t."QT_TUR_ESP"
                        ELSE 0
                    END
                )
            """
        }
    }

    if categoria not in metric_queries:
        return None

    if indicador not in metric_queries[categoria]:
        return None

    metric = metric_queries[categoria][indicador]

    if categoria == "matriculas":

        table = "fato_matricula"
        alias = "m"

    elif categoria == "docentes":

        table = "fato_docente"
        alias = "d"

    else:

        table = "fato_turma"
        alias = "t"

    query = text(f"""
        SELECT
            {alias}."NU_ANO_CENSO" AS ano,
            {metric} AS valor

        FROM {table} {alias}

        JOIN dim_escola e
            ON e."CO_ENTIDADE" =
               {alias}."CO_ENTIDADE"

        WHERE
            (
                :tipo = 'pais'

                OR (
                    :tipo = 'regiao'
                    AND e."CO_REGIAO" = :codigo
                )

                OR (
                    :tipo = 'uf'
                    AND e."CO_UF" = :codigo
                )

                OR (
                    :tipo = 'municipio'
                    AND e."CO_MUNICIPIO" = :codigo
                )
            )

        GROUP BY
            {alias}."NU_ANO_CENSO"

        ORDER BY
            {alias}."NU_ANO_CENSO"
    """)

    params_main = {
        "tipo": tipo,
        "codigo": codigo,
        "filtro": filtro
    }

    params_comparison = {
        "tipo": tipo_comparacao,
        "codigo": codigo_comparacao,
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
        set(main_by_year) &
        set(comparison_by_year)
    )

    comparison = None

    if common_years:

        ano = common_years[-1]

        valor_principal = (
            main_by_year[ano]
        )

        valor_comparado = (
            comparison_by_year[ano]
        )

        diferenca = (
            valor_principal -
            valor_comparado
        )

        comparison = {
            "ano": ano,
            "valor_principal":
                valor_principal,
            "valor_comparado":
                valor_comparado,
            "diferenca":
                diferenca
        }

    return {
        "divisao_principal":
            main_data,

        "divisao_comparada":
            comparison_data,

        "comparacao":
            comparison
    }


@comparison_bp.route(
    "/api/comparacao/<int:school_code>/"
    "<int:comparison_school_code>/"
    "<categoria>/<indicador>"
)
def comparison_data(
    school_code,
    comparison_school_code,
    categoria,
    indicador
):
    filtro = request.args.get(
        "filtro"
    )

    data = get_comparison_data(
        school_code,
        comparison_school_code,
        categoria,
        indicador,
        filtro
    )

    if data is None:
        return jsonify({
            "erro":
                "Categoria ou indicador inválido."
        }), 404

    return jsonify(data)


@comparison_bp.route(
    "/api/comparacao/estrutura/"
    "<int:school_code>/"
    "<int:comparison_code>"
)
def comparison_structure(
    school_code,
    comparison_code
):
    try:
        year_main_param = request.args.get(
            "ano_principal"
        )

        year_comparison_param = request.args.get(
            "ano_comparacao"
        )

        if year_main_param:

            try:
                year_main = int(
                    year_main_param
                )

            except ValueError:

                return jsonify({
                    "erro":
                        "Ano da escola principal inválido."
                }), 400

        else:
            year_main = None

        if year_comparison_param:

            try:
                year_comparison = int(
                    year_comparison_param
                )

            except ValueError:

                return jsonify({
                    "erro":
                        "Ano da escola comparada inválido."
                }), 400

        else:
            year_comparison = None

        main_data = get_school_structure_snapshot(school_code, year_main)

        comparison_data = get_school_structure_snapshot(comparison_code, year_comparison)

        if main_data is None:
            return jsonify({
                "erro":
                    "Nenhum dado de estrutura encontrado "
                    "para a escola principal."
            }), 404

        if comparison_data is None:
            return jsonify({
                "erro":
                    "Nenhum dado de estrutura encontrado "
                    "para a escola comparada."
            }), 404

        return jsonify({
            "escola_principal":
                main_data,

            "escola_comparada":
                comparison_data
        })

    except Exception as e:

        print(
            "Erro ao carregar estrutura da comparação:",
            e
        )

        return jsonify({
            "erro": str(e)
        }), 500


@comparison_bp.route(
    "/api/comparacao/grafico/"
    "<int:school_code>/"
    "<int:comparison_code>/"
    "<string:categoria>/"
    "<string:indicador>"
)
def generate_comparison_chart(
    school_code,
    comparison_code,
    categoria,
    indicador
):
    try:
        filtro = request.args.get(
            "filtro"
        )

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
            },

            "dependencias": {
                "total": 86
            },

            "acessibilidade": {
                "total": 85
            }
        }

        if categoria not in questions:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Categoria inválida."
            }), 400

        if indicador not in questions[categoria]:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Indicador inválido."
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
                    "erro":
                        "É necessário informar um filtro "
                        "para este indicador."
                }), 400

            if filtro not in filter_options[indicador]:
                return jsonify({
                    "sucesso": False,
                    "erro":
                        "Filtro inválido."
                }), 400

        params = {
            "escola": school_code,
            "escola_comparacao":
                comparison_code
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

        url = (
            f"{METABASE_SITE_URL}/embed/question/"
            f"{token}"
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


@comparison_bp.route(
    "/api/divisoes/comparacao/grafico/"
    "<string:categoria>/<string:indicador>"
)
def generate_division_comparison_chart(
    categoria,
    indicador
):
    try:
        tipo = request.args.get(
            "tipo"
        )

        codigo = request.args.get(
            "codigo",
            type=int
        )

        tipo_comparacao = request.args.get(
            "tipo_comparacao"
        )

        codigo_comparacao = request.args.get(
            "codigo_comparacao",
            type=int
        )

        filtro = request.args.get(
            "filtro"
        )

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

        if tipo_comparacao not in tipos_validos:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Tipo de divisão administrativa "
                    "da comparação inválido."
            }), 400

        if codigo is None:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Código da divisão é obrigatório."
            }), 400

        if codigo_comparacao is None:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Código da divisão de comparação "
                    "é obrigatório."
            }), 400

        questions = {
            "matriculas": {
                "total": 115,
                "modalidade": 118,
                "genero": 121,
                "raca": 122
            },

            "docentes": {
                "total": 116,
                "modalidade": 119
            },

            "turmas": {
                "total": 117,
                "modalidade": 120
            }
        }

        if categoria not in questions:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Categoria inválida."
            }), 400

        if indicador not in questions[categoria]:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Indicador inválido."
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
                    "erro":
                        "É necessário informar um filtro "
                        "para este indicador."
                }), 400

            if filtro not in filter_options[indicador]:
                return jsonify({
                    "sucesso": False,
                    "erro":
                        "Filtro inválido."
                }), 400

        params = {
            "tipo": tipo,
            "codigo": codigo,
            "tipo_comparacao":
                tipo_comparacao,
            "codigo_comparacao":
                codigo_comparacao
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

        url = (
            f"{METABASE_SITE_URL}/embed/question/"
            f"{token}"
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


@comparison_bp.route(
    "/api/divisoes/comparacao/"
    "<string:categoria>/<string:indicador>"
)
def division_comparison_data(
    categoria,
    indicador
):
    tipo = request.args.get(
        "tipo"
    )

    codigo = request.args.get(
        "codigo",
        type=int
    )

    tipo_comparacao = request.args.get(
        "tipo_comparacao"
    )

    codigo_comparacao = request.args.get(
        "codigo_comparacao",
        type=int
    )

    filtro = request.args.get(
        "filtro"
    )

    tipos_validos = {
        "pais",
        "regiao",
        "uf",
        "municipio"
    }

    if (
        tipo not in tipos_validos
        or tipo_comparacao not in tipos_validos
        or codigo is None
        or codigo_comparacao is None
    ):
        return jsonify({
            "erro":
                "Parâmetros de divisão inválidos."
        }), 400

    if tipo != tipo_comparacao:
        return jsonify({
            "erro":
                "A comparação deve ser feita entre "
                "divisões do mesmo tipo."
        }), 400

    data = get_division_comparison_data(
        tipo,
        codigo,
        tipo_comparacao,
        codigo_comparacao,
        categoria,
        indicador,
        filtro
    )

    if data is None:
        return jsonify({
            "erro":
                "Categoria ou indicador inválido."
        }), 404

    return jsonify(data)