"""
Database initialization script for Mech Connect
Run this once to create tables and add sample data
"""

import os
import sys
from datetime import datetime
from flask import Flask
from models import db, User, Admin, Mechanic, MechanicProposal

# Add the login folder to the path
sys.path.insert(0, os.path.dirname(__file__))

def init_database():
    """Initialize database with tables and sample data"""
    
    app = Flask(__name__)
    
    # Database configuration
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "mistrivai.db")}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        # Drop all tables to start fresh with new schema
        db.drop_all()
        
        # Create all tables with new schema
        db.create_all()
        print("Database tables created successfully!")
        
        # Add sample data if tables are empty
        if User.query.first() is None:
            print("\nAdding sample users...")
            
            sample_users = [
                User(
                    username='john_doe',
                    email='john@example.com',
                    password=User.hash_password('password123'),
                    full_name='John Doe',
                    role='user'
                ),
                User(
                    username='jane_smith',
                    email='jane@example.com',
                    password=User.hash_password('password123'),
                    full_name='Jane Smith',
                    role='user'
                )
            ]
            
            for user in sample_users:
                db.session.add(user)
                print(f"  Added user: {user.username}")
            
            db.session.commit()
        
        if Admin.query.first() is None:
            print("\nAdding sample admin...")
            
            admin = Admin(
                username='admin',
                email='jarifhassan980@gmail.com',
                password=Admin.hash_password('jarif.98@'),
                full_name='Admin User',
                role='admin',
                permissions='manage_users,manage_mechanics,view_reports,manage_bookings'
            )
            
            db.session.add(admin)
            db.session.commit()
            print(f"  Added admin: {admin.username}")
        
        if Mechanic.query.first() is None:
            print("\nAdding sample mechanics...")
            
            sample_mechanics = [
                Mechanic(
                    username='jarif_hassan',
                    email='jarif.hassan@gmail.com',
                    password=Mechanic.hash_password('password123'),
                    full_name='Jarif Hassan',
                    workshop_name='Hassan\'s Auto Repair',
                    expertise='Electrical work, Power solutions, Wiring',
                    experience_years=6,
                    hourly_rate=500.0,
                    working_hours='8 am to 10 pm',
                    address='123 Main Street, City',
                    mobile='+1-800-123-4567',
                    age=35,
                    education='Diploma',
                    is_active=True,
                    is_approved=True,
                    rating=4.8,
                    role='mechanic'
                ),
                Mechanic(
                    username='ali_khan',
                    email='ali.khan@gmail.com',
                    password=Mechanic.hash_password('password123'),
                    full_name='Ali Khan',
                    workshop_name='Khan\'s Auto Service',
                    expertise='Engine repair, Transmission, Diagnostics',
                    experience_years=8,
                    hourly_rate=600.0,
                    working_hours='9 am to 9 pm',
                    address='456 Oak Avenue, City',
                    mobile='+1-800-234-5678',
                    age=42,
                    education='Bachelor',
                    is_active=True,
                    is_approved=True,
                    rating=4.9,
                    role='mechanic'
                ),
                Mechanic(
                    username='sarah_williams',
                    email='sarah.williams@gmail.com',
                    password=Mechanic.hash_password('password123'),
                    full_name='Sarah Williams',
                    workshop_name='Williams Auto Body',
                    expertise='Body work, Painting, Dent repair',
                    experience_years=5,
                    hourly_rate=450.0,
                    working_hours='8 am to 6 pm',
                    address='789 Pine Road, City',
                    mobile='+1-800-345-6789',
                    age=38,
                    education='Diploma',
                    is_active=True,
                    is_approved=True,
                    rating=4.7,
                    role='mechanic'
                )
            ]
            
            for mechanic in sample_mechanics:
                db.session.add(mechanic)
                print(f"  Added mechanic: {mechanic.full_name}")
            
            db.session.commit()
            
            # Add proposals for existing mechanics (mark as approved)
            print("\nCreating proposals for sample mechanics...")
            for mechanic in sample_mechanics:
                proposal = MechanicProposal(
                    mechanic_id=mechanic.id,
                    status='approved',
                    reviewed_at=datetime.utcnow(),
                    reviewed_by=1  # admin ID
                )
                db.session.add(proposal)
                print(f"  Added approved proposal for: {mechanic.full_name}")
            
            db.session.commit()
        
        print("\n" + "="*50)
        print("Database initialization complete!")
        print("="*50)
        print("\nDatabase Statistics:")
        print(f"  Users: {User.query.count()}")
        print(f"  Admins: {Admin.query.count()}")
        print(f"  Mechanics: {Mechanic.query.count()}")
        print("\nSample Login Credentials:")
        print("  User: john_doe / password123")
        print("  Admin: admin / admin123")
        print("  Mechanic: jarif_hassan / password123")
        print("\nDatabase file: mistrivai.db")

if __name__ == '__main__':
    init_database()
