from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from flask_mail import Mail
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash
from celery import Celery
from backend.database import db
from dotenv import load_dotenv
import time
import os
from backend.models.user import User
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__, static_folder='../frontend', static_url_path='/static')

# flask config
app.config['SECRET_KEY'] = 'this-is-hms-web-app-123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///PulseCare-database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# jwt config
app.config['JWT_SECRET_KEY'] = 'jwt-secret-key-456'
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# email config (supports both gmail and mailhog)
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', os.getenv('MAIL_USERNAME'))

# celery config
app.config['CELERY_BROKER_URL'] = os.getenv('CELERY_BROKER_URL', 'redis://red-d851c2gjs32c73a629tg:6379')
app.config['CELERY_RESULT_BACKEND'] = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
app.config['CELERY_TASK_SERIALIZER'] = 'json'
app.config['CELERY_ACCEPT_CONTENT'] = ['json']
app.config['RESULT_SERIALIZER'] = 'json'
app.config['DEBUG'] = True

# initialize extensions
db.init_app(app)
CORS(app)
mail = Mail(app)
jwt = JWTManager(app)

# celery setup
def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=app.config['CELERY_RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL']
    )
    celery.conf.update(app.config)
    
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery.Task = ContextTask
    return celery

celery = make_celery(app)

# register blueprints
from models import *
from routes import *

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(doctor_bp, url_prefix='/api/doctor')
app.register_blueprint(patient_bp, url_prefix='/api/patient')

# error handlers
@app.errorhandler(404)
def not_found(error):
    # return json for api routes, html for others
    if request.path.startswith('/api/'):
        return jsonify({
            'success': False,
            'message': f'Endpoint not found: {request.path}'
        }), 404
    # for non-api routes, serve the frontend
    return send_from_directory('../frontend', 'index.html')

@app.errorhandler(500)
def internal_error(error):
    if request.path.startswith('/api/'):
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

@app.route('/')
def home():
    return send_from_directory('../frontend', 'index.html')

# catch-all route for frontend routing (must be last)
@app.route('/<path:path>')
def serve_frontend(path):
    # serve static files if they exist
    frontend_path = os.path.join('../frontend', path)
    if os.path.exists(frontend_path) and os.path.isfile(frontend_path):
        return send_from_directory('../frontend', path)
    # otherwise serve index.html for client-side routing
    return send_from_directory('../frontend', 'index.html')

# database initialization
def setup_db():
    with app.app_context():
        db.create_all()
        
        # create admin if not exists
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@PulseCare.com',
                password_hash=generate_password_hash('admin'),
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print("Admin created: admin/admin")

# application entry point
if __name__ == '__main__':
    setup_db()
    app.run(debug=True, port=5000)
