from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import hashlib

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=True)
    profile_pic = db.Column(db.String(255), nullable=True, default='')
    role = db.Column(db.String(50), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    @staticmethod
    def hash_password(password):
        return hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    def check_password(self, password):
        return self.password == self.hash_password(password)

class Admin(db.Model):
    __tablename__ = 'admins'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=True)
    profile_pic = db.Column(db.String(255), nullable=True, default='')
    role = db.Column(db.String(50), default='admin')
    permissions = db.Column(db.String(500), nullable=True, default='manage_users,view_reports')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Admin {self.username}>'
    
    @staticmethod
    def hash_password(password):
        return hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    def check_password(self, password):
        return self.password == self.hash_password(password)

class Mechanic(db.Model):
    __tablename__ = 'mechanics'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    workshop_name = db.Column(db.String(120), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    address = db.Column(db.String(255), nullable=True)
    mobile = db.Column(db.String(20), nullable=True)
    profile_pic = db.Column(db.String(255), nullable=True, default='')
    role = db.Column(db.String(50), default='mechanic')
    expertise = db.Column(db.String(255), nullable=True)  # comma-separated skills
    experience_years = db.Column(db.Integer, nullable=True)
    hourly_rate = db.Column(db.Float, nullable=True, default=0.0)
    working_hours = db.Column(db.String(100), nullable=True)
    education = db.Column(db.String(255), nullable=True)
    education_certificate = db.Column(db.String(255), nullable=True)
    skill_certificates = db.Column(db.Text, nullable=True)  # JSON array of URLs
    nid_number = db.Column(db.String(50), nullable=True)
    nid_photo = db.Column(db.String(255), nullable=True)
    birth_certificate_number = db.Column(db.String(50), nullable=True)
    birth_certificate_photo = db.Column(db.String(255), nullable=True)
    work_history = db.Column(db.Text, nullable=True)  # JSON array of past works
    is_active = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)
    rating = db.Column(db.Float, default=0.0)
    total_bookings = db.Column(db.Integer, default=0)
    total_income = db.Column(db.Float, default=0.0)
    monthly_income = db.Column(db.Float, default=0.0)
    average_income = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Mechanic {self.full_name}>'
    
    @staticmethod
    def hash_password(password):
        return hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    def check_password(self, password):
        return self.password == self.hash_password(password)

class MechanicProposal(db.Model):
    __tablename__ = 'mechanic_proposals'
    
    id = db.Column(db.Integer, primary_key=True)
    mechanic_id = db.Column(db.Integer, db.ForeignKey('mechanics.id'), nullable=False)
    status = db.Column(db.String(50), default='pending')  # pending, approved, rejected
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=True)
    review_notes = db.Column(db.Text, nullable=True)
    
    mechanic = db.relationship('Mechanic', backref='proposals')
    admin = db.relationship('Admin', backref='reviewed_proposals')
    
    def __repr__(self):
        return f'<MechanicProposal {self.mechanic_id} - {self.status}>'

class MechanicNotification(db.Model):
    __tablename__ = 'mechanic_notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    mechanic_id = db.Column(db.Integer, db.ForeignKey('mechanics.id'), nullable=False)
    proposal_id = db.Column(db.Integer, db.ForeignKey('mechanic_proposals.id'), nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)  # 'approved', 'rejected', 'info'
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    
    mechanic = db.relationship('Mechanic', backref='notifications')
    proposal = db.relationship('MechanicProposal', backref='notifications')
    
    def __repr__(self):
        return f'<MechanicNotification {self.mechanic_id} - {self.notification_type}>'

class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    mechanic_id = db.Column(db.Integer, db.ForeignKey('mechanics.id'), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    preferred_time = db.Column(db.DateTime, nullable=False)
    problem_description = db.Column(db.Text, nullable=False)
    offer = db.Column(db.Float, nullable=False)
    counter_offer = db.Column(db.Float, nullable=True)
    counter_note = db.Column(db.Text, nullable=True)
    payment_method = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), default='requested')  # requested, confirmed, pending, completed, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', backref='bookings')
    mechanic = db.relationship('Mechanic', backref='bookings')
    
    def __repr__(self):
        return f'<Booking {self.id} - {self.status}>'

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, nullable=False)  # Can be user or mechanic
    receiver_id = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<Message {self.id} from {self.sender_id} to {self.receiver_id}>'