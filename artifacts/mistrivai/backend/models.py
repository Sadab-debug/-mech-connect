from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(512), nullable=False)
    full_name = db.Column(db.String(120), nullable=True)
    profile_pic = db.Column(db.String(255), nullable=True, default='')
    role = db.Column(db.String(50), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'

    @staticmethod
    def hash_password(password):
        return generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

class Admin(db.Model):
    __tablename__ = 'admins'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(512), nullable=False)
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
        return generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

class Mechanic(db.Model):
    __tablename__ = 'mechanics'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(512), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    workshop_name = db.Column(db.String(120), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    address = db.Column(db.String(255), nullable=True)
    mobile = db.Column(db.String(20), nullable=True)
    profile_pic = db.Column(db.String(255), nullable=True, default='')
    role = db.Column(db.String(50), default='mechanic')
    expertise = db.Column(db.String(255), nullable=True)
    experience_years = db.Column(db.Integer, nullable=True)
    hourly_rate = db.Column(db.Float, nullable=True, default=0.0)
    working_hours = db.Column(db.String(100), nullable=True)
    education = db.Column(db.String(255), nullable=True)
    education_certificate = db.Column(db.String(255), nullable=True)
    skill_certificates = db.Column(db.Text, nullable=True)
    nid_number = db.Column(db.String(50), nullable=True)
    nid_photo = db.Column(db.String(255), nullable=True)
    birth_certificate_number = db.Column(db.String(50), nullable=True)
    birth_certificate_photo = db.Column(db.String(255), nullable=True)
    work_history = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)
    rating = db.Column(db.Float, default=0.0)
    review_count = db.Column(db.Integer, default=0)
    complaint_count = db.Column(db.Integer, default=0)
    trust_score = db.Column(db.Float, default=3.0)
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
        return generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

class MechanicProposal(db.Model):
    __tablename__ = 'mechanic_proposals'

    id = db.Column(db.Integer, primary_key=True)
    mechanic_id = db.Column(db.Integer, db.ForeignKey('mechanics.id'), nullable=False)
    status = db.Column(db.String(50), default='pending')
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
    notification_type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    reason = db.Column(db.Text, nullable=True)
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
    status = db.Column(db.String(50), default='requested')
    deposit_amount = db.Column(db.Float, default=0.0)
    platform_fee = db.Column(db.Float, default=0.0)
    payment_status = db.Column(db.String(50), default='pending')
    payment_transaction_id = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref='bookings')
    mechanic = db.relationship('Mechanic', backref='bookings')

    def __repr__(self):
        return f'<Booking {self.id} - {self.status}>'

class Review(db.Model):
    __tablename__ = 'reviews'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    mechanic_id = db.Column(db.Integer, db.ForeignKey('mechanics.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    booking = db.relationship('Booking', backref=db.backref('review', uselist=False))
    user = db.relationship('User', backref='reviews')
    mechanic = db.relationship('Mechanic', backref='reviews_received')

    def __repr__(self):
        return f'<Review booking={self.booking_id} rating={self.rating}>'

class Complaint(db.Model):
    __tablename__ = 'complaints'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    mechanic_id = db.Column(db.Integer, db.ForeignKey('mechanics.id'), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    booking = db.relationship('Booking', backref=db.backref('complaint', uselist=False))
    user = db.relationship('User', backref='complaints_filed')
    mechanic = db.relationship('Mechanic', backref='complaints_received')

    def __repr__(self):
        return f'<Complaint booking={self.booking_id} status={self.status}>'

class EmergencyRequest(db.Model):
    __tablename__ = 'emergency_requests'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    contact_number = db.Column(db.String(20), nullable=True)
    budget = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(50), default='open')
    accepted_by = db.Column(db.Integer, db.ForeignKey('mechanics.id'), nullable=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='emergency_requests')
    mechanic = db.relationship('Mechanic', backref='accepted_emergencies', foreign_keys=[accepted_by])

    def __repr__(self):
        return f'<EmergencyRequest {self.id} - {self.status}>'

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.String(50), nullable=False)
    receiver_id = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Message {self.sender_id} -> {self.receiver_id}>'
