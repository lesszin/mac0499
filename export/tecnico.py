import pandas as pd
from sqlalchemy import create_engine, inspect, text

DB_USER = 'postgres'
DB_PASS = '1234'
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'culturaeduca'
TAMANHO_LOTE = 100000

TABELA_DIM = 'dim_curso'
TABELA_FATO = 'fato_curso'

ARQUIVOS_CURSO = {
    2025: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2025/dados/Tabela_Curso_Tecnico_2025.csv',
    2024: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2024/dados/suplemento_cursos_tecnicos_2024.csv',
    2023: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2023/dados/suplemento_cursos_tecnicos_2023.csv',
    2022: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2022/dados/microdados_ed_basica_2022.csv'
}

colunas_dimensao = [
    'ID_AREA_CURSO_PROFISSIONAL', 
    'NO_AREA_CURSO_PROFISSIONAL', 
    'CO_CURSO_EDUC_PROFISSIONAL', 
    'NO_CURSO_EDUC_PROFISSIONAL'
]

colunas_fato = [
    'NU_ANO_CENSO', 
    'CO_ENTIDADE', 
    'CO_CURSO_EDUC_PROFISSIONAL', 
    'QT_MAT_CURSO_TEC'
]

colunas_totais = list(set(colunas_dimensao + colunas_fato))

engine = create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

def criar_indices_e_chaves():
    """Garante a otimização das tabelas após a criação."""
    with engine.connect() as conexao:
        print("\nConfigurando chaves e índices de performance...")
        conexao.execute(text(f'ALTER TABLE {TABELA_DIM} ADD PRIMARY KEY IF NOT EXISTS ("CO_CURSO_EDUC_PROFISSIONAL");'))
        conexao.execute(text(f'CREATE INDEX IF NOT EXISTS idx_fato_curso_escola ON {TABELA_FATO} ("CO_ENTIDADE");'))
        conexao.execute(text(f'CREATE INDEX IF NOT EXISTS idx_fato_curso_codigo ON {TABELA_FATO} ("CO_CURSO_EDUC_PROFISSIONAL");'))
        conexao.commit()

def consolidar_estrutura_star():
    print("Iniciando a modelagem Star Schema para Cursos Técnicos...")
    
    cursos_processados = set()
    
    inspector = inspect(engine)
    if TABELA_DIM in inspector.get_table_names():
        with engine.connect() as conn:
            resultado = conn.execute(text(f'SELECT "CO_CURSO_EDUC_PROFISSIONAL" FROM {TABELA_DIM}'))
            cursos_processados = set(row[0] for row in resultado)

    primeiro_lote_global = True

    for ano, caminho_arquivo in ARQUIVOS_CURSO.items():
        print(f"\n--- Processando Censo {ano} ---")
        
        try:
            leitor_csv = pd.read_csv(
                caminho_arquivo, 
                sep=';', 
                encoding='latin-1', 
                chunksize=TAMANHO_LOTE,
                usecols=lambda col: col in colunas_totais,
                low_memory=False
            )

            for i, chunk in enumerate(leitor_csv):
                print(f"[{ano}] Processando lote {i + 1}...")
                
                df_dim = chunk[colunas_dimensao].drop_duplicates(subset=['CO_CURSO_EDUC_PROFISSIONAL'])
                
                df_dim = df_dim[~df_dim['CO_CURSO_EDUC_PROFISSIONAL'].isin(cursos_processados)]
                
                if not df_dim.empty:
                    acao_dim = 'replace' if primeiro_lote_global else 'append'
                    df_dim.to_sql(name=TABELA_DIM, con=engine, if_exists=acao_dim, index=False)
                    cursos_processados.update(df_dim['CO_CURSO_EDUC_PROFISSIONAL'].tolist())
                
                df_fato = chunk[colunas_fato]
                
                acao_fato = 'replace' if primeiro_lote_global else 'append'
                df_fato.to_sql(name=TABELA_FATO, con=engine, if_exists=acao_fato, index=False)
                
                primeiro_lote_global = False
                
            print(f"Sucesso! Dados de {ano} integrados perfeitamente.")

        except Exception as e:
            print(f"Aviso: Arquivo ou colunas de {ano} indisponíveis. Pulando ano. Detalhe: {e}")
            pass 

    if p_names := inspector.get_table_names():
        if TABELA_FATO in p_names and TABELA_DIM in p_names:
            criar_indices_e_chaves()

if __name__ == "__main__":
    consolidar_estrutura_star()
    print("\nArquitetura Star Schema de Cursos finalizada com sucesso!")