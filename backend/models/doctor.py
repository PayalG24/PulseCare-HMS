from datetime import datetime
from database import db

class Doctor(db.Model):
    __tablename__ = 'doctors'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    experience = db.Column(db.Integer)
    qualification = db.Column(db.String(200))
    phone = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True)
    consultation_fee = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # relationships
    appointments = db.relationship('Appointment', backref='doctor', lazy=True)
    availability = db.relationship('DoctorAvailability', backref='doctor', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'specialization': self.specialization,
            'experience': self.experience,
            'qualification': self.qualification,
            'phone': self.phone,
            'is_active': self.is_active,
            'consultation_fee': self.consultation_fee,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': self.user.to_dict() if self.user else None
        }
    
    def __repr__(self):
        return f'<Doctor {self.name}>'

class DoctorAvailability(db.Model):
    __tablename__ = 'doctor_availability'
    
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    availability_date = db.Column(db.Date, nullable=False)
    slot_type = db.Column(db.String(20), nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('doctor_id', 'availability_date', 'slot_type', name='unique_doctor_date_slot'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'doctor_id': self.doctor_id,
            'availability_date': self.availability_date.isoformat() if self.availability_date else None,
            'slot_type': self.slot_type,
            'is_available': self.is_available,
            'time_range': '9:00 AM - 1:00 PM' if self.slot_type == 'morning' else '3:00 PM - 7:00 PM'
        }
    
    def __repr__(self):
        return f'<Availability {self.doctor_id} {self.availability_date} {self.slot_type}>'
