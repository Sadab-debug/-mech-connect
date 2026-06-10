# MistriVai - Online Mechanics Platform

## 📋 Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Setup Instructions](#setup-instructions)
- [File-by-File Documentation](#file-by-file-documentation)
- [User Roles & Permissions](#user-roles--permissions)
- [Key Features](#key-features)
- [Development Workflow](#development-workflow)

---

## 🎯 Overview

MistriVai is a comprehensive online mechanics booking platform that connects users with local mechanics. The platform features:

- **User System**: Regular users can browse mechanics, book services, and communicate with mechanics
- **Mechanic System**: Mechanics can register, create profiles, set availability, and manage bookings
- **Admin System**: Administrators can approve mechanic applications, manage users, and oversee platform operations
- **Booking System**: Complete booking workflow with status tracking (requested, confirmed, completed, etc.)
- **Messaging System**: Real-time chat between users and mechanics
- **Mechanic Registration**: Comprehensive 5-section registration form with document uploads

---

## 🛠 Technology Stack

### Backend
- **Framework**: Flask 2.3.3
- **Database**: SQLite with SQLAlchemy 2.0.23
- **ORM**: Flask-SQLAlchemy 3.1.1
- **CORS**: Flask-CORS 4.0.0
- **Password Hashing**: SHA256

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom styling with gradients, animations, and responsive design
- **JavaScript (Vanilla)**: No frameworks, pure JS for all interactions
- **Font**: Poppins (Google Fonts)

### Development
- **Server**: Flask development server (localhost:5000)
- **Session Management**: Flask sessions with credentials
- **File Uploads**: Base64 encoding (demo purposes)

---

## 📁 Project Structure

```
online_mechanics/
├── main.html                          # Landing page with mechanic listings
├── main.css                           # Main page styles (37KB)
├── main.js                            # Main page JavaScript logic
├── admin_dashboard.html               # Admin dashboard interface
├── admin_dashboard.css                # Admin dashboard styles
├── admin_dashboard.js                 # Admin dashboard JavaScript
├── mechanic_registration.html         # Mechanic registration form
├── mechanic_registration.js           # Registration form JavaScript
├── MECHANIC_REGISTRATION_SYSTEM.md    # Mechanic system documentation
│
├── about/                             # About page
│   ├── about.html
│   └── about.css
│
├── booking/                           # Booking system
│   ├── booking.html                   # User booking management
│   ├── booking.css
│   └── booking.js
│
├── chat/                              # Messaging system
│   ├── chat.html                      # Chat interface
│   ├── chat.css
│   ├── chat.js
│   ├── chat_new.html                  # Enhanced chat interface
│   ├── chat_new.css
│   └── chat_new.js
│
├── contact/                           # Contact page
│   ├── contact.html
│   └── contact.css
│
├── index/                             # Index/home page
│   ├── index.html
│   ├── index.css
│   └── index.js
│
├── services/                          # Services page
│   ├── services.html
│   └── services.css
│
└── login/                             # Backend & authentication
    ├── login_app.py                   # Main Flask application (64KB)
    ├── models.py                      # SQLAlchemy database models
    ├── login.html                     # Login/signup page
    ├── login.css                      # Login page styles
    ├── login.js                       # Login page JavaScript
    ├── mechanic_dashboard.html        # Mechanic dashboard
    ├── mechanic_dashboard_full.html    # Full mechanic dashboard
    ├── pending_mechanics.html          # Admin pending applicants
    ├── mechanic_bookings.html          # Mechanic booking management
    ├── mechanic_bookings.css
    ├── mechanic_bookings.js
    ├── requirements.txt               # Python dependencies
    ├── DATABASE_README.md             # Database documentation
    ├── init_db.py                     # Database initialization
    ├── current_db.txt                 # Current database filename
    │
    ├── Database Files:
    ├── mistrivai.db                 # Main SQLite database
    ├── mistrivai_fresh.db           # Fresh database copy
    ├── mistrivai_old.db             # Old database backup
    ├── mechanics_hiring.db           # Hiring database
    └── [Multiple timestamped .db files]
    │
    ├── Utility Scripts:
    ├── add_jarif_mechanic.py          # Add test mechanic
    ├── add_new_tables.py              # Add new database tables
    ├── check_fresh.py                 # Check fresh database
    ├── check_mechanic_bookings.py      # Check mechanic bookings
    ├── check_mechanics.py             # Check mechanics data
    ├── check_messages.py              # Check messages
    ├── debug_chat.py                  # Debug chat system
    ├── fix_emails.py                  # Fix email issues
    ├── inspect_db.py                  # Inspect database
    ├── inspect_one.py                 # Inspect single record
    ├── login.py                       # Legacy login script
    ├── migrate_db.py                  # Database migration
    ├── reinit_debug.py                # Reinitialize debug DB
    └── reinit_fresh.py                # Reinitialize fresh DB
```

---

## 🔧 Backend Architecture

### Main Application (`login/login_app.py`)

The Flask application serves as the central backend, handling:

1. **Static File Serving**: Routes for serving HTML, CSS, and JS files
2. **Authentication**: Login/signup for users, admins, and mechanics
3. **Session Management**: User session handling with role-based access
4. **API Endpoints**: RESTful API for frontend communication
5. **Database Operations**: CRUD operations via SQLAlchemy

### Key Components:

#### Database Configuration
```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mistrivai.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'your_secret_key_change_this'
```

#### CORS Configuration
```python
CORS(app, supports_credentials=True)
```

#### Route Categories:
- **Static File Routes**: Serve frontend assets
- **Authentication Routes**: Login, signup, logout
- **Profile Routes**: Get/update user profiles
- **Mechanic Routes**: Mechanic listing, details, proposals
- **Admin Routes**: Admin dashboard, pending applicants
- **Booking Routes**: Create/list bookings, accept/reject
- **Message Routes**: Chat functionality

---

## 🎨 Frontend Architecture

### Page Structure

#### 1. Landing Page (`main.html`)
- **Purpose**: Main entry point showcasing mechanics
- **Features**:
  - Hero section with search functionality
  - Popular mechanics carousel
  - Active mechanics list
  - Mechanic detail modal
  - Dark mode toggle
  - Profile/navbar integration
- **JavaScript**: `main.js` handles mechanic loading, filtering, and interactions

#### 2. Authentication (`login/login.html`)
- **Purpose**: User authentication interface
- **Features**:
  - Role selector (User/Admin/Mechanic)
  - Login form with email/password
  - Signup form with validation
  - Remember me functionality
  - Password visibility toggle
  - Social login buttons (UI only)
- **JavaScript**: `login.js` handles form submissions and role switching

#### 3. Admin Dashboard (`admin_dashboard.html`)
- **Purpose**: Admin control panel
- **Features**:
  - Sidebar navigation
  - Dashboard statistics
  - User management
  - Mechanic management
  - Pending applicants review
  - Booking oversight
  - Reports section
- **JavaScript**: `admin_dashboard.js` handles tab switching and data loading

#### 4. Mechanic Registration (`mechanic_registration.html`)
- **Purpose**: Comprehensive mechanic signup
- **Features**:
  - 5-section progressive form:
    1. Personal Information
    2. Professional Information
    3. Certifications & Documents
    4. Work History & Portfolio
    5. Terms & Agreement
  - File upload with preview
  - Form validation
  - Progress indicator
- **JavaScript**: `mechanic_registration.js` handles multi-step form logic

#### 5. Booking System (`booking/booking.html`)
- **Purpose**: User booking management
- **Features**:
  - Requested bookings section
  - Confirmed bookings section
  - Completed bookings section
  - Booking creation form
  - Mechanic search integration
- **JavaScript**: `booking.js` handles booking CRUD operations

#### 6. Chat System (`chat/chat.html`)
- **Purpose**: Real-time messaging
- **Features**:
  - Conversation list sidebar
  - Chat message display
  - Message input with image support
  - Real-time message updates
- **JavaScript**: `chat.js` handles messaging logic

### Design System

#### Color Scheme
- **Primary Gradient**: Purple (#667eea) to Violet (#764ba2)
- **Secondary**: Teal (#20c997)
- **Background**: Dark (#23272f) for dark mode
- **Text**: White/Light gray for readability

#### Typography
- **Font Family**: Poppins (Google Fonts)
- **Weights**: 400 (regular), 600 (semibold), 700 (bold)

#### Components
- **Cards**: Shadowed, rounded corners, hover effects
- **Buttons**: Gradient backgrounds, smooth transitions
- **Inputs**: Clean borders, focus states
- **Modals**: Overlay with centered content
- **Navigation**: Responsive navbar with profile integration

---

## 🗄 Database Schema

### Tables Overview

#### 1. `users` Table
```python
- id (Primary Key)
- username (Unique)
- email (Unique)
- password (SHA256 hashed)
- full_name
- profile_pic (URL)
- role (default: 'user')
- created_at (DateTime)
- updated_at (DateTime)
```

#### 2. `admins` Table
```python
- id (Primary Key)
- username (Unique)
- email (Unique)
- password (SHA256 hashed)
- full_name
- profile_pic (URL)
- role (default: 'admin')
- permissions (comma-separated)
- created_at (DateTime)
- updated_at (DateTime)
```

#### 3. `mechanics` Table
```python
- id (Primary Key)
- username (Unique)
- email (Unique)
- password (SHA256 hashed)
- full_name
- workshop_name
- age
- address
- mobile
- profile_pic (URL)
- role (default: 'mechanic')
- expertise (comma-separated skills)
- experience_years
- hourly_rate
- working_hours
- education
- education_certificate (URL)
- skill_certificates (JSON array)
- nid_number
- nid_photo (URL)
- birth_certificate_number
- birth_certificate_photo (URL)
- work_history (JSON array)
- is_active (Boolean)
- is_approved (Boolean)
- rating (Float)
- total_bookings (Integer)
- total_income (Float)
- monthly_income (Float)
- average_income (Float)
- created_at (DateTime)
- updated_at (DateTime)
```

#### 4. `mechanic_proposals` Table
```python
- id (Primary Key)
- mechanic_id (Foreign Key → mechanics.id)
- status (pending/approved/rejected)
- submitted_at (DateTime)
- reviewed_at (DateTime)
- reviewed_by (Foreign Key → admins.id)
- review_notes (Text)
```

#### 5. `mechanic_notifications` Table
```python
- id (Primary Key)
- mechanic_id (Foreign Key → mechanics.id)
- proposal_id (Foreign Key → mechanic_proposals.id)
- notification_type (approved/rejected/info)
- message (Text)
- created_at (DateTime)
- is_read (Boolean)
```

#### 6. `bookings` Table
```python
- id (Primary Key)
- user_id (Foreign Key → users.id)
- mechanic_id (Foreign Key → mechanics.id)
- address
- preferred_time (DateTime)
- problem_description (Text)
- offer (Float)
- counter_offer (Float)
- counter_note (Text)
- payment_method
- status (requested/confirmed/pending/completed/rejected)
- created_at (DateTime)
- updated_at (DateTime)
```

#### 7. `messages` Table
```python
- id (Primary Key)
- sender_id (Integer)
- receiver_id (Integer)
- content (Text)
- image_url (String)
- created_at (DateTime)
- is_read (Boolean)
```

### Relationships
- **User → Bookings**: One-to-many
- **Mechanic → Bookings**: One-to-many
- **Mechanic → Proposals**: One-to-many
- **Admin → Reviewed Proposals**: One-to-many
- **Mechanic → Notifications**: One-to-many

---

## 🌐 API Endpoints

### Authentication

#### POST `/login`
**Purpose**: Authenticate user/admin/mechanic
**Request Body**:
```json
{
  "username": "email@example.com",
  "password": "password123",
  "role": "user"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Login successful!",
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

#### POST `/signup`
**Purpose**: Register new user
**Request Body**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepass123",
  "full_name": "New User"
}
```

#### POST `/admin/signup`
**Purpose**: Register new admin
**Request Body**: Same as user signup

#### POST `/mechanic/signup`
**Purpose**: Register new mechanic
**Request Body**:
```json
{
  "username": "mechanic_user",
  "email": "mechanic@example.com",
  "password": "mechpass123",
  "full_name": "John Mechanic",
  "workshop_name": "John's Auto Repair"
}
```

#### POST `/logout`
**Purpose**: Logout current user

### Profile Management

#### GET `/profile`
**Purpose**: Get current user profile
**Response**:
```json
{
  "logged_in": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST `/update-profile`
**Purpose**: Update user profile
**Request Body**: Profile fields to update

### Mechanic Endpoints

#### GET `/mechanics`
**Purpose**: Get all active mechanics
**Response**:
```json
{
  "success": true,
  "mechanics": [
    {
      "id": 1,
      "name": "John Mechanic",
      "workshop": "John's Auto Repair",
      "expertise": "Engine,Electrical",
      "experience": 5,
      "hourly_rate": 50.0,
      "working_hours": "9am-6pm",
      "address": "123 Main St",
      "mobile": "555-1234",
      "profile_pic": "",
      "rating": 4.5,
      "is_active": true
    }
  ]
}
```

#### GET `/mechanics/<id>`
**Purpose**: Get specific mechanic details

#### POST `/mechanic/submit-proposal`
**Purpose**: Submit mechanic registration proposal
**Request Body**: Form data with all mechanic details

#### GET `/mechanic/status`
**Purpose**: Check mechanic proposal status
**Response**:
```json
{
  "success": true,
  "proposal": {
    "status": "pending",
    "submitted_at": "2024-01-01T00:00:00",
    "full_name": "John Mechanic",
    "email": "john@example.com",
    "is_approved": false
  }
}
```

### Admin Endpoints

#### GET `/api/stats`
**Purpose**: Get dashboard statistics
**Response**:
```json
{
  "success": true,
  "total_users": 10,
  "total_mechanics": 5,
  "total_bookings": 20
}
```

#### GET `/api/users`
**Purpose**: Get all users (admin only)

#### GET `/admin/pending-mechanics`
**Purpose**: Get pending mechanic applications
**Response**:
```json
{
  "success": true,
  "pending": [
    {
      "proposal_id": 1,
      "mechanic_id": 5,
      "name": "John Mechanic",
      "email": "john@example.com",
      "mobile": "555-1234",
      "submitted_at": "2024-01-01T00:00:00",
      "experience_years": 5,
      "skills": "Engine,Electrical"
    }
  ]
}
```

### Booking Endpoints

#### GET `/bookings`
**Purpose**: Get current user's bookings
**Response**:
```json
{
  "success": true,
  "bookings": [
    {
      "id": 1,
      "mechanic_id": 1,
      "mechanic_name": "John Mechanic",
      "address": "123 Main St",
      "preferred_time": "2024-01-01T10:00:00",
      "problem_description": "Car won't start",
      "offer": 100.0,
      "payment_method": "cash",
      "status": "requested"
    }
  ]
}
```

#### POST `/bookings`
**Purpose**: Create new booking
**Request Body**:
```json
{
  "mechanic_id": 1,
  "address": "123 Main St",
  "preferred_time": "2024-01-01T10:00:00",
  "problem_description": "Car won't start",
  "offer": 100.0,
  "payment_method": "cash"
}
```

#### GET `/mechanic/bookings`
**Purpose**: Get mechanic's bookings

#### POST `/mechanic/bookings/<id>/accept`
**Purpose**: Mechanic accepts booking

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation Steps

1. **Navigate to login directory**:
```bash
cd "d:\big projects\online_mechanics\login"
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Initialize database**:
```bash
python init_db.py
```

4. **Run the Flask application**:
```bash
python login_app.py
```

5. **Access the application**:
- Open browser to: `http://127.0.0.1:5000`

### Sample Credentials

After running `init_db.py`, you can use these credentials:

**User Account:**
- Username: `john_doe`
- Password: `password123`

**Admin Account:**
- Email: `jarifhassan980@gmail.com`
- Password: `JARIF.98@`

**Mechanic Account:**
- Username: `jarif_hassan`
- Password: `password123`

---

## 📄 File-by-File Documentation

### Root Level Files

#### `main.html` (7.5KB)
- **Purpose**: Landing page and main entry point
- **Key Features**:
  - Hero section with search
  - Popular mechanics carousel
  - Active mechanics list
  - Mechanic detail modal
  - Dark mode toggle
  - Profile integration
- **Dependencies**: `main.css`, `main.js`

#### `main.css` (37KB)
- **Purpose**: Global styles for main page
- **Key Styles**:
  - Gradient backgrounds
  - Card layouts
  - Responsive grid
  - Dark mode styles
  - Animations and transitions

#### `main.js` (8.9KB)
- **Purpose**: Main page JavaScript logic
- **Key Functions**:
  - `loadMechanics()`: Fetch mechanics from API
  - `buildMechanicCard()`: Create mechanic card HTML
  - `renderMechanics()`: Display mechanics in UI
  - `applyFilter()`: Filter mechanics by search query
  - Dark mode toggle logic
  - Modal open/close handlers

#### `admin_dashboard.html` (8.6KB)
- **Purpose**: Admin control panel interface
- **Key Features**:
  - Sidebar navigation
  - Dashboard statistics
  - User management table
  - Mechanic management table
  - Pending applicants section
- **Dependencies**: `admin_dashboard.css`, `admin_dashboard.js`

#### `admin_dashboard.css` (8.3KB)
- **Purpose**: Admin dashboard styles
- **Key Styles**:
  - Sidebar layout
  - Table styles
  - Card layouts
  - Status badges
  - Form styles

#### `admin_dashboard.js` (6.8KB)
- **Purpose**: Admin dashboard JavaScript
- **Key Functions**:
  - Tab switching logic
  - Data loading for each section
  - User/mechanic management
  - Statistics calculation

#### `mechanic_registration.html` (18.8KB)
- **Purpose**: Comprehensive mechanic registration form
- **Key Features**:
  - 5-section progressive form
  - File upload with preview
  - Form validation
  - Progress indicator
  - Terms agreement
- **Dependencies**: `mechanic_registration.js`

#### `mechanic_registration.js` (6.9KB)
- **Purpose**: Registration form JavaScript
- **Key Functions**:
  - Multi-step form navigation
  - File upload handling
  - Form validation
  - API submission
  - Progress tracking

### Directory: `login/`

#### `login_app.py` (64KB)
- **Purpose**: Main Flask application
- **Key Sections**:
  - Imports and configuration
  - Database initialization
  - Static file serving routes
  - Authentication routes
  - Profile management routes
  - Mechanic routes
  - Admin routes
  - Booking routes
- **Key Routes**: 30+ API endpoints

#### `models.py` (8KB)
- **Purpose**: SQLAlchemy database models
- **Models Defined**:
  - `User`: Regular user model
  - `Admin`: Admin user model
  - `Mechanic`: Mechanic profile model
  - `MechanicProposal`: Proposal tracking
  - `MechanicNotification`: Notification system
  - `Booking`: Booking management
  - `Message`: Messaging system
- **Key Methods**:
  - `hash_password()`: SHA256 password hashing
  - `check_password()`: Password verification

#### `login.html` (14KB)
- **Purpose**: Authentication interface
- **Key Features**:
  - Role selector (User/Admin/Mechanic)
  - Login form
  - Signup form
  - Remember me checkbox
  - Password visibility toggle
- **Dependencies**: `login.css`, `login.js`

#### `login.css` (19KB)
- **Purpose**: Login page styles
- **Key Styles**:
  - Auth modal design
  - Form input styles
  - Button styles
  - Role selector styles
  - Social login buttons

#### `login.js` (14.8KB)
- **Purpose**: Login page JavaScript
- **Key Functions**:
  - Role switching
  - Form submission
  - Password visibility toggle
  - Remember me functionality
  - Error handling

#### `mechanic_dashboard.html` (14.5KB)
- **Purpose**: Mechanic dashboard for pending approval
- **Key Features**:
  - Proposal status display
  - Waiting message
  - Profile summary
  - Auto-redirect logic

#### `mechanic_dashboard_full.html` (34KB)
- **Purpose**: Full mechanic dashboard for approved mechanics
- **Key Features**:
  - Booking management
  - Profile editing
  - Statistics display
  - Activity tracking

#### `pending_mechanics.html` (26.6KB)
- **Purpose**: Admin pending applicants interface
- **Key Features**:
  - Application list view
  - Detailed modal view
  - Approve/Reject actions
  - Review notes

#### `mechanic_bookings.html` (4.1KB)
- **Purpose**: Mechanic booking management
- **Key Features**:
  - Booking list
  - Accept/reject functionality
  - Status tracking

#### `requirements.txt` (78 bytes)
- **Purpose**: Python dependencies
- **Contents**:
  ```
  Flask==2.3.3
  Flask-CORS==4.0.0
  Flask-SQLAlchemy==3.1.1
  SQLAlchemy==2.0.23
  ```

#### `DATABASE_README.md` (5KB)
- **Purpose**: Database documentation
- **Contents**:
  - Database structure overview
  - Table descriptions
  - Setup instructions
  - Sample credentials
  - API endpoint examples
  - Security notes

#### `init_db.py` (6.4KB)
- **Purpose**: Database initialization script
- **Functions**:
  - Create all tables
  - Add sample data
  - Display credentials
  - Handle database errors

### Utility Scripts (login/)

#### `add_jarif_mechanic.py` (1.7KB)
- **Purpose**: Add test mechanic account
- **Creates**: Mechanic with predefined credentials

#### `add_new_tables.py` (372 bytes)
- **Purpose**: Add new database tables
- **Usage**: Run when schema changes

#### `check_fresh.py` (468 bytes)
- **Purpose**: Check fresh database status
- **Output**: Database connection test

#### `check_mechanic_bookings.py` (619 bytes)
- **Purpose**: Check mechanic booking data
- **Output**: Booking statistics

#### `check_mechanics.py` (665 bytes)
- **Purpose**: Check mechanics data
- **Output**: Mechanic list and details

#### `check_messages.py` (1.1KB)
- **Purpose**: Check message data
- **Output**: Message statistics

#### `debug_chat.py` (1.4KB)
- **Purpose**: Debug chat system
- **Functions**: Test messaging endpoints

#### `fix_emails.py` (739 bytes)
- **Purpose**: Fix email issues in database
- **Usage**: Run when email problems occur

#### `inspect_db.py` (578 bytes)
- **Purpose**: Inspect database structure
- **Output**: Table information

#### `inspect_one.py` (468 bytes)
- **Purpose**: Inspect single record
- **Usage**: Debug specific records

#### `login.py` (2KB)
- **Purpose**: Legacy login script
- **Status**: Deprecated, use login_app.py

#### `migrate_db.py` (2KB)
- **Purpose**: Database migration script
- **Usage**: Migrate data between schemas

#### `reinit_debug.py` (4.8KB)
- **Purpose**: Reinitialize debug database
- **Functions**: Reset database with test data

#### `reinit_fresh.py` (4.8KB)
- **Purpose**: Reinitialize fresh database
- **Functions**: Clean database reset

### Directory: `booking/`

#### `booking.html` (7.3KB)
- **Purpose**: User booking management interface
- **Key Features**:
  - Requested bookings section
  - Confirmed bookings section
  - Completed bookings section
  - Booking creation form
- **Dependencies**: `booking.css`, `booking.js`

#### `booking.css` (11.6KB)
- **Purpose**: Booking page styles
- **Key Styles**:
  - Booking card layout
  - Status badges
  - Form styles
  - Responsive design

#### `booking.js` (9.2KB)
- **Purpose**: Booking page JavaScript
- **Key Functions**:
  - Load user bookings
  - Create new booking
  - Update booking status
  - Filter bookings by status

### Directory: `chat/`

#### `chat.html` (4.2KB)
- **Purpose**: Basic chat interface
- **Key Features**:
  - Conversation list
  - Message display
  - Message input
- **Dependencies**: `chat.css`, `chat.js`

#### `chat.css` (8.5KB)
- **Purpose**: Chat page styles
- **Key Styles**:
  - Chat layout
  - Message bubbles
  - Sidebar design
  - Input area

#### `chat.js` (8KB)
- **Purpose**: Chat page JavaScript
- **Key Functions**:
  - Load conversations
  - Send messages
  - Receive messages
  - Update read status

#### `chat_new.html` (9.4KB)
- **Purpose**: Enhanced chat interface
- **Key Features**:
  - Improved UI
  - Better message handling
  - Image support

#### `chat_new.css` (13.9KB)
- **Purpose**: Enhanced chat styles
- **Key Styles**: Modern chat design

#### `chat_new.js` (32.3KB)
- **Purpose**: Enhanced chat JavaScript
- **Key Functions**: Advanced messaging features

### Directory: `index/`

#### `index.html` (7.3KB)
- **Purpose**: Index/home page
- **Key Features**: Landing content
- **Dependencies**: `index.css`, `index.js`

#### `index.css` (12.4KB)
- **Purpose**: Index page styles
- **Key Styles**: Landing page design

#### `index.js` (344 bytes)
- **Purpose**: Index page JavaScript
- **Key Functions**: Basic interactions

### Directory: `about/`, `contact/`, `services/`

These directories contain placeholder pages with minimal content:
- `about/about.html` (217 bytes)
- `contact/contact.html` (212 bytes)
- `services/services.html` (223 bytes)
- CSS files are empty (0 bytes)

---

## 👥 User Roles & Permissions

### User Role
- **Permissions**:
  - Browse mechanics
  - Book services
  - Send messages to mechanics
  - View own bookings
  - Update own profile
- **Access**: All public pages, booking system, chat system

### Admin Role
- **Permissions**:
  - All user permissions
  - View all users
  - View all mechanics
  - Approve/reject mechanic applications
  - View all bookings
  - Access admin dashboard
- **Access**: Admin dashboard, pending applicants page

### Mechanic Role
- **Permissions**:
  - Create profile (requires approval)
  - View own bookings
  - Accept/reject booking requests
  - Send messages to users
  - Update own profile
  - Set availability
- **Access**: Mechanic dashboard (after approval), booking management

### Role-Based Access Control
- Implemented via session management
- Checked on protected routes
- Frontend hides/shows elements based on role
- Backend validates role on API calls

---

## ✨ Key Features

### 1. Mechanic Registration System
- **5-Section Progressive Form**: Personal, Professional, Documents, Work History, Terms
- **File Uploads**: Profile photo, certificates, NID, birth certificate, work photos
- **Approval Workflow**: Submit → Pending Review → Admin Approval → Active
- **Status Tracking**: Real-time status updates via API

### 2. Booking System
- **Multi-Status Workflow**: Requested → Confirmed → Completed
- **Counter Offers**: Mechanics can counter user offers
- **Payment Methods**: Cash, card, etc.
- **Time Scheduling**: Preferred time selection
- **Problem Description**: Detailed issue reporting

### 3. Messaging System
- **Real-Time Chat**: User-mechanic communication
- **Conversation List**: View all conversations
- **Image Support**: Send images in messages
- **Read Status**: Track message read status
- **Auto-Refresh**: Polling for new messages

### 4. Admin Dashboard
- **Statistics Overview**: User/mechanic/booking counts
- **User Management**: View and manage users
- **Mechanic Management**: View and manage mechanics
- **Pending Applicants**: Review and approve/reject applications
- **Booking Oversight**: View all platform bookings

### 5. Search & Filtering
- **Mechanic Search**: By name, skills, workshop, location
- **Real-Time Filtering**: Instant results as you type
- **Popular Mechanics**: Top-rated mechanics highlighted
- **Active Mechanics**: Currently available mechanics

### 6. Responsive Design
- **Mobile-Friendly**: Works on all device sizes
- **Dark Mode**: Toggle between light/dark themes
- **Smooth Animations**: Professional transitions
- **Modern UI**: Gradient backgrounds, card layouts

---

## 🔧 Development Workflow

### Running the Application

1. **Start Flask Server**:
```bash
cd login
python login_app.py
```
Server runs on `http://127.0.0.1:5000`

2. **Access Frontend**:
- Main page: `http://127.0.0.1:5000/`
- Login: `http://127.0.0.1:5000/login/login.html`
- Admin: `http://127.0.0.1:5000/admin_dashboard.html`

### Database Management

1. **Reset Database**:
```bash
del mistrivai.db
python init_db.py
```

2. **Check Database**:
```bash
python inspect_db.py
```

3. **Add Test Data**:
```bash
python add_jarif_mechanic.py
```

### Debugging

1. **Check Mechanics**:
```bash
python check_mechanics.py
```

2. **Check Bookings**:
```bash
python check_mechanic_bookings.py
```

3. **Debug Chat**:
```bash
python debug_chat.py
```

### Adding New Features

1. **Backend**: Add routes in `login_app.py`
2. **Database**: Add models in `models.py`, run migration
3. **Frontend**: Create HTML/CSS/JS files
4. **API**: Add endpoints in `login_app.py`
5. **Testing**: Use utility scripts to verify

---

## 📝 Notes

### Security Considerations
- **Password Hashing**: SHA256 used (consider bcrypt for production)
- **Session Secret**: Change `app.secret_key` for production
- **CORS**: Enabled with credentials (restrict origins in production)
- **SQL Injection**: Protected via SQLAlchemy ORM
- **XSS**: Basic protection via HTML escaping

### Known Limitations
- **File Storage**: Base64 encoding in database (use cloud storage in production)
- **Real-Time**: Polling-based updates (consider WebSockets)
- **Email**: No email notifications (add in production)
- **Payment**: No payment processing (add payment gateway)
- **Testing**: No automated tests (add unit/integration tests)

### Future Enhancements
- **Cloud Storage**: AWS S3 or Cloudinary for file uploads
- **Email Notifications**: Sendgrid or similar for alerts
- **Payment Integration**: Stripe or PayPal
- **Real-Time Updates**: WebSockets for live updates
- **Mobile App**: React Native or Flutter app
- **Rating System**: User ratings for mechanics
- **Advanced Search**: Location-based, filters, sorting
- **Analytics**: Dashboard analytics and reporting

---

## 📞 Support

For issues or questions:
1. Check `DATABASE_README.md` for database issues
2. Check `MECHANIC_REGISTRATION_SYSTEM.md` for registration issues
3. Use utility scripts for debugging
4. Review Flask logs for server errors

---

## 📄 License

This project is for educational purposes.

---

**Last Updated**: June 2026
**Version**: 1.0.0
**Framework**: Flask 2.3.3
**Database**: SQLite with SQLAlchemy 2.0.23
