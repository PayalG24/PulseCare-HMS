
const PatientTemplate = `
<div class="patient-dashboard-wrapper">
    <!-- Messages -->
    <div v-if="error" class="alert alert-danger alert-dismissible fade show m-3">
        {{ error }}
        <button type="button" class="btn-close" @click="error = null"></button>
    </div>
    <div v-if="success" class="alert alert-success alert-dismissible fade show m-3">
        {{ success }}
        <button type="button" class="btn-close" @click="success = null"></button>
    </div>

    <div v-if="view === 'dashboard'" class="dashboard-container">
        <div class="container">
            <!-- Welcome Message -->
            <div class="mb-4">
                <h3 class="text-primary mb-2">Welcome, {{ currentUser.name || currentUser.username }}!</h3>
                <p class="text-muted fs-5">Here are your upcoming appointments.</p>
            </div>
            
            <!-- Stats Cards -->
            <div class="row mb-4 g-4">
                <div class="col-md-4">
                    <div class="stat-card" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
                        <div class="position-relative">
                            <h2 class="mb-1 fw-bold">{{ stats.upcoming_appointments || 0 }}</h2>
                            <p class="mb-0 opacity-90">Upcoming Appointments</p>
                            <i class="bi bi-calendar-event stat-icon"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                        <div class="position-relative">
                            <h2 class="mb-1 fw-bold">{{ stats.total_appointments || 0 }}</h2>
                            <p class="mb-0 opacity-90">Total Appointments</p>
                            <i class="bi bi-calendar-check stat-icon"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card" style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);">
                        <div class="position-relative">
                            <h2 class="mb-1 fw-bold">{{ stats.doctors_visited || 0 }}</h2>
                            <p class="mb-0 opacity-90">Doctors Visited</p>
                            <i class="bi bi-heart-pulse stat-icon"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <ul class="nav nav-tabs mb-3" id="patientTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="book-tab" data-bs-toggle="tab" data-bs-target="#book" type="button" role="tab">
                        <i class="bi bi-calendar-plus"></i> Book Appointment
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="appointments-tab" data-bs-toggle="tab" data-bs-target="#patient-appointments" type="button" role="tab">
                        <i class="bi bi-calendar"></i> My Appointments
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="medical-records-tab" data-bs-toggle="tab" data-bs-target="#medical-records" type="button" role="tab">
                        <i class="bi bi-file-earmark-medical"></i> Medical Records
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="history-tab" data-bs-toggle="tab" data-bs-target="#medical-history" type="button" role="tab">
                        <i class="bi bi-journal-medical"></i> Medical History
                    </button>
                </li>
            </ul>

            <div class="tab-content" id="patientTabsContent">
                <!-- Book Appointment Tab -->
                <div class="tab-pane fade show active" id="book" role="tabpanel">
                    <!-- Booking Progress Indicator -->
                    <div class="mb-4">
                        <div class="d-flex justify-content-between align-items-center px-3">
                            <div class="progress-step">
                                <div class="step-circle" :class="{'active': !selectedDepartment, 'completed': selectedDepartment}">
                                    <i v-if="selectedDepartment" class="bi bi-check"></i>
                                    <span v-else>1</span>
                                </div>
                                <div class="step-line" :class="{'active': selectedDepartment}"></div>
                            </div>
                            <div class="progress-step">
                                <div class="step-circle" :class="{'active': selectedDepartment && !selectedDoctor, 'completed': selectedDoctor}">
                                    <i v-if="selectedDoctor" class="bi bi-check"></i>
                                    <span v-else>2</span>
                                </div>
                                <div class="step-line" :class="{'active': selectedDoctor}"></div>
                            </div>
                            <div class="progress-step">
                                <div class="step-circle" :class="{'active': selectedDoctor && !bookingForm.appointment_date, 'completed': bookingForm.appointment_date}">
                                    <i v-if="bookingForm.appointment_date" class="bi bi-check"></i>
                                    <span v-else>3</span>
                                </div>
                                <div class="step-line" :class="{'active': bookingForm.appointment_date}"></div>
                            </div>
                            <div class="progress-step">
                                <div class="step-circle" :class="{'active': bookingForm.appointment_date && !bookingForm.appointment_time, 'completed': bookingForm.appointment_time}">
                                    <i v-if="bookingForm.appointment_time" class="bi bi-check"></i>
                                    <span v-else>4</span>
                                </div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between mt-2 px-3">
                            <small class="text-muted">Specialization</small>
                            <small class="text-muted">Doctor</small>
                            <small class="text-muted">Date</small>
                            <small class="text-muted">Time</small>
                        </div>
                    </div>
                    
                    <div class="card mb-4 shadow-soft">
                        <div class="card-header bg-white">
                            <h5 class="mb-0"><i class="bi bi-calendar-plus me-2"></i>Book New Appointment</h5>
                        </div>
                        <div class="card-body">
                            <form @submit.prevent="bookAppointment">
                                <!-- Step 1: Select Specialization -->
                                <div class="mb-4" v-if="!selectedDepartment">
                                    <label class="form-label h5 mb-3">Step 1: Select Specialization</label>
                                    <div class="row g-3">
                                        <div v-for="dept in departments" :key="dept.id" class="col-6 col-md-4 col-lg-3">
                                            <div class="card h-100 cursor-pointer hover-scale border-0 shadow-sm" 
                                                 @click="selectDepartment(dept)"
                                                 :class="{'ring-2 ring-primary': selectedDepartment?.id === dept.id}">
                                                <div class="card-body text-center p-4">
                                                    <div class="mb-3">
                                                        <i class="bi display-4 text-primary" :class="getSpecializationIcon(dept.name)"></i>
                                                    </div>
                                                    <h6 class="card-title fw-bold mb-1">{{ dept.name }}</h6>
                                                    <small class="text-muted">{{ dept.doctor_count }} Doctors</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="mb-4">
                                    <div class="d-flex align-items-center justify-content-between bg-light p-3 rounded-3 mb-3">
                                        <div class="d-flex align-items-center">
                                            <div class="bg-white p-2 rounded-circle shadow-sm me-3">
                                                <i class="bi text-primary fs-4" :class="getSpecializationIcon(selectedDepartment.name)"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-0 fw-bold">{{ selectedDepartment.name }}</h6>
                                                <small class="text-muted">Selected Specialization</small>
                                            </div>
                                        </div>
                                        <button type="button" class="btn btn-sm btn-outline-secondary" @click="selectedDepartment = null; selectedDoctor = null; bookingForm.appointment_date = ''; bookingForm.appointment_time = ''">
                                            Change
                                        </button>
                                    </div>
                                </div>

                                <!-- Step 2: Select Doctor -->
                                <div v-if="selectedDepartment && !selectedDoctor" class="mb-4">
                                    <label class="form-label h5 mb-3">Step 2: Select Doctor</label>
                                    <div class="row g-3">
                                        <div v-for="doctor in selectedDepartment.doctors" :key="doctor.id" class="col-md-6">
                                            <div class="card h-100 cursor-pointer hover-scale border-0 shadow-sm" @click="selectDoctor(doctor)">
                                                <div class="card-body d-flex align-items-center p-3">
                                                    <div class="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                                                        <i class="bi bi-person-badge text-primary fs-3"></i>
                                                    </div>
                                                    <div class="flex-grow-1">
                                                        <h6 class="fw-bold mb-1">Dr. {{ doctor.name }}</h6>
                                                        <p class="text-muted small mb-1">{{ doctor.qualification }}</p>
                                                        <div class="d-flex align-items-center">
                                                            <span class="badge bg-light text-dark border me-2">
                                                                <i class="bi bi-briefcase me-1"></i>{{ doctor.experience }} yrs
                                                            </span>
                                                            <button class="btn btn-link btn-sm p-0 text-decoration-none" @click.stop="viewDoctorProfile(doctor)">
                                                                View Profile
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div class="text-primary">
                                                        <i class="bi bi-chevron-right"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else-if="selectedDoctor" class="mb-4">
                                    <div class="d-flex align-items-center justify-content-between bg-light p-3 rounded-3 mb-3">
                                        <div class="d-flex align-items-center">
                                            <div class="bg-white p-2 rounded-circle shadow-sm me-3">
                                                <i class="bi bi-person-badge text-primary fs-4"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-0 fw-bold">Dr. {{ selectedDoctor.name }}</h6>
                                                <small class="text-muted">{{ selectedDoctor.qualification }} • {{ selectedDoctor.experience }} yrs exp</small>
                                            </div>
                                        </div>
                                        <button type="button" class="btn btn-sm btn-outline-secondary" @click="selectedDoctor = null; bookingForm.appointment_date = ''; bookingForm.appointment_time = ''">
                                            Change
                                        </button>
                                    </div>
                                </div>

                                <!-- Step 3: Select Date -->
                                <div v-if="selectedDoctor" class="mb-4">
                                    <label class="form-label">Step 3: Select Date</label>
                                    <input type="date" class="form-control" v-model="bookingForm.appointment_date" @change="loadAvailableSlots" :min="minBookingDate" required>
                                    <small class="text-muted">You cannot book appointments for past dates</small>
                                </div>

                                <!-- Step 4: Select Time Slot -->
                                <div v-if="selectedDoctor && bookingForm.appointment_date" class="mb-4">
                                    <label class="form-label">Step 4: Select Time Slot</label>
                                    <div v-if="availableSlots.length > 0">
                                        <div class="row">
                                            <div v-for="slot in availableSlots" :key="slot.slot_type" class="col-md-6 mb-2">
                                                <button type="button" 
                                                        class="btn w-100" 
                                                        :class="[
                                                            slot.status === 'available' ? 'btn-outline-success' : 'btn-outline-secondary',
                                                            bookingForm.appointment_time === slot.appointment_time ? 'active bg-success text-white' : ''
                                                        ]"
                                                        :disabled="slot.status !== 'available'"
                                                        @click="bookingForm.appointment_time = slot.appointment_time">
                                                    <div class="py-2">
                                                        <div>
                                                            <strong>{{ slot.display }}</strong>
                                                            <span class="ms-2 badge" :class="slot.status === 'available' ? 'bg-success' : 'bg-danger'">
                                                                {{ slot.status === 'available' ? '✓' : '✗' }}
                                                            </span>
                                                        </div>
                                                        <small class="text-muted">{{ slot.slot_type === 'morning' ? 'Morning Slot' : 'Evening Slot' }}</small>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                        <div v-if="bookingForm.appointment_time" class="mt-2">
                                            <small class="text-success">
                                                <i class="bi bi-check-circle me-1"></i>
                                                {{ availableSlots.find(s => s.appointment_time === bookingForm.appointment_time)?.display }}
                                            </small>
                                        </div>
                                    </div>
                                    <div v-else class="text-warning">
                                        <small>
                                            <i class="bi bi-info-circle me-1"></i>
                                            No slots available for this date.
                                        </small>
                                    </div>
                                </div>
                                
                                <!-- Notes Section -->
                                <div v-if="bookingForm.appointment_time" class="mb-4">
                                    <label class="form-label">Additional Notes (Optional)</label>
                                    <textarea class="form-control" v-model="bookingForm.notes" rows="3" placeholder="Any specific concerns or symptoms you'd like to mention..."></textarea>
                                </div>
                                
                                <!-- Booking Summary -->
                                <div v-if="selectedDoctor && bookingForm.appointment_date && bookingForm.appointment_time" class="alert alert-info mb-4">
                                    <h6 class="alert-heading mb-3"><i class="bi bi-info-circle me-2"></i>Booking Summary</h6>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p class="mb-2"><strong>Doctor:</strong> Dr. {{ selectedDoctor.name }}</p>
                                            <p class="mb-2"><strong>Specialization:</strong> {{ selectedDepartment.name }}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p class="mb-2"><strong>Date:</strong> {{ formatDisplayDate(bookingForm.appointment_date) }}</p>
                                            <p class="mb-2"><strong>Time:</strong> {{ availableSlots.find(s => s.appointment_time === bookingForm.appointment_time)?.display }}</p>
                                        </div>
                                    </div>
                                    <p class="mb-0"><strong>Consultation Fee:</strong> ₹{{ selectedDoctor.consultation_fee || '0.00' }}</p>
                                </div>
                                
                                <button type="submit" class="btn btn-gradient btn-lg w-100" :disabled="loading || !bookingForm.appointment_time">
                                    <span v-if="!loading">
                                        <i class="bi bi-check-circle me-2"></i>Confirm Booking
                                    </span>
                                    <span v-else>
                                        <span class="spinner-border spinner-border-sm me-2"></span>Processing...
                                    </span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Unified Appointments Tab -->
                <div class="tab-pane fade" id="patient-appointments" role="tabpanel">
                    <div class="card dashboard-card mb-4">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="bi bi-calendar-check me-2"></i>My Appointments</h5>
                            <span class="badge badge-soft-primary">{{ allPatientAppointments.length }} Total</span>
                        </div>
                        <div class="card-body">
                            <div v-if="allPatientAppointments.length === 0" class="empty-state">
                                <i class="bi bi-calendar-x"></i>
                                <p>No appointments found</p>
                                <small>Book your first appointment to get started</small>
                            </div>
                            <div v-else class="table-responsive">
                                <table class="table modern-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Doctor</th>
                                            <th>Department</th>
                                            <th>Date</th>
                                            <th>Time Slot</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(appointment, index) in allPatientAppointments" :key="appointment.id">
                                            <td><span class="row-number">{{ index + 1 }}</span></td>
                                            <td>
                                                <span class="fw-medium">{{ appointment.doctor ? 'Dr. ' + appointment.doctor.name : 'N/A' }}</span>
                                            </td>
                                            <td><span class="badge badge-soft-info">{{ appointment.department || (appointment.doctor ? appointment.doctor.specialization : 'N/A') }}</span></td>
                                            <td><i class="bi bi-calendar3 me-1 text-muted"></i>{{ appointment.appointment_date }}</td>
                                            <td><i class="bi bi-clock me-1 text-muted"></i>{{ formatTimeSlot(appointment.appointment_time) }}</td>
                                            <td>
                                                <span class="status-badge" :class="getStatusClass(appointment.status)">
                                                    {{ capitalizeStatus(appointment.status) }}
                                                </span>
                                            </td>
                                            <td>
                                                <div class="btn-group btn-group-sm">
                                                    <button v-if="appointment.status === 'booked'" 
                                                            class="btn btn-outline-danger" 
                                                            @click="cancelPatientAppointment(appointment.id)"
                                                            title="Cancel Appointment">
                                                        <i class="bi bi-x-circle"></i>
                                                    </button>
                                                    <button v-else-if="appointment.status === 'cancelled' || appointment.status === 'completed'" 
                                                            class="btn btn-outline-primary" 
                                                            @click="showAppointmentHistory(appointment)"
                                                            title="View Details">
                                                        <i class="bi bi-eye"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Medical Records Tab -->
                <div class="tab-pane fade" id="medical-records" role="tabpanel">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="bi bi-file-earmark-medical me-2"></i>Medical Records</h5>
                            <button class="btn btn-primary btn-sm" @click="showUploadModal">
                                <i class="bi bi-upload me-1"></i>Upload Record
                            </button>
                        </div>
                        <div class="card-body">
                            <div v-if="medicalRecords.length === 0" class="text-center py-4">
                                <i class="bi bi-folder-x display-4 text-muted mb-3"></i>
                                <p class="text-muted">No medical records found</p>
                                <button class="btn btn-primary" @click="showUploadModal">
                                    <i class="bi bi-upload me-1"></i>Upload Your First Record
                                </button>
                            </div>
                            <div v-else class="table-responsive">
                                <table class="table table-hover">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Title</th>
                                            <th>Type</th>
                                            <th>Date</th>
                                            <th>File</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="record in medicalRecords" :key="record.id">
                                            <td>{{ record.title }}</td>
                                            <td><span class="badge bg-info">{{ record.record_type }}</span></td>
                                            <td>{{ formatDate(record.record_date) }}</td>
                                            <td>{{ record.file_name }}</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary me-1" @click="downloadRecord(record.id)">
                                                    <i class="bi bi-download"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" @click="deleteRecord(record.id)">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Medical History Tab -->
                <div class="tab-pane fade" id="medical-history" role="tabpanel">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">My Medical History</h5>
                            <div>
                                <button class="btn btn-success btn-sm" @click="exportHistory">
                                    <i class="bi bi-download"></i> Export Full History
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <!-- Empty State -->
                            <div v-if="treatments.length === 0" class="text-center py-4">
                                <i class="bi bi-journal-x display-4 text-muted mb-3"></i>
                                <p class="text-muted">No medical history found</p>
                                <small class="text-muted">Your completed appointments with treatment details will appear here</small>
                            </div>
                            <!-- Medical History Table -->
                            <div v-else class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Sr. No</th>
                                            <th>Date</th>
                                            <th>Doctor</th>
                                            <th>Visit Type</th>
                                            <th>Diagnosis</th>
                                            <th>Prescription</th>
                                            <th>Treatment Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(treatment, index) in treatments" :key="treatment.id">
                                            <td>{{ index + 1 }}</td>
                                            <td>{{ treatment.created_at ? new Date(treatment.created_at).toLocaleDateString() : 'N/A' }}</td>
                                            <td>{{ getTreatmentDoctor(treatment) }}</td>
                                            <td>
                                                <span class="badge bg-info">{{ treatment.visit_type || 'General' }}</span>
                                            </td>
                                            <td>{{ truncateText(treatment.diagnosis) }}</td>
                                            <td>{{ truncateText(treatment.prescription) }}</td>
                                            <td>{{ truncateText(treatment.treatment_notes) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Appointment History View -->
    <div v-if="view === 'appointment-history'" class="container mt-4">
        <div class="row justify-content-center">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Appointment History Details</h5>
                        <button class="btn btn-outline-secondary mb-2" @click="goBackToAppointments()">
                            <i class="bi bi-arrow-left"></i> Back to Appointments
                        </button> 
                    </div>
                    <div class="card-body">
                        <div v-if="selectedAppointmentHistory">
                            <!-- Appointment Information -->
                            <div class="mb-4">
                                <h6>Appointment Information</h6>
                                <p><strong>Doctor:</strong> {{ selectedAppointmentHistory.doctor ? 'Dr. ' + selectedAppointmentHistory.doctor.name : 'N/A' }}</p>
                                <p><strong>Department:</strong> {{ selectedAppointmentHistory.department || (selectedAppointmentHistory.doctor ? selectedAppointmentHistory.doctor.specialization : 'N/A') }}</p>
                                <p><strong>Date:</strong> {{ selectedAppointmentHistory.appointment_date }}</p>
                                <p><strong>Time:</strong> {{ selectedAppointmentHistory.appointment_time }}</p>
                                <p><strong>Status:</strong> {{ selectedAppointmentHistory.status }}</p>
                                <p v-if="selectedAppointmentHistory.notes"><strong>Notes:</strong> {{ selectedAppointmentHistory.notes }}</p>
                            </div>
                            
                            <!-- Treatment Details -->
                            <div v-if="selectedAppointmentHistory.treatment" class="mb-4">
                                <h6>Treatment Details</h6>
                                <p v-if="selectedAppointmentHistory.treatment.visit_type"><strong>Visit Type:</strong> {{ selectedAppointmentHistory.treatment.visit_type }}</p>
                                <p v-if="selectedAppointmentHistory.treatment.diagnosis"><strong>Diagnosis:</strong> {{ selectedAppointmentHistory.treatment.diagnosis }}</p>
                                <p v-if="selectedAppointmentHistory.treatment.prescription"><strong>Prescription:</strong> {{ selectedAppointmentHistory.treatment.prescription }}</p>
                                <p v-if="selectedAppointmentHistory.treatment.treatment_notes"><strong>Treatment Notes:</strong> {{ selectedAppointmentHistory.treatment.treatment_notes }}</p>
                            </div>
                            
                            <div v-else class="mb-4">
                                <h6>Treatment Details</h6>
                                <p>No treatment details available.</p>
                            </div>
                            
                            <!-- Cancellation Details -->
                            <div v-if="selectedAppointmentHistory.status === 'cancelled' && selectedAppointmentHistory.cancellation_reason" class="mb-4">
                                <h6>Cancellation Information</h6>
                                <p><strong>Reason:</strong> {{ selectedAppointmentHistory.cancellation_reason }}</p>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Doctor Profile Modal -->
    <div class="modal fade" id="doctorProfileModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Doctor Profile</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-center" v-if="viewingDoctor">
                    <div class="mb-4">
                        <div class="avatar-circle bg-primary text-white mx-auto mb-3" style="width: 80px; height: 80px; font-size: 2rem; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
                            {{ viewingDoctor.name.charAt(0) }}
                        </div>
                        <h4>Dr. {{ viewingDoctor.name }}</h4>
                        <p class="text-muted mb-1">{{ viewingDoctor.department }}</p>
                        <span class="badge bg-info">{{ viewingDoctor.experience }} Years Experience</span>
                    </div>
                    
                    <div class="row text-start">
                        <div class="col-md-6 mb-3">
                            <strong><i class="bi bi-mortarboard me-2"></i>Qualification</strong>
                            <p class="text-muted ms-4">{{ viewingDoctor.qualification }}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <strong><i class="bi bi-cash me-2"></i>Consultation Fee</strong>
                            <p class="text-muted ms-4">$ {{ viewingDoctor.consultation_fee || '0.00' }}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <strong><i class="bi bi-telephone me-2"></i>Contact</strong>
                            <p class="text-muted ms-4">{{ viewingDoctor.phone || 'N/A' }}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <strong><i class="bi bi-envelope me-2"></i>Email</strong>
                            <p class="text-muted ms-4">{{ viewingDoctor.email || 'N/A' }}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" @click="selectDoctorAndBook(viewingDoctor)">Book Appointment</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Cancel Appointment Modal -->
    <div class="modal fade" id="cancelAppointmentModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Cancel Appointment</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to cancel this appointment?</p>
                    <p class="text-danger"><small>This action cannot be undone.</small></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">No, Keep it</button>
                    <button type="button" class="btn btn-danger" @click="confirmCancelAppointment">Yes, Cancel Appointment</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Upload Medical Record Modal -->
    <div class="modal fade" id="uploadRecordModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Upload Medical Record</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="uploadRecord">
                        <div class="mb-3">
                            <label class="form-label">Record Type</label>
                            <select class="form-select" v-model="uploadForm.record_type" required>
                                <option value="prescription">Prescription</option>
                                <option value="lab_report">Lab Report</option>
                                <option value="scan">Scan/X-Ray</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Title</label>
                            <input type="text" class="form-control" v-model="uploadForm.title" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Description (Optional)</label>
                            <textarea class="form-control" v-model="uploadForm.description" rows="2"></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Record Date</label>
                            <input type="date" class="form-control" v-model="uploadForm.record_date">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">File (Max 10MB)</label>
                            <input type="file" class="form-control" @change="handleFileSelect" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" required>
                            <small class="text-muted">Allowed: PDF, PNG, JPG, DOC, DOCX</small>
                        </div>
                        <button type="submit" class="btn btn-primary" :disabled="uploading">
                            <span v-if="uploading" class="spinner-border spinner-border-sm me-2"></span>
                            {{ uploading ? 'Uploading...' : 'Upload' }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
`;

const PatientComponent = {
    template: PatientTemplate,
    props: ['currentUser'],
    data() {
        return {
            view: 'dashboard',
            stats: {},
            departments: [],
            allPatientAppointments: [],
            treatments: [],
            prescriptions: [],
            medicalRecords: [],
            selectedDepartment: null,
            selectedDoctor: null,
            viewingDoctor: null,
            availableSlots: [],
            bookingForm: {
                specialization: '',
                doctor_id: '',
                appointment_date: '',
                appointment_time: '',
                notes: ''
            },
            uploadForm: {
                record_type: 'prescription',
                title: '',
                description: '',
                record_date: '',
                file: null
            },
            selectedFile: null,
            uploading: false,
            loading: false,
            error: null,
            success: null,
            selectedAppointmentHistory: null,
            minBookingDate: new Date().toISOString().split('T')[0],
            appointmentToCancel: null
        }
    },
    methods: {
        async loadPatientData() {
            const dashboard = await window.ApiService.getPatientDashboard()
            if (dashboard.success) {
                this.stats = dashboard.data
            }

            const departments = await window.ApiService.getDepartments()
            if (departments.success) this.departments = departments.data.departments

            const appointments = await window.ApiService.getPatientAppointments()
            if (appointments.success) this.allPatientAppointments = appointments.data.appointments

            const history = await window.ApiService.getPatientHistoryForPatient()
            if (history.success) {
                this.treatments = history.data.treatments
            }

            const prescriptions = await window.ApiService.getPatientPrescriptions()
            if (prescriptions.success) {
                this.prescriptions = prescriptions.data.prescriptions
            }

            const records = await window.ApiService.getMedicalRecords()
            if (records.success) {
                this.medicalRecords = records.data.records
            }
        },

        selectDepartment(department) {
            this.selectedDepartment = department
            this.selectedDoctor = null
            this.availableSlots = []
            this.bookingForm.appointment_date = ''
            this.bookingForm.appointment_time = ''
            this.bookingForm.doctor_id = ''
        },

        selectDoctor(doctor) {
            this.selectedDoctor = doctor
            this.bookingForm.doctor_id = doctor.id
            this.availableSlots = []
            this.bookingForm.appointment_time = ''
            if (this.bookingForm.appointment_date) {
                this.loadAvailableSlots()
            }
        },

        async loadAvailableSlots() {
            if (this.bookingForm.doctor_id && this.bookingForm.appointment_date) {
                const resp = await window.ApiService.getAvailableSlots(this.bookingForm.doctor_id, this.bookingForm.appointment_date)
                if (resp.success) {
                    this.availableSlots = resp.data.slots || []
                } else {
                    this.availableSlots = []
                    this.error = resp.message || 'Failed to load available slots'
                }
            }
        },

        async bookAppointment() {
            this.loading = true
            this.error = null
            this.success = null
            
            const selectedDate = new Date(this.bookingForm.appointment_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            if (selectedDate < today) {
                this.error = 'Cannot book appointments for past dates'
                this.loading = false
                return
            }
            
            const resp = await window.ApiService.bookAppointment(this.bookingForm)
            if (resp.success) {
                this.success = 'Appointment booked successfully!'
                this.bookingForm = { 
                    specialization: '', 
                    doctor_id: '', 
                    appointment_date: '', 
                    appointment_time: '', 
                    notes: '' 
                }
                this.selectedDepartment = null
                this.selectedDoctor = null
                this.availableSlots = []
                await this.loadPatientData()
            } else { 
                this.error = resp.message || 'Failed to book appointment' 
            }
            this.loading = false
        },

        cancelPatientAppointment(appointmentId) {
            this.appointmentToCancel = appointmentId;
            const modal = new bootstrap.Modal(document.getElementById('cancelAppointmentModal'));
            modal.show();
        },

        async confirmCancelAppointment() {
            if (!this.appointmentToCancel) return;
            
            const modalEl = document.getElementById('cancelAppointmentModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            const resp = await window.ApiService.cancelAppointment(this.appointmentToCancel);
            if (resp.success) { 
                this.success = 'Appointment cancelled successfully';
                await this.loadPatientData();
            } else {
                this.error = resp.message || 'Failed to cancel appointment';
            }
            this.appointmentToCancel = null;
        },

        async exportHistory() {
            try {
                const response = await window.ApiService.exportPatientHistory();
                if (response.success) {
                    this.success = 'History export started. You will receive an email shortly.';
                } else {
                    this.error = response.message || 'Failed to export history';
                }
            } catch (error) {
                this.error = 'Error exporting history: ' + error.message;
            }
        },

        showAppointmentHistory(appointment) {
            this.selectedAppointmentHistory = appointment;
            this.view = 'appointment-history';
        },

        goBackToAppointments() {
            this.view = 'dashboard';
            this.selectedAppointmentHistory = null;
        },

        viewDoctorProfile(doctor) {
            this.viewingDoctor = doctor;
            const modal = new bootstrap.Modal(document.getElementById('doctorProfileModal'));
            modal.show();
        },

        closeDoctorProfile() {
            const modalEl = document.getElementById('doctorProfileModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            this.viewingDoctor = null;
        },

        selectDoctorAndBook(doctor) {
            this.selectDoctor(doctor);
            this.closeDoctorProfile();
        },

        showUploadModal() {
            const modal = new bootstrap.Modal(document.getElementById('uploadRecordModal'));
            modal.show();
        },

        handleFileSelect(event) {
            this.selectedFile = event.target.files[0];
        },

        async uploadRecord() {
            if (!this.selectedFile) {
                this.error = 'Please select a file';
                return;
            }

            this.uploading = true;
            this.error = null;

            const formData = new FormData();
            formData.append('file', this.selectedFile);
            formData.append('record_type', this.uploadForm.record_type);
            formData.append('title', this.uploadForm.title);
            formData.append('description', this.uploadForm.description);
            if (this.uploadForm.record_date) {
                formData.append('record_date', this.uploadForm.record_date);
            }

            const resp = await window.ApiService.uploadMedicalRecord(formData);
            
            if (resp.success) {
                this.success = 'Medical record uploaded successfully';
                this.uploadForm = { record_type: 'prescription', title: '', description: '', record_date: '' };
                this.selectedFile = null;
                const modalEl = document.getElementById('uploadRecordModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                await this.loadPatientData();
            } else {
                this.error = resp.message || 'Failed to upload record';
            }

            this.uploading = false;
        },

        downloadRecord(recordId) {
            window.ApiService.downloadMedicalRecord(recordId);
        },

        async deleteRecord(recordId) {
            if (!confirm('Are you sure you want to delete this record?')) return;

            const resp = await window.ApiService.deleteMedicalRecord(recordId);
            if (resp.success) {
                this.success = 'Record deleted successfully';
                await this.loadPatientData();
            } else {
                this.error = resp.message || 'Failed to delete record';
            }
        },

        formatDate(dateString) {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString();
        },

        formatDisplayDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        },

        // Helpers
        formatTimeSlot(time) {
            if (!time) return '';
            const [hours, minutes] = time.toString().split(':');
            let h = parseInt(hours);
            const m = minutes ? minutes.substring(0, 2) : '00';
            
            // Calculate end time (1 hour duration)
            let endH = h + 1;
            
            // Format start time
            const startAmpm = h >= 12 ? 'PM' : 'AM';
            const startH12 = h % 12 || 12;
            
            // Format end time
            const endAmpm = endH >= 12 && endH < 24 ? 'PM' : 'AM';
            const endH12 = endH % 12 || 12;
            
            return `${startH12}:${m} ${startAmpm} - ${endH12}:${m} ${endAmpm}`;
        },

        getStatusClass(status) {
            return window.UtilsModule.getStatusClass(status);
        },

        capitalizeStatus(status) {
            if (!status) return '';
            return status.charAt(0).toUpperCase() + status.slice(1);
        },

        getSpecializationIcon(name) {
            const map = {
                'Cardiology': 'bi-heart-pulse',
                'Neurology': 'bi-lightning-charge',
                'Orthopedics': 'bi-person-arms-up',
                'Pediatrics': 'bi-emoji-smile',
                'Dermatology': 'bi-person-fill',
                'Psychiatry': 'bi-chat-square-heart',
                'General Medicine': 'bi-prescription2',
                'ENT': 'bi-ear',
                'Ophthalmology': 'bi-eye',
                'Dentist': 'bi-emoji-laughing'
            };
            return map[name] || 'bi-building';
        },

        getSpecializationDescription(name) {
            const descriptions = {
                'Cardiology': 'Heart and cardiovascular system care',
                'Dermatology': 'Skin, hair, and nail conditions',
                'Neurology': 'Brain, spine, and nervous system',
                'Orthopedics': 'Bones, joints, and muscles',
                'Pediatrics': 'Medical care for infants and children',
                'General Medicine': 'Primary healthcare and general checkups'
            };
            return descriptions[name] || 'Specialized medical care';
        },

        getTreatmentDoctor(treatment) {
            if (treatment.appointment && treatment.appointment.doctor) {
                return 'Dr. ' + treatment.appointment.doctor.name;
            }
            return 'N/A';
        },

        truncateText(text, length = 50) {
            if (!text) return 'N/A';
            return text.length > length ? text.substring(0, length) + '...' : text;
        }
    },
    async mounted() {
        await this.loadPatientData();
    }
};

window.PatientComponent = PatientComponent;
