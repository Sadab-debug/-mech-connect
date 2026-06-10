import os
import sys
import random
import sqlite3
from datetime import datetime
sys.path.append(os.path.dirname(__file__))

from models import db, User, Admin, Mechanic, MechanicProposal, MechanicNotification
from login_app import app

def generate_fake_users(count=10):
    first_names = ["John", "Jane", "Mike", "Emily", "Chris", "Sophie", "David", "Olivia", "James", "Emma"]
    last_names = ["Smith", "Doe", "Brown", "Johnson", "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas"]
    users = []
    for i in range(count):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        username = f"{fn.lower()}_{ln.lower()}{i+1}"
        email = f"{username}@example.com"
        password = "password123"
        users.append({
            "username": username,
            "email": email,
            "password": User.hash_password(password),
            "full_name": f"{fn} {ln}",
            "role": "user"
        })
    return users

def generate_fake_mechanics(count=10):
    workshops = ["AutoFix", "QuickRepair", "ProMech", "CarCare", "EngineExperts", "MotorMedic", "WrenchWorks", "SpeedyFix", "TurboTech", "GearHeads"]
    skills_options = [
        "Engine diagnostics, Oil change, Brake repair",
        "Electrical systems, Battery replacement, Wiring",
        "Transmission service, Clutch repair",
        "AC repair, Cooling system, Radiator",
        "Suspension, Wheel alignment, Tire service",
        "Exhaust system, Muffler replacement",
        "General maintenance, Inspection, Diagnostics"
    ]
    mechanics = []
    for i in range(count):
        fn = f"Mechanic{i+1}"
        username = f"mech_{fn.lower()}"
        email = f"{username}@example.com"
        password = "password123"
        mechanics.append({
            "username": username,
            "email": email,
            "password": Mechanic.hash_password(password),
            "full_name": fn,
            "workshop_name": random.choice(workshops),
            "age": random.randint(25, 55),
            "address": f"{random.randint(100,999)} Service St, City",
            "mobile": f"017{random.randint(10000000,99999999)}",
            "expertise": random.choice(skills_options),
            "experience_years": random.randint(2, 20),
            "hourly_rate": round(random.uniform(300, 1200), 2),
            "working_hours": "9AM - 6PM",
            "education": random.choice(["Diploma in Automotive", "BSc in Mechanical Engineering", "Certified Mechanic"]),
            "is_active": True,
            "is_approved": True,
            "rating": round(random.uniform(3.5, 5.0), 1)
        })
    return mechanics

def reinit():
    import time
    timestamp = int(time.time())
    db_path = os.path.join(os.path.dirname(__file__), f'mistrivai_{timestamp}.db')
    if os.path.exists(db_path):
        os.remove(db_path)
        print("Removed existing fresh db.")
    print(f"Using database: {os.path.basename(db_path)}")
    with open(os.path.join(os.path.dirname(__file__), 'current_db.txt'), 'w') as f:
        f.write(os.path.basename(db_path))

    with app.app_context():
        db.create_all()
        print("Created fresh tables.")

        # Add admin
        admin = Admin(
            username="jarifhassan980",
            email="jarifhassan980@gmail.com",
            password=Admin.hash_password("jarif.98@"),
            full_name="Jarif Hassan",
            role="admin"
        )
        db.session.add(admin)
        db.session.commit()
        print("Added admin: jarifhassan980@gmail.com / jarif.98@")

        # Add users
        for u in generate_fake_users(10):
            user = User(**u)
            db.session.add(user)
        db.session.commit()
        print("Added 10 users.")

        # Add mechanics
        for m in generate_fake_mechanics(10):
            mechanic = Mechanic(**m)
            db.session.add(mechanic)
        db.session.commit()
        print("Added 10 mechanics.")

        # Create proposals for mechanics
        mechanics = Mechanic.query.all()
        for mech in mechanics:
            proposal = MechanicProposal(
                mechanic_id=mech.id,
                status='approved',
                reviewed_at=datetime.utcnow(),
                reviewed_by=admin.id
            )
            db.session.add(proposal)
        db.session.commit()
        print("Created proposals for all mechanics.")

    print("\n=== Fresh database ready ===")
    print(f"Admin: jarifhassan980@gmail.com / jarif.98@")
    print("10 users and 10 mechanics added.")
    print("All mechanics are approved and active.")

if __name__ == '__main__':
    reinit()
