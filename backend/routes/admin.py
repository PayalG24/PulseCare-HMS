from flask import Blueprint, request, jsonify, current_app
from database import db
from models import User, Patient, Doctor, Appointment, Treatment
from werkzeug.security import generate_password_hash
from datetime import datetime, date
from sqlalchemy import or_
from decorators import admin_required

admin_bp = Blueprint('admin', __name__)

# Simple in-memory cache for dashboard stats
_stats_cache = {}

# get admin dashboard stats with caching
@admin_bp.route('/dashboard-stats', methods=['GET'])
@admin_required
def dashboard_stats():
    from datetime import datetime, timedelta

    cache_key = 'admin_stats'
    # check cached data (5 min expiry)
    if cache_key in _stats_cache:
        cached_data, cached_time = _stats_cache[cache_key]
        if (datetime.now() - cached_time).total_seconds() < 300:
            return jsonify({'success': True, 'message': 'Dashboard stats retrieved (from cache)', 'data': cached_data})
    
    # fetch fresh data
    total_doctors = Doctor.query.count()
    total_patients = Patient.query.count()
    total_appointments = Appointment.query.filter(
        Appointment.status.in_(['booked', 'cancelled', 'completed'])
    ).count()
    
    stats = {
        'total_doctors': total_doctors,
        'total_patients': total_patients,
        'total_appointments': total_appointments
    }
    
    # save to cache
    _stats_cache[cache_key] = (stats, datetime.now())
    
    return jsonify({'success': True, 'message': 'Dashboard stats retrieved (fresh)', 'data': stats})

# get all doctors list
@admin_bp.route('/doctors', methods=['GET'])
@admin_required
def get_doctors():
    doctors = Doctor.query.all()
    data = []
    
    for doc in doctors:
        data.append(doc.to_dict())
    
    return jsonify({'success': True, 'message': 'Doctors retrieved successfully', 'data': {'doctors': data}})


# create new doctor account
@admin_bp.route('/doctors', methods=['POST'])
@admin_required
def add_doctor():
    data = request.get_json()
    
    required = ['name', 'email', 'specialization', 'phone', 'experience', 'qualification']
    for field in required:
        if not data.get(field):
            name = field.replace("_", " ").title()
            return jsonify({'success': False, 'message': f'{name} is required', 'errors': [f'Missing {field}']}), 400
    
    existing = User.query.filter_by(email=data['email']).first()
    if existing is not None:
        return jsonify({'success': False, 'message': 'Email already exists', 'errors': ['Email taken']}), 400
    
    base = data['email'].split('@')[0]
    
    username = base
    counter = 1
    while User.query.filter_by(username=username).first():
        username = f"{base}{counter}"
        counter += 1
    
    password = f"{username}123"
    
    user = User(
        username=username,
        email=data['email'],
        password_hash=generate_password_hash(password),
        role='doctor'
    )
    db.session.add(user)
    db.session.flush()
    
    doctor = Doctor(
        user_id=user.id,
        name=data['name'],
        specialization=data['specialization'],
        phone=data['phone'],
        experience=data['experience'],
        qualification=data['qualification'],
        is_active=True
    )
    db.session.add(doctor)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Doctor account created successfully', 'data': {'doctor': doctor.to_dict(), 'credentials': {'username': username, 'password': password}}})


# update doctor details
@admin_bp.route('/doctors/<int:doctor_id>', methods=['PUT'])
@admin_required
def update_doctor(doctor_id):
    doctor = Doctor.query.get(doctor_id)
    
    if doctor is None:
        return jsonify({'success': False, 'message': 'Doctor not found', 'errors': ['Doctor not found']}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        doctor.name = data['name']
    
    if 'specialization' in data:
        doctor.specialization = data['specialization']
    
    if 'experience' in data:
        doctor.experience = data['experience']
    
    if 'qualification' in data:
        doctor.qualification = data['qualification']
    
    if 'phone' in data:
        doctor.phone = data['phone']
    
    if 'is_active' in data:
        doctor.is_active = data['is_active']
        doctor.user.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Doctor updated successfully', 'data': {'doctor': doctor.to_dict()}})

# deactivate doctor account
@admin_bp.route('/doctors/<int:doctor_id>', methods=['DELETE'])
@admin_required
def delete_doctor(doctor_id):
    doctor = Doctor.query.get(doctor_id)
    
    if doctor is None:
        return jsonify({'success': False, 'message': 'Doctor not found', 'errors': ['Doctor not found']}), 404
    
    doctor.is_active = False
    doctor.user.is_active = False
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Doctor deactivated successfully', 'data': {}})

# get all patients list
@admin_bp.route('/patients', methods=['GET'])
@admin_required
def get_patients():
    patients = Patient.query.all()
    data = []
    
    for p in patients:
        data.append(p.to_dict())
    
    return jsonify({'success': True, 'message': 'Patients retrieved successfully', 'data': {'patients': data}})

# get all appointments list
@admin_bp.route('/appointments', methods=['GET'])
@admin_required
def get_appointments():
    appointments = Appointment.query.order_by(Appointment.appointment_date.desc()).all()
    data = []
    
    for apt in appointments:
        data.append(apt.to_dict())
    
    return jsonify({'success': True, 'message': 'Appointments retrieved successfully', 'data': {'appointments': data}})

# update appointment status, notes, or reschedule
@admin_bp.route('/appointments/<int:appointment_id>', methods=['PUT'])
@admin_required
def update_appointment(appointment_id):
    appointment = Appointment.query.get(appointment_id)
    
    if appointment is None:
        return jsonify({'success': False, 'message': 'Appointment not found', 'errors': ['Appointment not found']}), 404
    
    data = request.get_json()
    
    if 'status' in data:
        appointment.status = data['status']
    if 'notes' in data:
        appointment.notes = data['notes']
        
    # Handle rescheduling
    if 'appointment_date' in data and 'appointment_time' in data:
        try:
            new_date = datetime.strptime(data['appointment_date'], '%Y-%m-%d').date()
            # Handle time format HH:MM or HH:MM:SS
            time_str = data['appointment_time']
            if len(time_str.split(':')) == 2:
                new_time = datetime.strptime(time_str, '%H:%M').time()
            else:
                new_time = datetime.strptime(time_str, '%H:%M:%S').time()
            
            # Check availability
            existing = Appointment.query.filter_by(
                doctor_id=appointment.doctor_id,
                appointment_date=new_date,
                appointment_time=new_time
            ).first()
            
            if existing and existing.id != appointment.id and existing.status != 'cancelled':
                 return jsonify({'success': False, 'message': 'Slot already booked', 'errors': ['Slot unavailable']}), 400
                 
            appointment.appointment_date = new_date
            appointment.appointment_time = new_time
            
        except ValueError as e:
            return jsonify({'success': False, 'message': f'Invalid date/time format: {str(e)}', 'errors': ['Invalid format']}), 400
    
    appointment.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Appointment updated successfully', 'data': {'appointment': appointment.to_dict()}})

# search doctors by name or specialization
@admin_bp.route('/search/doctors', methods=['GET'])
@admin_required
def search_doctors():
    q = request.args.get('q', '')
    spec = request.args.get('specialization', '')
    
    if not q and not spec:
        return jsonify({'success': False, 'message': 'Search query or specialization is required', 'errors': ['Missing search parameters']}), 400
    
    query = Doctor.query
    
    if q:
        query = query.filter(
            or_(
                Doctor.name.ilike(f'%{q}%'),
                Doctor.specialization.ilike(f'%{q}%')
            )
        )
    
    if spec:
        query = query.filter(
            Doctor.specialization.ilike(f'%{spec}%')
        )
    
    doctors = query.all()
    data = []
    
    for doc in doctors:
        data.append(doc.to_dict())
    
    count = len(data)
    
    return jsonify({'success': True, 'message': 'Doctors found', 'data': {'doctors': data, 'count': count}})

# search patients by name or email
@admin_bp.route('/search/patients', methods=['GET'])
@admin_required
def search_patients():
    q = request.args.get('q', '')
    
    if not q:
        return jsonify({'success': False, 'message': 'Search query is required', 'errors': ['Missing search parameter']}), 400
    
    patients = db.session.query(Patient).join(User).filter(
        or_(
            Patient.name.ilike(f'%{q}%'),
            User.email.ilike(f'%{q}%')
        )
    ).all()
    
    data = []
    for p in patients:
        data.append(p.to_dict())
    
    count = len(data)
    
    return jsonify({'success': True, 'message': 'Patients found', 'data': {'patients': data, 'count': count}})

# toggle patient blacklist status
@admin_bp.route('/patients/<int:patient_id>/blacklist', methods=['PUT'])
@admin_required
def toggle_patient_blacklist(patient_id):
    patient = Patient.query.get(patient_id)
    
    if patient is None:
        return jsonify({'success': False, 'message': 'Patient not found', 'errors': ['Patient not found']}), 404
    
    patient.is_blacklisted = not patient.is_blacklisted
    
    db.session.commit()
    
    if patient.is_blacklisted:
        action = "blacklisted"
    else:
        action = "unblacklisted"
    
    return jsonify({'success': True, 'message': f'Patient {action} successfully', 'data': {'patient': patient.to_dict()}})

# get patient appointment history
@admin_bp.route('/patients/<int:patient_id>/history', methods=['GET'])
@admin_required
def get_patient_history(patient_id):
    patient = Patient.query.get(patient_id)
    
    if patient is None:
        return jsonify({'success': False, 'message': 'Patient not found', 'errors': ['Patient not found']}), 404
    
    appointments = Appointment.query.filter_by(patient_id=patient_id).order_by(Appointment.appointment_date.desc()).all()
    
    data = []
    for apt in appointments:
        data.append(apt.to_dict())
    
    return jsonify({'success': True, 'message': 'Patient history retrieved successfully', 'data': {'patient': patient.to_dict(), 'appointments': data}})


# get doctor appointment history
@admin_bp.route('/doctors/<int:doctor_id>/history', methods=['GET'])
@admin_required
def get_doctor_history(doctor_id):
    doctor = Doctor.query.get(doctor_id)
    
    if doctor is None:
        return jsonify({'success': False, 'message': 'Doctor not found', 'errors': ['Doctor not found']}), 404
    
    appointments = Appointment.query.filter_by(doctor_id=doctor_id).order_by(Appointment.appointment_date.desc()).all()
    
    data = []
    for apt in appointments:
        data.append(apt.to_dict())
    
    return jsonify({'success': True, 'message': 'Doctor history retrieved successfully', 'data': {'doctor': doctor.to_dict(), 'appointments': data}})


# update patient details
@admin_bp.route('/patients/<int:patient_id>', methods=['PUT'])
@admin_required
def update_patient(patient_id):
    patient = Patient.query.get(patient_id)
    
    if patient is None:
        return jsonify({'success': False, 'message': 'Patient not found', 'errors': ['Patient not found']}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        patient.name = data['name']
    if 'phone' in data:
        patient.phone = data['phone']
    if 'age' in data:
        patient.age = data['age']
    if 'gender' in data:
        patient.gender = data['gender']
    if 'address' in data:
        patient.address = data['address']
    if 'medical_history' in data:
        patient.medical_history = data['medical_history']
    if 'emergency_contact' in data:
        patient.emergency_contact = data['emergency_contact']
        
    # Update email if provided (in User model)
    if 'email' in data and patient.user:
        # Check if email is taken by another user
        existing = User.query.filter(User.email == data['email'], User.id != patient.user_id).first()
        if existing:
             return jsonify({'success': False, 'message': 'Email already exists', 'errors': ['Email taken']}), 400
        patient.user.email = data['email']

    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Patient updated successfully', 'data': {'patient': patient.to_dict()}})
