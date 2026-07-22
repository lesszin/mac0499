import pandas as pd
from sqlalchemy import create_engine, inspect

DB_USER = 'postgres'
DB_PASS = '1234'
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'culturaeduca'
TABLE_NAME = 'fato_gestor'
BATCH_SIZE = 100000

CENSUS_FILES = {
    2025: '/home/lucas/Área de trabalho/dados/microdados_censo_escolar_2025/dados/Tabela_Gestor_Escolar_2025.csv'
}

target_columns = [
    'NU_ANO_CENSO', 
    'CO_ENTIDADE', 
    'QT_GEST_BAS',       
    'QT_GEST_BAS_FEM',   
    'QT_GEST_BAS_MASC',  
    'QT_GEST_BAS_DIRETOR'
]

engine = create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

def consolidate_manager_fact():
    print("Starting the construction of the Manager Fact Table...")
    db_columns = []
    
    sorted_years = sorted(CENSUS_FILES.keys(), reverse=True)
    first_run = True
    
    for year in sorted_years:
        file_path = CENSUS_FILES[year]
        print(f"\n--- Processing Manager data for Census year {year} ---")
        
        if not first_run:
            inspector = inspect(engine)
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
                
                action = 'replace' if (first_run and i == 0) else 'append'
                
                chunk.to_sql(
                    name=TABLE_NAME,
                    con=engine,
                    if_exists=action,
                    index=False
                )
                
            print(f"Success! {year} manager data integrated into the time series.")
            first_run = False

        except Exception as e:
            print(f"Critical error processing year {year}: {e}")
            print("Halting execution to protect database integrity.")
            break 

if __name__ == "__main__":
    consolidate_manager_fact()
    print("\nInjection process finished successfully!")