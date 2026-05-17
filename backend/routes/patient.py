from flask import Blueprint, request, jsonify
from database import db
from models import User, Patient, Doctor, Appointment, Treatment, DoctorAvailability
from datetime import datetime, date, time, timedelta
from decorators import patient_required, patient_or_admin_required, get_current_user_id

patient_bp = Blueprint('patient', __name__)

# get patient dashboard stats
@patient_bp.route('/dashboard', methods=['GET'])
@patient_required
def get_dashboard():
    user_id = get_current_user_id()
    patient = Patient.query.filter_by(user_id=user_id).first()
    
    if patient is None:
        return jsonify({'success': False, 'message': 'Patient profile not found', 'errors': ['Profile not found']}), 404
    
    upcoming = Appointment.query.filter(
        Appointment.patient_id == patient.id,
        Appointment.appointment_date >= date.today(),
        Appointment.status == 'booked'
    ).count()
    
    total = Appointment.query.filter_by(patient_id=patient.id).count()
    
    doctors = db.session.query(Appointment.doctor_id).filter_by(
        patient_id=patient.id
    ).distinct().count()
    
    return jsonify({'success': True, 'message': 'Dashboard data retrieved', 'data': {'patient': patient.to_dict(), 'upcoming_appointments': upcoming, 'total_appointments': total, 'doctors_visited': doctors}})

# get all departments with active doctors
@patient_bp.route('/departments', methods=['GET'])
@patient_or_admin_required
def get_departments():
    # get unique specializations from active doctors
    from sqlalchemy import func
    
    specializations = db.session.query(
        Doctor.specialization,
        func.count(Doctor.id).label('doctor_count')
    ).filter_by(is_active=True).group_by(Doctor.specialization).all()
    
    data = []
    
    for spec, count in specializations:
        # get doctors with this specialization
        doctors = Doctor.query.filter_by(
            specialization=spec,
            is_active=True
        ).all()
        
        docs = []
        for doc in doctors:
            info = {
                'id': doc.id,
                'name': doc.name,
                'department': spec,
                'qualification': doc.qualification,
                'experience': doc.experience,
                'consultation_fee': doc.consultation_fee,
                'phone': doc.phone,
                'email': doc.user.email if doc.user else 'N/A'
            }
            docs.append(info)
        
        dept_info = {
            'id': spec.lower().replace(' ', '_'),
            'name': spec,
            'description': f'{spec} Department',
            'doctor_count': count,
            'doctors': docs
        }
        data.append(dept_info)
    
    return jsonify({'success': True, 'message': 'Departments retrieved successfully', 'data': {'departments': data}})

# get available slots for doctor on specific date
@patient_bp.route('/available-slots', methods=['GET'])
@patient_or_admin_required
def get_available_slots():
    doctor_id = request.args.get('doctor_id')
    date_str = request.args.get('date')
    
    if not doctor_id:
        return jsonify({'success': False, 'message': 'Doctor ID is required'}), 400
    
    if not date_str:
        return jsonify({'success': False, 'message': 'Date is required'}), 400
    
    try:
        apt_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # get current date and time (adjusted for IST - UTC+5:30)
    # This ensures that checks for "today" and current hour are accurate for the target user base
    now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    current_date = now.date()
    current_hour = now.hour
    
    # check if requested date is today
    is_today = (apt_date == current_date)
    
    # check doctor availability for this date
    morning_avail = DoctorAvailability.query.filter_by(
        doctor_id=doctor_id,
        availability_date=apt_date,
        slot_type='morning',
        is_available=True
    ).first()
    
    evening_avail = DoctorAvailability.query.filter_by(
        doctor_id=doctor_id,
        availability_date=apt_date,
        slot_type='evening',
        is_available=True
    ).first()
    
    slots = []
    
    def add_hourly_slots(start_hour, end_hour, slot_type):
        for h in range(start_hour, end_hour):
            slot_time = time(h, 0)
            
            # Check if this specific hour is booked
            booked = Appointment.query.filter_by(
                doctor_id=doctor_id,
                appointment_date=apt_date,
                appointment_time=slot_time,
                status='booked'
            ).first()
            
            # Check if passed (if today)
            # If current_hour is 9, the 9:00-10:00 slot is considered started/passed
            is_passed = is_today and current_hour >= h
            
            if not is_passed:
                # Format time for display (12-hour format)
                start_time_obj = datetime.strptime(f'{h}:00', '%H:%M')
                end_time_obj = datetime.strptime(f'{h+1}:00', '%H:%M')
                display_time = f"{start_time_obj.strftime('%I:%M %p')} - {end_time_obj.strftime('%I:%M %p')}"
                
                slots.append({
                    'slot_type': slot_type,
                    'time': f'{h:02d}:00-{h+1:02d}:00',
                    'display': display_time,
                    'status': 'booked' if booked else 'available',
                    'appointment_time': f'{h:02d}:00'
                })

    # morning slots (9:00-13:00) -> 9, 10, 11, 12
    if morning_avail:
        add_hourly_slots(9, 13, 'morning')
    
    # evening slots (15:00-19:00) -> 15, 16, 17, 18
    if evening_avail:
        add_hourly_slots(15, 19, 'evening')
    
    return jsonify({'success': True, 'message': 'Available slots retrieved successfully', 'data': {'slots': slots, 'date': apt_date.isoformat(), 'doctor_id': doctor_id}})

# get doctors list by department
@patient_bp.route('/doctors', methods=['GET'])
@patient_required
def get_doctors():
    try:
        dept = request.args.get('department')
        
        query = Doctor.query.filter_by(is_active=True)
        
        if dept:
            # filter by specialization
            query = query.filter(Doctor.specialization == dept)
        
        doctors = query.all()
        
        return jsonify({'success': True, 'message': 'Doctors retrieved successfully', 'data': {'doctors': [doc.to_dict() for doc in doctors]}})
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Failed to get doctors', 'errors': [str(e)]}), 500

# get patient's appointments
@patient_bp.route('/appointments', methods=['GET'])
@patient_required
def get_appointments():
    user_id = get_current_user_id()
    patient = Patient.query.filter_by(user_id=user_id).first()
    
    if patient is None:
        return jsonify({'success': False, 'message': 'Patient profile not found', 'errors': ['Profile not found']}), 404
    
    status = request.args.get('status')
    
    query = Appointment.query.filter_by(patient_id=patient.id)
    
    if status:
        query = query.filter_by(status=status)
    
    appointments = query.order_by(
        Appointment.appointment_date.desc(),
        Appointment.appointment_time.desc()
    ).all()
    
    return jsonify({'success': True, 'message': 'Appointments retrieved successfully', 'data': {'appointments': [apt.to_dict() for apt in appointments]}})

# book new appointment
@patient_bp.route('/appointments', methods=['POST'])
@patient_required
def book_appointment():
    user_id = get_current_user_id()
    patient = Patient.query.filter_by(user_id=user_id).first()
    
    if patient is None:
        return jsonify({'success': False, 'message': 'Patient profile not found'}), 404
    
    if patient.is_blacklisted:
        return jsonify({'success': False, 'message': 'Your account has been blacklisted. Please contact admin.'}), 403
    
    data = request.get_json()
    
    if not data.get('doctor_id'):
        return jsonify({'success': False, 'message': 'Doctor ID is required'}), 400
    
    if not data.get('appointment_date'):
        return jsonify({'success': False, 'message': 'Appointment date is required'}), 400
    
    if not data.get('appointment_time'):
        return jsonify({'success': False, 'message': 'Appointment time is required'}), 400
    
    doctor = Doctor.query.get(data['doctor_id'])
    if doctor is None or not doctor.is_active:
        return jsonify({'success': False, 'message': 'Doctor not found or inactive'}), 404
    
    try:
        apt_date = datetime.strptime(data['appointment_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid date format'}), 400
    
    # validate date is not in the past
    # Use IST adjusted time
    now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    today = now.date()
    current_hour = now.hour
    current_minute = now.minute
    
    if apt_date < today:
        return jsonify({'success': False, 'message': 'Cannot book appointments for past dates'}), 400
    
    # parse time to determine slot type
    time_str = data['appointment_time']
    if '-' in time_str:
        start = time_str.split('-')[0].strip()
        apt_time = datetime.strptime(start, '%H:%M').time()
    else:
        apt_time = datetime.strptime(time_str, '%H:%M').time()
    
    # determine slot type and validate hour
    hour = apt_time.hour
    if 9 <= hour < 13:
        slot_type = 'morning'
    elif 15 <= hour < 19:
        slot_type = 'evening'
    else:
        return jsonify({'success': False, 'message': 'Invalid time slot. Only Morning (09:00-13:00) and Evening (15:00-19:00) slots are available.'}), 400
    
    # if booking for today, check if the slot time has already passed
    if apt_date == today:
        if current_hour >= hour:
            return jsonify({'success': False, 'message': f'Cannot book this slot for today as it has already passed'}), 400
    
    # check if doctor has set this slot as available
    availability = DoctorAvailability.query.filter_by(
        doctor_id=data['doctor_id'],
        availability_date=apt_date,
        slot_type=slot_type,
        is_available=True
    ).first()
    
    if not availability:
        return jsonify({'success': False, 'message': f'Doctor is not available for {slot_type} slot on {apt_date}'}), 400
    
    # check if slot already booked
    existing_booking = Appointment.query.filter_by(
        doctor_id=data['doctor_id'],
        appointment_date=apt_date,
        appointment_time=apt_time,
        status='booked'
    ).first()
    
    if existing_booking:
        return jsonify({'success': False, 'message': 'This slot is already booked'}), 400
    
    # check if patient already has appointment at this time
    patient_conflict = Appointment.query.filter_by(
        patient_id=patient.id,
        appointment_date=apt_date,
        appointment_time=apt_time,
        status='booked'
    ).first()
    
    if patient_conflict:
        return jsonify({'success': False, 'message': 'You already have an appointment at this time'}), 400
    
    # create new appointment
    appointment = Appointment(
        doctor_id=data['doctor_id'],
        patient_id=patient.id,
        appointment_date=apt_date,
        appointment_time=apt_time,
        status='booked',
        notes=data.get('notes', '')
    )
    
    db.session.add(appointment)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Appointment booked successfully', 'data': {'appointment': appointment.to_dict()}})

# cancel appointment
@patient_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@patient_required
def cancel_appointment(appointment_id):
    user_id = get_current_user_id()
    patient = Patient.query.filter_by(user_id=user_id).first()
    
    if patient is None:
        return jsonify({'success': False, 'message': 'Patient profile not found', 'errors': ['Profile not found']}), 404
    
    appointment = Appointment.query.filter_by(
        id=appointment_id,
        patient_id=patient.id
    ).first()
    
    if appointment is None:
        return jsonify({'success': False, 'message': 'Appointment not found', 'errors': ['Appointment not found']}), 404
    
    if appointment.status != 'booked':
        return jsonify({'success': False, 'message': 'Cannot cancel this appointment', 'errors': ['Invalid status']}), 400
    
    appointment.status = 'cancelled'
    appointment.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Appointment cancelled successfully', 'data': {}})

# get patient medical history with treatments
@patient_bp.route('/history', methods=['GET'])
@patient_required
def get_history():
    user_id = get_current_user_id()
    patient = Patient.query.filter_by(user_id=user_id).first()
    
    if patient is None:
        return jsonify({'success': False, 'message': 'Patient profile not found', 'errors': ['Profile not found']}), 404
    
    treatments = db.session.query(Treatment).join(Appointment).filter(
        Appointment.patient_id == patient.id
    ).order_by(Treatment.created_at.desc()).all()
    
    # include appointment and doctor info
    treatment_data = []
    for treatment in treatments:
        treatment_dict = treatment.to_dict()
        
        # get appointment details
        appointment = Appointment.query.get(treatment.appointment_id)
        if appointment:
            treatment_dict['appointment'] = {
                'id': appointment.id,
                'appointment_date': appointment.appointment_date.isoformat() if appointment.appointment_date else None,
                'appointment_time': str(appointment.appointment_time) if appointment.appointment_time else None,
                'status': appointment.status
            }
            
            # get doctor info
            if appointment.doctor:
                treatment_dict['doctor'] = {
                    'id': appointment.doctor.id,
                    'name': appointment.doctor.name,
                    'specialization': appointment.doctor.specialization,
                    'department': appointment.doctor.specialization
                }
            else:
                treatment_dict['doctor'] = None
        
        treatment_data.append(treatment_dict)
    
    return jsonify({'success': True, 'message': 'Patient history retrieved successfully', 'data': {'treatments': treatment_data}})

# get doctor availability schedule
@patient_bp.route('/doctor/availability/<int:doctor_id>', methods=['GET'])
@patient_required
def get_doctor_availability(doctor_id):
    doctor = Doctor.query.get(doctor_id)
    
    if doctor is None or not doctor.is_active:
        return jsonify({'success': False, 'message': 'Doctor not found or inactive', 'errors': ['Invalid doctor']}), 404
    
    availability = DoctorAvailability.query.filter_by(
        doctor_id=doctor_id,
        is_available=True
    ).all()
    
    return jsonify({'success': True, 'message': 'Doctor availability retrieved successfully', 'data': {'doctor': doctor.to_dict(), 'availability': [avail.to_dict() for avail in availability]}})

# export patient history as csv via email
@patient_bp.route('/export-history', methods=['POST'])
@patient_required
def export_patient_history():
    try:
        user_id = get_current_user_id()
        patient = Patient.query.filter_by(user_id=user_id).first()
        
        if not patient:
            return jsonify({'success': False, 'message': 'Patient profile not found', 'errors': ['Profile not found']}), 404
        
        from celery_tasks import export_patient_history_csv
        task = export_patient_history_csv.delay(patient.id)
        
        return jsonify({'success': True, 'message': 'CSV export started. You will be notified when ready.', 'data': {'task_id': task.id}})
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Failed to start CSV export', 'errors': [str(e)]}), 500

# update patient profile information
@patient_bp.route('/profile', methods=['PUT'])
@patient_required
def update_patient_profile():
    try:
        user_id = get_current_user_id()
        patient = Patient.query.filter_by(user_id=user_id).first()
        
        if not patient:
            return jsonify({'success': False, 'message': 'Patient profile not found', 'errors': ['Profile not found']}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided', 'errors': ['Missing data']}), 400
        
        if 'name' in data:
            patient.name = data['name']
        if 'phone' in data:
            patient.phone = data['phone']
        if 'address' in data:
            patient.address = data['address']
        if 'age' in data:
            patient.age = data['age']
        if 'gender' in data:
            patient.gender = data['gender']
        if 'medical_history' in data:
            patient.medical_history = data['medical_history']
        if 'emergency_contact' in data:
            patient.emergency_contact = data['emergency_contact']
        
        if 'email' in data:
            patient.user.email = data['email']
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Profile updated successfully', 'data': {'patient': patient.to_dict()}})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to update profile', 'errors': [str(e)]}), 500
