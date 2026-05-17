from .imports import celery
from .email_template import get_email_template
from flask_mail import Message
from models import Appointment
from datetime import date

@celery.task
def daily_reminders():
    from app import app, mail
    with app.app_context():
        today = date.today()
        appts = Appointment.query.filter_by(appointment_date=today, status='booked').all()
        for appt in appts:
            if not (appt.patient and appt.patient.user and appt.doctor):
                continue
            patient_email = appt.patient.user.email
            patient_name = appt.patient.name
            doctor_name = appt.doctor.name
            appointment_time = appt.appointment_time
            
            content = f"""
                <p>Hi {patient_name},</p>
                <p>You have an appointment today with <strong>Dr. {doctor_name}</strong> at <strong>{appointment_time}</strong>.</p>
                <p>Please arrive 10 minutes early to complete any necessary paperwork.</p>
            """
            html = get_email_template("Appointment Reminder", content)
            
            msg = Message(subject=f"Appointment Reminder - {today}", recipients=[patient_email])
            msg.html = html
            mail.send(msg)
        return f"Sent {len(appts)} reminders for {today}"
