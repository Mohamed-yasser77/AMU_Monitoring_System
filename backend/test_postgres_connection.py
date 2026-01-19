import psycopg2
from psycopg2 import OperationalError

# Update these values with your actual database credentials
DB_NAME ="AMU_DB"
DB_USER = "postgres"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_PASSWORD = "albaqarah@2"

def test_connection():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        print("Connection to PostgreSQL DB successful")
        conn.close()
    except OperationalError as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_connection()
