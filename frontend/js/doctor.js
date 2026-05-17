const DoctorDashboardTemplate = `
<div class="doctor-wrapper">
    <!-- Messages -->
    <div v-if="error" class="alert alert-danger alert-dismissible fade show m-3">
        {{ error }}
        <button type="button" class="btn-close" @click="error = null"></button>
    </div>
    <div v-if="success" class="alert alert-success alert-dismissible fade show m-3">
        {{ success }}
        <button type="button" class="btn-close" @click="success = null"></button>
    </div>

    <!-- Main Dashboard -->
    <div v-if="view === 'dashboard'" class="dashboard-container">
        <div class="container">
            <!-- Welcome Message -->
            <div class="mb-4">
                <h3 class="text-primary mb-2">Welcome, Dr. {{ currentUser.name || currentUser.username }}!</h3>
                <p class="text-muted fs-5">Here's your practice overview for today.</p>
            </div>
            
            <!-- Stats Cards -->
            <div class="row mb-4 g-4">
                <div class="col-md-3">
                    <div class="stat-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                        <div class="position-relative">
                            <h2 class="mb-1 fw-bold">{{ stats.total_appointments || 0 }}</h2>
                            <p class="mb-0 opacity-90">Total Appointments</p>
                            <i class="bi bi-calendar-check stat-icon"></i>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="stat-card" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
                        <div class="position-relative">
                            <h2 class="mb-1 fw-bold">{{ stats.today_appointments || 0 }}</h2>
                            <p class="mb-0 opacity-90">Today's Schedule</p>
                            <i class="bi bi-clock-history stat-icon"></i>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="stat-card" style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);">
                        <div class="position-relative">
                            <h2 class="mb-1 fw-bold">{{ stats.total_patients || 0 }}</h2>
                            <p class="mb-0 opacity-90">Total Patients</p>
                            <i class="bi bi-people stat-icon"></i>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                        <div class="position-relative">
                            <h2 class="mb-1 fw-bold">{{ stats.completed_today || 0 }}</h2>
                            <p class="mb-0 opacity-90">Completed Today</p>
                            <i class="bi bi-check-circle stat-icon"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <ul class="nav nav-tabs mb-3" id="doctorTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="appointments-tab" data-bs-toggle="tab" data-bs-target="#doctor-appointments" type="button" role="tab">
                        <i class="bi bi-calendar"></i> Appointments
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="patients-tab" data-bs-toggle="tab" data-bs-target="#doctor-patients" type="button" role="tab">
                        <i class="bi bi-people"></i> Assigned Patients
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="availability-tab" data-bs-toggle="tab" data-bs-target="#availability" type="button" role="tab">
                        <i class="bi bi-calendar-alt"></i> Set Availability
                    </button>
                </li>
            </ul>

            <div class="tab-content" id="doctorTabsContent">
                <!-- Appointments Tab -->
                <div class="tab-pane fade show active" id="doctor-appointments" role="tabpanel">
                    <div class="card dashboard-card mb-4">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="bi bi-calendar-check me-2"></i>My Appointments</h5>
                            <span class="badge badge-soft-primary">{{ doctorAppointments.length }} Total</span>
                        </div>
                        <div class="card-body">
                            <div v-if="loading" class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p class="text-muted mt-2">Loading appointments...</p>
                            </div>
                            <div v-else-if="doctorAppointments.length === 0" class="empty-state">
                                <i class="bi bi-calendar-x"></i>
                                <h4>No Appointments</h4>
                                <p>You don't have any appointments scheduled yet.</p>
                            </div>
                            <div v-else class="table-responsive mb-3">
                                <table class="table modern-table align-middle">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Patient</th>
                                            <th>Date & Time</th>
                                            <th>Age / Gender</th>
                                            <th>Contact</th>
                                            <th>Status</th>
                                            <th class="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="appointment in doctorAppointments" :key="appointment.id">
                                            <td class="fw-bold text-muted">{{ appointment.sr_no }}</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                                                        <i class="bi bi-person text-primary"></i>
                                                    </div>
                                                    <div>
                                                        <div class="fw-semibold">{{ appointment.patient ? appointment.patient.name : 'N/A' }}</div>
                                                        <small class="text-muted">{{ appointment.patient ? appointment.patient.phone : '' }}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <div class="fw-semibold">{{ formatDisplayDate(appointment.appointment_date) }}</div>
                                                    <small class="text-muted">
                                                        <i class="bi bi-clock me-1"></i>{{ formatTimeSlot(appointment.appointment_time) }}
                                                    </small>
                                                </div>
                                            </td>
                                            <td>
                                                <span class="badge badge-soft-primary">{{ appointment.patient ? appointment.patient.age : 'N/A' }} yrs</span>
                                                <span class="badge badge-soft-primary ms-1">{{ appointment.patient ? appointment.patient.gender : 'N/A' }}</span>
                                            </td>
                                            <td>{{ appointment.patient ? appointment.patient.phone : 'N/A' }}</td>
                                            <td>
                                                <span class="badge rounded-pill" :class="getStatusBadgeClass(appointment.status)">
                                                    <i :class="getStatusIcon(appointment.status)" class="me-1"></i>{{ capitalizeStatus(appointment.status) }}
                                                </span>
                                            </td>
                                            <td class="text-center">
                                                <div class="btn-group" role="group">
                                                    <button class="btn btn-sm btn-outline-primary" 
                                                            @click="openTreatmentPage(appointment)" 
                                                            title="Update Treatment">
                                                        <i class="bi bi-clipboard-plus"></i>
                                                    </button>
                                                    <button v-if="appointment.status === 'booked'"
                                                            class="btn btn-sm btn-outline-danger" 
                                                            @click="cancelDoctorAppointment(appointment)" 
                                                            title="Cancel">
                                                        <i class="bi bi-x-lg"></i>
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

                <!-- Assigned Patients Tab -->
                <div class="tab-pane fade" id="doctor-patients" role="tabpanel">
                    <div class="card dashboard-card mb-4">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="bi bi-people me-2"></i>Assigned Patients</h5>
                            <span class="badge badge-soft-primary">{{ doctorPatients.length }} Total</span>
                        </div>
                        <div class="card-body">
                            <div v-if="doctorPatients.length === 0" class="empty-state">
                                <i class="bi bi-person-x"></i>
                                <h4>No Patients</h4>
                                <p>You don't have any assigned patients yet.</p>
                            </div>
                            <div v-else class="table-responsive mb-3">
                                <table class="table modern-table align-middle">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Patient</th>
                                            <th>Contact</th>
                                            <th>Age</th>
                                            <th>Gender</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="patient in doctorPatients" :key="patient.id">
                                            <td><span class="row-number">{{ patient.sr_no }}</span></td>
                                            <td>
                                                <span class="fw-medium">{{ patient.name }}</span>
                                            </td>
                                            <td><i class="bi bi-telephone me-1 text-muted"></i>{{ patient.phone }}</td>
                                            <td><span class="badge badge-soft-primary">{{ patient.age }} yrs</span></td>
                                            <td><span class="badge badge-soft-info">{{ patient.gender }}</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" 
                                                        @click="viewPatientTreatmentHistory(patient)" 
                                                        title="View Treatment History">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Availability Tab -->
                <div class="tab-pane fade" id="availability" role="tabpanel">
                    <div class="card dashboard-card mb-4">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="mb-0"><i class="bi bi-calendar-check me-2"></i>Set Availability</h5>
                                <small class="text-muted">Next 7 Days</small>
                            </div>
                            <button @click="saveAvailability" class="btn btn-primary" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                <i class="bi bi-save me-1"></i> Save Changes
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-light border mb-4">
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-info-circle text-primary me-2 fs-5"></i>
                                    <div>
                                        <strong>Instructions:</strong> Check the boxes for slots when you're available.
                                        <div class="mt-1">
                                            <span class="badge bg-light text-dark border me-2"><i class="bi bi-sunrise me-1"></i>Morning: 9 AM - 1 PM</span>
                                            <span class="badge bg-light text-dark border"><i class="bi bi-sunset me-1"></i>Evening: 3 PM - 7 PM</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="table-responsive">
                                <table class="table modern-table align-middle">
                                    <thead>
                                        <tr>
                                            <th style="width: 40%">Date</th>
                                            <th style="width: 30%" class="text-center">
                                                <i class="bi bi-sunrise me-1"></i>Morning
                                                <br><small class="fw-normal text-muted">9 AM - 1 PM</small>
                                            </th>
                                            <th style="width: 30%" class="text-center">
                                                <i class="bi bi-sunset me-1"></i>Evening
                                                <br><small class="fw-normal text-muted">3 PM - 7 PM</small>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="day in availabilityDays" :key="day.date">
                                            <td class="align-middle">
                                                <div class="d-flex align-items-center">
                                                    <div class="bg-primary bg-opacity-10 rounded-circle p-2 me-2" style="min-width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
                                                        <i class="bi bi-calendar-day text-primary"></i>
                                                    </div>
                                                    <div>
                                                        <strong class="d-block">{{ day.day_name }}</strong>
                                                        <small class="text-muted">{{ day.date }}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="text-center align-middle">
                                                <div class="form-check form-switch d-inline-block">
                                                    <input 
                                                        class="form-check-input" 
                                                        type="checkbox" 
                                                        role="switch"
                                                        :id="'morning-' + day.date"
                                                        v-model="day.morning_available"
                                                        style="cursor: pointer;">
                                                    <label class="form-check-label ms-2" :for="'morning-' + day.date" style="cursor: pointer;">
                                                        <span v-if="day.morning_available" class="badge bg-success">
                                                            <i class="bi bi-check-circle me-1"></i>Available
                                                        </span>
                                                        <span v-else class="badge bg-secondary">
                                                            <i class="bi bi-x-circle me-1"></i>Unavailable
                                                        </span>
                                                    </label>
                                                </div>
                                            </td>
                                            <td class="text-center align-middle">
                                                <div class="form-check form-switch d-inline-block">
                                                    <input 
                                                        class="form-check-input" 
                                                        type="checkbox" 
                                                        role="switch"
                                                        :id="'evening-' + day.date"
                                                        v-model="day.evening_available"
                                                        style="cursor: pointer;">
                                                    <label class="form-check-label ms-2" :for="'evening-' + day.date" style="cursor: pointer;">
                                                        <span v-if="day.evening_available" class="badge bg-success">
                                                            <i class="bi bi-check-circle me-1"></i>Available
                                                        </span>
                                                        <span v-else class="badge bg-secondary">
                                                            <i class="bi bi-x-circle me-1"></i>Unavailable
                                                        </span>
                                                    </label>
                                                </div>
                                            </td>
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

    <!-- Cancel Appointment Modal -->
    <div class="modal fade" id="cancelDoctorAppointmentModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Cancel Appointment</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to cancel this appointment?</p>
                    <div v-if="appointmentToCancel" class="alert alert-info">
                        <strong>Patient:</strong> {{ appointmentToCancel.patient?.name }}<br>
                        <strong>Date:</strong> {{ appointmentToCancel.appointment_date }}<br>
                        <strong>Time:</strong> {{ formatTimeSlot(appointmentToCancel.appointment_time) }}
                    </div>
                    <p class="text-danger"><small>This action cannot be undone.</small></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">No, Keep it</button>
                    <button type="button" class="btn btn-danger" @click="confirmCancelAppointment">Yes, Cancel Appointment</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Treatment Management Page -->
    <div v-if="view === 'treatment-management'" class="container mt-4">
        <div class="row justify-content-center">
            <div class="col-md-12">
                <div class="card shadow-sm border-0">
                    <div class="card-header bg-white border-bottom py-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <div class="bg-primary bg-opacity-10 p-2 rounded-3 me-3">
                                    <i class="bi bi-clipboard2-pulse text-primary fs-5"></i>
                                </div>
                                <div>
                                    <h5 class="mb-0 fw-bold">Manage Treatment</h5>
                                    <small class="text-muted">{{ selectedAppointmentForTreatment?.patient?.name }}</small>
                                </div>
                            </div>
                            <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" @click="backToDoctorAppointments()">
                                <i class="bi bi-arrow-left me-1"></i> Back to Dashboard
                            </button>
                        </div>
                    </div>
                    <div class="card-body p-4">
                        <div v-if="selectedAppointmentForTreatment">
                            <!-- Appointment Info -->
                            <div class="alert alert-light border mb-4">
                                <div class="row">
                                    <div class="col-md-6">
                                        <i class="bi bi-calendar-event text-primary me-2"></i><strong>Date:</strong> {{ selectedAppointmentForTreatment.appointment_date }}
                                    </div>
                                    <div class="col-md-6">
                                        <i class="bi bi-clock text-info me-2"></i><strong>Time:</strong> {{ formatTimeSlot(selectedAppointmentForTreatment.appointment_time) }}
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <i class="bi bi-info-circle text-success me-2"></i><strong>Status:</strong> 
                                    <span class="badge" :class="getStatusClass(selectedAppointmentForTreatment.status)">{{ selectedAppointmentForTreatment.status }}</span>
                                </div>
                            </div>

                            <!-- Treatment Form -->
                            <form @submit.prevent="submitTreatment">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label fw-medium"><i class="bi bi-card-checklist me-2"></i>Visit Type <span class="text-danger">*</span></label>
                                        <select class="form-select" v-model="treatmentForm.visit_type" required>
                                            <option value="">Select Visit Type</option>
                                            <option value="consultation">Consultation</option>
                                            <option value="follow_up">Follow Up</option>
                                            <option value="emergency">Emergency</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label fw-medium"><i class="bi bi-heart-pulse me-2"></i>Diagnosis <span class="text-danger">*</span></label>
                                    <textarea class="form-control" rows="3" v-model="treatmentForm.diagnosis" 
                                            placeholder="Provide the diagnosis" required></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label fw-medium"><i class="bi bi-prescription2 me-2"></i>Prescribed Medicines <span class="text-danger">*</span></label>
                                    <textarea class="form-control" rows="3" v-model="treatmentForm.prescription" 
                                            placeholder="List prescribed medications with dosage" required></textarea>
                                </div>
                                
                                <div class="mb-4">
                                    <label class="form-label fw-medium"><i class="bi bi-file-text me-2"></i>Treatment Notes <span class="text-danger">*</span></label>
                                    <textarea class="form-control" rows="4" v-model="treatmentForm.treatment_notes" 
                                            placeholder="Additional notes, recommendations, and follow-up instructions" required></textarea>
                                </div>
                                
                                <div class="border-top pt-4">
                                    <button type="submit" class="btn btn-primary px-4 me-2" :disabled="!isFormComplete()">
                                        <i class="bi bi-save me-2"></i>Update Treatment
                                    </button>
                                    <button type="button" class="btn btn-success px-4" @click="markAsCompleted()" 
                                            :disabled="!isFormComplete() || selectedAppointmentForTreatment.status === 'completed'">
                                        <i class="bi bi-check-circle me-2"></i>Mark as Completed
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Patient Treatment History Page -->
    <div v-if="view === 'patient-treatment-history'" class="container mt-4">
        <div class="row justify-content-center">
            <div class="col-md-12">
                <div class="card shadow-sm border-0">
                    <div class="card-header bg-white border-bottom py-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <div class="bg-info bg-opacity-10 p-2 rounded-3 me-3">
                                    <i class="bi bi-clock-history text-info fs-5"></i>
                                </div>
                                <div>
                                    <h5 class="mb-0 fw-bold">Treatment History</h5>
                                    <small class="text-muted">{{ selectedPatientForHistory?.name }}</small>
                                </div>
                            </div>
                            <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" @click="backToAssignedPatients()">
                                <i class="bi bi-arrow-left me-1"></i> Back to Patients
                            </button>
                        </div>
                    </div>
                    <div class="card-body p-4">
                        <div v-if="selectedPatientForHistory">
                            <!-- Patient Info -->
                            <div class="alert alert-light border mb-4">
                                <h6 class="mb-3"><i class="bi bi-person-vcard me-2"></i>Patient Information</h6>
                                <div class="row">
                                    <div class="col-md-3">
                                        <strong>Name:</strong> {{ selectedPatientForHistory.name }}
                                    </div>
                                    <div class="col-md-3">
                                        <strong>Age:</strong> {{ selectedPatientForHistory.age }}
                                    </div>
                                    <div class="col-md-3">
                                        <strong>Gender:</strong> {{ selectedPatientForHistory.gender }}
                                    </div>
                                    <div class="col-md-3">
                                        <strong>Phone:</strong> {{ selectedPatientForHistory.phone }}
                                    </div>
                                </div>
                            </div>

                            <!-- Treatment History Table -->
                            <div class="table-responsive mb-3" v-if="selectedPatientForHistory.appointments && selectedPatientForHistory.appointments.length > 0">
                                <table class="table table-striped table-hover">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Date</th>
                                            <th>Slot</th>
                                            <th>Doctor</th>
                                            <th>Status</th>
                                            <th>Visit Type</th>
                                            <th>Diagnosis</th>
                                            <th>Prescription</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="appointment in selectedPatientForHistory.appointments" :key="appointment.id">
                                            <td>{{ appointment.appointment_date }}</td>
                                            <td>{{ formatTimeSlot(appointment.appointment_time) }}</td>
                                            <td>{{ appointment.doctor ? appointment.doctor.name : '-' }}</td>
                                            <td>
                                                <span class="badge" :class="getStatusClass(appointment.status)">
                                                    {{ appointment.status }}
                                                </span>
                                            </td>
                                            <td>{{ appointment.treatment ? appointment.treatment.visit_type : '-' }}</td>
                                            <td>{{ appointment.treatment ? appointment.treatment.diagnosis : '-' }}</td>
                                            <td>{{ appointment.treatment ? appointment.treatment.prescription : '-' }}</td>
                                            <td>{{ appointment.treatment ? appointment.treatment.notes : '-' }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div v-else class="text-center text-muted py-5">
                                <div class="mb-4">
                                    <i class="bi bi-inbox" style="font-size: 4rem; opacity: 0.3;"></i>
                                </div>
                                <h6 class="text-muted">No Treatment History</h6>
                                <p class="small text-muted mb-0">No treatment history found for this patient.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

const DoctorComponent = {
    template: DoctorDashboardTemplate,
    props: ['currentUser'],
    data() {
        return {
            view: 'dashboard',
            stats: {},
            doctorAppointments: [],
            doctorPatients: [],
            availabilityDays: [],
            selectedAppointmentForTreatment: null,
            selectedPatientForHistory: null,
            treatmentForm: {
                appointment_id: '',
                visit_type: '',
                diagnosis: '',
                prescription: '',
                treatment_notes: ''
            },
            appointmentToCancel: null,
            loading: false,
            error: null,
            success: null
        }
    },
    methods: {
        async loadDoctorData() {
            const dashboard = await window.ApiService.getDoctorDashboard()
            if (dashboard.success) {
                this.stats = dashboard.data
            }

            await this.loadAppointments()
            await this.loadPatients()
            await this.loadAvailabilityDays()
        },

        async loadAppointments() {
            const appointments = await window.ApiService.getDoctorAppointments('')
            if (appointments.success) {
                this.doctorAppointments = appointments.data.appointments.map((apt, idx) => ({
                    ...apt,
                    sr_no: idx + 1
                }))
            }
        },

        async loadPatients() {
            const patients = await window.ApiService.getDoctorPatients()
            if (patients.success) {
                this.doctorPatients = patients.data.patients.map((patient, idx) => ({
                    ...patient,
                    sr_no: idx + 1
                }))
            }
        },

        async loadAvailabilityDays() {
            try {
                const resp = await window.ApiService.getDoctorOwnAvailability()
                if (resp.success && resp.data && resp.data.availability) {
                    this.availabilityDays = resp.data.availability
                } else {
                    this.generateAvailabilityDays()
                }
            } catch (error) {
                this.generateAvailabilityDays()
            }
        },

        generateAvailabilityDays() {
            const days = []
            const today = new Date()
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(today)
                date.setDate(today.getDate() + i)
                const dateStr = date.toISOString().split('T')[0]
                const dayName = dayNames[date.getDay()] + ', ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                
                days.push({
                    date: dateStr,
                    day_name: dayName,
                    morning_available: false,
                    evening_available: false
                })
            }
            
            this.availabilityDays = days
        },

        async saveAvailability() {
            this.loading = true
            this.error = null
            this.success = null
            
            try {
                const slots = []
                for (const day of this.availabilityDays) {
                    if (day.morning_available) {
                        slots.push({
                            date: day.date,
                            slot_type: 'morning',
                            is_available: true
                        })
                    }
                    if (day.evening_available) {
                        slots.push({
                            date: day.date,
                            slot_type: 'evening',
                            is_available: true
                        })
                    }
                }
                
                if (slots.length === 0) {
                    this.error = 'Please select at least one slot'
                    this.loading = false
                    return
                }
                
                const resp = await window.ApiService.setDoctorSlots({ slots: slots })
                
                if (resp.success) {
                    this.success = 'Availability updated successfully!'
                    await this.loadAvailabilityDays()
                } else {
                    this.error = resp.message || 'Failed to update availability'
                }
            } catch (error) {
                this.error = 'Failed to save availability'
            }
            
            this.loading = false
        },

        async cancelDoctorAppointment(appointment) {
            this.appointmentToCancel = appointment;
            const modal = new bootstrap.Modal(document.getElementById('cancelDoctorAppointmentModal'));
            modal.show();
        },

        async confirmCancelAppointment() {
            if (!this.appointmentToCancel) return;
            
            const modalEl = document.getElementById('cancelDoctorAppointmentModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            this.loading = true;
            const resp = await window.ApiService.updateAppointmentStatus(this.appointmentToCancel.id, 'cancelled');
            if (resp.success) {
                this.success = 'Appointment cancelled successfully';
                await this.loadAppointments();
            } else {
                this.error = resp.message || 'Failed to cancel appointment';
            }
            this.loading = false;
            this.appointmentToCancel = null;
        },

        openTreatmentPage(appointment) {
            this.selectedAppointmentForTreatment = appointment
            this.treatmentForm = {
                appointment_id: appointment.id,
                visit_type: appointment.treatment ? appointment.treatment.visit_type : '',
                diagnosis: appointment.treatment ? appointment.treatment.diagnosis : '',
                prescription: appointment.treatment ? appointment.treatment.prescription : '',
                treatment_notes: appointment.treatment ? appointment.treatment.notes : ''
            }
            this.view = 'treatment-management'
        },

        async submitTreatment() {
            this.loading = true
            this.error = null
            const resp = await window.ApiService.updatePatientHistory(this.treatmentForm)
            if (resp.success) {
                this.success = 'Treatment record updated successfully'
                this.selectedAppointmentForTreatment.treatment = {
                    visit_type: this.treatmentForm.visit_type,
                    diagnosis: this.treatmentForm.diagnosis,
                    prescription: this.treatmentForm.prescription,
                    notes: this.treatmentForm.treatment_notes
                }
            } else {
                this.error = resp.message || 'Failed to update treatment record'
            }
            this.loading = false
        },

        async markAsCompleted() {
            if (!this.isFormComplete()) {
                this.error = 'Please complete all required fields before marking as completed'
                return
            }
            
            if (confirm('Mark this appointment as completed? This action cannot be undone.')) {
                this.loading = true
                this.error = null
                
                await this.submitTreatment()
                
                const resp = await window.ApiService.updateAppointmentStatus(
                    this.selectedAppointmentForTreatment.id, 
                    'completed'
                )
                
                if (resp.success) {
                    this.success = 'Appointment marked as completed successfully'
                    this.selectedAppointmentForTreatment.status = 'completed'
                    setTimeout(() => {
                        this.backToDoctorAppointments()
                    }, 2000)
                } else {
                    this.error = resp.message || 'Failed to complete appointment'
                }
                this.loading = false
            }
        },

        isFormComplete() {
            const form = this.treatmentForm
            return form.visit_type && form.diagnosis && form.prescription && form.treatment_notes
        },

        backToDoctorAppointments() {
            this.view = 'dashboard'
            this.selectedAppointmentForTreatment = null
            this.treatmentForm = {
                appointment_id: '',
                visit_type: '',
                diagnosis: '',
                prescription: '',
                treatment_notes: ''
            }
            this.loadAppointments()
        },

        async viewPatientTreatmentHistory(patient) {
            this.loading = true
            const resp = await window.ApiService.getPatientHistory(patient.id)
            if (resp) {
                this.selectedPatientForHistory = patient
                this.selectedPatientForHistory.appointments = resp.appointments || []
                this.view = 'patient-treatment-history'
            } else {
                this.error = 'Failed to load patient treatment history'
            }
            this.loading = false
        },

        backToAssignedPatients() {
            this.view = 'dashboard'
            this.selectedPatientForHistory = null
        },

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

        getStatusBadgeClass(status) {
            const classes = {
                'booked': 'bg-primary',
                'completed': 'bg-success',
                'cancelled': 'bg-danger',
                'available': 'bg-secondary'
            };
            return classes[status] || 'bg-secondary';
        },

        getStatusIcon(status) {
            const icons = {
                'booked': 'bi-calendar-check',
                'completed': 'bi-check-circle',
                'cancelled': 'bi-x-circle',
                'available': 'bi-clock'
            };
            return icons[status] || 'bi-circle';
        },

        capitalizeStatus(status) {
            if (!status) return '';
            return status.charAt(0).toUpperCase() + status.slice(1);
        },

        formatDisplayDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const options = { month: 'short', day: 'numeric', year: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        },

        getPatientPrefix() {
            return '';
        }
    },
    async mounted() {
        await this.loadDoctorData();
    }
};

window.DoctorComponent = DoctorComponent;
