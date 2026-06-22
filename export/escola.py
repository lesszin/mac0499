import pandas as pd
from sqlalchemy import create_engine

DB_USER = 'postgres'
DB_PASS = '1234'
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'culturaeduca'

engine = create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

CENSUS_FILES = {
    2025: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2025/dados/Tabela_Escola_2025.csv',
    2024: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2024/dados/microdados_ed_basica_2024.csv',
    2023: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2023/dados/microdados_ed_basica_2023.csv',
    2022: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2022/dados/microdados_ed_basica_2022.csv'
}

target_columns = [
    'NU_ANO_CENSO', 'CO_ENTIDADE', 'NO_ENTIDADE', 
    
    'CO_MUNICIPIO', 'NO_MUNICIPIO', 'CO_UF', 'SG_UF', 
    'TP_LOCALIZACAO', 'LATITUDE', 'LONGITUDE', 'NO_REGIAO', 'CO_REGIAO',

    'NO_REGIAO_GEOG_INTERM', 'CO_REGIAO_GEOG_INTERM', 
    'NO_REGIAO_GEOG_IMED', 'CO_REGIAO_GEOG_IMED',
    'CO_DISTRITO', 'NO_DISTRITO',

    'DS_ENDERECO', 'NU_ENDERECO', 'DS_COMPLEMENTO', 
    'NO_BAIRRO', 'CO_CEP', 'NU_DDD', 'NU_TELEFONE',
    
    'TP_DEPENDENCIA', 'TP_CATEGORIA_ESCOLA_PRIVADA', 'TP_SITUACAO_FUNCIONAMENTO',

    'IN_EDUCACAO_INDIGENA', 'TP_AEE', 'TP_ATIVIDADE_COMPLEMENTAR', 'IN_ALIMENTACAO', 'IN_EDUC_AMBIENTAL',

    'IN_AGUA_REDE_PUBLICA', 'IN_ENERGIA_REDE_PUBLICA', 'IN_ESGOTO_REDE_PUBLICA', 'IN_LIXO_SERVICO_COLETA',
    'IN_AGUA_POTAVEL', 'IN_LIXO_COLETA_PERIODICA',

    'IN_AREA_PLANTIO', 'IN_AREA_VERDE', 'IN_BIBLIOTECA', 'IN_LABORATORIO_CIENCIAS', 'IN_AUDITORIO',
    'IN_LABORATORIO_INFORMATICA', 'IN_QUADRA_ESPORTES_COBERTA', 'IN_QUADRA_ESPORTES_DESCOBERTA',
    'IN_SALA_ATELIE_ARTES', 'IN_SALA_MUSICA_CORAL', 'IN_SALA_ESTUDIO_DANCA', 'IN_SALA_MULTIUSO',
    'IN_SALA_ESTUDIO_GRAVACAO', 'IN_SALA_PROFESSOR', 'IN_SALA_ATENDIMENTO_ESPECIAL', 'IN_REFEITORIO',
    'QT_SALAS_UTILIZADAS', 'IN_SALA_LEITURA', 'IN_QUADRA_ESPORTES',
    
    'IN_BANHEIRO_PNE', 'IN_ACESSIBILIDADE_RAMPAS', 'IN_BANHEIRO_ACESSIBILIDADE', 'IN_ACESSIBILIDADE_ELEVADOR',
    'IN_ACESSIBILIDADE_CORRIMAO', 'IN_ACESSIBILIDADE_PISOS_TATEIS', 'IN_ACESSIBILIDADE_VAO_LIVRE',
    'IN_ACESSIBILIDADE_SINAL_SONORO', 'IN_ACESSIBILIDADE_SINAL_TATIL', 'IN_ACESSIBILIDADE_SINAL_VISUAL',

    'IN_ESPACO_ATIVIDADE', 'IN_ESPACO_EQUIPAMENTO', 'IN_ORGAO_ASS_PAIS', 'IN_ORGAO_ASS_PAIS_MESTRES', 
    'IN_ORGAO_CONSELHO_ESCOLAR', 'IN_ORGAO_GREMIO_ESTUDANTIL', 'TP_PROPOSTA_PEDAGOGICA',

    'IN_INTERNET', 'IN_BANDA_LARGA', 'TP_REDE_LOCAL', 'IN_INTERNET_ALUNOS', 'IN_INTERNET_ADMINISTRATIVO',
    'IN_INTERNET_APRENDIZAGEM', 'IN_INTERNET_COMUNIDADE', 'QT_DESKTOP_ALUNO', 'QT_COMP_PORTATIL_ALUNO',
    'QT_TABLET_ALUNO', 'QT_EQUIP_SOM', 'QT_EQUIP_TV', 'QT_EQUIP_LOUSA_DIGITAL', 'QT_EQUIP_MULTIMIDIA',

    'IN_MATERIAL_PED_MULTIMIDIA', 'IN_MATERIAL_PED_INFANTIL', 'IN_MATERIAL_PED_CIENTIFICO', 'IN_MATERIAL_PED_DIFUSAO',
    'IN_MATERIAL_PED_MUSICAL', 'IN_MATERIAL_PED_JOGOS', 'IN_MATERIAL_PED_ARTISTICAS', 'IN_MATERIAL_PED_PROFISSIONAL',
    'IN_MATERIAL_PED_INDIGENA', 'IN_MATERIAL_PED_ETNICO', 'IN_MATERIAL_PED_CAMPO', 'IN_MATERIAL_PED_BIL_SURDOS',
    'IN_MATERIAL_PED_AGRICOLA', 'IN_MATERIAL_PED_QUILOMBOLA', 'IN_MATERIAL_PED_EDU_ESP',

    'QT_PROF_ADMINISTRATIVOS', 'QT_PROF_SERVICOS_GERAIS', 'QT_PROF_BIBLIOTECARIO', 'QT_PROF_SAUDE',
    'QT_PROF_COORDENADOR', 'QT_PROF_FONAUDIOLOGO', 'QT_PROF_NUTRICIONISTA', 'QT_PROF_PSICOLOGO',
    'QT_PROF_ALIMENTACAO', 'QT_PROF_PEDAGOGIA', 'QT_PROF_SECRETARIO', 'QT_PROF_SEGURANCA',
    'QT_PROF_MONITORES', 'QT_PROF_GESTAO', 'QT_PROF_ASSIST_SOCIAL', 'QT_PROF_TRAD_LIBRAS', 
    'QT_PROF_AGRICOLA', 'QT_PROF_REVISOR_BRAILLE',
]

print("Starting Historical Dimension Engineering with RAM Optimization...")

master_df = pd.DataFrame()

try:
    sorted_years = sorted(CENSUS_FILES.keys(), reverse=True)
    
    for year in sorted_years:
        file_path = CENSUS_FILES[year]
        print(f"\n[Processing {year}] Reading file...")
        
        def filter_existing(column):
            return column in target_columns

        year_df = pd.read_csv(
            file_path, 
            sep=';', 
            encoding='latin-1', 
            usecols=filter_existing,
            low_memory=False
        )
        
        year_df = year_df.dropna(subset=['CO_ENTIDADE'])
        year_df['CO_ENTIDADE'] = year_df['CO_ENTIDADE'].astype(int)
        year_df = year_df.drop_duplicates(subset=['CO_ENTIDADE'], keep='first')
        
        if master_df.empty:
            master_df = year_df
            print(f"-> Initial base ({year}) loaded with {len(master_df)} schools.")
        else:
            new_schools = year_df[~year_df['CO_ENTIDADE'].isin(master_df['CO_ENTIDADE'])]
            print(f"-> Out of {len(year_df)} schools found in {year}, {len(new_schools)} are new and will be added.")
            
            master_df = pd.concat([master_df, new_schools], ignore_index=True)
            print(f"-> Total accumulated unique schools in memory: {len(master_df)}")

    if 'NU_ANO_CENSO' in master_df.columns:
        master_df = master_df.drop(columns=['NU_ANO_CENSO'])

    print(f"\nSaving {len(master_df)} schools to PostgreSQL...")

    master_df.to_sql(
        name='dim_escola',
        con=engine,
        if_exists='replace',
        index=False,
        chunksize=1000
    )
    
    print("\nMAXIMUM Success! Your consolidated dimension is saved and ready in the database.")

except Exception as e:
    print(f"\nA critical error occurred during the process: {e}")