import os
from flask import Flask
from models import db, User, Mechanic, Message

# Check current database
with open('current_db.txt', 'r') as f:
    db_name = f.read().strip()

# Connect to database
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(os.getcwd(), db_name)}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    # Check jarif mechanic
    jarif = Mechanic.query.filter_by(email='jarif123@gmail.com').first()
    if jarif:
        print(f'Jarif mechanic found: ID={jarif.id}, username={jarif.username}')
        
        # Check messages for jarif
        messages = Message.query.filter_by(receiver_id=f'mechanic_{jarif.id}').all()
        print(f'Messages for jarif (mechanic_{jarif.id}): {len(messages)}')
        
        # Check all messages
        all_messages = Message.query.all()
        print(f'\nAll messages in database:')
        for msg in all_messages:
            print(f'  {msg.sender_id} -> {msg.receiver_id}: {msg.content[:30]}...')
    else:
        print('Jarif mechanic not found!')
