from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

# simple jwt decorator that checks if user is logged in
def login_required(f):
    @wraps(f)
    @jwt_required()
    def wrapper(*args, **kwargs):
        return f(*args, **kwargs)
    return wrapper

# admin only access
def admin_required(f):
    @wraps(f)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access only'}), 403
        return f(*args, **kwargs)
    return wrapper

# doctor only access
def doctor_required(f):
    @wraps(f)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'doctor':
            return jsonify({'success': False, 'message': 'Doctor access only'}), 403
        return f(*args, **kwargs)
    return wrapper

# patient only access
def patient_required(f):
    @wraps(f)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'patient':
            return jsonify({'success': False, 'message': 'Patient access only'}), 403
        return f(*args, **kwargs)
    return wrapper

# patient or admin access
def patient_or_admin_required(f):
    @wraps(f)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') not in ['patient', 'admin']:
            return jsonify({'success': False, 'message': 'Patient or admin access only'}), 403
        return f(*args, **kwargs)
    return wrapper

# helper function to get current user id from jwt
def get_current_user_id():
    return int(get_jwt_identity())

# helper function to get current user role from jwt
def get_current_user_role():
    claims = get_jwt()
    return claims.get('role')
