import pandas as pd
from sqlalchemy import create_engine

DB_USER = 'postgres'          
DB_PASS = '1234'    
DB_HOST = 'localhost'         
DB_PORT = '5432'              
DB_NAME = 'culturaeduca'   

engine = create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

CSV_FILE_PATH = '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2025/dados/Tabela_Matricula_2025.csv'

NOME_TABELA = 'fato_matricula_2025'

print("Iniciando a leitura e inserção dos dados...")

TAMANHO_LOTE = 100000 

try:
    leitor_csv = pd.read_csv(
        CSV_FILE_PATH, 
        sep=';', 
        encoding='latin-1', 
        chunksize=TAMANHO_LOTE,
        low_memory=False 
    )

    for i, chunk in enumerate(leitor_csv):
        print(f"Processando e inserindo o lote {i + 1} (Linhas {i * TAMANHO_LOTE} a {(i + 1) * TAMANHO_LOTE})...")
        
        acao = 'replace' if i == 0 else 'append'
        
        chunk.to_sql(
            name=NOME_TABELA,
            con=engine,
            if_exists=acao,
            index=False
        )
        
    print("\n Sucesso! Todos os dados de matrícula foram importados para o banco de dados.")

except Exception as e:
    print(f"\n Ocorreu um erro durante a importação: {e}")