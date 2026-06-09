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
    # Check messages in database
    messages = Message.query.all()
    print(f'Total messages: {len(messages)}')
    
    for msg in messages[:5]:
        print(f'Message: {msg.sender_id} -> {msg.receiver_id}: {msg.content[:50]}...')
    
    # Check mechanics
    mechanics = Mechanic.query.all()
    print(f'\nTotal mechanics: {len(mechanics)}')
    
    for mech in mechanics[:3]:
        print(f'Mechanic: {mech.username} (ID: {mech.id})')
        
    # Check specific mechanic messages
    jarif = Mechanic.query.filter_by(email='jarif123@gmail.com').first()
    if jarif:
        print(f'\nChecking messages for {jarif.username}:')
        received = Message.query.filter_by(receiver_id=str(jarif.id)).all()
        print(f'Received messages: {len(received)}')
        
        # Also check with prefix
        received_prefixed = Message.query.filter_by(receiver_id=f'mechanic_{jarif.id}').all()
        print(f'Received messages (mechanic_ prefix): {len(received_prefixed)}')
