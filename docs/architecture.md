# Project Architecture

This document explains how different parts of the project work together.

## How Everything Connects

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                            │
│                     http://localhost:3000                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTP Requests
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND SERVER                             │
│                   (Python HTTP Server)                           │
│                      Port: 3000                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Static Files: HTML, CSS, JavaScript (Vue.js)           │   │
│  │  - index.html                                            │   │
│  │  - custom.css                                            │   │
│  │  - js/*.js (app, admin, doctor, patient, api, utils)    │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ AJAX/Fetch API Calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                              │
│                     (Flask REST API)                             │
│                      Port: 5000                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Routes:                                                 │   │
│  │  - /api/auth/*      (Authentication)                     │   │
│  │  - /api/admin/*     (Admin operations)                   │   │
│  │  - /api/doctor/*    (Doctor operations)                  │   │
│  │  - /api/patient/*   (Patient operations)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────┬────────────┬──────────────┬────────────────────┬──────────┘
      │            │              │                    │
      │            │              │                    │
      ▼            ▼              ▼                    ▼
┌──────────┐ ┌──────────┐  ┌──────────┐      ┌─────────────────┐
│ SQLite   │ │  Redis   │  │  Celery  │      │    MailHog      │
│ Database │ │  Cache   │  │  Queue   │      │ (Email Testing) │
│          │ │          │  │          │      │                 │
│ - Users  │ │ Sessions │  │ Tasks:   │      │ SMTP: 1025      │
│ - Doctors│ │ & Cache  │  │ - Emails │      │ Web:  8025      │
│ - Patient│ │          │  │ - Report │      │                 │
│ - Appts  │ │Port:6379 │  │          │      │                 │
│ - Treats │ │          │  │          │      │                 │
└──────────┘ └──────────┘  └────┬─────┘      └────────▲────────┘
                                 │                     │
                                 │ Sends Email Jobs    │
                                 └─────────────────────┘
```

## Main Components

### 1. Frontend (What users see)
- **Location:** `frontend/` folder
- **Technology:** Vue.js 3 (CDN), Bootstrap 5, Bootstrap Icons
- **What it does:** Single-page application (SPA) that shows different views based on user role
- **Main files:**
  - `index.html` - Main HTML page with Vue app
  - `custom.css` - Custom styling (dark theme #0f172a)
  - `js/app.js` - Main Vue app, routing, authentication
  - `js/admin.js` - Admin dashboard component (manage doctors/patients/appointments)
  - `js/doctor.js` - Doctor dashboard component (appointments, treatments, availability)
  - `js/patient.js` - Patient dashboard component (book appointments, view history)
  - `js/api.js` - API service layer (all backend calls)
  - `js/utils.js` - Utility functions (date formatting, status classes)
- **Runs on:** http://localhost:3000

### 2. Backend (Brain of the app)
- **Location:** `backend/` folder
- **Technology:** Flask, SQLAlchemy, Flask-JWT-Extended, Flask-CORS
- **What it does:** REST API for all operations, authentication, database management
- **Main files:**
  - `app.py` - Main Flask application, CORS setup, routes registration
  - `database.py` - Database connection and session management
  - `decorators.py` - JWT authentication decorators (@token_required, @admin_required, etc.)
  - `seed_db.py` - Database seeding script (creates sample data)
  - `routes/` - API endpoints (all return JSON)
    - `auth.py` - Login, Register, Get User Info
    - `admin.py` - Manage doctors/patients, view all appointments, reschedule/cancel
    - `doctor.py` - View appointments, update treatments, set availability, view assigned patients
    - `patient.py` - Book appointments, view history, get available slots, view doctors
  - `models/` - SQLAlchemy ORM models (6 tables)
    - `user.py` - User model
    - `doctor.py` - Doctor model
    - `patient.py` - Patient model
    - `appointment.py` - Appointment model
    - `treatment.py` - Treatment model
  - `celery_tasks/` - Background job processing
- **Runs on:** http://localhost:5000

### 3. Database (Where data is stored)
- **Type:** SQLite (simple file-based database)
- **Location:** `backend/instance/hospital.db`
- **Tables (6 total):**
  - `users` - Login credentials (username, password, email, role)
  - `doctors` - Doctor profiles (name, specialization, experience, qualification, consultation_fee, is_active)
  - `patients` - Patient info (name, age, gender, phone, address, medical_history, is_blacklisted)
  - `appointments` - Bookings (doctor_id, patient_id, appointment_date, appointment_time, status)
  - `treatments` - Treatment records (appointment_id, visit_type, diagnosis, prescription, notes)
  - `doctor_availability` - Schedule slots (doctor_id, date, slot_type, is_available)

### 4. Background Jobs (Celery)
- **Location:** `backend/celery_tasks/` folder
- **What it does:** Sends appointment confirmation emails and periodic reminders
- **Task files:**
  - `__init__.py` - Celery app configuration
  - `email.py` - Appointment confirmation emails
  - `reminders.py` - Daily reminder emails (for today's appointments)
  - `reports.py` - Monthly reports for doctors
  - `email_template.py` - HTML email templates
  - `imports.py` - Imports all tasks for worker discovery
- **Needs:** Redis to be running (message broker)

### 5. Redis (Message Queue)
- **What it does:** Helps Celery send background tasks
- **Runs on:** Port 6379
- **Not required** for basic app, only for emails

## How Things Work Together

### Example: Patient Books an Appointment

1. Patient selects department (e.g., Cardiology)
2. Patient chooses a doctor from list
3. Patient selects date (cannot select past dates - validated)
4. Patient picks time slot (morning/evening - based on doctor availability)
5. Frontend sends POST request to `/api/patient/appointments`
6. Backend validates:
   - Date is not in the past
   - Slot is still available
   - Doctor is active
7. Backend creates appointment record (status: 'booked')
8. Backend queues email task via Celery
9. Celery worker sends confirmation email
10. Backend returns success response
11. Frontend shows success message and redirects to appointments list

### Example: Doctor Updates Treatment

1. Doctor views appointment list in dashboard
2. Doctor clicks "Update" button on an appointment
3. Form opens with fields:
   - Visit Type (consultation/follow_up/emergency)
   - Diagnosis
   - Prescribed Medicines
   - Treatment Notes
4. Doctor fills all required fields
5. Doctor clicks "Update Treatment" (saves only)
   OR "Mark as Completed" (saves and changes status)
6. Frontend sends PUT request to `/api/doctor/patient-history`
7. Backend creates/updates Treatment record linked to appointment
8. If marked completed, appointment status changes to 'completed'
9. Patient can view treatment details in their history

## UI Design

The app uses a **dark professional theme** with:
- **Primary Color:** Dark slate (#0f172a)
- **Accent Color:** Gold gradient for highlights
- **Modern Design:** Rounded corners, shadows, smooth animations
- **Responsive:** Works on desktop and mobile

### Key Features:
- Professional hero section on homepage
- Modern login/register pages with branding
- Clean dashboards for admin, doctor, patient
- Modal confirmations (instead of ugly alerts)
- Icons from Bootstrap Icons
- Smooth transitions and hover effects

## User Roles & Permissions

### Admin (username: admin, password: admin123)
**Dashboard Features:**
- Stats cards: Total doctors, patients, appointments
- Tabs: Doctors, Patients, Appointments

**Doctor Management:**
- Add new doctor (auto-generates username/password)
- Edit doctor details (name, specialization, experience, fee)
- Blacklist/Activate doctors
- View doctor appointment history
- Search and sort doctors

**Patient Management:**
- Edit patient details (name, age, gender, medical history)
- Blacklist/Unblacklist patients (prevents booking)
- View patient appointment history
- Search and sort patients

**Appointment Management:**
- View all appointments across system
- Reschedule appointments (select new date/time)
- Cancel appointments
- Filter by status

### Doctor (username: dr_sharma, password: doctor123)
**Dashboard Features:**
- Stats: Total appointments, patients, today's appointments
- Tabs: Appointments, Assigned Patients, Set Availability

**Appointment Management:**
- View all appointments (sorted by date)
- Update treatment details
- Mark appointments as completed
- Cancel booked appointments

**Patient Records:**
- View assigned patients list
- Access patient treatment history
- See patient demographics

**Availability Management:**
- Set morning slots (9 AM - 1 PM) for next 7 days
- Set evening slots (3 PM - 7 PM) for next 7 days
- Toggle availability on/off

### Patient (username: patient1, password: patient123)
**Dashboard Features:**
- View upcoming appointments
- View past appointments with treatment details

**Booking Process:**
- Step 1: Select department
- Step 2: Choose doctor (see profile: experience, fees, qualification)
- Step 3: Select date (min: today, max: 30 days ahead)
- Step 4: Pick time slot (based on doctor availability)
- Confirm booking

**Appointment Actions:**
- Cancel upcoming appointments
- View treatment records (diagnosis, prescription, notes)

**Profile Management:**
- Update personal information
- View medical history

## Data Flow

```
┌──────────┐
│  ADMIN   │
└────┬─────┘
     │ Creates/Manages
     ▼
┌──────────┐     Schedules      ┌──────────┐
│  DOCTOR  │◄──────────────────►│AVAILABILITY│
└────┬─────┘                    └──────────┘
     │                                ▲
     │ Treats                         │
     ▼                                │
┌──────────┐     Books          ┌────┴──────┐
│ PATIENT  │────────────────────►│APPOINTMENT│
└────┬─────┘                    └────┬──────┘
     │                               │
     │ Has                           │ Contains
     ▼                               ▼
┌──────────┐                    ┌──────────┐
│TREATMENT │◄───────────────────│ DOCTOR   │
│ RECORD   │   Creates          │          │
└──────────┘                    └──────────┘
```

## 🔐 Security Flow

```
1. User Login
   └─> POST /api/auth/login
       └─> Verify credentials
           └─> Create session
               └─> Store in Redis
                   └─> Return session cookie

2. Authenticated Request
   └─> Send with session cookie
       └─> Decorator checks session
           └─> Verify role
               └─> Allow/Deny access
```

## ⚡ Background Task Flow

```
1. Trigger Event (e.g., appointment booked)
   └─> Backend creates task
       └─> Push to Redis queue
           └─> Celery worker picks up
               └─> Execute task
                   └─> Send email via MailHog
                       └─> Task complete
```

## 🚀 Startup Sequence

### Manual Startup:

```
1. Start Redis
   └─> redis-server
       └─> Port 6379 open

2. Start Backend API
   └─> python3 app.py
       └─> Port 5000 open
       └─> Connects to Redis
       └─> Creates database tables

3. Start Celery Worker & Beat (Optional - for emails)
   └─> celery -A celery_tasks.imports:celery_app worker --beat
       └─> Connects to Redis
       └─> Ready for tasks
       └─> Scheduler running

4. Start Frontend Server
   └─> python3 -m http.server 3000
       └─> Port 3000 open
       └─> Serves static files

All services ready! 
```

## 📊 Port Mapping

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Frontend | 3000 | HTTP | Serve static files |
| Backend | 5000 | HTTP | REST API |
| Redis | 6379 | TCP | Message broker for Celery |

## 🔧 Technology Stack

### Frontend
- **Vue.js 3** - Reactive framework
- **Bootstrap 5** - UI components
- **Bootstrap Icons** - Icons
- **Vanilla JS** - No build tools needed

### Backend
- **Flask 2.3.3** - Web framework
- **SQLAlchemy 3.0.5** - ORM
- **Flask-CORS 4.0.0** - Cross-origin requests
- **Werkzeug** - Password hashing
- **Flask-JWT-Extended 4.5.3** - JWT authentication

### Background Tasks
- **Celery 5.3.4** - Task queue
- **Redis 5.0.1** - Message broker
- **Flask-Mail 0.9.1** - Email sending via SMTP

### Database
- **SQLite** - File-based database

## 📝 Notes

- All services run on localhost
- No internet connection required after initial setup (except for email sending)
- Emails are sent via Gmail SMTP (configure in .env file)
- Redis is used as Celery message broker
- Frontend is pure HTML/CSS/JS with Vue.js 3 CDN (no build process)
- Simple caching implemented for admin dashboard stats (5-minute expiry)

---

**This architecture provides:**
- Separation of concerns
- Scalable background processing  
- Secure authentication
- Real-time email testing
- Easy development setup
