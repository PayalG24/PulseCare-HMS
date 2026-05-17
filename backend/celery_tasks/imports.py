from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv
import os

load_dotenv()

celery = Celery('hospital_management')
celery.conf.broker_url = 'redis://localhost:6379/0'
celery.conf.result_backend = 'redis://localhost:6379/0'
celery.conf.broker_connection_retry_on_startup = True

# Import tasks to ensure they are registered
from .reminders import daily_reminders
from .reports import monthly_report, patient_history_export
from .email import booking_confirmation, booking_cancellation, doctor_login

@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # daily reminder at 7:30 AM every day
    sender.add_periodic_task(
        crontab(hour=7, minute=30),
        daily_reminders.s()
    )
    # monthly report on the 1st of every month at 8:00 AM
    sender.add_periodic_task(
        crontab(day_of_month=1, hour=8, minute=0),
        monthly_report.s()
    )
