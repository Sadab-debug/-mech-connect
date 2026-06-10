# Mech Connect - Login & Database Setup

## Overview
This system uses SQLAlchemy with SQLite database to manage users, admins, and mechanics for the Mech Connect platform.

## Database Structure

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password`: Hashed password (SHA256)
- `full_name`: User's full name
- `profile_pic`: Profile picture URL
- `role`: User role (default: 'user')
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Admins Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password`: Hashed password
- `full_name`: Admin's full name
- `profile_pic`: Profile picture URL
- `role`: Admin role
- `permissions`: Comma-separated permissions
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Mechanics Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password`: Hashed password
- `full_name`: Mechanic's full name
- `workshop_name`: Workshop/business name
- `profile_pic`: Profile picture URL
- `expertise`: Comma-separated skills
- `experience_years`: Years of experience
- `hourly_rate`: Hourly service rate
- `working_hours`: Operating hours (e.g., "8 am to 10 pm")
- `address`: Workshop address
- `phone`: Contact number
- `is_active`: Active status (boolean)
- `rating`: Service rating (0-5)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Initialize Database
```bash
python init_db.py
```

This will:
- Create all database tables
- Add sample data (users, admin, mechanics)
- Display sample login credentials

### 3. Run the Flask Application
```bash
python login_app.py
```

The server will start at: `http://127.0.0.1:5000`

## Sample Login Credentials

After initialization, you can use:

**User Account:**
- Username: `john_doe`
- Password: `password123`

**Admin Account:**
- Username: `admin`
- Password: `jarif.98@`

**Mechanic Account:**
- Username: `jarif_hassan`
- Password: `password123`

## API Endpoints

### User Authentication
- `POST /login` - User login
- `POST /signup` - User registration
- `POST /logout` - User logout

### Admin Authentication
- `POST /admin/signup` - Admin registration

### Mechanic Authentication
- `POST /mechanic/signup` - Mechanic registration

### Profile Management
- `GET /profile` - Get current user profile
- `POST /update-profile` - Update user profile

### Mechanic Listing
- `GET /mechanics` - Get all active mechanics
- `GET /mechanics/<id>` - Get specific mechanic details

## Request/Response Examples

### User Login
**Request:**
```json
{
  "username": "john_doe",
  "password": "password123",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful! Welcome john_doe",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "user",
    "profile_pic": ""
  }
}
```

### User Signup
**Request:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepass123",
  "full_name": "New User"
}
```

### Mechanic Signup
**Request:**
```json
{
  "username": "mechanic_user",
  "email": "mechanic@example.com",
  "password": "mechpass123",
  "full_name": "John Mechanic",
  "workshop_name": "John's Auto Repair"
}
```

## Database File
The SQLite database is stored as `mistrivai.db` in the same directory as `login_app.py`.

## Security Notes
- Passwords are hashed using SHA256
- Change `app.secret_key` to a secure random value before production
- Never commit the database file to version control
- Use HTTPS in production
- Implement rate limiting for login attempts
- Add password validation rules (minimum length, complexity)

## Troubleshooting

### Database Already Exists
To reset the database, delete `mistrivai.db` and run `init_db.py` again.

### Port Already in Use
If port 5000 is busy, modify the port in `login_app.py`:
```python
app.run(debug=True, host='127.0.0.1', port=5001)  # Change port here
```

### Import Errors
Ensure you're running from the correct directory and have installed all requirements:
```bash
pip install -r requirements.txt
```

## File Structure
```
online_mechanics/login/
├── login_app.py          # Main Flask application
├── models.py             # SQLAlchemy models (User, Admin, Mechanic)
├── init_db.py            # Database initialization script
├── requirements.txt      # Python dependencies
├── login.html            # Frontend login page
├── login.js              # Frontend login logic
├── login.css             # Login page styles
└── mistrivai.db        # SQLite database (created after init)
```
