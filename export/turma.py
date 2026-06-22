import pandas as pd
from sqlalchemy import create_engine, inspect, text

DB_USER = 'postgres'
DB_PASS = '1234'
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'culturaeduca'
TABLE_NAME = 'fato_turma'
BATCH_SIZE = 100000

CENSUS_FILES = {
    2025: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2025/dados/Tabela_Turma_2025.csv',
    2024: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2024/dados/microdados_ed_basica_2024.csv',
    2023: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2023/dados/microdados_ed_basica_2023.csv',
    2022: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2022/dados/microdados_ed_basica_2022.csv'
}

target_columns = [
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
    'QT_TUR_EJA_MED',
    'QT_TUR_ESP'
]

engine = create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

def optimize_table():
    with engine.connect() as connection:
        print("\nOptimizing database...")
        connection.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{TABLE_NAME}_escola ON {TABLE_NAME} ("CO_ENTIDADE");'))
        connection.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{TABLE_NAME}_ano ON {TABLE_NAME} ("NU_ANO_CENSO");'))
        connection.commit()
        print("Indexes created successfully!")

def consolidate_class_fact():
    print("Starting the construction of the Class Fact Table...")
    db_columns = []
    
    sorted_years = sorted(CENSUS_FILES.keys(), reverse=True)
    first_run = True
    
    for year in sorted_years:
        file_path = CENSUS_FILES[year]
        print(f"\n--- Processing Class data for Census year {year} ---")
        
        if not first_run:
            inspector = inspect(engine)
            if TABLE_NAME in inspector.get_table_names():
                db_columns = [col['name'] for col in inspector.get_columns(TABLE_NAME)]
                print(f"Database schema read: The table has {len(db_columns)} active columns.")
        
        def filter_columns(column_name):
            return column_name in target_columns if first_run else column_name in db_columns

        try:
            csv_reader = pd.read_csv(
                file_path, 
                sep=';', 
                encoding='latin-1', 
                chunksize=BATCH_SIZE,
                usecols=filter_columns,
                low_memory=False
            )

            for i, chunk in enumerate(csv_reader):
                print(f"[{year}] Injecting batch {i + 1}...")
                
                chunk = chunk.fillna(0)
                
                action = 'replace' if (first_run and i == 0) else 'append'
                
                chunk.to_sql(
                    name=TABLE_NAME,
                    con=engine,
                    if_exists=action,
                    index=False
                )
                
            print(f"Success! {year} class data integrated into the time series.")
            first_run = False

        except Exception as e:
            print(f"Warning [{year}]: Table columns missing or process error: {e}")
            pass

    inspector = inspect(engine)
    if TABLE_NAME in inspector.get_table_names():
        optimize_table()

if __name__ == "__main__":
    consolidate_class_fact()
    print("\nInjection process finished successfully!")