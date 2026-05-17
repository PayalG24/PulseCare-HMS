# import all models
from .user import User
from .patient import Patient  
from .doctor import Doctor, DoctorAvailability
from .appointment import Appointment
from .treatment import Treatment

__all__ = [
    'User',
    'Patient', 
    'Doctor',
    'DoctorAvailability',
    'Appointment',
    'Treatment'
]
