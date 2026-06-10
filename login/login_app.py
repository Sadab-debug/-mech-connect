from flask import Flask, render_template, request, jsonify, session, redirect, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from sqlalchemy import or_, and_
import os
import tempfile
import time
import pusher

# Import models first to get their db instance
from models import db, User, Admin, Mechanic, MechanicProposal, MechanicNotification, Booking, Message

app = Flask(__name__, static_folder=None)

# Configure session cookie behavior from environment for production (Vercel)
# Use env vars to control for local vs production environments.
session_cookie_secure = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() in ('true', '1', 'yes')
session_cookie_samesite = os.environ.get('SESSION_COOKIE_SAMESITE', 'Lax')
if not session_cookie_secure and session_cookie_samesite.lower() == 'none':
    session_cookie_samesite = 'Lax'

app.config.update({
    'SESSION_COOKIE_HTTPONLY': True,
    'SESSION_COOKIE_SAMESITE': session_cookie_samesite,
    'SESSION_COOKIE_SECURE': session_cookie_secure,
})

# Optionally set session cookie domain when serving across subdomains
if os.environ.get('SESSION_COOKIE_DOMAIN'):
    app.config['SESSION_COOKIE_DOMAIN'] = os.environ.get('SESSION_COOKIE_DOMAIN')

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
parent_dir = os.path.dirname(basedir)

database_url = os.environ.get('DATABASE_URL')
if database_url:
    # SQLAlchemy requires 'postgresql://' instead of 'postgres://' (common in Vercel Postgres URLs)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    def get_current_db():
        try:
            with open(os.path.join(basedir, 'current_db.txt')) as f:
                return f.read().strip()
        except:
            return 'mechconnect.db'

    db_name = get_current_db()
    db_path = os.path.join(basedir, db_name)
    if os.environ.get('VERCEL') == '1' or not os.access(basedir, os.W_OK):
        temp_db_dir = tempfile.gettempdir()
        db_path = os.path.join(temp_db_dir, db_name)
        print(f"[DB] Using temporary writable SQLite path: {db_path}")

    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = os.environ.get('SESSION_SECRET_KEY', 'your_secret_key_change_this')


# Initialize database with the app
db.init_app(app)

# Configure the session lifetime (days)
app.permanent_session_lifetime = timedelta(days=int(os.environ.get('SESSION_LIFETIME_DAYS', '7')))

# Configure CORS origins: set FRONTEND_ORIGINS env var to a comma-separated list
# For debugging: if FRONTEND_ORIGINS not set, allow all origins (less secure but helps debug cookie issues)
frontend_origins = os.environ.get('FRONTEND_ORIGINS')
if frontend_origins:
    origins = [o.strip() for o in frontend_origins.split(',') if o.strip()]
    print(f"[CORS] Using restricted origins: {origins}")
    CORS(app, supports_credentials=True, origins=origins)
else:
    print("[CORS] WARNING: FRONTEND_ORIGINS not set. Allowing all origins for debugging.")
    print("[CORS] For production, set FRONTEND_ORIGINS env var to your frontend URL.")
    CORS(app, supports_credentials=True, origins=['*'])  # Allow all origins (debug mode)

# Initialize Pusher
pusher_app_id = os.environ.get('PUSHER_APP_ID')
pusher_key = os.environ.get('PUSHER_KEY')
pusher_secret = os.environ.get('PUSHER_SECRET')
pusher_cluster = os.environ.get('PUSHER_CLUSTER', 'ap2')

pusher_client = None
if pusher_app_id and pusher_key and pusher_secret:
    try:
        pusher_client = pusher.Pusher(
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
            print(f"[PUSHER ERROR] Failed to trigger event {event} on channel {channel}: {e}")

with app.app_context():
    db.create_all()

    # Ensure a known default admin account exists.
    default_email = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@mechconnect.local')
    default_password = os.environ.get('DEFAULT_ADMIN_PASSWORD', 'Admin@1234')
    default_username = os.environ.get('DEFAULT_ADMIN_USERNAME', 'admin')
    default_full_name = os.environ.get('DEFAULT_ADMIN_FULL_NAME', 'Default Admin')
    default_admin = Admin.query.filter_by(email=default_email).first()
    if not default_admin:
        if Admin.query.filter_by(username=default_username).first():
            default_username = f"{default_username}_1"
        new_admin = Admin(
            username=default_username,
            email=default_email,
            password=Admin.hash_password(default_password),
            full_name=default_full_name,
            role='admin'
        )
        db.session.add(new_admin)
        db.session.commit()
        print(f"[INIT] Created default admin account: {default_email} / {default_password}")

# ===== SERVE STATIC FILES =====

@app.route('/')
def serve_main():
    """Serve main.html"""
    return send_from_directory(parent_dir, 'main.html')

@app.route('/main.html')
def serve_main_alt():
    """Serve main.html"""
    return send_from_directory(parent_dir, 'main.html')

@app.route('/main.css')
def serve_main_css():
    """Serve main.css"""
    return send_from_directory(parent_dir, 'main.css')

@app.route('/main.js')
def serve_main_js():
    """Serve main.js"""
    return send_from_directory(parent_dir, 'main.js')

@app.route('/login/login.html')
def serve_login():
    """Serve login.html"""
    return send_from_directory(basedir, 'login.html')

@app.route('/login/login.js')
def serve_login_js():
    """Serve login.js"""
    return send_from_directory(basedir, 'login.js')

@app.route('/login/login.css')
def serve_login_css():
    """Serve login.css"""
    return send_from_directory(basedir, 'login.css')

@app.route('/signup.html')
def serve_signup_html():
    """Serve signup page via login.html"""
    return send_from_directory(basedir, 'login.html')

@app.route('/register')
@app.route('/register.html')
def serve_register_html():
    """Serve register page via login.html"""
    return send_from_directory(basedir, 'login.html')

@app.route('/i18n.js')
def serve_i18n_js():
    """Serve i18n.js"""
    return send_from_directory(parent_dir, 'i18n.js')

@app.route('/i18n.css')
def serve_i18n_css():
    """Serve i18n.css"""
    return send_from_directory(parent_dir, 'i18n.css')

# Serve index files
@app.route('/index/index.html')
def serve_index():
    """Serve index.html"""
    index_path = os.path.join(parent_dir, 'index', 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(os.path.join(parent_dir, 'index'), 'index.html')
    return "File not found", 404

@app.route('/index/index.css')
def serve_index_css():
    """Serve index.css"""
    index_path = os.path.join(parent_dir, 'index', 'index.css')
    if os.path.exists(index_path):
        return send_from_directory(os.path.join(parent_dir, 'index'), 'index.css')
    return "", 204

@app.route('/index/index.js')
def serve_index_js():
    """Serve index.js"""
    index_path = os.path.join(parent_dir, 'index', 'index.js')
    if os.path.exists(index_path):
        return send_from_directory(os.path.join(parent_dir, 'index'), 'index.js')
    return "", 204

@app.route('/admin_dashboard.html')
def serve_admin_dashboard():
    """Serve admin dashboard"""
    return send_from_directory(parent_dir, 'admin_dashboard.html')
@app.route('/pending_mechanics.html')
def serve_pending_mechanics():
    """Serve pending mechanics page"""
    return send_from_directory(basedir, 'pending_mechanics.html')
@app.route('/admin_dashboard.css')
def serve_admin_dashboard_css():
    """Serve admin dashboard CSS"""
    return send_from_directory(parent_dir, 'admin_dashboard.css')

@app.route('/admin_dashboard.js')
def serve_admin_dashboard_js():
    """Serve admin dashboard JS"""
    return send_from_directory(parent_dir, 'admin_dashboard.js')

@app.route('/mechanic_registration.html')
def serve_mechanic_registration():
    """Serve mechanic registration form"""
    return send_from_directory(parent_dir, 'mechanic_registration.html')

@app.route('/mechanic_registration.js')
def serve_mechanic_registration_js():
    """Serve mechanic registration JS"""
    return send_from_directory(parent_dir, 'mechanic_registration.js')

@app.route('/mechanic_dashboard.html')
def serve_mechanic_dashboard():
    """Serve mechanic dashboard"""
    return send_from_directory(basedir, 'mechanic_dashboard.html')
@app.route('/mechanic_dashboard_full.html')
def serve_mechanic_dashboard_full():
    """Serve full mechanic dashboard for approved mechanics"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return redirect('/login/login.html')

    mechanic = db.session.get(Mechanic, user_data.get('id'))
    if not mechanic:
        return redirect('/login/login.html')

    if not mechanic.is_approved:
        return redirect('/mechanic_dashboard.html')

    return send_from_directory(basedir, 'mechanic_dashboard_full.html')
# ===== USER ROUTES =====

@app.route('/login', methods=['GET', 'POST'])
def api_login():
    """Handle login page display and login form submission."""
    if request.method == 'GET':
        return send_from_directory(basedir, 'login.html')

    data = request.json
    email = data.get('username')  # Frontend sends email in username field
    password = data.get('password')
    role = data.get('role', 'user')  # Default to user role
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Please enter both email and password!'}), 400
    
    user = None
    
    # Check based on role - search by email
    if role == 'admin':
        user = Admin.query.filter_by(email=email).first()
    elif role == 'mechanic':
        user = Mechanic.query.filter_by(email=email).first()
    else:  # default user
        user = User.query.filter_by(email=email).first()
    
    # If not found by role, try mechanic for jarif123@gmail.com as fallback
    if not user and email == 'jarif123@gmail.com':
        user = Mechanic.query.filter_by(email=email).first()
        role = 'mechanic'
    
    if user and user.check_password(password):
        session['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': getattr(user, 'full_name', ''),
            'role': user.role,
            'profile_pic': user.profile_pic
        }
        # make the session persistent (honors app.permanent_session_lifetime)
        session.permanent = True
        return jsonify({
            'success': True,
            'message': f'Login successful! Welcome {user.username}',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': getattr(user, 'full_name', ''),
                'role': user.role,
                'profile_pic': user.profile_pic
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Invalid email or password!'}), 401

@app.route('/signup', methods=['GET', 'POST'])
def api_signup():
    """Handle signup for users"""
    if request.method == 'GET':
        return send_from_directory(basedir, 'login.html')

    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', '')
    
    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'Username, email, and password are required!'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Username already exists!'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already registered!'}), 400
    
    # Create new user
    new_user = User(
        username=username,
        email=email,
        password=User.hash_password(password),
        full_name=full_name,
        role='user'
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        session['user'] = {
            'id': new_user.id,
            'username': new_user.username,
            'email': new_user.email,
            'full_name': new_user.full_name,
            'role': new_user.role,
            'profile_pic': new_user.profile_pic
        }
        session.permanent = True
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully!',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'full_name': new_user.full_name,
                'role': new_user.role,
                'profile_pic': new_user.profile_pic
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error creating account: {str(e)}'}), 500

# ===== ADMIN ROUTES =====

@app.route('/admin/signup', methods=['POST'])
def admin_signup():
    """Handle admin signup"""
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', '')
    
    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'Username, email, and password are required!'}), 400
    
    if Admin.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Admin username already exists!'}), 400
    
    if Admin.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Admin email already registered!'}), 400
    
    new_admin = Admin(
        username=username,
        email=email,
        password=Admin.hash_password(password),
        full_name=full_name,
        role='admin'
    )
    
    try:
        db.session.add(new_admin)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Admin account created successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error creating admin account: {str(e)}'}), 500

# ===== MECHANIC ROUTES =====

@app.route('/mechanic/signup', methods=['POST'])
def mechanic_signup():
    """Handle mechanic signup"""
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    workshop_name = data.get('workshop_name')
    
    if not all([username, email, password, full_name, workshop_name]):
        return jsonify({'success': False, 'message': 'All fields are required!'}), 400
    
    if Mechanic.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Mechanic username already exists!'}), 400
    
    if Mechanic.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Mechanic email already registered!'}), 400
    
    new_mechanic = Mechanic(
        username=username,
        email=email,
        password=Mechanic.hash_password(password),
        full_name=full_name,
        workshop_name=workshop_name,
        role='mechanic'
    )
    
    try:
        db.session.add(new_mechanic)
        db.session.commit()
        
        session['user'] = {
            'id': new_mechanic.id,
            'username': new_mechanic.username,
            'email': new_mechanic.email,
            'full_name': new_mechanic.full_name,
            'workshop_name': new_mechanic.workshop_name,
            'role': new_mechanic.role,
            'profile_pic': new_mechanic.profile_pic
        }
        session.permanent = True
        
        return jsonify({
            'success': True,
            'message': 'Mechanic account created successfully!',
            'user': {
                'id': new_mechanic.id,
                'username': new_mechanic.username,
                'email': new_mechanic.email,
                'full_name': new_mechanic.full_name,
                'workshop_name': new_mechanic.workshop_name,
                'role': new_mechanic.role,
                'profile_pic': new_mechanic.profile_pic
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error creating mechanic account: {str(e)}'}), 500

# ===== PROFILE & SESSION ROUTES =====

@app.route('/profile', methods=['GET'])
def get_profile():
    """Get current user profile"""
    user = session.get('user')
    if user:
        return jsonify({'logged_in': True, 'user': user})
    else:
        return jsonify({'logged_in': False}), 401

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get public configurations like Pusher credentials"""
    return jsonify({
        'pusher_key': os.environ.get('PUSHER_KEY', ''),
        'pusher_cluster': os.environ.get('PUSHER_CLUSTER', 'ap2')
    })

@app.route('/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.pop('user', None)
    return jsonify({'success': True, 'message': 'Logged out successfully!'})

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """Update user profile"""
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
        
        # Update allowed fields
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'profile_pic' in data:
            user.profile_pic = data['profile_pic']
        if 'email' in data:
            user.email = data['email']
        
        # Mechanic-specific fields
        if role == 'mechanic':
            if 'expertise' in data:
                user.expertise = data['expertise']
            if 'experience_years' in data:
                user.experience_years = data['experience_years']
            if 'hourly_rate' in data:
                user.hourly_rate = data['hourly_rate']
            if 'working_hours' in data:
                user.working_hours = data['working_hours']
            if 'address' in data:
                user.address = data['address']
            if 'mobile' in data:
                user.mobile = data['mobile']
            elif 'phone' in data:
                user.mobile = data['phone']
            if 'workshop_name' in data:
                user.workshop_name = data['workshop_name']
            if 'age' in data:
                user.age = data['age']
            if 'is_active' in data:
                user.is_active = bool(data['is_active'])
        
        db.session.commit()
        
        # Update session
        session['user'].update({
            'full_name': user.full_name,
            'profile_pic': user.profile_pic,
            'email': user.email
        })

        if role == 'mechanic':
            session['user'].update({
                'workshop_name': user.workshop_name,
                'is_active': user.is_active,
                'is_approved': user.is_approved
            })
        
        return jsonify({'success': True, 'message': 'Profile updated successfully!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error updating profile: {str(e)}'}), 500

# ===== MECHANIC LISTING ROUTE =====

@app.route('/mechanics', methods=['GET'])
def get_mechanics():
    """Get all active and approved mechanics"""
    try:
        mechanics = Mechanic.query.filter_by(is_active=True, is_approved=True).all()
        mechanics_data = []
        
        for mechanic in mechanics:
            mechanics_data.append({
                'id': mechanic.id,
                'name': mechanic.full_name,
                'workshop': mechanic.workshop_name,
                'expertise': mechanic.expertise,
                'experience': mechanic.experience_years,
                'hourly_rate': mechanic.hourly_rate,
                'working_hours': mechanic.working_hours,
                'address': mechanic.address,
                'mobile': mechanic.mobile,
                'profile_pic': mechanic.profile_pic,
                'rating': mechanic.rating,
                'is_active': mechanic.is_active
            })
        
        return jsonify({'success': True, 'mechanics': mechanics_data})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error fetching mechanics: {str(e)}'}), 500

@app.route('/mechanics/<int:mechanic_id>', methods=['GET'])
def get_mechanic_detail(mechanic_id):
    """Get specific mechanic details"""
    try:
        mechanic = db.session.get(Mechanic, mechanic_id)
        if not mechanic:
            return jsonify({'success': False, 'message': 'Mechanic not found!'}), 404
        
        return jsonify({
            'success': True,
            'mechanic': {
                'id': mechanic.id,
                'name': mechanic.full_name,
                'workshop': mechanic.workshop_name,
                'expertise': mechanic.expertise,
                'experience': mechanic.experience_years,
                'hourly_rate': mechanic.hourly_rate,
                'working_hours': mechanic.working_hours,
                'address': mechanic.address,
                'mobile': mechanic.mobile,
                'profile_pic': mechanic.profile_pic,
                'rating': mechanic.rating
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error fetching mechanic: {str(e)}'}), 500

# ===== ADMIN API ROUTES =====

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistics for admin dashboard"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    
    try:
        total_users = User.query.count()
        total_mechanics = Mechanic.query.count()
        total_bookings = 0  # Add booking count when booking table is added
        
        return jsonify({
            'success': True,
            'total_users': total_users,
            'total_mechanics': total_mechanics,
            'total_bookings': total_bookings
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/api/users', methods=['GET'])
def get_all_users():
    """Get all users for admin"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    
    try:
        users = User.query.all()
        users_list = []
        
        for user in users:
            users_list.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'created_at': user.created_at.isoformat()
            })
        
        return jsonify({'success': True, 'users': users_list})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

# ===== MECHANIC PROPOSAL ROUTES =====

@app.route('/mechanic/submit-proposal', methods=['POST'])
def submit_mechanic_proposal():
    """Submit a mechanic proposal"""
    try:
        import json
        
        # Get data from FormData or JSON
        if request.form:
            data = request.form.to_dict()
        else:
            data = request.get_json() or {}
        
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        full_name = data.get('full_name', '').strip()
        
        # Validate required fields
        if not email or not password or not full_name:
            return jsonify({
                'success': False, 
                'message': 'Email, password, and full name are required!'
            }), 400
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'Email already registered!'}), 400
        
        if Mechanic.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'Email already registered!'}), 400
        
        # Parse skills from JSON string
        skills_str = data.get('skills', '[]')
        try:
            skills = json.loads(skills_str)
        except:
            skills = []
        
        # Create mechanic (not approved yet)
        mechanic = Mechanic(
            username=email,  # Use email as username
            email=email,
            password=Mechanic.hash_password(password),
            full_name=full_name,
            age=int(data.get('age', 0)) if data.get('age') else None,
            mobile=data.get('mobile', '').strip(),
            address=data.get('address', '').strip(),
            workshop_name=data.get('workshop_name', '').strip(),
            experience_years=int(data.get('experience', 0)) if data.get('experience') else None,
            hourly_rate=float(data.get('hourly_rate', 0)) if data.get('hourly_rate') else 0.0,
            working_hours=data.get('working_hours', '').strip(),
            expertise=','.join(skills) if skills else '',
            education=data.get('education', '').strip(),
            nid_number=data.get('nid_number', '').strip(),
            birth_certificate_number=data.get('birth_certificate_number', '').strip(),
            work_history=data.get('work_history', '').strip(),
            is_active=False,
            is_approved=False,
            role='mechanic'
        )
        
        # TODO: Store files properly
        # For demo, we'll store the base64 strings in the database fields
        # In production, use cloud storage like AWS S3, Cloudinary, etc.
        if data.get('profile_photo'):
            mechanic.profile_pic = data.get('profile_photo', '')[:200]
        
        db.session.add(mechanic)
        db.session.commit()
        
        # Create proposal
        proposal = MechanicProposal(mechanic_id=mechanic.id, status='pending')
        db.session.add(proposal)
        db.session.commit()
        
        # Set session for mechanic waiting status
        session['user'] = {
            'id': mechanic.id,
            'username': mechanic.username,
            'email': mechanic.email,
            'full_name': mechanic.full_name,
            'role': 'mechanic',
            'profile_pic': mechanic.profile_pic,
            'is_approved': False
        }
        session.permanent = True
        
        return jsonify({
            'success': True,
            'message': 'Proposal submitted! Redirecting to dashboard...',
            'mechanic_id': mechanic.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/status', methods=['GET'])
def get_mechanic_status():
    """Get mechanic proposal status"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return jsonify({'success': False, 'message': 'Not authorized!', 'redirect': '/login/login.html'}), 401
    
    try:
        mechanic = db.session.get(Mechanic, user_data.get('id'))
        if not mechanic:
            return jsonify({'success': False, 'message': 'Mechanic not found!'}), 404
        
        proposal = MechanicProposal.query.filter_by(mechanic_id=mechanic.id).first()
        
        # If no proposal but mechanic is approved, create one
        if not proposal and mechanic.is_approved:
            proposal = MechanicProposal(mechanic_id=mechanic.id, status='approved')
            db.session.add(proposal)
            db.session.commit()
        
        if not proposal:
            return jsonify({'success': False, 'message': 'No proposal found!'}), 404
        
        response = {
            'success': True,
            'proposal': {
                'status': proposal.status,
                'submitted_at': proposal.submitted_at.isoformat() if proposal.submitted_at else None,
                'reviewed_at': proposal.reviewed_at.isoformat() if proposal.reviewed_at else None,
                'review_notes': proposal.review_notes,
                'full_name': mechanic.full_name,
                'email': mechanic.email,
                'mobile': mechanic.mobile,
                'address': mechanic.address,
                'age': mechanic.age,
                'experience': mechanic.experience_years,
                'hourly_rate': mechanic.hourly_rate,
                'working_hours': mechanic.working_hours,
                'workshop_name': mechanic.workshop_name,
                'expertise': mechanic.expertise,
                'education': mechanic.education,
                'profile_photo': mechanic.profile_pic,
                'is_active': mechanic.is_active,
                'is_approved': mechanic.is_approved
            }
        }
        
        # If approved, redirect to main dashboard
        if proposal.status == 'approved':
            if session.get('user') and session['user'].get('role') == 'mechanic':
                session['user']['is_approved'] = True
            response['redirect'] = '/mechanic_dashboard_full.html'
        
        return jsonify(response)
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

# ===== ADMIN PENDING APPLICANTS =====

@app.route('/admin/pending-mechanics', methods=['GET'])
def get_pending_mechanics():
    """Get all pending mechanic proposals"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    
    try:
        proposals = MechanicProposal.query.filter_by(status='pending').all()
        pending_list = []
        
        for proposal in proposals:
            mechanic = proposal.mechanic
            pending_list.append({
                'proposal_id': proposal.id,
                'mechanic_id': mechanic.id,
                'name': mechanic.full_name,
                'email': mechanic.email,
                'mobile': mechanic.mobile,
                'profile_pic': mechanic.profile_pic,
                'submitted_at': proposal.submitted_at.isoformat(),
                'experience_years': mechanic.experience_years,
                'skills': mechanic.expertise
            })
        
        return jsonify({'success': True, 'pending': pending_list})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

# ===== BOOKING ENDPOINTS =====

@app.route('/bookings', methods=['GET', 'POST'])
def bookings():
    """Create or list bookings for the logged-in user"""
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    if request.method == 'POST':
        # Create a new booking
        data = request.get_json()
        try:
            booking = Booking(
                user_id=user_data['id'],
                mechanic_id=data['mechanic_id'],
                address=data['address'],
                preferred_time=datetime.fromisoformat(data['preferred_time']),
                problem_description=data['problem_description'],
                offer=data['offer'],
                payment_method=data['payment_method'],
                status='requested'
            )
            db.session.add(booking)
            db.session.commit()
            
            # Trigger Pusher event to mechanic
            pusher_payload = {
                'id': booking.id,
                'user_id': booking.user_id,
                'mechanic_id': booking.mechanic_id,
                'status': booking.status,
                'problem_description': booking.problem_description,
                'offer': booking.offer,
                'preferred_time': booking.preferred_time.isoformat(),
                'address': booking.address,
                'created_at': booking.created_at.isoformat() if booking.created_at else datetime.utcnow().isoformat()
            }
            trigger_pusher_event(f"mechanic-{booking.mechanic_id}", 'booking_update', pusher_payload)
            
            return jsonify({'success': True, 'booking_id': booking.id})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    else:
        # List user's bookings
        try:
            bookings = Booking.query.filter_by(user_id=user_data['id']).order_by(Booking.created_at.desc()).all()
            result = []
            for b in bookings:
                mechanic = b.mechanic
                result.append({
                    'id': b.id,
                    'mechanic_id': b.mechanic_id,
                    'mechanic_name': mechanic.full_name,
                    'mechanic_profile_pic': mechanic.profile_pic,
                    'address': b.address,
                    'preferred_time': b.preferred_time.isoformat(),
                    'problem_description': b.problem_description,
                    'offer': b.offer,
                    'payment_method': b.payment_method,
                    'status': b.status,
                    'counter_offer': b.counter_offer,
                    'counter_note': b.counter_note,
                    'created_at': b.created_at.isoformat()
                })
            return jsonify({'success': True, 'bookings': result})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/bookings', methods=['GET'])
def mechanic_bookings():
    """List bookings for the logged-in mechanic"""
    user_data = session.get('user')
    print(f"[DEBUG] Session data: {user_data}")
    if not user_data or user_data.get('role') != 'mechanic':
        print("[DEBUG] Not authorized or not a mechanic")
        return jsonify({'success': False, 'message': 'Not authorized'}), 401

    try:
        mechanic_id = user_data['id']
        print(f"[DEBUG] Mechanic ID: {mechanic_id}")
        bookings = Booking.query.filter_by(mechanic_id=mechanic_id).order_by(Booking.created_at.desc()).all()
        print(f"[DEBUG] Found bookings: {len(bookings)}")
        result = []
        for b in bookings:
            user = b.user
            result.append({
                'id': b.id,
                'user_id': b.user_id,
                'user_name': user.username,
                'user_profile_pic': getattr(user, 'profile_pic', None),
                'address': b.address,
                'preferred_time': b.preferred_time.isoformat(),
                'problem_description': b.problem_description,
                'offer': b.offer,
                'payment_method': b.payment_method,
                'status': b.status,
                'counter_offer': b.counter_offer,
                'counter_note': b.counter_note,
                'created_at': b.created_at.isoformat()
            })
        print(f"[DEBUG] Returning bookings: {result}")
        return jsonify({'success': True, 'bookings': result})
    except Exception as e:
        print(f"[DEBUG] Error: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/bookings/<int:booking_id>/accept', methods=['POST'])
def mechanic_accept_booking(booking_id):
    """Mechanic accepts a booking (no counter offer)"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return jsonify({'success': False, 'message': 'Not authorized'}), 401

    try:
        booking = Booking.query.get(booking_id)
        if not booking or booking.mechanic_id != user_data['id']:
            return jsonify({'success': False, 'message': 'Booking not found'}), 404
        if booking.status != 'requested':
            return jsonify({'success': False, 'message': 'Booking already processed'}), 400

        booking.status = 'confirmed'
        db.session.commit()
        
        # Trigger Pusher event to user and mechanic
        pusher_payload = {
            'id': booking.id,
            'status': booking.status,
            'mechanic_name': booking.mechanic.full_name
        }
        trigger_pusher_event(f"user-{booking.user_id}", 'booking_update', pusher_payload)
        trigger_pusher_event(f"mechanic-{booking.mechanic_id}", 'booking_update', pusher_payload)
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/bookings/<int:booking_id>/counter', methods=['POST'])
def mechanic_counter_booking(booking_id):
    """Mechanic sends a counter offer"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return jsonify({'success': False, 'message': 'Not authorized'}), 401

    data = request.get_json()
    try:
        booking = Booking.query.get(booking_id)
        if not booking or booking.mechanic_id != user_data['id']:
            return jsonify({'success': False, 'message': 'Booking not found'}), 404
        if booking.status != 'requested':
            return jsonify({'success': False, 'message': 'Booking already processed'}), 400

        booking.counter_offer = data.get('counter_offer')
        booking.counter_note = data.get('note')
        db.session.commit()
        
        # Trigger Pusher event to user and mechanic
        pusher_payload = {
            'id': booking.id,
            'status': booking.status,
            'counter_offer': booking.counter_offer,
            'counter_note': booking.counter_note,
            'mechanic_name': booking.mechanic.full_name
        }
        trigger_pusher_event(f"user-{booking.user_id}", 'booking_update', pusher_payload)
        trigger_pusher_event(f"mechanic-{booking.mechanic_id}", 'booking_update', pusher_payload)
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/bookings/<int:booking_id>/reject', methods=['POST'])
def mechanic_reject_booking(booking_id):
    """Mechanic rejects a booking"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return jsonify({'success': False, 'message': 'Not authorized'}), 401

    try:
        booking = Booking.query.get(booking_id)
        if not booking or booking.mechanic_id != user_data['id']:
            return jsonify({'success': False, 'message': 'Booking not found'}), 404
        if booking.status != 'requested':
            return jsonify({'success': False, 'message': 'Booking already processed'}), 400

        booking.status = 'rejected'
        db.session.commit()
        
        # Trigger Pusher event to user and mechanic
        pusher_payload = {
            'id': booking.id,
            'status': booking.status,
            'mechanic_name': booking.mechanic.full_name
        }
        trigger_pusher_event(f"user-{booking.user_id}", 'booking_update', pusher_payload)
        trigger_pusher_event(f"mechanic-{booking.mechanic_id}", 'booking_update', pusher_payload)
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/bookings/<int:booking_id>/complete', methods=['POST'])
def complete_booking(booking_id):
    """User marks a confirmed booking as completed"""
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    try:
        booking = Booking.query.get(booking_id)
        if not booking or booking.user_id != user_data['id']:
            return jsonify({'success': False, 'message': 'Booking not found'}), 404
        if booking.status != 'confirmed':
            return jsonify({'success': False, 'message': 'Booking not confirmed'}), 400

        booking.status = 'completed'
        # Update mechanic stats
        mechanic = booking.mechanic
        mechanic.total_bookings = (mechanic.total_bookings or 0) + 1
        mechanic.total_income = (mechanic.total_income or 0) + booking.offer
        # Update monthly income (simple: add to current month)
        mechanic.monthly_income = (mechanic.monthly_income or 0) + booking.offer
        # Update average income
        if mechanic.total_bookings:
            mechanic.average_income = mechanic.total_income / mechanic.total_bookings
        db.session.commit()
        
        # Trigger Pusher event to mechanic and user
        pusher_payload = {
            'id': booking.id,
            'status': booking.status
        }
        trigger_pusher_event(f"mechanic-{booking.mechanic_id}", 'booking_update', pusher_payload)
        trigger_pusher_event(f"user-{booking.user_id}", 'booking_update', pusher_payload)
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

# ===== CHAT ENDPOINTS =====

@app.route('/chat/conversations', methods=['GET'])
def chat_conversations():
    """List conversations for the logged-in user/mechanic"""
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    try:
        # Determine peer role
        my_role = user_data.get('role')
        if my_role == 'user':
            peer_role = 'mechanic'
            my_id = user_data['id']
        elif my_role == 'mechanic':
            peer_role = 'user'
            my_id = user_data['id']
        else:
            return jsonify({'success': False, 'message': 'Invalid role'}), 400

        # Simple: fetch all messages involving me, deduce peers
        messages = Message.query.filter(
            or_(Message.sender_id == my_id, Message.receiver_id == my_id)
        ).order_by(Message.created_at.desc()).all()

        peer_map = {}
        for msg in messages:
            peer_id = msg.receiver_id if msg.sender_id == my_id else msg.sender_id
            if peer_id not in peer_map:
                peer_map[peer_id] = msg
        convs = []
        for peer_id, last_msg in peer_map.items():
            peer = User.query.get(peer_id)
            if not peer: continue
            convs.append({
                'id': f'{my_id}-{peer_id}',
                'peer_id': peer_id,
                'peer_name': peer.username,
                'peer_avatar': getattr(peer, 'profile_pic', None),
                'last_message': last_msg.content or (last_msg.image_url and '[Image]') or '',
                'last_time': last_msg.created_at.isoformat()
            })
        return jsonify({'success': True, 'conversations': convs})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/chat/messages/<conversation_id>', methods=['GET'])
def chat_messages(conversation_id):
    """List messages for a conversation (conversation_id = 'user_id-mechanic_id')"""
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    try:
        my_id = user_data['id']
        peer_id = None
        if '-' in conversation_id:
            parts = conversation_id.split('-')
            if parts[0] == str(my_id):
                peer_id = int(parts[1])
            elif parts[1] == str(my_id):
                peer_id = int(parts[0])
        if peer_id is None:
            return jsonify({'success': False, 'message': 'Invalid conversation'}), 400

        messages = Message.query.filter(
            or_(
                and_(Message.sender_id == my_id, Message.receiver_id == peer_id),
                and_(Message.sender_id == peer_id, Message.receiver_id == my_id)
            )
        ).order_by(Message.created_at.asc()).all()
        result = []
        for m in messages:
            result.append({
                'id': m.id,
                'sender_id': m.sender_id,
                'receiver_id': m.receiver_id,
                'sender_is_me': m.sender_id == my_id,
                'content': m.content,
                'image_url': m.image_url,
                'created_at': m.created_at.isoformat()
            })
        return jsonify({'success': True, 'messages': result})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/chat/messages/<conversation_id>', methods=['POST'])
def send_message(conversation_id):
    """Send a text message"""
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    data = request.get_json()
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'success': False, 'message': 'Empty message'}), 400

    try:
        my_id = user_data['id']
        peer_id = None
        if '-' in conversation_id:
            parts = conversation_id.split('-')
            if parts[0] == str(my_id):
                peer_id = int(parts[1])
            elif parts[1] == str(my_id):
                peer_id = int(parts[0])
        if peer_id is None:
            return jsonify({'success': False, 'message': 'Invalid conversation'}), 400

        msg = Message(sender_id=my_id, receiver_id=peer_id, content=content)
        db.session.add(msg)
        db.session.commit()
        return jsonify({'success': True, 'message_id': msg.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/chat/messages/<conversation_id>/image', methods=['POST'])
def send_image_message(conversation_id):
    """Send an image message"""
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    try:
        my_id = user_data['id']
        peer_id = None
        if '-' in conversation_id:
            parts = conversation_id.split('-')
            if parts[0] == str(my_id):
                peer_id = int(parts[1])
            elif parts[1] == str(my_id):
                peer_id = int(parts[0])
        if peer_id is None:
            return jsonify({'success': False, 'message': 'Invalid conversation'}), 400

        if 'image' not in request.files:
            return jsonify({'success': False, 'message': 'No image file'}), 400
        file = request.files['image']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No selected file'}), 400

        # Save image to uploads folder (simple)
        import os, uuid
        upload_folder = os.path.join(os.path.dirname(__file__), 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ('.png', '.jpg', '.jpeg', '.gif', '.webp'):
            return jsonify({'success': False, 'message': 'Invalid image type'}), 400
        filename = str(uuid.uuid4()) + ext
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        image_url = f'/uploads/{filename}'

        msg = Message(sender_id=my_id, receiver_id=peer_id, image_url=image_url)
        db.session.add(msg)
        db.session.commit()
        return jsonify({'success': True, 'message_id': msg.id, 'image_url': image_url})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

# ===== SERVE UPLOADED IMAGES =====
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    from flask import send_from_directory
    upload_folder = os.path.join(os.path.dirname(__file__), 'uploads')
    return send_from_directory(upload_folder, filename)

@app.route('/admin/mechanic/<int:mechanic_id>', methods=['GET'])
def get_mechanic_details(mechanic_id):
    """Get full mechanic details for review"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    
    try:
        mechanic = db.session.get(Mechanic, mechanic_id)
        if not mechanic:
            return jsonify({'success': False, 'message': 'Mechanic not found!'}), 404
        
        return jsonify({
            'success': True,
            'mechanic': {
                'id': mechanic.id,
                'full_name': mechanic.full_name,
                'email': mechanic.email,
                'age': mechanic.age,
                'mobile': mechanic.mobile,
                'address': mechanic.address,
                'workshop_name': mechanic.workshop_name,
                'experience_years': mechanic.experience_years,
                'hourly_rate': mechanic.hourly_rate,
                'working_hours': mechanic.working_hours,
                'expertise': mechanic.expertise,
                'education': mechanic.education,
                'nid_number': mechanic.nid_number,
                'birth_certificate_number': mechanic.birth_certificate_number,
                'work_history': mechanic.work_history,
                'profile_pic': mechanic.profile_pic,
                'created_at': mechanic.created_at.isoformat()
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/admin/mechanic/<int:mechanic_id>/approve', methods=['POST'])
def approve_mechanic(mechanic_id):
    """Approve a mechanic"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    
    try:
        mechanic = db.session.get(Mechanic, mechanic_id)
        if not mechanic:
            return jsonify({'success': False, 'message': 'Mechanic not found!'}), 404
        
        mechanic.is_approved = True
        mechanic.is_active = True
        
        proposal = MechanicProposal.query.filter_by(mechanic_id=mechanic_id).first()
        if proposal:
            proposal.status = 'approved'
            proposal.reviewed_by = user_data.get('id')
            proposal.reviewed_at = datetime.utcnow()
            
            # Create notification for mechanic
            notification = MechanicNotification(
                mechanic_id=mechanic_id,
                proposal_id=proposal.id,
                notification_type='approved',
                message='Congratulations! Your proposal has been approved! You can now access your mechanic dashboard and start accepting bookings.'
            )
            db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Mechanic approved successfully!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/admin/mechanic/<int:mechanic_id>/reject', methods=['POST'])
def reject_mechanic(mechanic_id):
    """Reject a mechanic"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    
    data = request.get_json() or {}
    
    try:
        mechanic = db.session.get(Mechanic, mechanic_id)
        if not mechanic:
            return jsonify({'success': False, 'message': 'Mechanic not found!'}), 404
        
        proposal = MechanicProposal.query.filter_by(mechanic_id=mechanic_id).first()
        if proposal:
            proposal.status = 'rejected'
            proposal.reviewed_by = user_data.get('id')
            proposal.reviewed_at = datetime.utcnow()
            proposal.review_notes = data.get('notes', '')
            
            # Create notification for mechanic with rejection reason
            rejection_reason = data.get('notes', 'Application does not meet our current requirements.')
            notification = MechanicNotification(
                mechanic_id=mechanic_id,
                proposal_id=proposal.id,
                notification_type='rejected',
                message='Unfortunately, your application has been reviewed and we cannot proceed at this time.',
                reason=rejection_reason
            )
            db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Mechanic rejected!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

# ===== MECHANIC NOTIFICATION ROUTES =====

@app.route('/mechanic/notifications', methods=['GET'])
def get_mechanic_notifications():
    """Get all notifications for current mechanic"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    
    try:
        mechanic_id = user_data.get('id')
        notifications = MechanicNotification.query.filter_by(mechanic_id=mechanic_id).order_by(
            MechanicNotification.created_at.desc()
        ).all()
        
        notifications_list = []
        for notif in notifications:
            notifications_list.append({
                'id': notif.id,
                'type': notif.notification_type,
                'message': notif.message,
                'reason': notif.reason,
                'is_read': notif.is_read,
                'created_at': notif.created_at.isoformat()
            })
        
        return jsonify({'success': True, 'notifications': notifications_list})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/mechanic/notification/<int:notification_id>/mark-read', methods=['POST'])
def mark_notification_read(notification_id):
    """Mark notification as read"""
    user_data = session.get('user')
    if not user_data or user_data.get('role') != 'mechanic':
        return jsonify({'success': False, 'message': 'Not authorized!'}), 401
    
    try:
        notification = db.session.get(MechanicNotification, notification_id)
        if not notification:
            return jsonify({'success': False, 'message': 'Notification not found!'}), 404
        
        if notification.mechanic_id != user_data.get('id'):
            return jsonify({'success': False, 'message': 'Not authorized!'}), 401
        
        notification.is_read = True
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Notification marked as read'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

# ===== CHAT ENDPOINTS =====
@app.route('/chat/conversations', methods=['GET'])
def get_conversations():
    """Get all conversations for the current user"""
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    try:
        current_user_id = user_data['id']
        current_role = user_data['role']
        
        # Add prefix to current user ID for comparison
        if current_role == 'user':
            current_user_id_prefixed = f"user_{current_user_id}"
        elif current_role == 'mechanic':
            current_user_id_prefixed = f"mechanic_{current_user_id}"
        else:
            current_user_id_prefixed = str(current_user_id)
        
        # Get all messages where current user is sender or receiver
        sent_messages = Message.query.filter_by(sender_id=current_user_id_prefixed).all()
        received_messages = Message.query.filter_by(receiver_id=current_user_id_prefixed).all()
        
        # Group messages by conversation
        conversations = {}
        all_message_ids = set()
        
        for msg in sent_messages + received_messages:
            other_user_id = msg.receiver_id if msg.sender_id == current_user_id_prefixed else msg.sender_id
            
            if other_user_id not in conversations:
                # Get other user info
                if other_user_id.startswith('user_'):
                    other_user = User.query.filter_by(id=int(other_user_id.replace('user_', ''))).first()
                    role = 'user'
                else:
                    other_user = Mechanic.query.filter_by(id=int(other_user_id.replace('mechanic_', ''))).first()
                    role = 'mechanic'
                
                if other_user:
                    conversations[other_user_id] = {
                        'id': other_user_id,
                        'name': other_user.username,
                        'avatar': getattr(other_user, 'profile_pic', None),
                        'role': role,
                        'last_message': None,
                        'last_message_time': None,
                        'unread_count': 0,
                        'online': True  # Placeholder
                    }
            
            # Update last message
            if msg.created_at > (conversations[other_user_id]['last_message_time'] or datetime.min):
                conversations[other_user_id]['last_message'] = msg.content or '📷 Image'
                conversations[other_user_id]['last_message_time'] = msg.created_at
            
            # Count unread messages
            if msg.receiver_id == str(current_user_id) and not msg.is_read:
                conversations[other_user_id]['unread_count'] += 1
            
            all_message_ids.add(msg.id)
        
        return jsonify({
            'success': True,
            'conversations': list(conversations.values())
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/chat/messages/<conversation_id>', methods=['GET'])
def get_messages(conversation_id):
    """Get messages for a specific conversation"""
    user_data = session.get('user')
    if not user_data:
        print(f"Not logged in when getting messages for {conversation_id}")
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    try:
        current_user_id = user_data['id']
        current_role = user_data['role']
        print(f"Getting messages for {conversation_id}, user: {current_user_id}, role: {current_role}")
        
        # Add prefix to current user ID for comparison
        if current_role == 'user':
            current_user_id_prefixed = f"user_{current_user_id}"
        elif current_role == 'mechanic':
            current_user_id_prefixed = f"mechanic_{current_user_id}"
        else:
            current_user_id_prefixed = str(current_user_id)
        
        # Get messages between current user and conversation partner
        messages = Message.query.filter(
            or_(
                and_(Message.sender_id == current_user_id_prefixed, Message.receiver_id == conversation_id),
                and_(Message.sender_id == conversation_id, Message.receiver_id == current_user_id_prefixed)
            )
        ).order_by(Message.created_at.asc()).all()
        
        messages_list = []
        for msg in messages:
            messages_list.append({
                'id': msg.id,
                'sender_id': msg.sender_id,
                'receiver_id': msg.receiver_id,
                'content': msg.content,
                'image_url': msg.image_url,
                'created_at': msg.created_at.isoformat(),
                'is_read': msg.is_read
            })
        
        # Mark received messages as read
        Message.query.filter_by(receiver_id=current_user_id_prefixed, is_read=False).update({'is_read': True})
        db.session.commit()
        
        return jsonify({
            'success': True,
            'messages': messages_list
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/chat/send', methods=['POST'])
def chat_send_message():
    """Send a message"""
    user_data = session.get('user')
    if not user_data:
        print("Not logged in when sending message")
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    try:
        data = request.json
        content = data.get('content', '').strip()
        receiver_id = data.get('receiver_id')
        image_url = data.get('image_url')
        
        print(f"Send message request: user={user_data.get('id')}, receiver={receiver_id}, content={content[:30]}...")
        
        if not content and not image_url:
            return jsonify({'success': False, 'message': 'Message content is required'}), 400
        
        if not receiver_id:
            print("Receiver ID is missing!")
            return jsonify({'success': False, 'message': 'Receiver is required'}), 400
        
        # Convert sender ID with prefix
        sender_id = str(user_data['id'])
        if user_data['role'] == 'user':
            sender_id = f"user_{sender_id}"
        elif user_data['role'] == 'mechanic':
            sender_id = f"mechanic_{sender_id}"
        
        message = Message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content,
            image_url=image_url
        )
        
        db.session.add(message)
        db.session.commit()
        
        # Trigger Pusher event
        pusher_payload = {
            'id': message.id,
            'sender_id': message.sender_id,
            'receiver_id': message.receiver_id,
            'content': message.content,
            'image_url': message.image_url,
            'created_at': message.created_at.isoformat() if message.created_at else datetime.utcnow().isoformat(),
            'is_read': message.is_read
        }
        trigger_pusher_event(f"chat-{receiver_id}", 'new_message', pusher_payload)
        trigger_pusher_event(f"chat-{sender_id}", 'new_message', pusher_payload)
        
        return jsonify({
            'success': True,
            'message': 'Message sent successfully',
            'message_id': message.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/chat/upload', methods=['POST'])
def upload_file():
    """Upload file for chat"""
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400
        
        # Check file size (10MB max)
        file.seek(0, os.SEEK_END)
        if file.tell() > 10 * 1024 * 1024:
            return jsonify({'success': False, 'message': 'File too large'}), 400
        file.seek(0)
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        timestamp = int(time.time())
        unique_filename = f"{timestamp}_{filename}"
        
        # Save file
        upload_dir = os.path.join(basedir, 'uploads', 'chat')
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        # Return relative file URL for deployed environments
        image_url = f"/uploads/chat/{unique_filename}"
        
        return jsonify({
            'success': True,
            'image_url': image_url
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/chat/users', methods=['GET'])
def get_chat_users():
    """Get list of users/mechanics for starting new conversations"""
    user_data = session.get('user')
    if not user_data:
        print("Not logged in when getting chat users")
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    try:
        current_user_id = user_data['id']
        current_role = user_data['role']
        print(f"Getting chat users for user: {current_user_id}, role: {current_role}")
        
        users = []
        
        # If current user is a regular user, show mechanics
        if current_role == 'user':
            mechanics = Mechanic.query.filter_by(is_active=True, is_approved=True).all()
            for mechanic in mechanics:
                users.append({
                    'id': f"mechanic_{mechanic.id}",
                    'username': mechanic.username,
                    'avatar': mechanic.profile_pic,
                    'role': 'mechanic'
                })
        
        # If current user is a mechanic, show users who have booked them OR sent them messages
        elif current_role == 'mechanic':
            # Get users who have booked this mechanic
            bookings = Booking.query.filter_by(mechanic_id=current_user_id).all()
            user_ids = set(b.user_id for b in bookings)
            
            # Also get users who have sent messages to this mechanic
            sent_messages = Message.query.filter_by(receiver_id=f"mechanic_{current_user_id}").all()
            for msg in sent_messages:
                if msg.sender_id.startswith('user_'):
                    user_id = int(msg.sender_id.replace('user_', ''))
                    user_ids.add(user_id)
            
            for user_id in user_ids:
                user = User.query.get(user_id)
                if user:
                    users.append({
                        'id': f"user_{user.id}",
                        'username': user.username,
                        'avatar': user.profile_pic,
                        'role': 'user'
                    })
        
        # Admin can chat with everyone
        elif current_role == 'admin':
            # Add all users
            all_users = User.query.all()
            for user in all_users:
                users.append({
                    'id': f"user_{user.id}",
                    'username': user.username,
                    'avatar': user.profile_pic,
                    'role': 'user'
                })
            
            # Add all mechanics
            all_mechanics = Mechanic.query.all()
            for mechanic in all_mechanics:
                users.append({
                    'id': f"mechanic_{mechanic.id}",
                    'username': mechanic.username,
                    'avatar': mechanic.profile_pic,
                    'role': 'mechanic'
                })
        
        return jsonify({
            'success': True,
            'users': users
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/chat/start', methods=['POST'])
def start_conversation():
    """Start a new conversation"""
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    try:
        data = request.json
        target_user_id = data.get('user_id')
        
        if not target_user_id:
            return jsonify({'success': False, 'message': 'User ID is required'}), 400
        
        # Check if conversation already exists
        existing = Message.query.filter(
            or_(
                and_(Message.sender_id == str(user_data['id']), Message.receiver_id == target_user_id),
                and_(Message.sender_id == target_user_id, Message.receiver_id == str(user_data['id']))
            )
        ).first()
        
        if existing:
            return jsonify({
                'success': True,
                'conversation_id': target_user_id,
                'message': 'Conversation already exists'
            })
        
        # Return the target user ID as conversation ID
        return jsonify({
            'success': True,
            'conversation_id': target_user_id,
            'message': 'Conversation started'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

# ===== SERVE STATIC PAGES =====
import os
from flask import send_from_directory
basedir = os.path.abspath(os.path.dirname(__file__))

@app.route('/mechanic_bookings.html')
def serve_mechanic_bookings():
    return send_from_directory(basedir, 'mechanic_bookings.html')

@app.route('/mechanic_bookings.css')
def serve_mechanic_bookings_css():
    return send_from_directory(basedir, 'mechanic_bookings.css')

@app.route('/mechanic_bookings.js')
def serve_mechanic_bookings_js():
    return send_from_directory(basedir, 'mechanic_bookings.js')

@app.route('/booking/<path:filename>')
def serve_booking(filename):
    return send_from_directory(os.path.join(basedir, '..', 'booking'), filename)

@app.route('/chat/')
@app.route('/chat/chat.html')
def chat_page():
    """Serve the chat page with session context"""
    user_data = session.get('user')
    if not user_data:
        return redirect('/login/login.html')
    
    return send_from_directory(os.path.join(basedir, '..', 'chat'), 'chat.html')

@app.route('/chat/<path:filename>')
def serve_chat(filename):
    if filename == 'chat.html':
        return redirect('/chat/')
    elif filename == 'chat.css':
        return send_from_directory(os.path.join(basedir, '..', 'chat'), 'chat.css')
    elif filename == 'chat.js':
        return send_from_directory(os.path.join(basedir, '..', 'chat'), 'chat.js')
    else:
        return send_from_directory(os.path.join(basedir, '..', 'chat'), filename)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
