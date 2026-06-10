import os
from flask import Flask
from models import db, User, Mechanic

# Check current database
with open('current_db.txt', 'r') as f:
    db_name = f.read().strip()

# Connect to database
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(os.getcwd(), db_name)}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    # Check all mechanics
    mechanics = Mechanic.query.filter_by(is_approved=True, is_active=True).all()
    print(f'Approved mechanics:')
    for mech in mechanics:
        print(f'  ID={mech.id}, username={mech.username}, email={mech.email}')
