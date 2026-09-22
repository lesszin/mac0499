from flask import Blueprint, jsonify, request
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

spatial_bp = Blueprint(
    "spatial",
    __name__
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


@spatial_bp.route(
    '/api/analise-espacial/escolas'
)
def get_spatial_analysis_schools():
    try:
        dependencia_map = {
            "federal": 1,
            "estadual": 2,
            "municipal": 3,
            "privada": 4
        }

        modalidade_map = {
            "creche":
                't."QT_TUR_INF_CRE" > 0',

            "pre_escola":
                't."QT_TUR_INF_PRE" > 0',

            "fund_ai":
                't."QT_TUR_FUND_AI" > 0',

            "fund_af":
                't."QT_TUR_FUND_AF" > 0',

            "medio":
                't."QT_TUR_MED" > 0',

            "medio_int":
                't."QT_TUR_PROF" > 0',

            "eja_fund":
                't."QT_TUR_EJA_FUND" > 0',

            "eja_med":
                't."QT_TUR_EJA_MED" > 0',

            "tecnico":
                "tecnico"
        }

        dependencia = request.args.get(
            "dependencia",
            ""
        ).lower()

        modalidade = request.args.get(
            "modalidade",
            ""
        ).lower()

        if (
            dependencia and
            dependencia != "todas"
        ):
            if dependencia not in dependencia_map:
                return jsonify({
                    "erro":
                        "Dependência administrativa inválida."
                }), 400

        if (
            modalidade and
            modalidade != "todas"
        ):
            if modalidade not in modalidade_map:
                return jsonify({
                    "erro":
                        "Modalidade inválida."
                }), 400

        if (
            dependencia not in (
                "",
                "todas"
            )
            and
            modalidade not in (
                "",
                "todas"
            )
        ):
            return jsonify({
                "erro":
                    "Selecione apenas um tipo de filtro."
            }), 400

        query = """
            SELECT
                "LATITUDE",
                "LONGITUDE"
            FROM dim_escola e

            WHERE "TP_SITUACAO_FUNCIONAMENTO" = 1

              AND "LATITUDE" IS NOT NULL
              AND "LONGITUDE" IS NOT NULL
        """

        params = {}

        if (
            dependencia and
            dependencia != "todas"
        ):
            query += """
                AND "TP_DEPENDENCIA" =
                    :dependencia
            """

            params["dependencia"] = (
                dependencia_map[dependencia]
            )

        if (
            modalidade and
            modalidade != "todas"
        ):

            if modalidade == "tecnico":

                query += """
                    AND EXISTS (
                        SELECT 1
                        FROM fato_curso c
                        WHERE c."CO_ENTIDADE" =
                              e."CO_ENTIDADE"
                          AND c."NU_ANO_CENSO" = 2025
                    )
                """

            else:

                query += f"""
                    AND EXISTS (
                        SELECT 1
                        FROM fato_turma t
                        WHERE t."CO_ENTIDADE" =
                              e."CO_ENTIDADE"
                          AND t."NU_ANO_CENSO" = 2025
                          AND {modalidade_map[modalidade]}
                    )
                """

        with engine.connect() as connection:

            results = connection.execute(
                text(query),
                params
            ).fetchall()

        schools = [
            {
                "lat": float(row[0]),
                "lng": float(row[1])
            }
            for row in results
        ]

        return jsonify(schools)

    except Exception as e:

        print(
            "Error fetching schools for "
            f"spatial analysis: {e}"
        )

        return jsonify({
            "erro": str(e)
        }), 500


@spatial_bp.route(
    '/api/analise-espacial/matriculas'
)
def get_spatial_analysis_enrollments():
    try:
        modalidade_map = {
            "total":
                'm."QT_MAT_BAS"',

            "creche":
                'm."QT_MAT_INF_CRE"',

            "pre_escola":
                'm."QT_MAT_INF_PRE"',

            "fund_ai":
                'm."QT_MAT_FUND_AI"',

            "fund_af":
                'm."QT_MAT_FUND_AF"',

            "medio":
                'm."QT_MAT_MED"',

            "medio_int":
                'm."QT_MAT_PROF"',

            "eja_fund":
                'm."QT_MAT_EJA_FUND"',

            "eja_med":
                'm."QT_MAT_EJA_MED"',

            "tecnico":
                'm."QT_MAT_PROF"'
        }

        genero_map = {
            "masculino":
                'm."QT_MAT_BAS_MASC"',

            "feminino":
                'm."QT_MAT_BAS_FEM"'
        }

        raca_cor_map = {
            "nd":
                'm."QT_MAT_BAS_ND"',

            "branca":
                'm."QT_MAT_BAS_BRANCA"',

            "preta":
                'm."QT_MAT_BAS_PRETA"',

            "parda":
                'm."QT_MAT_BAS_PARDA"',

            "amarela":
                'm."QT_MAT_BAS_AMARELA"',

            "indigena":
                'm."QT_MAT_BAS_INDIGENA"'
        }

        tipo = request.args.get(
            "tipo",
            ""
        ).lower()

        indicador = request.args.get(
            "indicador",
            ""
        ).lower()

        if tipo not in (
            "modalidade",
            "genero",
            "raca_cor"
        ):
            return jsonify({
                "erro":
                    "Tipo de indicador inválido."
            }), 400

        if tipo == "modalidade":

            indicador_map = modalidade_map

        elif tipo == "genero":

            indicador_map = genero_map

        else:

            indicador_map = raca_cor_map

        if indicador not in indicador_map:
            return jsonify({
                "erro":
                    "Indicador inválido."
            }), 400

        lat_min = request.args.get(
            "lat_min"
        )

        lat_max = request.args.get(
            "lat_max"
        )

        lng_min = request.args.get(
            "lng_min"
        )

        lng_max = request.args.get(
            "lng_max"
        )

        has_bounds = all(
            v is not None
            for v in [
                lat_min,
                lat_max,
                lng_min,
                lng_max
            ]
        )

        if has_bounds:

            lat_min = float(
                lat_min
            )

            lat_max = float(
                lat_max
            )

            lng_min = float(
                lng_min
            )

            lng_max = float(
                lng_max
            )

        query = f"""
            SELECT
                e."LATITUDE",
                e."LONGITUDE",

                COALESCE(
                    {indicador_map[indicador]},
                    0
                ) AS valor

            FROM dim_escola e

            INNER JOIN fato_matricula m
                ON m."CO_ENTIDADE" =
                   e."CO_ENTIDADE"

            WHERE
                e."TP_SITUACAO_FUNCIONAMENTO" = 1

                AND e."LATITUDE" IS NOT NULL
                AND e."LONGITUDE" IS NOT NULL

                AND m."NU_ANO_CENSO" = 2025

                AND COALESCE(
                    {indicador_map[indicador]},
                    0
                ) > 0
        """

        params = {}

        if has_bounds:

            query += """
                AND e."LATITUDE"
                    BETWEEN :lat_min AND :lat_max

                AND e."LONGITUDE"
                    BETWEEN :lng_min AND :lng_max
            """

            params.update({
                "lat_min": lat_min,
                "lat_max": lat_max,
                "lng_min": lng_min,
                "lng_max": lng_max
            })

        if tipo == "modalidade":

            if indicador == "tecnico":

                query += """
                    AND EXISTS (
                        SELECT 1
                        FROM fato_curso c
                        WHERE c."CO_ENTIDADE" =
                              e."CO_ENTIDADE"

                          AND c."NU_ANO_CENSO" = 2025
                    )
                """

            elif indicador != "total":

                modalidade_filtro = {
                    "creche":
                        't."QT_TUR_INF_CRE" > 0',

                    "pre_escola":
                        't."QT_TUR_INF_PRE" > 0',

                    "fund_ai":
                        't."QT_TUR_FUND_AI" > 0',

                    "fund_af":
                        't."QT_TUR_FUND_AF" > 0',

                    "medio":
                        't."QT_TUR_MED" > 0',

                    "medio_int":
                        't."QT_TUR_PROF" > 0',

                    "eja_fund":
                        't."QT_TUR_EJA_FUND" > 0',

                    "eja_med":
                        't."QT_TUR_EJA_MED" > 0'
                }

                query += f"""
                    AND EXISTS (
                        SELECT 1
                        FROM fato_turma t
                        WHERE t."CO_ENTIDADE" =
                              e."CO_ENTIDADE"

                          AND t."NU_ANO_CENSO" = 2025

                          AND {modalidade_filtro[indicador]}
                    )
                """

        if has_bounds:
            query += " LIMIT 5000"

        with engine.connect() as connection:

            results = connection.execute(
                text(query),
                params
            ).fetchall()

        schools = [
            {
                "lat": float(row[0]),
                "lng": float(row[1]),
                "valor": int(row[2])
            }
            for row in results
        ]

        return jsonify(schools)

    except Exception as e:

        print(
            "Error fetching enrollment data "
            f"for spatial analysis: {e}"
        )

        return jsonify({
            "erro": str(e)
        }), 500