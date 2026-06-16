import pandas as pd
from sqlalchemy import create_engine, inspect, text

DB_USER = 'postgres'
DB_PASS = '1234'
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'culturaeduca'
NOME_TABELA = 'fato_turma'
TAMANHO_LOTE = 100000

ARQUIVOS_TURMA = {
    2025: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2025/dados/Tabela_Turma_2025.csv',
    2024: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2024/dados/microdados_ed_basica_2024.csv',
    2023: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2023/dados/microdados_ed_basica_2023.csv',
    2022: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2022/dados/microdados_ed_basica_2022.csv'
}

colunas_desejadas = [
    'NU_ANO_CENSO', 
    'CO_ENTIDADE', 
    'QT_TUR_BAS',  
    'QT_TUR_INF',
    'QT_TUR_INF_CRE',     
    'QT_TUR_INF_PRE',  
    'QT_TUR_FUND',
    'QT_TUR_FUND_AI',      
    'QT_TUR_FUND_AF', 
    'QT_TUR_MED',          
    'QT_TUR_MED_IFTP_CT',
    'QT_TUR_EJA_FUND',    
    'QT_TUR_EJA_MED'   
]

engine = create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

def otimizar_tabela():
    with engine.connect() as conexao:
        print("\nOtimizando o banco de dados...")
        conexao.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{NOME_TABELA}_escola ON {NOME_TABELA} ("CO_ENTIDADE");'))
        conexao.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{NOME_TABELA}_ano ON {NOME_TABELA} ("NU_ANO_CENSO");'))
        conexao.commit()
        print("Índices criados com sucesso!")

def consolidar_fato_turma():
    print("Iniciando a construção da Tabela Fato de Turmas...")
    colunas_db = []
    
    for ano, caminho_arquivo in ARQUIVOS_TURMA.items():
        print(f"\n--- Processando dados de Turmas do Censo {ano} ---")
        
        if ano != 2025:
            inspector = inspect(engine)
            if NOME_TABELA in inspector.get_table_names():
                colunas_db = [col['name'] for col in inspector.get_columns(NOME_TABELA)]
        
        def filtar_colunas(nome_coluna):
            return nome_coluna in colunas_desejadas if ano == 2025 else nome_coluna in colunas_db

        try:
            leitor_csv = pd.read_csv(
                caminho_arquivo, 
                sep=';', 
                encoding='latin-1', 
                chunksize=TAMANHO_LOTE,
                usecols=filtar_colunas,
                low_memory=False
            )

            for i, chunk in enumerate(leitor_csv):
                print(f"[{ano}] Injetando lote {i + 1}...")
                
                chunk = chunk.fillna(0)
                
                acao = 'replace' if (ano == 2025 and i == 0) else 'append'
                
                chunk.to_sql(
                    name=NOME_TABELA,
                    con=engine,
                    if_exists=acao,
                    index=False
                )
                
            print(f"Sucesso! Dados de turmas de {ano} integrados.")

        except Exception as e:
            print(f"Aviso [{ano}]: Tabela de colunas inexistente neste ano ou erro: {e}")
            pass

    inspector = inspect(engine)
    if NOME_TABELA in inspector.get_table_names():
        otimizar_tabela()

if __name__ == "__main__":
    consolidar_fato_turma()
    print("\nProcesso de injeção finalizado com sucesso!")