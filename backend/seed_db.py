from app import app
from database import db
from models import User, Doctor, Patient, DoctorAvailability, Appointment, Treatment
from werkzeug.security import generate_password_hash
from datetime import date, timedelta, time as datetime_time, datetime

# create admin user
def create_admin_user():
    existing_admin = User.query.filter_by(username='admin').first()
    if existing_admin is None:
        admin_user = User(
            username='admin',
            email='admin@PulseCare.in',
            password_hash=generate_password_hash('admin'),
            role='admin'
        )
        db.session.add(admin_user)
        db.session.commit()
        print("✓ Admin user created")

# create sample doctors account
def create_sample_doctors():
    existing_doctors = Doctor.query.first()
    if existing_doctors is None:
        sample_doctors_list = [
            {
                'username': 'ajay',
                'email': 'ajay.kumar@PulseCare.in',
                'password': 'ajay.kumar123',
                'name': 'Ajay Kumar',
                'specialization': 'Cardiology',
                'experience': 14,
                'qualification': 'MD, DM (Cardiology)',
                'phone': '+91-9876543210',
                'consultation_fee': 1200
            },
            {
                'username': 'rajesh',
                'email': 'rajesh.verma@PulseCare.in',
                'password': 'rajesh',
                'name': 'Rajesh Verma',
                'specialization': 'Neurology',
                'experience': 12,
                'qualification': 'MBBS, MD (Neurology)',
                'phone': '+91-9876543212',
                'consultation_fee': 1400
            }
        ]

        for d in sample_doctors_list:
            user = User(
                username=d['username'],
                email=d['email'],
                password_hash=generate_password_hash(d['password']),
                role='doctor',
                is_active=True
            )
            db.session.add(user)
            db.session.flush()

            doctor = Doctor(
                user_id=user.id,
                name=d['name'],
                specialization=d['specialization'],
                experience=d['experience'],
                qualification=d['qualification'],
                phone=d['phone'],
                consultation_fee=d['consultation_fee'],
                is_active=True
            )
            db.session.add(doctor)

        db.session.commit()
        print("✓ sample doctors created")

# create 7-day availability (morning/evening slots)
def create_sample_availability():
    DoctorAvailability.query.delete()
    db.session.commit()

    doctors = Doctor.query.all()
    today = date.today()

    for doc in doctors:
        for i in range(7):
            current_date = today + timedelta(days=i)

            # morning slot
            morning = DoctorAvailability(
                doctor_id=doc.id,
                availability_date=current_date,
                slot_type='morning',
                is_available=True
            )
            db.session.add(morning)

            # evening slot
            evening = DoctorAvailability(
                doctor_id=doc.id,
                availability_date=current_date,
                slot_type='evening',
                is_available=True
            )
            db.session.add(evening)

    db.session.commit()
    print("✓ 7-day availability created (8 slots/day)")

# create sample patients
def create_sample_patients():
    existing_patients = Patient.query.first()
    if existing_patients is None:
        sample_patients_list = [
            {
                'username': 'arjun',
                'email': 'arjun.patel@gmail.com',
                'password': 'arjun',
                'name': 'Arjun Patel',
                'phone': '+91-9100001001',
                'address': 'Flat 201, Andheri East, Mumbai',
                'age': 37,
                'gender': 'Male',
                'medical_history': 'Hypertension'
            },
            {
                'username': 'vikram',
                'email': 'vikram.singh@gmail.com',
                'password': 'vikram',
                'name': 'Vikram Singh',
                'phone': '+91-9100001003',
                'address': '12, MG Road, Bengaluru',
                'age': 29,
                'gender': 'Male',
                'medical_history': 'Asthma'
            }
        ]

        for p in sample_patients_list:
            user = User(
                username=p['username'],
                email=p['email'],
                password_hash=generate_password_hash(p['password']),
                role='patient',
                is_active=True
            )
            db.session.add(user)
            db.session.flush()

            patient = Patient(
                user_id=user.id,
                name=p['name'],
                phone=p['phone'],
                address=p['address'],
                age=p['age'],
                gender=p['gender'],
                medical_history=p['medical_history'],
                is_blacklisted=False
            )
            db.session.add(patient)

        db.session.commit()
        print("✓ sample patients created")

# run initialization
if __name__ == '__main__':
    print("Initializing database...\n")

    try:
        with app.app_context():
            db.create_all()
            print("✓ Tables created")

            create_admin_user()
            create_sample_doctors()
            create_sample_availability()
            create_sample_patients()

            print("\n✓ Database seeding completed successfully!")

    except Exception as e:
        print("Error while seeding database:")
        print(e)