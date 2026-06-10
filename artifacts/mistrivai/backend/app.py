import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify, session, redirect
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from sqlalchemy import or_, and_
import tempfile
import time

try:
    import pusher as pusher_lib
except ImportError:
    pusher_lib = None

from models import db, User, Admin, Mechanic, MechanicProposal, MechanicNotification, Booking, Message

app = Flask(__name__, static_folder=None)

session_cookie_secure = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() in ('true', '1', 'yes')
session_cookie_samesite = os.environ.get('SESSION_COOKIE_SAMESITE', 'Lax')
if not session_cookie_secure and session_cookie_samesite.lower() == 'none':
    session_cookie_samesite = 'Lax'

app.config.update({
    'SESSION_COOKIE_HTTPONLY': True,
    'SESSION_COOKIE_SAMESITE': session_cookie_samesite,
    'SESSION_COOKIE_SECURE': session_cookie_secure,
})

if os.environ.get('SESSION_COOKIE_DOMAIN'):
    app.config['SESSION_COOKIE_DOMAIN'] = os.environ.get('SESSION_COOKIE_DOMAIN')

basedir = os.path.abspath(os.path.dirname(__file__))

database_url = os.environ.get('DATABASE_URL')
if database_url:
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    db_path = os.path.join(basedir, 'mistrivai.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

_secret_key = os.environ.get('SESSION_SECRET_KEY')
if not _secret_key:
    import secrets as _secrets
    _secret_key = _secrets.token_hex(32)
    print('[WARNING] SESSION_SECRET_KEY not set — using a random key. Sessions will not survive restarts. Set SESSION_SECRET_KEY in environment for production.')
app.secret_key = _secret_key

db.init_app(app)

app.permanent_session_lifetime = timedelta(days=int(os.environ.get('SESSION_LIFETIME_DAYS', '7')))

frontend_origins = os.environ.get('FRONTEND_ORIGINS')
if frontend_origins:
    origins = [o.strip() for o in frontend_origins.split(',') if o.strip()]
    CORS(app, supports_credentials=True, origins=origins)
else:
    CORS(app, supports_credentials=True, origins=['*'])

pusher_client = None
if pusher_lib:
    pusher_app_id = os.environ.get('PUSHER_APP_ID')
    pusher_key = os.environ.get('PUSHER_KEY')
    pusher_secret = os.environ.get('PUSHER_SECRET')
    pusher_cluster = os.environ.get('PUSHER_CLUSTER', 'ap2')
    if pusher_app_id and pusher_key and pusher_secret:
        try:
            pusher_client = pusher_lib.Pusher(
                app_id=pusher_app_id,
                key=pusher_key,
                secret=pusher_secret,
                cluster=pusher_cluster,
                ssl=True
            )
        except Exception as e:
            print(f"[PUSHER] Failed to initialize: {e}")

def trigger_pusher_event(channel, event, data):
    if pusher_client:
        try:
            pusher_client.trigger(channel, event, data)
        except Exception as e:
            print(f"[PUSHER ERROR] {e}")

with app.app_context():
    db.create_all()
    default_email = os.environ.get('DEFAULT_ADMIN_EMAIL')
    default_password = os.environ.get('DEFAULT_ADMIN_PASSWORD')
    default_username = os.environ.get('DEFAULT_ADMIN_USERNAME', 'admin')
    default_full_name = os.environ.get('DEFAULT_ADMIN_FULL_NAME', 'Admin')
    if default_email and default_password:
        existing = Admin.query.filter_by(email=default_email).first()
        if not existing:
            uname = default_username
            if Admin.query.filter_by(username=uname).first():
                uname = f"{uname}_1"
            new_admin = Admin(
                username=uname,
                email=default_email,
                password=Admin.hash_password(default_password),
                full_name=default_full_name,
                role='admin'
            )
            db.session.add(new_admin)
            db.session.commit()
            print(f"[INIT] Created admin from env: {default_email}")
    elif not Admin.query.first():
        print("[INIT] No admin exists. Set DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD env vars to seed one.")

@app.route('/profile', methods=['GET'])
def get_profile():
    user = session.get('user')
    if user:
        return jsonify({'logged_in': True, 'user': user})
    return jsonify({'logged_in': False}), 200

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify({
        'pusher_key': os.environ.get('PUSHER_KEY', ''),
        'pusher_cluster': os.environ.get('PUSHER_CLUSTER', 'ap2')
    })

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({'success': True, 'message': 'Logged out successfully!'})

@app.route('/login', methods=['POST'])
def api_login():
    data = request.json
    email = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')
    if not email or not password:
        return jsonify({'success': False, 'message': 'Please enter both email and password!'}), 400
    user = None
    if role == 'admin':
        user = Admin.query.filter_by(email=email).first()
    elif role == 'mechanic':
        user = Mechanic.query.filter_by(email=email).first()
    else:
        user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        session['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': getattr(user, 'full_name', ''),
            'role': user.role,
            'profile_pic': user.profile_pic,
            'is_approved': getattr(user, 'is_approved', None),
        }
        session.permanent = True
        return jsonify({
            'success': True,
            'message': f'Login successful!',
            'user': session['user']
        })
    return jsonify({'success': False, 'message': 'Invalid email or password!'}), 401

@app.route('/signup', methods=['POST'])
def api_signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', '')
    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'Username, email, and password are required!'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Username already exists!'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already registered!'}), 400
    new_user = User(username=username, email=email, password=User.hash_password(password), full_name=full_name, role='user')
    try:
        db.session.add(new_user)
        db.session.commit()
        session['user'] = {'id': new_user.id, 'username': new_user.username, 'email': new_user.email, 'full_name': new_user.full_name, 'role': new_user.role, 'profile_pic': new_user.profile_pic}
        session.permanent = True
        return jsonify({'success': True, 'message': 'Account created!', 'user': session['user']}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/admin/signup', methods=['POST'])
def admin_signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', '')
    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'All fields required!'}), 400
    if Admin.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Admin username exists!'}), 400
    if Admin.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Admin email registered!'}), 400
    new_admin = Admin(username=username, email=email, password=Admin.hash_password(password), full_name=full_name, role='admin')
    try:
        db.session.add(new_admin)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Admin created!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/signup', methods=['POST'])
def mechanic_signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    workshop_name = data.get('workshop_name')
    if not all([username, email, password, full_name, workshop_name]):
        return jsonify({'success': False, 'message': 'All fields required!'}), 400
    if Mechanic.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Username exists!'}), 400
    if Mechanic.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email registered!'}), 400
    new_mechanic = Mechanic(username=username, email=email, password=Mechanic.hash_password(password), full_name=full_name, workshop_name=workshop_name, role='mechanic')
    try:
        db.session.add(new_mechanic)
        db.session.commit()
        session['user'] = {'id': new_mechanic.id, 'username': new_mechanic.username, 'email': new_mechanic.email, 'full_name': new_mechanic.full_name, 'role': new_mechanic.role, 'profile_pic': new_mechanic.profile_pic, 'is_approved': False}
        session.permanent = True
        return jsonify({'success': True, 'message': 'Mechanic account created!', 'user': session['user']}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/update-profile', methods=['POST'])
def update_profile():
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in!'}), 401
    data = request.json
    role = user_data.get('role', 'user')
    user_id = user_data.get('id')
    try:
        if role == 'admin':
            user = db.session.get(Admin, user_id)
        elif role == 'mechanic':
            user = db.session.get(Mechanic, user_id)
        else:
            user = db.session.get(User, user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found!'}), 404
        if 'full_name' in data: user.full_name = data['full_name']
        if 'profile_pic' in data: user.profile_pic = data['profile_pic']
        if 'email' in data: user.email = data['email']
        if role == 'mechanic':
            for field in ['expertise', 'experience_years', 'hourly_rate', 'working_hours', 'address', 'workshop_name', 'age']:
                if field in data: setattr(user, field, data[field])
            if 'mobile' in data: user.mobile = data['mobile']
            elif 'phone' in data: user.mobile = data['phone']
            if 'is_active' in data: user.is_active = bool(data['is_active'])
        db.session.commit()
        session['user'].update({'full_name': user.full_name, 'profile_pic': user.profile_pic, 'email': user.email})
        return jsonify({'success': True, 'message': 'Profile updated!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanics', methods=['GET'])
def get_mechanics():
    try:
        mechanics = Mechanic.query.filter_by(is_active=True, is_approved=True).all()
        mechanics_data = [{
            'id': m.id, 'name': m.full_name, 'workshop': m.workshop_name,
            'expertise': m.expertise, 'experience': m.experience_years,
            'hourly_rate': m.hourly_rate, 'working_hours': m.working_hours,
            'address': m.address, 'mobile': m.mobile, 'profile_pic': m.profile_pic,
            'rating': m.rating, 'is_active': m.is_active
        } for m in mechanics]
        return jsonify({'success': True, 'mechanics': mechanics_data})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanics/<int:mechanic_id>', methods=['GET'])
def get_mechanic_detail(mechanic_id):
    try:
        m = db.session.get(Mechanic, mechanic_id)
        if not m:
            return jsonify({'success': False, 'message': 'Mechanic not found!'}), 404
        return jsonify({'success': True, 'mechanic': {
            'id': m.id, 'name': m.full_name, 'workshop': m.workshop_name,
            'expertise': m.expertise, 'experience': m.experience_years,
            'hourly_rate': m.hourly_rate, 'working_hours': m.working_hours,
            'address': m.address, 'mobile': m.mobile, 'profile_pic': m.profile_pic, 'rating': m.rating
        }})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    try:
        return jsonify({'success': True, 'total_users': User.query.count(), 'total_mechanics': Mechanic.query.count(), 'total_bookings': Booking.query.count()})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/api/users', methods=['GET'])
def get_all_users():
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    try:
        users = [{'id': u.id, 'username': u.username, 'email': u.email, 'full_name': u.full_name, 'role': u.role, 'created_at': u.created_at.isoformat()} for u in User.query.all()]
        return jsonify({'success': True, 'users': users})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/api/mechanics', methods=['GET'])
def get_all_mechanics():
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    try:
        mechanics = [{'id': m.id, 'username': m.username, 'email': m.email, 'full_name': m.full_name, 'is_active': m.is_active, 'is_approved': m.is_approved, 'rating': m.rating, 'total_bookings': m.total_bookings} for m in Mechanic.query.all()]
        return jsonify({'success': True, 'mechanics': mechanics})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/submit-proposal', methods=['POST'])
def submit_mechanic_proposal():
    try:
        import json
        if request.form:
            data = request.form.to_dict()
        else:
            data = request.get_json() or {}
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        full_name = data.get('full_name', '').strip()
        if not email or not password or not full_name:
            return jsonify({'success': False, 'message': 'Email, password, and full name are required!'}), 400
        if User.query.filter_by(email=email).first() or Mechanic.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'Email already registered!'}), 400
        skills_str = data.get('skills', '') or data.get('expertise', '')
        skills = [s.strip() for s in skills_str.split(',') if s.strip()] if isinstance(skills_str, str) else []
        mechanic = Mechanic(
            username=email, email=email, password=Mechanic.hash_password(password),
            full_name=full_name, age=int(data.get('age', 0)) if data.get('age') else None,
            mobile=data.get('mobile', '').strip(), address=data.get('address', '').strip(),
            workshop_name=data.get('workshop_name', '').strip(),
            experience_years=int(data.get('experience', 0)) if data.get('experience') else None,
            hourly_rate=float(data.get('hourly_rate', 0)) if data.get('hourly_rate') else 0.0,
            working_hours=data.get('working_hours', '').strip(),
            expertise=','.join(skills), education=data.get('education', '').strip(),
            nid_number=data.get('nid_number', '').strip(),
            birth_certificate_number=data.get('birth_certificate_number', '').strip(),
            work_history=data.get('work_history', '').strip(),
            is_active=False, is_approved=False, role='mechanic'
        )
        db.session.add(mechanic)
        db.session.commit()
        proposal = MechanicProposal(mechanic_id=mechanic.id, status='pending')
        db.session.add(proposal)
        db.session.commit()
        session['user'] = {'id': mechanic.id, 'username': mechanic.username, 'email': mechanic.email, 'full_name': mechanic.full_name, 'role': 'mechanic', 'profile_pic': mechanic.profile_pic, 'is_approved': False}
        session.permanent = True
        return jsonify({'success': True, 'message': 'Proposal submitted!', 'mechanic_id': mechanic.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/status', methods=['GET'])
def get_mechanic_status():
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    try:
        mechanic = db.session.get(Mechanic, user_data.get('id'))
        if not mechanic:
            return jsonify({'success': False, 'message': 'Mechanic not found!'}), 404
        proposal = MechanicProposal.query.filter_by(mechanic_id=mechanic.id).first()
        if not proposal and mechanic.is_approved:
            proposal = MechanicProposal(mechanic_id=mechanic.id, status='approved')
            db.session.add(proposal)
            db.session.commit()
        if not proposal:
            return jsonify({'success': False, 'message': 'No proposal found!'}), 404
        response = {'success': True, 'proposal': {
            'status': proposal.status, 'submitted_at': proposal.submitted_at.isoformat() if proposal.submitted_at else None,
            'full_name': mechanic.full_name, 'email': mechanic.email, 'is_approved': mechanic.is_approved
        }}
        if proposal.status == 'approved':
            if session.get('user'):
                session['user']['is_approved'] = True
            response['redirect'] = '/mechanic-dashboard'
        return jsonify(response)
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/admin/pending-mechanics', methods=['GET'])
def get_pending_mechanics():
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    try:
        proposals = MechanicProposal.query.filter_by(status='pending').all()
        pending_list = [{'proposal_id': p.id, 'mechanic_id': p.mechanic.id, 'name': p.mechanic.full_name, 'email': p.mechanic.email, 'mobile': p.mechanic.mobile, 'profile_pic': p.mechanic.profile_pic, 'submitted_at': p.submitted_at.isoformat(), 'experience_years': p.mechanic.experience_years, 'skills': p.mechanic.expertise} for p in proposals]
        return jsonify({'success': True, 'pending': pending_list})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/admin/mechanic/<int:mechanic_id>', methods=['GET'])
def get_mechanic_details_admin(mechanic_id):
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    try:
        m = db.session.get(Mechanic, mechanic_id)
        if not m:
            return jsonify({'success': False, 'message': 'Not found!'}), 404
        return jsonify({'success': True, 'mechanic': {'id': m.id, 'full_name': m.full_name, 'email': m.email, 'age': m.age, 'mobile': m.mobile, 'address': m.address, 'workshop_name': m.workshop_name, 'experience_years': m.experience_years, 'hourly_rate': m.hourly_rate, 'working_hours': m.working_hours, 'expertise': m.expertise, 'education': m.education, 'nid_number': m.nid_number, 'profile_pic': m.profile_pic, 'is_approved': m.is_approved, 'is_active': m.is_active}})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/admin/mechanic/<int:mechanic_id>/approve', methods=['POST'])
def approve_mechanic(mechanic_id):
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    try:
        m = db.session.get(Mechanic, mechanic_id)
        if not m:
            return jsonify({'success': False, 'message': 'Not found!'}), 404
        m.is_approved = True
        m.is_active = True
        proposal = MechanicProposal.query.filter_by(mechanic_id=mechanic_id).first()
        if proposal:
            proposal.status = 'approved'
            proposal.reviewed_by = user_data.get('id')
            proposal.reviewed_at = datetime.utcnow()
            notif = MechanicNotification(mechanic_id=mechanic_id, proposal_id=proposal.id, notification_type='approved', message='Congratulations! Your proposal has been approved!')
            db.session.add(notif)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Mechanic approved!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/admin/mechanic/<int:mechanic_id>/reject', methods=['POST'])
def reject_mechanic(mechanic_id):
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    data = request.get_json() or {}
    try:
        m = db.session.get(Mechanic, mechanic_id)
        if not m:
            return jsonify({'success': False, 'message': 'Not found!'}), 404
        proposal = MechanicProposal.query.filter_by(mechanic_id=mechanic_id).first()
        if proposal:
            proposal.status = 'rejected'
            proposal.reviewed_by = user_data.get('id')
            proposal.reviewed_at = datetime.utcnow()
            proposal.review_notes = data.get('notes', '')
            notif = MechanicNotification(mechanic_id=mechanic_id, proposal_id=proposal.id, notification_type='rejected', message='Your application has been reviewed.', reason=data.get('notes', ''))
            db.session.add(notif)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Mechanic rejected!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/bookings', methods=['GET', 'POST'])
def bookings():
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    if request.method == 'POST':
        data = request.get_json()
        try:
            booking = Booking(
                user_id=user_data['id'], mechanic_id=data['mechanic_id'],
                address=data['address'], preferred_time=datetime.fromisoformat(data['preferred_time']),
                problem_description=data['problem_description'], offer=data['offer'],
                payment_method=data['payment_method'], status='requested'
            )
            db.session.add(booking)
            db.session.commit()
            trigger_pusher_event(f"mechanic-{booking.mechanic_id}", 'booking_update', {'id': booking.id, 'status': booking.status})
            return jsonify({'success': True, 'booking_id': booking.id})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    else:
        try:
            bk = Booking.query.filter_by(user_id=user_data['id']).order_by(Booking.created_at.desc()).all()
            result = [{'id': b.id, 'mechanic_id': b.mechanic_id, 'mechanic_name': b.mechanic.full_name, 'mechanic_profile_pic': b.mechanic.profile_pic, 'address': b.address, 'preferred_time': b.preferred_time.isoformat(), 'problem_description': b.problem_description, 'offer': b.offer, 'payment_method': b.payment_method, 'status': b.status, 'counter_offer': b.counter_offer, 'counter_note': b.counter_note, 'created_at': b.created_at.isoformat()} for b in bk]
            return jsonify({'success': True, 'bookings': result})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/bookings', methods=['GET'])
def mechanic_bookings():
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return jsonify({'success': False, 'message': 'Not authorized'}), 401
    try:
        bk = Booking.query.filter_by(mechanic_id=user_data['id']).order_by(Booking.created_at.desc()).all()
        result = [{'id': b.id, 'user_id': b.user_id, 'user_name': b.user.username, 'address': b.address, 'preferred_time': b.preferred_time.isoformat(), 'problem_description': b.problem_description, 'offer': b.offer, 'payment_method': b.payment_method, 'status': b.status, 'counter_offer': b.counter_offer, 'counter_note': b.counter_note, 'created_at': b.created_at.isoformat()} for b in bk]
        return jsonify({'success': True, 'bookings': result})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/bookings/<int:booking_id>/accept', methods=['POST'])
def mechanic_accept_booking(booking_id):
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return jsonify({'success': False, 'message': 'Not authorized'}), 401
    try:
        booking = db.session.get(Booking, booking_id)
        if not booking or booking.mechanic_id != user_data['id']:
            return jsonify({'success': False, 'message': 'Not found'}), 404
        booking.status = 'confirmed'
        db.session.commit()
        trigger_pusher_event(f"user-{booking.user_id}", 'booking_update', {'id': booking.id, 'status': booking.status})
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/bookings/<int:booking_id>/reject', methods=['POST'])
def mechanic_reject_booking(booking_id):
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return jsonify({'success': False, 'message': 'Not authorized'}), 401
    try:
        booking = db.session.get(Booking, booking_id)
        if not booking or booking.mechanic_id != user_data['id']:
            return jsonify({'success': False, 'message': 'Not found'}), 404
        booking.status = 'rejected'
        db.session.commit()
        trigger_pusher_event(f"user-{booking.user_id}", 'booking_update', {'id': booking.id, 'status': booking.status})
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/bookings/<int:booking_id>/counter', methods=['POST'])
def mechanic_counter_booking(booking_id):
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return jsonify({'success': False, 'message': 'Not authorized'}), 401
    data = request.get_json()
    try:
        booking = db.session.get(Booking, booking_id)
        if not booking or booking.mechanic_id != user_data['id']:
            return jsonify({'success': False, 'message': 'Not found'}), 404
        booking.counter_offer = data.get('counter_offer')
        booking.counter_note = data.get('note')
        db.session.commit()
        trigger_pusher_event(f"user-{booking.user_id}", 'booking_update', {'id': booking.id, 'counter_offer': booking.counter_offer})
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/bookings/<int:booking_id>/complete', methods=['POST'])
def complete_booking(booking_id):
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    try:
        booking = db.session.get(Booking, booking_id)
        if not booking or booking.user_id != user_data['id']:
            return jsonify({'success': False, 'message': 'Not found'}), 404
        booking.status = 'completed'
        mechanic = booking.mechanic
        mechanic.total_bookings = (mechanic.total_bookings or 0) + 1
        mechanic.total_income = (mechanic.total_income or 0) + booking.offer
        if mechanic.total_bookings:
            mechanic.average_income = mechanic.total_income / mechanic.total_bookings
        db.session.commit()
        trigger_pusher_event(f"mechanic-{booking.mechanic_id}", 'booking_update', {'id': booking.id, 'status': 'completed'})
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/chat/conversations', methods=['GET'])
def chat_conversations():
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    try:
        my_id = user_data['id']
        my_role = user_data.get('role')
        my_prefixed = f"{my_role}_{my_id}"
        messages = Message.query.filter(or_(Message.sender_id == my_prefixed, Message.receiver_id == my_prefixed)).order_by(Message.created_at.desc()).all()
        peer_map = {}
        for msg in messages:
            peer_id = msg.receiver_id if msg.sender_id == my_prefixed else msg.sender_id
            if peer_id not in peer_map:
                peer_map[peer_id] = {'last_msg': msg, 'unread': 0}
            if msg.receiver_id == my_prefixed and not msg.is_read:
                peer_map[peer_id]['unread'] += 1
        convs = []
        for peer_id, info in peer_map.items():
            if peer_id.startswith('user_'):
                peer = User.query.get(int(peer_id.replace('user_', '')))
                role = 'user'
            elif peer_id.startswith('mechanic_'):
                peer = Mechanic.query.get(int(peer_id.replace('mechanic_', '')))
                role = 'mechanic'
            else:
                continue
            if not peer: continue
            convs.append({'id': peer_id, 'name': peer.username, 'avatar': getattr(peer, 'profile_pic', None), 'role': role, 'last_message': info['last_msg'].content or '[Image]', 'last_time': info['last_msg'].created_at.isoformat(), 'unread_count': info['unread']})
        return jsonify({'success': True, 'conversations': convs})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/chat/messages/<conversation_id>', methods=['GET'])
def get_messages(conversation_id):
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    try:
        my_prefixed = f"{user_data['role']}_{user_data['id']}"
        messages = Message.query.filter(or_(
            and_(Message.sender_id == my_prefixed, Message.receiver_id == conversation_id),
            and_(Message.sender_id == conversation_id, Message.receiver_id == my_prefixed)
        )).order_by(Message.created_at.asc()).all()
        Message.query.filter_by(receiver_id=my_prefixed, is_read=False).update({'is_read': True})
        db.session.commit()
        result = [{'id': m.id, 'sender_id': m.sender_id, 'receiver_id': m.receiver_id, 'content': m.content, 'image_url': m.image_url, 'created_at': m.created_at.isoformat(), 'is_read': m.is_read} for m in messages]
        return jsonify({'success': True, 'messages': result})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/chat/send', methods=['POST'])
def chat_send():
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    try:
        data = request.json
        content = data.get('content', '').strip()
        receiver_id = data.get('receiver_id')
        image_url = data.get('image_url')
        if not content and not image_url:
            return jsonify({'success': False, 'message': 'Message content required'}), 400
        if not receiver_id:
            return jsonify({'success': False, 'message': 'Receiver required'}), 400
        sender_id = f"{user_data['role']}_{user_data['id']}"
        msg = Message(sender_id=sender_id, receiver_id=receiver_id, content=content, image_url=image_url)
        db.session.add(msg)
        db.session.commit()
        payload = {'id': msg.id, 'sender_id': sender_id, 'receiver_id': receiver_id, 'content': content, 'image_url': image_url, 'created_at': msg.created_at.isoformat()}
        trigger_pusher_event(f"chat-{receiver_id}", 'new_message', payload)
        trigger_pusher_event(f"chat-{sender_id}", 'new_message', payload)
        return jsonify({'success': True, 'message_id': msg.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/chat/users', methods=['GET'])
def get_chat_users():
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    try:
        role = user_data.get('role')
        users = []
        if role == 'user':
            mechanics = Mechanic.query.filter_by(is_active=True, is_approved=True).all()
            users = [{'id': f"mechanic_{m.id}", 'username': m.username, 'avatar': m.profile_pic, 'role': 'mechanic'} for m in mechanics]
        elif role == 'mechanic':
            bookings = Booking.query.filter_by(mechanic_id=user_data['id']).all()
            user_ids = set(b.user_id for b in bookings)
            for uid in user_ids:
                u = User.query.get(uid)
                if u: users.append({'id': f"user_{u.id}", 'username': u.username, 'avatar': u.profile_pic, 'role': 'user'})
        elif role == 'admin':
            users = [{'id': f"user_{u.id}", 'username': u.username, 'avatar': u.profile_pic, 'role': 'user'} for u in User.query.all()]
            users += [{'id': f"mechanic_{m.id}", 'username': m.username, 'avatar': m.profile_pic, 'role': 'mechanic'} for m in Mechanic.query.all()]
        return jsonify({'success': True, 'users': users})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/notifications', methods=['GET'])
def get_mechanic_notifications():
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    try:
        notifs = MechanicNotification.query.filter_by(mechanic_id=user_data['id']).order_by(MechanicNotification.created_at.desc()).all()
        return jsonify({'success': True, 'notifications': [{'id': n.id, 'type': n.notification_type, 'message': n.message, 'reason': n.reason, 'is_read': n.is_read, 'created_at': n.created_at.isoformat()} for n in notifs]})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/admin/all-bookings', methods=['GET'])
def get_all_bookings():
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    try:
        bk = Booking.query.order_by(Booking.created_at.desc()).all()
        result = [{'id': b.id, 'user_name': b.user.username, 'mechanic_name': b.mechanic.full_name, 'status': b.status, 'offer': b.offer, 'address': b.address, 'created_at': b.created_at.isoformat()} for b in bk]
        return jsonify({'success': True, 'bookings': result})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
