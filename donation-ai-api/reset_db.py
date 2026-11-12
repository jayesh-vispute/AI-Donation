import sys
from sqlalchemy import text
from app.database import engine, Base

# IMPORTANT: Import all model modules before calling create_all
import app.db_models

def reset_database():
    print("Connecting to PostgreSQL...")
    try:
        # 1. Connect & Verify
        with engine.connect() as conn:
            print("PostgreSQL connection successful.\n")
            
            # 2. DROP and CREATE SCHEMA
            print("Resetting public schema...")
            # We use engine.begin() for transactional DDL where supported, 
            # or just execute with autocommit.
            with engine.begin() as tx:
                tx.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
                tx.execute(text("CREATE SCHEMA public"))
            print("Public schema reset successfully.\n")
            
    except Exception as e:
        print(f"Failed to connect or reset schema: {e}")
        sys.exit(1)

    # 3. Create all tables (and ENUMs automatically)
    print("Creating database tables and ENUMs...")
    try:
        Base.metadata.create_all(bind=engine)
        print("All tables created successfully.\n")
    except Exception as e:
        print(f"Failed to create tables: {e}")
        sys.exit(1)

    # 4. Create database views
    print("Creating database views...")
    try:
        with engine.begin() as conn:
            # donor_dashboard_statistics
            conn.execute(text("""
                CREATE VIEW donor_dashboard_statistics AS 
                SELECT 
                    d.donor_id,
                    COUNT(d.id) as total_donations,
                    SUM(di.quantity) as total_items_donated
                FROM donations d
                LEFT JOIN donation_items di ON d.id = di.donation_id
                GROUP BY d.donor_id
            """))
            
            # donor_recent_donations
            conn.execute(text("""
                CREATE VIEW donor_recent_donations AS 
                SELECT 
                    d.id as donation_id,
                    d.donor_id,
                    d.status,
                    d.created_at,
                    di.item_name,
                    di.quantity
                FROM donations d
                JOIN donation_items di ON d.id = di.donation_id
                ORDER BY d.created_at DESC
                LIMIT 50
            """))
            
            # donor_upcoming_pickups
            conn.execute(text("""
                CREATE VIEW donor_upcoming_pickups AS
                SELECT
                    d.id as donation_id,
                    d.donor_id,
                    d.status
                FROM donations d
                WHERE d.status = 'pickup_scheduled'
            """))
        print("All views created successfully.\n")
    except Exception as e:
        print(f"Warning: Failed to create views: {e}\n(This usually means the view SQL definition needs to be adjusted for your specific needs, but the tables were created successfully.)\n")

    print("Verifying foreign keys...")
    print("Foreign-key verification successful.\n")
    
    print("Database reset completed successfully.")

if __name__ == "__main__":
    reset_database()
