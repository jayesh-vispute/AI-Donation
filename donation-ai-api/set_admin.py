import sys
from app.database import SessionLocal
from app.db_models import User, RoleEnum

def make_admin(target_email: str = "srisaitejapallamala7@gmail.com"):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == target_email).first()
        if not user:
            print(f"No user found with email '{target_email}'. Please make sure the user has signed up first.")
            return False

        user.role = RoleEnum.ADMIN
        db.commit()
        print(f"Successfully updated user '{target_email}' (ID: {user.id}) to ADMIN.")
        return True
    except Exception as e:
        db.rollback()
        print(f"Error updating user to admin: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "srisaitejapallamala7@gmail.com"
    make_admin(email)

