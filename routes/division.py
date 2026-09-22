from flask import Blueprint, jsonify, render_template, request
import datetime
import jwt
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import geopandas as gpd

load_dotenv()

division_bp = Blueprint(
    "division",
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


@division_bp.route('/api/divisoes/ficha')
def get_division_sheet():
    try:
        tipo = request.args.get(
            "tipo",
            ""
        ).strip().lower()

        codigo = request.args.get(
            "codigo",
            ""
        ).strip()

        config = {
            "pais": {
                "table": "dim_pais",
                "column": "ID_PAIS"
            },
            "regiao": {
                "table": "dim_regiao",
                "column": "CD_REGIAO"
            },
            "uf": {
                "table": "dim_uf",
                "column": "CD_UF"
            },
            "municipio": {
                "table": "dim_municipio",
                "column": "CD_MUN"
            }
        }

        if tipo not in config:
            return jsonify({
                "erro":
                    "Tipo de divisão administrativa inválido."
            }), 400

        if not codigo:
            return jsonify({
                "erro":
                    "Código da divisão administrativa não informado."
            }), 400

        try:
            codigo_int = int(codigo)
        except ValueError:
            return jsonify({
                "erro":
                    "Código da divisão administrativa inválido."
            }), 400

        table = config[tipo]["table"]
        column = config[tipo]["column"]

        query = f'''
            SELECT *
            FROM "{table}"
            WHERE "{column}" = :codigo
            LIMIT 1
        '''

        with engine.connect() as conn:
            row = conn.execute(
                text(query),
                {"codigo": codigo_int}
            ).mappings().first()

        if not row:
            return jsonify({
                "erro":
                    "Divisão administrativa não encontrada."
            }), 404

        data = dict(row)

        return jsonify({
            "tipo": tipo,
            "codigo": codigo_int,
            "dados": data
        })

    except Exception as error:
        print(
            "Erro ao carregar ficha administrativa:",
            error
        )

        return jsonify({
            "erro":
                "Erro interno ao carregar a divisão administrativa."
        }), 500


@division_bp.route('/api/divisoes/graficos')
def generate_division_charts():
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
                    "Parâmetros 'tipo' e 'codigo' são obrigatórios."
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
                "modalidade": 89,
                "genero": 91,
                "raca": 93
            },
            "docentes": {
                "modalidade": 88,
                "genero": 92,
                "raca": 94
            },
            "turmas": {
                "modalidade": 90
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
                    f"{METABASE_SITE_URL}/embed/question/{token}"
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


@division_bp.route(
    '/api/busca-divisao/<string:tipo>/<string:text_query>'
)
def search_divisions(tipo, text_query):
    try:
        configs = {
            "regiao": {
                "table": "dim_regiao",
                "code": "CD_REGIAO",
                "name": "NM_REGIAO",
                "description": "Brasil"
            },
            "uf": {
                "table": "dim_uf",
                "code": "CD_UF",
                "name": "NM_UF"
            },
            "municipio": {
                "table": "dim_municipio",
                "code": "CD_MUN",
                "name": "NM_MUN"
            }
        }

        if tipo not in configs:
            return jsonify({
                "erro":
                    "Tipo de divisão administrativa inválido "
                    "para comparação."
            }), 400

        codigo_atual = request.args.get(
            "codigo",
            type=int
        )

        words = text_query.split()

        if not words:
            return jsonify([])

        config = configs[tipo]

        if tipo == "municipio":

            search_clauses = " AND ".join(
                [
                    f'dm."{config["name"]}" ILIKE :word_{i}'
                    for i in range(len(words))
                ]
            )

            query_string = f"""
                SELECT
                    dm."{config["code"]}",
                    dm."{config["name"]}",
                    dm."NM_UF"
                FROM {config["table"]} dm
                WHERE {search_clauses}
            """

        elif tipo == "uf":

            search_clauses = " AND ".join(
                [
                    f'du."{config["name"]}" ILIKE :word_{i}'
                    for i in range(len(words))
                ]
            )

            query_string = f"""
                SELECT
                    du."{config["code"]}",
                    du."{config["name"]}",
                    du."NM_REGIAO"
                FROM {config["table"]} du
                WHERE {search_clauses}
            """

        else:

            search_clauses = " AND ".join(
                [
                    f'dr."{config["name"]}" ILIKE :word_{i}'
                    for i in range(len(words))
                ]
            )

            query_string = f"""
                SELECT
                    dr."{config["code"]}",
                    dr."{config["name"]}"
                FROM {config["table"]} dr
                WHERE {search_clauses}
            """

        params = {
            f"word_{i}": f"%{word}%"
            for i, word in enumerate(words)
        }

        if codigo_atual is not None:

            query_string += f"""
                AND "{config["code"]}" <> :codigo_atual
            """

            params["codigo_atual"] = codigo_atual

        query_string += f"""
            ORDER BY "{config["name"]}"
            LIMIT 100
        """

        query = text(query_string)

        with engine.connect() as connection:
            results = connection.execute(
                query,
                params
            ).fetchall()

        divisions = []

        for row in results:

            if tipo == "regiao":
                descricao = "Brasil"

            elif tipo == "uf":
                descricao = row[2]

            else:
                descricao = row[2]

            divisions.append({
                "codigo": row[0],
                "nome": row[1],
                "descricao": descricao
            })

        return jsonify(divisions)

    except Exception as e:
        print(
            f"Error in division search route: {e}"
        )

        return jsonify({
            "erro": str(e)
        }), 500


@division_bp.route('/api/divisoes/escolas')
def get_division_schools():
    try:
        dependencia_map = {
            "federal": 1,
            "estadual": 2,
            "municipal": 3,
            "privada": 4
        }

        localizacao_map = {
            "urbano": 1,
            "rural": 2
        }

        tipo = request.args.get("tipo")
        codigo = request.args.get(
            "codigo",
            type=int
        )
        categoria = request.args.get("categoria")
        filtro = request.args.get("filtro")

        limite = request.args.get(
            "limite",
            default=10,
            type=int
        )

        offset = request.args.get(
            "offset",
            default=0,
            type=int
        )

        tipos_validos = {
            "pais",
            "regiao",
            "uf",
            "municipio"
        }

        categorias_validas = {
            "modalidade",
            "dependencia",
            "localizacao"
        }

        if tipo not in tipos_validos:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Tipo de divisão administrativa inválido."
            }), 400

        if codigo is None:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Código da divisão é obrigatório."
            }), 400

        if categoria not in categorias_validas:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Categoria de filtro inválida."
            }), 400

        if not filtro:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Filtro escolar é obrigatório."
            }), 400

        query = """
            SELECT
                e."CO_ENTIDADE",
                e."NO_ENTIDADE",
                e."NO_MUNICIPIO",
                e."SG_UF",
                e."LATITUDE",
                e."LONGITUDE",
                COUNT(*) OVER() AS total
            FROM dim_escola e
            WHERE e."TP_SITUACAO_FUNCIONAMENTO" = 1
        """

        params = {
            "limite": limite,
            "offset": offset
        }

        if tipo == "regiao":

            query += """
                AND e."CO_REGIAO" = :codigo
            """

            params["codigo"] = codigo

        elif tipo == "uf":

            query += """
                AND e."CO_UF" = :codigo
            """

            params["codigo"] = codigo

        elif tipo == "municipio":

            query += """
                AND e."CO_MUNICIPIO" = :codigo
            """

            params["codigo"] = codigo

        if categoria == "dependencia":

            dependencia = dependencia_map.get(
                filtro
            )

            if dependencia is None:
                return jsonify({
                    "sucesso": False,
                    "erro":
                        "Dependência administrativa inválida."
                }), 400

            query += """
                AND e."TP_DEPENDENCIA" = :dependencia
            """

            params["dependencia"] = dependencia

        elif categoria == "localizacao":

            localizacao = localizacao_map.get(
                filtro
            )

            if localizacao is None:
                return jsonify({
                    "sucesso": False,
                    "erro":
                        "Localização inválida."
                }), 400

            query += """
                AND e."TP_LOCALIZACAO" = :localizacao
            """

            params["localizacao"] = localizacao

        elif categoria == "modalidade":

            filter_map = {
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

            if filtro == "tecnico":

                query += """
                    AND EXISTS (
                        SELECT 1
                        FROM fato_curso c
                        WHERE c."CO_ENTIDADE" =
                              e."CO_ENTIDADE"
                          AND c."NU_ANO_CENSO" = 2025
                    )
                """

            elif filtro in filter_map:

                query += f"""
                    AND EXISTS (
                        SELECT 1
                        FROM fato_turma t
                        WHERE t."CO_ENTIDADE" =
                              e."CO_ENTIDADE"
                          AND t."NU_ANO_CENSO" = 2025
                          AND {filter_map[filtro]}
                    )
                """

            else:
                return jsonify({
                    "sucesso": False,
                    "erro":
                        "Modalidade inválida."
                }), 400

        query += """
            ORDER BY e."NO_ENTIDADE"
            LIMIT :limite
            OFFSET :offset
        """

        with engine.connect() as connection:

            results = connection.execute(
                text(query),
                params
            ).fetchall()

        total = (
            int(results[0][6])
            if results
            else 0
        )

        escolas = [
            {
                "codigo": row[0],
                "nome": row[1],
                "cidade": row[2],
                "estado": row[3],
                "lat": (
                    float(row[4])
                    if row[4] is not None
                    else None
                ),
                "lng": (
                    float(row[5])
                    if row[5] is not None
                    else None
                )
            }
            for row in results
        ]

        return jsonify({
            "sucesso": True,
            "escolas": escolas,
            "total": total,
            "limite": limite,
            "offset": offset,
            "quantidade": len(escolas)
        })

    except Exception as e:

        print(
            f"Error in division schools route: {e}"
        )

        return jsonify({
            "sucesso": False,
            "erro": str(e)
        }), 500


@division_bp.route('/divisao/<tipo>/<int:codigo>')
def division_page(tipo, codigo):

    tipos_validos = {
        "pais",
        "regiao",
        "uf",
        "municipio"
    }

    if tipo not in tipos_validos:
        return (
            "Divisão administrativa inválida.",
            404
        )

    return render_template(
        "division.html",
        tipo=tipo,
        codigo=codigo
    )


@division_bp.route('/api/divisoes/filhas')
def get_child_divisions():
    try:
        tipo = request.args.get(
            "tipo",
            ""
        ).strip().lower()

        codigo = request.args.get(
            "codigo",
            ""
        ).strip()

        try:
            limite = int(
                request.args.get(
                    "limite",
                    10
                )
            )

            offset = int(
                request.args.get(
                    "offset",
                    0
                )
            )

        except ValueError:
            return jsonify({
                "erro":
                    "Limite ou offset inválido."
            }), 400

        if limite <= 0:
            limite = 10

        if offset < 0:
            offset = 0

        config = {
            "pais": {
                "table": "dim_regiao",
                "codigo": "CD_REGIAO",
                "nome": "NM_REGIAO",
                "parent_column": None
            },

            "regiao": {
                "table": "dim_uf",
                "codigo": "CD_UF",
                "nome": "NM_UF",
                "parent_column": "CD_REGIAO"
            },

            "uf": {
                "table": "dim_municipio",
                "codigo": "CD_MUN",
                "nome": "NM_MUN",
                "parent_column": "CD_UF"
            }
        }

        if tipo == "municipio":

            return jsonify({
                "tipo": tipo,
                "codigo": (
                    int(codigo)
                    if codigo
                    else None
                ),
                "divisoes": [],
                "tem_mais": False
            })

        if tipo not in config:
            return jsonify({
                "erro":
                    "Tipo de divisão administrativa inválido."
            }), 400

        if not codigo:
            return jsonify({
                "erro":
                    "Código da divisão administrativa não informado."
            }), 400

        try:
            codigo_int = int(codigo)

        except ValueError:
            return jsonify({
                "erro":
                    "Código da divisão administrativa inválido."
            }), 400

        item = config[tipo]

        table = item["table"]
        codigo_column = item["codigo"]
        nome_column = item["nome"]
        parent_column = item["parent_column"]

        if parent_column is None:

            query = text(f'''
                SELECT
                    "{codigo_column}" AS codigo,
                    "{nome_column}" AS nome
                FROM "{table}"
                ORDER BY "{codigo_column}"
                LIMIT :limite
                OFFSET :offset
            ''')

            count_query = text(f'''
                SELECT COUNT(*)
                FROM "{table}"
            ''')

            params = {
                "limite": limite,
                "offset": offset
            }

        else:

            query = text(f'''
                SELECT
                    "{codigo_column}" AS codigo,
                    "{nome_column}" AS nome
                FROM "{table}"
                WHERE "{parent_column}" = :codigo
                ORDER BY "{codigo_column}"
                LIMIT :limite
                OFFSET :offset
            ''')

            count_query = text(f'''
                SELECT COUNT(*)
                FROM "{table}"
                WHERE "{parent_column}" = :codigo
            ''')

            params = {
                "codigo": codigo_int,
                "limite": limite,
                "offset": offset
            }

        with engine.connect() as conn:

            rows = conn.execute(
                query,
                params
            ).mappings().all()

            if parent_column is None:

                total = conn.execute(
                    count_query
                ).scalar_one()

            else:

                total = conn.execute(
                    count_query,
                    {
                        "codigo": codigo_int
                    }
                ).scalar_one()

        divisoes = [
            {
                "codigo": int(
                    row["codigo"]
                ),
                "nome": row["nome"]
            }
            for row in rows
        ]

        return jsonify({
            "tipo": tipo,
            "codigo": codigo_int,
            "divisoes": divisoes,
            "total": total,
            "offset": offset,
            "limite": limite,
            "tem_mais": (
                offset + len(divisoes)
            ) < total
        })

    except Exception as error:

        print(
            "Erro ao carregar divisões filhas:",
            error
        )

        return jsonify({
            "erro": (
                "Erro interno ao carregar "
                "as divisões administrativas."
            )
        }), 500


@division_bp.route('/api/divisoes/indicadores')
def get_division_indicators():
    try:
        tipo = request.args.get(
            "tipo",
            ""
        ).strip().lower()

        codigo = request.args.get(
            "codigo",
            ""
        ).strip()

        division_config = {
            "pais": {
                "column": None
            },
            "regiao": {
                "column": "CO_REGIAO"
            },
            "uf": {
                "column": "CO_UF"
            },
            "municipio": {
                "column": "CO_MUNICIPIO"
            }
        }

        if tipo not in division_config:
            return jsonify({
                "erro":
                    "Tipo de divisão administrativa inválido."
            }), 400

        if not codigo:
            return jsonify({
                "erro":
                    "Código da divisão administrativa não informado."
            }), 400

        try:
            codigo_int = int(codigo)

        except ValueError:
            return jsonify({
                "erro":
                    "Código da divisão administrativa inválido."
            }), 400

        config = division_config[tipo]

        year = 2025

        params = {
            "ano": year,
            "codigo": codigo_int
        }

        if config["column"] is None:
            school_filter = ""

        else:
            school_filter = f'''
                AND e."{config["column"]}" = :codigo
            '''

        matricula_query = text(f'''
            SELECT
                COALESCE(
                    SUM(m."QT_MAT_BAS"),
                    0
                ) AS basica,

                COALESCE(
                    SUM(m."QT_MAT_INF_CRE"),
                    0
                ) AS creche,

                COALESCE(
                    SUM(m."QT_MAT_INF_PRE"),
                    0
                ) AS pre_escola,

                COALESCE(
                    SUM(m."QT_MAT_FUND_AI"),
                    0
                ) AS fund_ai,

                COALESCE(
                    SUM(m."QT_MAT_FUND_AF"),
                    0
                ) AS fund_af,

                COALESCE(
                    SUM(m."QT_MAT_MED"),
                    0
                ) AS medio,

                COALESCE(
                    SUM(m."QT_MAT_PROF"),
                    0
                ) AS profissional,

                COALESCE(
                    SUM(m."QT_MAT_EJA_FUND"),
                    0
                ) AS eja_fund,

                COALESCE(
                    SUM(m."QT_MAT_EJA_MED"),
                    0
                ) AS eja_med,

                COALESCE(
                    SUM(m."QT_MAT_ESP"),
                    0
                ) AS especial,

                COALESCE(
                    SUM(m."QT_MAT_BAS_MASC"),
                    0
                ) AS masculino,

                COALESCE(
                    SUM(m."QT_MAT_BAS_FEM"),
                    0
                ) AS feminino,

                COALESCE(
                    SUM(m."QT_MAT_BAS_ND"),
                    0
                ) AS nao_declarado,

                COALESCE(
                    SUM(m."QT_MAT_BAS_BRANCA"),
                    0
                ) AS branca,

                COALESCE(
                    SUM(m."QT_MAT_BAS_PRETA"),
                    0
                ) AS preta,

                COALESCE(
                    SUM(m."QT_MAT_BAS_PARDA"),
                    0
                ) AS parda,

                COALESCE(
                    SUM(m."QT_MAT_BAS_AMARELA"),
                    0
                ) AS amarela,

                COALESCE(
                    SUM(m."QT_MAT_BAS_INDIGENA"),
                    0
                ) AS indigena

            FROM "fato_matricula" m

            INNER JOIN "dim_escola" e
                ON e."CO_ENTIDADE" =
                   m."CO_ENTIDADE"

            WHERE m."NU_ANO_CENSO" = :ano
                AND e."TP_SITUACAO_FUNCIONAMENTO" = 1
                {school_filter}
        ''')

        docente_query = text(f'''
            SELECT
                COALESCE(
                    SUM(d."QT_DOC_BAS"),
                    0
                ) AS basica,

                COALESCE(
                    SUM(d."QT_DOC_INF_CRE"),
                    0
                ) AS creche,

                COALESCE(
                    SUM(d."QT_DOC_INF_PRE"),
                    0
                ) AS pre_escola,

                COALESCE(
                    SUM(d."QT_DOC_FUND_AI"),
                    0
                ) AS fund_ai,

                COALESCE(
                    SUM(d."QT_DOC_FUND_AF"),
                    0
                ) AS fund_af,

                COALESCE(
                    SUM(d."QT_DOC_MED"),
                    0
                ) AS medio,

                COALESCE(
                    SUM(d."QT_DOC_PROF"),
                    0
                ) AS profissional,

                COALESCE(
                    SUM(d."QT_DOC_EJA"),
                    0
                ) AS eja,

                COALESCE(
                    SUM(d."QT_DOC_ESP"),
                    0
                ) AS especial,

                COALESCE(
                    SUM(d."QT_DOC_BAS_MASC"),
                    0
                ) AS masculino,

                COALESCE(
                    SUM(d."QT_DOC_BAS_FEM"),
                    0
                ) AS feminino,

                COALESCE(
                    SUM(d."QT_DOC_BAS_ND"),
                    0
                ) AS nao_declarado,

                COALESCE(
                    SUM(d."QT_DOC_BAS_BRANCA"),
                    0
                ) AS branca,

                COALESCE(
                    SUM(d."QT_DOC_BAS_PRETA"),
                    0
                ) AS preta,

                COALESCE(
                    SUM(d."QT_DOC_BAS_PARDA"),
                    0
                ) AS parda,

                COALESCE(
                    SUM(d."QT_DOC_BAS_AMARELA"),
                    0
                ) AS amarela,

                COALESCE(
                    SUM(d."QT_DOC_BAS_INDIGENA"),
                    0
                ) AS indigena

            FROM "fato_docente" d

            INNER JOIN "dim_escola" e
                ON e."CO_ENTIDADE" =
                   d."CO_ENTIDADE"

            WHERE d."NU_ANO_CENSO" = :ano
                AND e."TP_SITUACAO_FUNCIONAMENTO" = 1
                {school_filter}
        ''')

        turma_query = text(f'''
            SELECT
                COALESCE(
                    SUM(t."QT_TUR_INF_CRE"),
                    0
                ) AS creche,

                COALESCE(
                    SUM(t."QT_TUR_INF_PRE"),
                    0
                ) AS pre_escola,

                COALESCE(
                    SUM(t."QT_TUR_FUND_AI"),
                    0
                ) AS fund_ai,

                COALESCE(
                    SUM(t."QT_TUR_FUND_AF"),
                    0
                ) AS fund_af,

                COALESCE(
                    SUM(t."QT_TUR_MED"),
                    0
                ) AS medio,

                COALESCE(
                    SUM(t."QT_TUR_PROF"),
                    0
                ) AS profissional,

                COALESCE(
                    SUM(t."QT_TUR_EJA"),
                    0
                ) AS eja,

                COALESCE(
                    SUM(t."QT_TUR_ESP"),
                    0
                ) AS especial

            FROM "fato_turma" t

            INNER JOIN "dim_escola" e
                ON e."CO_ENTIDADE" =
                   t."CO_ENTIDADE"

            WHERE t."NU_ANO_CENSO" = :ano
                AND e."TP_SITUACAO_FUNCIONAMENTO" = 1
                {school_filter}
        ''')

        with engine.connect() as conn:

            matriculas = conn.execute(
                matricula_query,
                params
            ).mappings().first()

            docentes = conn.execute(
                docente_query,
                params
            ).mappings().first()

            turmas = conn.execute(
                turma_query,
                params
            ).mappings().first()

        return jsonify({
            "ano": year,
            "tipo": tipo,
            "codigo": codigo_int,
            "matriculas": dict(
                matriculas
            ),
            "docentes": dict(
                docentes
            ),
            "turmas": dict(
                turmas
            )
        })

    except Exception as error:

        print(
            "Erro ao carregar indicadores da divisão:",
            error
        )

        return jsonify({
            "erro":
                "Erro interno ao carregar os "
                "indicadores da divisão."
        }), 500


@division_bp.route('/api/divisoes/pais')
def get_country():
    try:
        query = """
            SELECT
                "ID_PAIS",
                "Pais",
                "AREA_KM2"
            FROM dim_pais
            ORDER BY "ID_PAIS"
        """

        with engine.connect() as connection:

            results = connection.execute(
                text(query)
            ).fetchall()

        paises = [
            {
                "codigo": int(row[0]),
                "nome": row[1],
                "area_km2": float(row[2])
            }
            for row in results
        ]

        return jsonify(paises)

    except Exception as e:

        print(
            f"Error fetching countries: {e}"
        )

        return jsonify({
            "erro": str(e)
        }), 500


@division_bp.route('/api/divisoes/regioes')
def get_regions():
    try:
        query = """
            SELECT
                "CD_REGIAO",
                "NM_REGIAO",
                "SIGLA_RG"
            FROM dim_regiao
            ORDER BY "CD_REGIAO"
        """

        with engine.connect() as connection:

            results = connection.execute(
                text(query)
            ).fetchall()

        regioes = [
            {
                "codigo": int(row[0]),
                "nome": row[1],
                "sigla": row[2]
            }
            for row in results
        ]

        return jsonify(regioes)

    except Exception as e:

        print(
            f"Error fetching regions: {e}"
        )

        return jsonify({
            "erro": str(e)
        }), 500


@division_bp.route('/api/divisoes/ufs')
def get_ufs():
    try:
        regiao = request.args.get(
            "regiao",
            ""
        ).strip()

        if not regiao:
            return jsonify({
                "erro":
                    "Grande Região não informada."
            }), 400

        try:
            regiao = int(regiao)

        except ValueError:
            return jsonify({
                "erro":
                    "Código de Grande Região inválido."
            }), 400

        query = """
            SELECT
                "CD_UF",
                "NM_UF",
                "SIGLA_UF"
            FROM dim_uf
            WHERE "CD_REGIAO" = :regiao
            ORDER BY "NM_UF"
        """

        with engine.connect() as connection:

            results = connection.execute(
                text(query),
                {
                    "regiao": regiao
                }
            ).fetchall()

        ufs = [
            {
                "codigo": int(row[0]),
                "nome": row[1],
                "sigla": row[2]
            }
            for row in results
        ]

        return jsonify(ufs)

    except Exception as e:

        print(
            f"Error fetching UFs: {e}"
        )

        return jsonify({
            "erro": str(e)
        }), 500


@division_bp.route('/api/divisoes/municipios')
def get_municipios():
    try:
        uf = request.args.get(
            "uf",
            ""
        ).strip()

        if not uf:
            return jsonify({
                "erro":
                    "Unidade Federativa não informada."
            }), 400

        try:
            uf = int(uf)

        except ValueError:
            return jsonify({
                "erro":
                    "Código de Unidade Federativa inválido."
            }), 400

        query = """
            SELECT
                "CD_MUN",
                "NM_MUN"
            FROM dim_municipio
            WHERE "CD_UF" = :uf
            ORDER BY "NM_MUN"
        """

        with engine.connect() as connection:

            results = connection.execute(
                text(query),
                {
                    "uf": uf
                }
            ).fetchall()

        municipios = [
            {
                "codigo": int(row[0]),
                "nome": row[1]
            }
            for row in results
        ]

        return jsonify(municipios)

    except Exception as e:

        print(
            f"Error fetching municipalities: {e}"
        )

        return jsonify({
            "erro": str(e)
        }), 500


@division_bp.route('/api/divisoes/geometria')
def get_division_geometry():
    try:
        tipo = request.args.get(
            "tipo",
            ""
        ).lower().strip()

        codigo = request.args.get(
            "codigo",
            ""
        ).strip()

        shapefile_map = {
            "regiao": {
                "path":
                    "shapefiles/regioes/BR_Regioes_2025.shp",
                "column":
                    "CD_REGIAO"
            },
            "uf": {
                "path":
                    "shapefiles/uf/BR_UF_2025.shp",
                "column":
                    "CD_UF"
            },
            "municipio": {
                "path":
                    "shapefiles/municipios/BR_Municipios_2025.shp",
                "column":
                    "CD_MUN"
            },
            "pais": {
                "path":
                    "shapefiles/pais/BR_Pais_2025.shp",
                "column":
                    "Pais"
            }
        }

        if tipo not in shapefile_map:
            return jsonify({
                "erro":
                    "Tipo de divisão inválido."
            }), 400

        if not codigo:
            return jsonify({
                "erro":
                    "Código da divisão não informado."
            }), 400

        config = shapefile_map[tipo]

        gdf = gpd.read_file(
            config["path"]
        )

        if tipo == "pais":

            if codigo != "1":
                return jsonify({
                    "erro":
                        "País não encontrado."
                }), 404

            if gdf.empty:
                return jsonify({
                    "erro":
                        "Geometria do país não encontrada."
                }), 404

            return gdf.to_json()

        gdf[config["column"]] = (
            gdf[config["column"]]
            .astype(str)
        )

        division = gdf[
            gdf[config["column"]] == codigo
        ]

        if division.empty:
            return jsonify({
                "erro":
                    "Divisão administrativa não encontrada."
            }), 404

        return division.to_json()

    except Exception as e:

        print(
            f"Error fetching division geometry: {e}"
        )

        return jsonify({
            "erro": str(e)
        }), 500