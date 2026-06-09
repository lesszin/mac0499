import pandas as pd
from sqlalchemy import create_engine

DB_USER = 'postgres'
DB_PASS = '1234'
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'culturaeduca'

engine = create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

ARQUIVOS = {
    2025: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2025/dados/Tabela_Escola_2025.csv',
    2024: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2024/dados/microdados_ed_basica_2024.csv',
    2023: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2023/dados/microdados_ed_basica_2023.csv',
    2022: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2022/dados/microdados_ed_basica_2022.csv'
}

colunas_desejadas = [
    'NU_ANO_CENSO', 'CO_ENTIDADE', 'NO_ENTIDADE', 'NO_MUNICIPIO', 'SG_UF', 
    'TP_DEPENDENCIA', 'TP_LOCALIZACAO', 'TP_SITUACAO_FUNCIONAMENTO', 
    'LATITUDE', 'LONGITUDE', 'IN_AGUA_POTAVEL', 'IN_ENERGIA_REDE_PUBLICA', 
    'IN_ESGOTO_REDE_PUBLICA', 'IN_INTERNET', 'IN_LABORATORIO_INFORMATICA', 
    'IN_BIBLIOTECA', 'IN_QUADRA_ESPORTES', 'IN_ACESSIBILIDADE_RAMPAS'
]

print("Iniciando a Engenharia da Dimensão Histórica...")

lista_dataframes = []

try:
    for ano, caminho in ARQUIVOS.items():
        print(f"Lendo dados de {ano}...")
        
        def filtrar_existentes(coluna):
            return coluna in colunas_desejadas

        df_ano = pd.read_csv(
            caminho, 
            sep=';', 
            encoding='latin-1', 
            usecols=filtrar_existentes,
            low_memory=False
        )
        lista_dataframes.append(df_ano)

    print("Unindo todos os anos e processando duplicatas...")
    
    df_consolidado = pd.concat(lista_dataframes, ignore_index=True)
    
    df_consolidado = df_consolidado.dropna(subset=['CO_ENTIDADE'])
    
    df_consolidado = df_consolidado.sort_values(by='NU_ANO_CENSO', ascending=False)
    
    df_consolidado = df_consolidado.drop_duplicates(subset=['CO_ENTIDADE'], keep='first')
    
    df_consolidado = df_consolidado.drop(columns=['NU_ANO_CENSO'])

    print(f"Preparando para inserir {len(df_consolidado)} escolas únicas no banco...")
    
    df_consolidado.to_sql(
        name='dim_escola',
        con=engine,
        if_exists='replace',
        index=False
    )
    
    print("\n Sucesso MÁXIMO! Sua dimensão consolidada está pronta para o BI.")

except Exception as e:
    print(f"\n Ocorreu um erro: {e}")