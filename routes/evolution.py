from flask import Blueprint, jsonify, request
import datetime
import jwt
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

from routes.school import get_school_structure_snapshot


# Carrega as variáveis definidas no arquivo de ambiente.
load_dotenv()


evolution_bp = Blueprint(
    "evolution",
    __name__
)


# Configurações utilizadas na geração dos links de incorporação do Metabase.
METABASE_SITE_URL = "http://localhost:3000"
METABASE_SECRET_KEY = os.getenv(
    "METABASE_SECRET_KEY"
)


# Configurações de acesso ao banco de dados.
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv(
    "DB_PORT",
    "5432"
)


# Cria a conexão com o banco de dados PostgreSQL.
engine = create_engine(
    f"postgresql://{DB_USER}:{DB_PASS}@"
    f"{DB_HOST}:{DB_PORT}/{DB_NAME}"
)


def calculate_time_series_summary(data):
    """
    Calcula um resumo estatístico de uma série temporal.

    O resumo considera o primeiro e o último registro, o crescimento
    absoluto e percentual, a maior alta, a maior queda, a quantidade
    de anos com crescimento, queda ou estabilidade e os valores máximo
    e mínimo observados.

    Args:
        data: Lista de registros contendo os campos "ano" e "valor",
            ordenados cronologicamente.

    Returns:
        Um dicionário com os principais indicadores da série temporal.
        Retorna None quando a série possui menos de dois registros.
    """

    # Uma série com menos de dois pontos não permite calcular
    # variações entre períodos.
    if len(data) < 2:
        return None

    inicio = data[0]
    fim = data[-1]

    # Calcula o crescimento absoluto entre o início e o fim da série.
    crescimento = (
        fim["valor"] -
        inicio["valor"]
    )

    # Calcula o crescimento percentual somente quando o valor inicial
    # é diferente de zero.
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

    # Inicializa máximo e mínimo com o primeiro elemento da série.
    maximo = inicio
    minimo = inicio

    # Analisa a variação entre cada par de anos consecutivos.
    for i in range(1, len(data)):

        anterior = data[i - 1]
        atual = data[i]

        diferenca = (
            atual["valor"] -
            anterior["valor"]
        )

        # Classifica a evolução do indicador no período.
        if diferenca > 0:
            anos_crescimento += 1

        elif diferenca < 0:
            anos_queda += 1

        else:
            anos_estavel += 1

        # Atualiza a maior alta encontrada na série.
        if (
            maior_alta is None or
            diferenca > maior_alta["valor"]
        ):
            maior_alta = {
                "de": anterior["ano"],
                "para": atual["ano"],
                "valor": diferenca
            }

        # Atualiza a maior queda encontrada na série.
        if (
            maior_queda is None or
            diferenca < maior_queda["valor"]
        ):
            maior_queda = {
                "de": anterior["ano"],
                "para": atual["ano"],
                "valor": diferenca
            }

        # Atualiza o maior valor observado.
        if atual["valor"] > maximo["valor"]:
            maximo = atual

        # Atualiza o menor valor observado.
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
    """
    Obtém a série histórica de um indicador de uma escola e gera
    o resumo correspondente.

    Args:
        school_code: Código da escola.
        categoria: Categoria do indicador, como matrículas, docentes
            ou turmas.
        indicador: Indicador solicitado dentro da categoria.

    Returns:
        O resumo da série temporal calculado por
        calculate_time_series_summary(). Retorna None quando a categoria
        ou o indicador não são suportados.
    """

    # Define as consultas disponíveis para os indicadores de evolução.
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

    # Valida a categoria e o indicador solicitados.
    if categoria not in queries:
        return None

    if indicador not in queries[categoria]:
        return None

    # Executa a consulta histórica da escola.
    with engine.connect() as connection:

        result = connection.execute(
            queries[categoria][indicador],
            {
                "codigo": school_code
            }
        ).fetchall()

    # Converte os registros para o formato utilizado pelo resumo.
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
    """
    Obtém a série histórica agregada de um indicador para uma divisão
    administrativa e calcula seu resumo temporal.

    Args:
        tipo: Tipo da divisão administrativa, como país, região, UF
            ou município.
        codigo: Código da divisão administrativa.
        categoria: Categoria do indicador.
        indicador: Indicador solicitado.

    Returns:
        O resumo da série temporal da divisão administrativa.
        Retorna None quando a categoria ou o indicador não são suportados.
    """

    # Define as consultas de evolução agregada para cada categoria.
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

    # Valida a categoria e o indicador solicitados.
    if categoria not in queries:
        return None

    if indicador not in queries[categoria]:
        return None

    # Executa a consulta para a divisão administrativa selecionada.
    with engine.connect() as connection:

        result = connection.execute(
            queries[categoria][indicador],
            {
                "tipo": tipo,
                "codigo": codigo
            }
        ).fetchall()

    # Converte os registros para o formato utilizado pelo resumo.
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
    """
    Gera URLs de incorporação do Metabase para os gráficos de evolução
    de uma divisão administrativa.

    Os questionários do Metabase são organizados por categoria e nome
    do gráfico, e cada URL recebe os parâmetros da divisão selecionada.

    Returns:
        Uma resposta JSON contendo as URLs dos gráficos ou uma mensagem
        de erro.
    """

    try:
        # Obtém os parâmetros da divisão administrativa.
        tipo = request.args.get("tipo")
        codigo = request.args.get(
            "codigo",
            type=int
        )

        # Verifica se os parâmetros obrigatórios foram fornecidos.
        if not tipo or codigo is None:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Parâmetros 'tipo' e 'codigo' "
                    "são obrigatórios."
            }), 400

        # Tipos de divisão administrativa aceitos pela API.
        tipos_validos = {
            "pais",
            "regiao",
            "uf",
            "municipio"
        }

        # Valida o tipo informado.
        if tipo not in tipos_validos:
            return jsonify({
                "sucesso": False,
                "erro":
                    "Tipo de divisão administrativa inválido."
            }), 400

        # Relaciona cada gráfico à pergunta correspondente no Metabase.
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

        # Percorre as categorias e seus respectivos questionários
        # para gerar uma URL para cada gráfico.
        for categoria, perguntas in questions.items():

            urls[categoria] = {}

            for nome, question_id in perguntas.items():

                # Monta os parâmetros utilizados pelo questionário.
                payload = {
                    "resource": {
                        "question": question_id
                    },

                    "params": {
                        "tipo": tipo,
                        "codigo": codigo
                    },

                    # Define a validade do token em 30 minutos.
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

                # Gera o token JWT utilizado na incorporação.
                token = jwt.encode(
                    payload,
                    METABASE_SECRET_KEY,
                    algorithm="HS256"
                )

                # Armazena a URL correspondente ao gráfico.
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
    """
    Gera URLs de incorporação do Metabase para os gráficos de evolução
    de uma escola.

    Args:
        school_code: Código da escola recebido pela URL.

    Returns:
        Uma resposta JSON contendo as URLs organizadas por categoria
        e indicador ou uma mensagem de erro.
    """

    try:
        # Relaciona cada gráfico da ficha escolar à pergunta correspondente
        # configurada no Metabase.
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

        # Gera individualmente as URLs para cada pergunta configurada.
        for categoria, perguntas in questions.items():

            urls[categoria] = {}

            for nome, question_id in perguntas.items():

                # Define a pergunta e os parâmetros da escola no payload.
                payload = {
                    "resource": {
                        "question": question_id
                    },

                    "params": {
                        "escola": school_code
                    },

                    # Mantém o token válido por 30 minutos.
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

                # Gera o token assinado para o Metabase.
                token = jwt.encode(
                    payload,
                    METABASE_SECRET_KEY,
                    algorithm="HS256"
                )

                # Armazena a URL de incorporação do gráfico.
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
    """
    Retorna o resumo temporal de um indicador de uma escola.

    Args:
        school_code: Código da escola.
        categoria: Categoria do indicador.
        indicador: Indicador solicitado.

    Returns:
        Uma resposta JSON com o resumo da série temporal ou um erro
        HTTP 404 quando a categoria ou o indicador são inválidos.
    """

    # Obtém o resumo calculado para a escola.
    summary = get_evolution_summary(
        school_code,
        categoria,
        indicador
    )

    # Retorna erro quando a categoria ou o indicador não são suportados.
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
    """
    Retorna o resumo temporal de um indicador de uma divisão
    administrativa.

    Args:
        categoria: Categoria do indicador.
        indicador: Indicador solicitado.

    Returns:
        Uma resposta JSON com o resumo da série temporal ou uma
        mensagem de erro.
    """

    try:
        # Obtém o tipo e o código da divisão administrativa.
        tipo = request.args.get("tipo")

        codigo = request.args.get(
            "codigo",
            type=int
        )

        # Tipos de divisão administrativa aceitos.
        tipos_validos = {
            "pais",
            "regiao",
            "uf",
            "municipio"
        }

        # Valida o tipo da divisão.
        if tipo not in tipos_validos:
            return jsonify({
                "erro":
                    "Tipo de divisão administrativa inválido."
            }), 400

        # O código da divisão é obrigatório.
        if codigo is None:
            return jsonify({
                "erro":
                    "Código da divisão é obrigatório."
            }), 400

        # Calcula o resumo da série temporal da divisão.
        summary = get_division_evolution_summary(
            tipo,
            codigo,
            categoria,
            indicador
        )

        # Retorna erro quando a categoria ou o indicador são inválidos.
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
    """
    Retorna o snapshot estrutural de uma escola para um determinado ano.

    O ano é opcional. Quando não informado, a função utilizada para
    obter o snapshot determina o ano de referência.

    Args:
        school_code: Código da escola.

    Returns:
        Uma resposta JSON com os dados estruturais da escola ou uma
        mensagem de erro.
    """

    try:
        # Obtém o ano opcional enviado na requisição.
        year_param = request.args.get(
            "ano"
        )

        # Converte o ano para inteiro quando informado.
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

        # Obtém o snapshot estrutural da escola.
        data = get_school_structure_snapshot(
            school_code,
            year
        )

        # Retorna erro quando não existem dados para a escola.
        if data is None:
            return jsonify({
                "erro":
                    "Nenhum dado de estrutura "
                    "encontrado para esta escola."
            }), 404

        return jsonify(data)

    except Exception as e:

        # Registra o erro no servidor para facilitar o diagnóstico.
        print(
            f"Error fetching structure evolution "
            f"for {school_code}: {e}"
        )

        return jsonify({
            "erro": str(e)
        }), 500