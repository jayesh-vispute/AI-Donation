import os
from sqlalchemy import text
from app.database import engine

def apply_migration():
    print("Applying migration...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE demands ADD COLUMN IF NOT EXISTS group_id VARCHAR;"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_demands_group_id ON demands (group_id);"))
            conn.commit()
            print("Migration applied successfully.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    apply_migration()
