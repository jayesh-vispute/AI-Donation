"""Direct fix: ALTER TABLE delivery_proofs ALTER COLUMN photo_url DROP NOT NULL"""
import sys
sys.path.insert(0, '.')
from app.config import settings
from sqlalchemy import create_engine, text

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    # Check current state
    result = conn.execute(text("""
        SELECT column_name, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'delivery_proofs' AND column_name = 'photo_url'
    """))
    row = result.fetchone()
    print(f"Before: photo_url is_nullable = {row[1] if row else 'COLUMN NOT FOUND'}")
    
    # Drop the NOT NULL constraint
    conn.execute(text("ALTER TABLE delivery_proofs ALTER COLUMN photo_url DROP NOT NULL"))
    conn.commit()
    
    # Verify
    result = conn.execute(text("""
        SELECT column_name, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'delivery_proofs' AND column_name = 'photo_url'
    """))
    row = result.fetchone()
    print(f"After:  photo_url is_nullable = {row[1] if row else 'COLUMN NOT FOUND'}")
    print("Done! photo_url is now nullable.")
