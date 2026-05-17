from flask import Blueprint, request, jsonify
from database import db
from models import User, Doctor, Patient, Appointment, Treatment, DoctorAvailability
from datetime import datetime, date, time, timedelta
from decorators import doctor_required, get_current_user_id

doctor_bp = Blueprint('doctor', __name__)

# get doctor dashboard stats
@doctor_bp.route('/dashboard', methods=['GET'])
@doctor_required
def get_dashboard():
    user_id = get_current_user_id()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    
    if doctor is None:
        return jsonify({'success': False, 'message': 'Doctor profile not found', 'errors': ['Profile not found']}), 404
    
    # Get total appointments for this doctor (excluding available slots)
    total_appointments = Appointment.query.filter(
        Appointment.doctor_id == doctor.id,
        Appointment.status.in_(['booked', 'cancelled', 'completed'])
    ).count()

    total_patients = db.session.query(Appointment.patient_id).filter_by(
        doctor_id=doctor.id
    ).distinct().count()

    today_appointments = Appointment.query.filter_by(
        doctor_id=doctor.id,
        appointment_date=date.today()
    ).count()
    
    return jsonify({'success': True, 'message': 'Dashboard data retrieved', 'data': {'doctor': doctor.to_dict(), 'today_appointments': today_appointments, 'total_appointments': total_appointments, 'total_patients': total_patients}})

# get patient history with appointments and treatments
@doctor_bp.route('/patient-history/<int:patient_id>', methods=['GET'])
@doctor_required
def get_patient_history_details(patient_id):
    user_id = get_current_user_id()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    
    if doctor is None:
        return jsonify({"error": "Doctor not found"}), 404
    
    patient = Patient.query.get(patient_id)
    
    if patient is None:
        return jsonify({"error": "Patient not found"}), 404
    
    appointments = Appointment.query.filter_by(
        patient_id=patient_id
    ).filter(Appointment.status.in_(['booked', 'completed', 'cancelled', 'canceled'])).order_by(Appointment.appointment_date.desc()).all()
    
    history = []
    for apt in appointments:
        formatted_date = apt.appointment_date.strftime('%Y-%m-%d')
        formatted_time = apt.appointment_time.strftime('%H:%M')
        
        treatment = None
        if apt.treatments:
            latest = apt.treatments[-1]
            treatment = {
                'id': latest.id,
                'visit_type': latest.visit_type,
                'diagnosis': latest.diagnosis,
                'prescription': latest.prescription,
                'notes': latest.treatment_notes
            }
        
        apt_doctor = apt.doctor if apt.doctor else None
        doc_info = {
            'name': apt_doctor.name if apt_doctor else 'Unknown',
            'specialization': apt_doctor.specialization if apt_doctor else 'Unknown'
        }
        
        record = {
            'id': apt.id,
            'appointment_date': formatted_date,
            'appointment_time': formatted_time,
            'status': apt.status,
            'doctor': doc_info,
            'treatment': treatment
        }
        history.append(record)
    
    email = patient.user.email if patient.user else 'Not available'
    
    data = {
        'id': patient.id,
        'name': patient.name,
        'email': email,
        'phone': patient.phone,
        'address': patient.address,
        'age': patient.age,
        'gender': patient.gender,
        'medical_history': patient.medical_history,
        'appointments': history
    }
    
    return jsonify(data)

# get doctor's appointments with filters
@doctor_bp.route('/appointments', methods=['GET'])
@doctor_required
def get_appointments():
    user_id = get_current_user_id()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    
    if doctor is None:
        return jsonify({'success': False, 'message': 'Doctor profile not found', 'errors': ['Profile not found']}), 404
    
    date_filter = request.args.get('date')
    status_filter = request.args.get('status')
    time_filter = request.args.get('time_filter')
    
    query = Appointment.query.filter_by(doctor_id=doctor.id)
    query = query.filter(Appointment.status.in_(['booked', 'canceled', 'cancelled', 'completed']))
    
    if time_filter == 'today':
        query = query.filter_by(appointment_date=date.today())
    elif time_filter == 'upcoming':
        query = query.filter(Appointment.appointment_date >= date.today())
        query = query.filter(Appointment.status.in_(['booked']))
    elif time_filter == 'completed':
        query = query.filter(Appointment.status == 'completed')
    else:
        from datetime import timedelta
        thirty_days_ago = date.today() - timedelta(days=30)
        query = query.filter(Appointment.appointment_date >= thirty_days_ago)
    
    if date_filter:
        filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
        query = query.filter_by(appointment_date=filter_date)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    appointments = query.order_by(
        Appointment.appointment_date.asc(),
        Appointment.appointment_time.asc()
    ).all()
    
    data = []
    for apt in appointments:
        data.append(apt.to_dict())
    
    return jsonify({'success': True, 'message': 'Appointments retrieved successfully', 'data': {'appointments': data}})

# get all assigned patients
@doctor_bp.route('/patients', methods=['GET'])
@doctor_required
def get_patients():
    user_id = get_current_user_id()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    
    if doctor is None:
        return jsonify({'success': False, 'message': 'Doctor profile not found', 'errors': ['Profile not found']}), 404
    
    patients = db.session.query(Patient).join(Appointment).filter(
        Appointment.doctor_id == doctor.id
    ).distinct().all()
    
    data = []
    for p in patients:
        data.append(p.to_dict())
    
    return jsonify({'success': True, 'message': 'Patients retrieved successfully', 'data': {'patients': data}})

# update appointment status (complete, cancel, etc)
@doctor_bp.route('/appointments/<int:appointment_id>/status', methods=['PUT'])
@doctor_required
def update_appointment_status(appointment_id):
    user_id = get_current_user_id()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    
    if doctor is None:
        return jsonify({'success': False, 'message': 'Doctor profile not found', 'errors': ['Profile not found']}), 404
    
    appointment = Appointment.query.filter_by(id=appointment_id, doctor_id=doctor.id).first()
    
    if appointment is None:
        return jsonify({'success': False, 'message': 'Appointment not found', 'errors': ['Appointment not found']}), 404
    
    data = request.get_json()
    status = data.get('status')
    
    valid = ['completed', 'cancelled', 'booked']
    if status not in valid:
        return jsonify({'success': False, 'message': 'Invalid status', 'errors': ['Status must be completed, cancelled, or booked']}), 400
    
    appointment.status = status
    appointment.updated_at = datetime.utcnow()
    
    if 'notes' in data:
        appointment.notes = data['notes']
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': f'Appointment marked as {status}', 'data': {'appointment': appointment.to_dict()}})

# add treatment details for an appointment
@doctor_bp.route('/patient-history', methods=['POST'])
@doctor_required
def add_patient_history():
    user_id = get_current_user_id()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    
    if doctor is None:
        return jsonify({'success': False, 'message': 'Doctor profile not found', 'errors': ['Profile not found']}), 404
    
    data = request.get_json()
    apt_id = data.get('appointment_id')
    
    if not apt_id:
        return jsonify({'success': False, 'message': 'Appointment ID is required', 'errors': ['Missing appointment_id']}), 400
    
    appointment = Appointment.query.filter_by(
        id=apt_id,
        doctor_id=doctor.id
    ).first()
    
    if appointment is None:
        return jsonify({'success': False, 'message': 'Appointment not found', 'errors': ['Appointment not found']}), 404
    
    treatment = Treatment(
        appointment_id=apt_id,
        diagnosis=data.get('diagnosis', ''),
        prescription=data.get('prescription', ''),
        visit_type=data.get('visit_type', 'consultation'),
        treatment_notes=data.get('treatment_notes', '')
    )
    
    db.session.add(treatment)
    
    appointment.status = 'completed'
    appointment.notes = data.get('notes', '')
    appointment.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Patient history updated successfully', 'data': {'treatment': treatment.to_dict(), 'appointment': appointment.to_dict()}})

# get doctor's 7-day availability schedule
@doctor_bp.route('/availability', methods=['GET'])
@doctor_required
def get_availability():
    from datetime import date, timedelta
    
    user_id = get_current_user_id()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if doctor is None:
        return jsonify({'success': False, 'message': 'Doctor profile not found', 'errors': ['Profile not found']}), 404
    
    # next 7 days
    today = date.today()
    availability_days = []
    day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    for i in range(7):
        current_date = today + timedelta(days=i)
        day_name = day_names[current_date.weekday()] + ', ' + current_date.strftime('%b %d')
        
        # check availability for this date
        morning_avail = DoctorAvailability.query.filter_by(
            doctor_id=doctor.id,
            availability_date=current_date,
            slot_type='morning'
        ).first()
        
        evening_avail = DoctorAvailability.query.filter_by(
            doctor_id=doctor.id,
            availability_date=current_date,
            slot_type='evening'
        ).first()
        
        availability_days.append({
            'date': current_date.isoformat(),
            'day_name': day_name,
            'morning_available': morning_avail.is_available if morning_avail else False,
            'evening_available': evening_avail.is_available if evening_avail else False
        })
    
    return jsonify({'success': True, 'message': 'Availability retrieved successfully', 'data': {'availability': availability_days}})

# set doctor availability for specific date/slot combinations
@doctor_bp.route('/set-slots', methods=['POST'])
@doctor_required
def set_availability_slots():
    user_id = get_current_user_id()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    
    if doctor is None:
        return jsonify({'success': False, 'message': 'Doctor profile not found'}), 404
    
    data = request.get_json()
    slots = data.get('slots', [])
    
    if not slots:
        return jsonify({'success': False, 'message': 'No slots provided'}), 400
    
    try:
        updated_count = 0
        created_count = 0
        
        for slot_data in slots:
            date_str = slot_data.get('date')
            slot_type = slot_data.get('slot_type')
            is_available = slot_data.get('is_available', False)
            
            # parse date
            availability_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # find or create record
            availability = DoctorAvailability.query.filter_by(
                doctor_id=doctor.id,
                availability_date=availability_date,
                slot_type=slot_type
            ).first()
            
            if availability:
                # update existing
                availability.is_available = is_available
                updated_count += 1
            else:
                # create new
                availability = DoctorAvailability(
                    doctor_id=doctor.id,
                    availability_date=availability_date,
                    slot_type=slot_type,
                    is_available=is_available
                )
                db.session.add(availability)
                created_count += 1
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': f'Availability updated successfully ({created_count} created, {updated_count} updated)'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error updating availability: {str(e)}'}), 500

# update doctor profile information
@doctor_bp.route('/profile', methods=['PUT'])
@doctor_required
def update_doctor_profile():
    try:
        user_id = get_current_user_id()
        doctor = Doctor.query.filter_by(user_id=user_id).first()
        
        if not doctor:
            return jsonify({'success': False, 'message': 'Doctor profile not found', 'errors': ['Profile not found']}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided', 'errors': ['Missing data']}), 400
        
        if 'name' in data:
            doctor.name = data['name']
        if 'specialization' in data:
            doctor.specialization = data['specialization']
        if 'department_id' in data:
            doctor.department_id = data['department_id']
        if 'experience' in data:
            doctor.experience = data['experience']
        if 'qualification' in data:
            doctor.qualification = data['qualification']
        if 'phone' in data:
            doctor.phone = data['phone']
        if 'consultation_fee' in data:
            doctor.consultation_fee = data['consultation_fee']
        
        if 'email' in data:
            doctor.user.email = data['email']
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Profile updated successfully', 'data': {'doctor': doctor.to_dict()}})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to update profile', 'errors': [str(e)]}), 500

# get doctor's available appointment slots
@doctor_bp.route('/available-slots', methods=['GET'])
@doctor_required
def get_available_slots():
    user_id = get_current_user_id()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    
    if doctor is None:
        return jsonify({'success': False, 'message': 'Doctor profile not found', 'errors': ['Profile not found']}), 404
    
    try:
        from datetime import date
        slots = Appointment.query.filter_by(
            doctor_id=doctor.id,
            status='available'
        ).filter(Appointment.appointment_date >= date.today()).order_by(
            Appointment.appointment_date.asc(),
            Appointment.appointment_time.asc()
        ).all()
        
        data = []
        for slot in slots:
            data.append({
                'id': slot.id,
                'date': slot.appointment_date.strftime('%Y-%m-%d'),
                'time': slot.appointment_time.strftime('%H:%M'),
                                'formatted_display': f"{slot.appointment_date.strftime('%Y-%m-%d')} {slot.appointment_time.strftime('%H:%M')}"
            })
        
        return jsonify({'success': True, 'message': 'Available slots retrieved successfully', 'data': {'slots': data, 'total_count': len(data)}})
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Failed to retrieve available slots', 'errors': [str(e)]}), 500
