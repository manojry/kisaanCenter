import os
from dotenv import load_dotenv

load_dotenv()

print("Environment check:")
print(f"DB_HOST: {os.getenv('DB_HOST')}")
print(f"DB_NAME: {os.getenv('DB_NAME')}")
print(f"DB_USER: {os.getenv('DB_USER')}")

try:
    import psycopg2
    print("✅ psycopg2 imported successfully")
    
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode='prefer',
        connect_timeout=10
    )
    
    cursor = conn.cursor()
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
    tables = [row[0] for row in cursor.fetchall()]
    
    print(f"\n📊 Current database tables ({len(tables)}):")
    for table in tables:
        print(f"   • {table}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
