import pandas as pd
from sqlalchemy import create_engine, inspect, text

DB_USER = 'postgres'
DB_PASS = '1234'
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'culturaeduca'
BATCH_SIZE = 100000

DIM_TABLE = 'dim_curso'
FACT_TABLE = 'fato_curso'

CENSUS_FILES = {
    2025: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2025/dados/Tabela_Curso_Tecnico_2025.csv',
    2024: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2024/dados/suplemento_cursos_tecnicos_2024.csv',
    2023: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2023/dados/suplemento_cursos_tecnicos_2023.csv',
    2022: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2022/dados/microdados_ed_basica_2022.csv'
}

dim_columns = [
    'ID_AREA_CURSO_PROFISSIONAL', 
    'NO_AREA_CURSO_PROFISSIONAL', 
    'CO_CURSO_EDUC_PROFISSIONAL', 
    'NO_CURSO_EDUC_PROFISSIONAL'
]

fact_columns = [
    'NU_ANO_CENSO', 
    'CO_ENTIDADE', 
    'CO_CURSO_EDUC_PROFISSIONAL', 
    'QT_MAT_CURSO_TEC'
]

all_columns = list(set(dim_columns + fact_columns))

engine = create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

def create_indexes_and_keys():
    with engine.connect() as connection:
        print("\nConfiguring performance keys and indexes...")
        connection.execute(text(f'ALTER TABLE {DIM_TABLE} ADD PRIMARY KEY IF NOT EXISTS ("CO_CURSO_EDUC_PROFISSIONAL");'))
        connection.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{FACT_TABLE}_escola ON {FACT_TABLE} ("CO_ENTIDADE");'))
        connection.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{FACT_TABLE}_codigo ON {FACT_TABLE} ("CO_CURSO_EDUC_PROFISSIONAL");'))
        connection.commit()

def consolidate_star_schema():
    print("Starting Star Schema modeling for Technical Courses...")
    
    processed_courses = set()
    inspector = inspect(engine)
    
    if DIM_TABLE in inspector.get_table_names():
        with engine.connect() as conn:
            result = conn.execute(text(f'SELECT "CO_CURSO_EDUC_PROFISSIONAL" FROM {DIM_TABLE}'))
            processed_courses = set(row[0] for row in result)

    first_global_batch = True
    sorted_years = sorted(CENSUS_FILES.keys(), reverse=True)

    for year in sorted_years:
        file_path = CENSUS_FILES[year]
        print(f"\n--- Processing Census year {year} ---")
        
        try:
            csv_reader = pd.read_csv(
                file_path, 
                sep=';', 
                encoding='latin-1', 
                chunksize=BATCH_SIZE,
                usecols=lambda col: col in all_columns,
                low_memory=False
            )

            for i, chunk in enumerate(csv_reader):
                print(f"[{year}] Processing batch {i + 1}...")
                
                dim_df = chunk[dim_columns].drop_duplicates(subset=['CO_CURSO_EDUC_PROFISSIONAL'])
                dim_df = dim_df[~dim_df['CO_CURSO_EDUC_PROFISSIONAL'].isin(processed_courses)]
                
                if not dim_df.empty:
                    dim_action = 'replace' if first_global_batch else 'append'
                    dim_df.to_sql(name=DIM_TABLE, con=engine, if_exists=dim_action, index=False)
                    processed_courses.update(dim_df['CO_CURSO_EDUC_PROFISSIONAL'].tolist())
                
                fact_df = chunk[fact_columns]
                
                fact_action = 'replace' if first_global_batch else 'append'
                fact_df.to_sql(name=FACT_TABLE, con=engine, if_exists=fact_action, index=False)
                
                first_global_batch = False
                
            print(f"Success! {year} data perfectly integrated.")

        except Exception as e:
            print(f"Warning: File or columns for {year} unavailable. Skipping year. Detail: {e}")
            pass 

    if table_names := inspector.get_table_names():
        if FACT_TABLE in table_names and DIM_TABLE in table_names:
            create_indexes_and_keys()

if __name__ == "__main__":
    consolidate_star_schema()
    print("\nCourse Star Schema architecture finished successfully!")