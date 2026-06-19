import pandas as pd
from sqlalchemy import create_engine, inspect

# --- CONFIGURAÇÕES ---
DB_USER = 'postgres'
DB_PASS = '1234'
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'culturaeduca'
NOME_TABELA = 'fato_docente'
TAMANHO_LOTE = 100000

ARQUIVOS_CENSO = {
    2025: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2025/dados/Tabela_Docente_2025.csv',
    2024: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2024/dados/microdados_ed_basica_2024.csv',
    2023: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2023/dados/microdados_ed_basica_2023.csv',
    2022: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2022/dados/microdados_ed_basica_2022.csv'
}

colunas_desejadas = [
    'NU_ANO_CENSO', 
    'CO_ENTIDADE', 
    'QT_DOC_BAS',  
    'QT_DOC_INF', 'QT_DOC_INF_CRE', 'QT_DOC_INF_PRE', 
    'QT_DOC_FUND', 'QT_DOC_FUND_AI', 'QT_DOC_FUND_AF', 
    'QT_DOC_MED', 'QT_DOC_PROF', 'QT_DOC_EJA',
]

engine = create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

def consolidar_fato_docente():
    print("Iniciando a construção da Tabela Fato de Docentes...")
    colunas_db = []
    
    for ano, caminho_arquivo in ARQUIVOS_CENSO.items():
        print(f"\n--- Processando dados de Docentes do Censo {ano} ---")
        
        if ano != 2025:
            inspector = inspect(engine)
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
                
                acao = 'replace' if (ano == 2025 and i == 0) else 'append'
                
                chunk.to_sql(
                    name=NOME_TABELA,
                    con=engine,
                    if_exists=acao,
                    index=False
                )
                
            print(f"Sucesso! Dados de docentes de {ano} integrados.")

        except Exception as e:
            print(f"Erro ao processar o ano {ano}: {e}")
            break 

if __name__ == "__main__":
    consolidar_fato_docente()