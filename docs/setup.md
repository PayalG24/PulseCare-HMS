# Setup Guide - Hospital Management System

This is a simple guide to get the project running on your machine.

## What You Need

- Python 3.8 or higher
- Redis Server (for background tasks)
- A web browser (Chrome, Firefox, etc.)

## Step 1: Backend Setup

First, go to the backend folder and install all the required packages:

```bash
cd backend
pip install -r requirements.txt
```

## Step 2: Create Database with Sample Data

Run this script to create the database and add some test data (admin, doctors, patients):

```bash
python seed_db.py
```

This will create:
- **1 Admin account** (username: admin, password: admin)
- **3 Doctors** with different specializations:
  - Ajay Kumar (Cardiology) - 14 years exp, ₹1200 fee
  - Rajesh Verma (Neurology) - 12 years exp, ₹1400 fee
  - Aditya Tripathi (Orthopedics) - 8 years exp, ₹1000 fee
- **3 Sample Patients**
- **7-day availability** for all doctors (morning & evening slots)

## Step 3: Start the Backend Server

Now start the Flask server:

```bash
python app.py
```

Your backend will be running at `http://localhost:5000`

## Step 4: Start Frontend

Open another terminal and go to the frontend folder:

```bash
cd frontend
python -m http.server 3000
```

Your website will open at `http://localhost:3000`

## Step 5: Redis Setup (For Email Notifications)

If you want email notifications to work, install and start Redis:

**Install Redis (Ubuntu/WSL):**
```bash
sudo apt update
sudo apt install redis-server
```

**Start Redis:**
```bash
sudo service redis-server start
```

## Step 6: Start Background Workers (Optional)

These are needed for sending emails and reminders:

**Terminal - Celery Worker with Beat:**
```bash
cd backend
celery -A celery_tasks.imports:celery_app worker --beat --loglevel=info
```

This single command runs both the worker (for processing tasks) and beat (for scheduling) together.

## Quick Summary

At minimum, you need 2 terminals:
1. **Backend:** `python app.py` (in backend folder)
2. **Frontend:** `python -m http.server 3000` (in frontend folder)

For full features (emails), you need:
3. Redis running in background
4. Celery worker
5. Celery beat

## Login Credentials

After running `seed_db.py`, you can login as:

**Admin:**
- Username: `admin`
- Password: `admin`
- Email: admin@PulseCare.in

**Doctors:**
- **Ajay Kumar** (Cardiology):
  - Username: `ajay`
  - Password: `ajay.kumar123`
  - Email: ajay.kumar@PulseCare.in

- **Rajesh Verma** (Neurology):
  - Username: `rajesh`
  - Password: `rajesh`
  - Email: rajesh.verma@PulseCare.in

**Patients:**
- **Arjun Patel**:
  - Username: `arjun`
  - Password: `arjun`
  - Email: arjun.patel@gmail.com

- **Vikram Singh**:
  - Username: `vikram`
  - Password: `vikram`
  - Email: vikram.singh@gmail.com
