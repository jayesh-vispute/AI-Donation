import sqlalchemy
from app.database import engine

with engine.begin() as conn:
    try:
        conn.execute(sqlalchemy.text("ALTER TABLE ngo_profiles ADD COLUMN registration_certificate_url VARCHAR;"))
        print("Added registration_certificate_url")
    except Exception as e:
        print(e)
        
    try:
        conn.execute(sqlalchemy.text("ALTER TABLE ngo_profiles ADD COLUMN pan_card_url VARCHAR;"))
        print("Added pan_card_url")
    except Exception as e:
        print(e)
        
    try:
        conn.execute(sqlalchemy.text("ALTER TABLE ngo_profiles ADD COLUMN address_proof_url VARCHAR;"))
        print("Added address_proof_url")
    except Exception as e:
        print(e)
