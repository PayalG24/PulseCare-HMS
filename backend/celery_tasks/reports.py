from .imports import celery
from .email_template import get_email_template
from flask_mail import Message
from models import Doctor, Appointment, Treatment, Patient
from datetime import datetime
import os
import csv

@celery.task
def monthly_report():
    from app import app, mail
    with app.app_context():
        now = datetime.now()
        first_day_current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_day_current = now.replace(hour=23, minute=59, second=59, microsecond=999999)

        docs = Doctor.query.filter_by(is_active=True).all()
        sent = 0
        for doc in docs:
            if not doc.user:
                continue
            appts = Appointment.query.filter(
                Appointment.doctor_id == doc.id,
                Appointment.appointment_date >= first_day_current.date(),
                Appointment.appointment_date <= last_day_current.date(),
                Appointment.status == 'completed'
            ).all()
            treatments = Treatment.query.join(Appointment).filter(
                Appointment.doctor_id == doc.id,
                Treatment.created_at >= first_day_current,
                Treatment.created_at <= last_day_current
            ).all()

            # html report
            content = f"""
                <p><strong>Dr. {doc.name}</strong> - {doc.specialization}</p>
                <p>Period: {first_day_current.strftime('%B %Y')}</p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Total Appointments:</strong> {len(appts)}</p>
                    <p style="margin: 5px 0;"><strong>Total Treatments:</strong> {len(treatments)}</p>
                </div>

                <h3>Recent Appointments</h3>
                <table>
                    <tr>
                        <th>Date</th>
                        <th>Patient</th>
                        <th>Time</th>
                    </tr>"""
            for a in appts[:10]:
                pname = a.patient.name if a.patient else 'N/A'
                content += f"<tr><td>{a.appointment_date}</td><td>{pname}</td><td>{a.appointment_time}</td></tr>"
            content += "</table>"
            
            html = get_email_template("Monthly Activity Report", content)

            doctor_email = doc.user.email
            msg = Message(subject=f"Monthly Activity Report - {first_day_current.strftime('%B %Y')}", recipients=[doctor_email])
            msg.html = html
            mail.send(msg)
            sent += 1
        return f"Sent {sent} monthly reports for {first_day_current.strftime('%B %Y')}"

@celery.task
def patient_history_export(patient_id):
    from app import app, mail
    with app.app_context():
        patient = Patient.query.get(patient_id)
        if not patient or not patient.user:
            return f"Patient {patient_id} not found or has no user account"

        treatments = Treatment.query.join(Appointment).filter(
            Appointment.patient_id == patient_id
        ).order_by(Treatment.created_at.desc()).all()

        # Use absolute path relative to backend root or a specific exports folder
        # Assuming backend/exports exists or should be created
        exports_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'exports')
        os.makedirs(exports_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"patient_{patient_id}_history_{timestamp}.csv"
        filepath = os.path.join(exports_dir, filename)

        # write csv file
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Sr. No', 'Date', 'Doctor', 'Visit Type', 'Diagnosis', 'Medicines', 'Treatment Notes'])
            for idx, t in enumerate(treatments, 1):
                doctor_name = t.appointment.doctor.name if t.appointment and t.appointment.doctor else 'N/A'
                appt_date = str(t.appointment.appointment_date) if t.appointment else 'N/A'
                visit_type = t.visit_type or 'General'
                diagnosis = t.diagnosis or 'N/A'
                medicines = t.prescription or 'N/A'
                notes = t.treatment_notes or 'N/A'
                writer.writerow([idx, appt_date, doctor_name, visit_type, diagnosis, medicines, notes])

        # send email with attachment
        patient_email = patient.user.email
        
        content = f"""
            <p>Hi {patient.name},</p>
            <p>Your medical history export has been generated successfully.</p>
            <p>Please find the attached CSV file containing your complete medical records.</p>
            <p>If you did not request this export, please contact support immediately.</p>
        """
        html = get_email_template("Medical History Export", content)
        
        msg = Message(subject='Your Medical History Export is Ready', recipients=[patient_email])
        msg.html = html
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        msg.attach(filename, 'text/csv', content)
        mail.send(msg)
        return f"Exported {len(treatments)} records to {filename} and emailed to {patient_email}"
