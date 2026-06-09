import pandas as pd
from sqlalchemy import create_engine, inspect

DB_USER = 'postgres'
DB_PASS = '1234'
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'culturaeduca'

engine = create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

NOME_TABELA = 'fato_matricula'
CSV_FILE_PATH = '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2023/dados/microdados_ed_basica_2023.csv'

print("Lendo a estrutura da tabela no banco de dados...")
inspector = inspect(engine)
colunas_db = [col['name'] for col in inspector.get_columns(NOME_TABELA)]

def filtar_colunas(nome_coluna):
    return nome_coluna in colunas_db

print(f"Iniciando a filtragem e inserção dos dados de 2023...")

TAMANHO_LOTE = 100000

try:
    leitor_csv = pd.read_csv(
        CSV_FILE_PATH, 
        sep=';', 
        encoding='latin-1', 
        chunksize=TAMANHO_LOTE,
        usecols=filtar_colunas,
        low_memory=False
    )

    for i, chunk in enumerate(leitor_csv):
        print(f"Processando lote {i + 1}...")

        chunk.to_sql(
            name=NOME_TABELA,
            con=engine,
            if_exists='append',
            index=False
        )
        
    print("\n Sucesso! Os dados de 2023 foram integrados à série temporal.")

except Exception as e:
    print(f"\n Ocorreu um erro: {e}")