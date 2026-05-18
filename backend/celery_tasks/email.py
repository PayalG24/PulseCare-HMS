from .imports import celery
from .email_template import get_email_template
from flask_mail import Message
from backend.models import Appointment, Doctor
from backend.database import db

@celery.task
def booking_confirmation(appointment_id):
    from app import app, mail
    with app.app_context():
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return f"Appointment {appointment_id} not found"
        
        patient = appointment.patient
        doctor = appointment.doctor
        
        if not (patient and patient.user and doctor and doctor.user):
            return "Missing user details for email"

        # Email to Patient
        patient_content = f"""
            <p>Hi {patient.name},</p>
            <p>Your appointment has been successfully booked.</p>
            <p><strong>Doctor:</strong> Dr. {doctor.name}</p>
            <p><strong>Date:</strong> {appointment.appointment_date}</p>
            <p><strong>Time:</strong> {appointment.appointment_time}</p>
            <p>Please arrive 10 minutes early.</p>
        """
        patient_html = get_email_template("Appointment Confirmation", patient_content)
        msg_patient = Message(
            subject="Appointment Confirmation - PulseCare",
            recipients=[patient.user.email],
            html=patient_html
        )
        mail.send(msg_patient)

        # Email to Doctor
        doctor_content = f"""
            <p>Hi Dr. {doctor.name},</p>
            <p>A new appointment has been booked.</p>
            <p><strong>Patient:</strong> {patient.name}</p>
            <p><strong>Date:</strong> {appointment.appointment_date}</p>
            <p><strong>Time:</strong> {appointment.appointment_time}</p>
        """
        doctor_html = get_email_template("New Appointment Booking", doctor_content)
        msg_doctor = Message(
            subject="New Appointment Booking - PulseCare",
            recipients=[doctor.user.email],
            html=doctor_html
        )
        mail.send(msg_doctor)
        
        return f"Sent booking confirmation for Appointment {appointment_id}"

@celery.task
def booking_cancellation(appointment_id):
    from app import app, mail
    with app.app_context():
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return f"Appointment {appointment_id} not found"
        
        patient = appointment.patient
        doctor = appointment.doctor
        
        if not (patient and patient.user and doctor and doctor.user):
            return "Missing user details for email"

        # Email to Patient
        patient_content = f"""
            <p>Hi {patient.name},</p>
            <p>Your appointment has been cancelled.</p>
            <p><strong>Doctor:</strong> Dr. {doctor.name}</p>
            <p><strong>Date:</strong> {appointment.appointment_date}</p>
            <p><strong>Time:</strong> {appointment.appointment_time}</p>
        """
        patient_html = get_email_template("Appointment Cancellation", patient_content)
        msg_patient = Message(
            subject="Appointment Cancellation - PulseCare",
            recipients=[patient.user.email],
            html=patient_html
        )
        mail.send(msg_patient)

        # Email to Doctor
        doctor_content = f"""
            <p>Hi Dr. {doctor.name},</p>
            <p>An appointment has been cancelled.</p>
            <p><strong>Patient:</strong> {patient.name}</p>
            <p><strong>Date:</strong> {appointment.appointment_date}</p>
            <p><strong>Time:</strong> {appointment.appointment_time}</p>
        """
        doctor_html = get_email_template("Appointment Cancellation", doctor_content)
        msg_doctor = Message(
            subject="Appointment Cancellation - PulseCare",
            recipients=[doctor.user.email],
            html=doctor_html
        )
        mail.send(msg_doctor)
        
        return f"Sent cancellation emails for Appointment {appointment_id}"

@celery.task
def doctor_login(doctor_id, password):
    from app import app, mail
    with app.app_context():
        doctor = Doctor.query.get(doctor_id)
        if not doctor or not doctor.user:
            return f"Doctor {doctor_id} not found"

        content = f"""
            <p>Hi Dr. {doctor.name},</p>
            <p>Your account has been created on PulseCare.</p>
            <p><strong>Username:</strong> {doctor.user.username}</p>
            <p><strong>Password:</strong> {password}</p>
            <p>Please login and change your password immediately.</p>
        """
        html = get_email_template("Welcome to PulseCare", content)
        
        msg = Message(
            subject="Your PulseCare Account Details",
            recipients=[doctor.user.email],
            html=html
        )
        mail.send(msg)
        return f"Sent login details to Doctor {doctor_id}"
