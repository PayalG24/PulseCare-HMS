from datetime import datetime
from database import db

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    appointment_date = db.Column(db.Date, nullable=False)
    appointment_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), default='available')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('doctor_id', 'appointment_date', 'appointment_time', name='unique_doctor_slot'),
    )
    
    # relationships
    treatments = db.relationship('Treatment', backref='appointment', lazy=True)
    
    def to_dict(self):
        data = {
            'id': self.id,
            'patient_id': self.patient_id,
            'doctor_id': self.doctor_id,
            'appointment_date': self.appointment_date.strftime('%Y-%m-%d') if self.appointment_date else None,
            'appointment_time': self.appointment_time.strftime('%H:%M') if self.appointment_time else None,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None
        }
        
        # add patient info if exists
        if self.patient:
            data['patient_name'] = self.patient.name
            data['patient_phone'] = self.patient.phone
            data['patient'] = {
                'id': self.patient.id,
                'name': self.patient.name,
                'phone': self.patient.phone,
                'age': self.patient.age,
                'gender': self.patient.gender,
                'address': self.patient.address,
                'medical_history': self.patient.medical_history
            }
            
        # add doctor info if exists
        if self.doctor:
            data['doctor_name'] = self.doctor.name
            data['doctor_specialization'] = self.doctor.specialization
            data['consultation_fee'] = self.doctor.consultation_fee
            data['doctor'] = {
                'id': self.doctor.id,
                'name': self.doctor.name,
                'specialization': self.doctor.specialization,
                'department': self.doctor.specialization,
                'qualification': self.doctor.qualification,
                'consultation_fee': self.doctor.consultation_fee
            }
        
        # add treatment if exists
        if self.treatments and len(self.treatments) > 0:
            treatment = self.treatments[0]
            data['treatment'] = {
                'id': treatment.id,
                'visit_type': treatment.visit_type,
                'diagnosis': treatment.diagnosis,
                'prescription': treatment.prescription,
                'treatment_notes': treatment.treatment_notes,
                'created_at': treatment.created_at.strftime('%Y-%m-%d %H:%M:%S') if treatment.created_at else None
            }
            
        return data
    
    def __repr__(self):
        return f'<Appointment {self.id} - {self.appointment_date} {self.appointment_time}>'

