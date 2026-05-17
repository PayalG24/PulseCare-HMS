const { createApp } = Vue

// Hospital Management App - PulseCare
const App = {
  data() {
    return {
      currentUser: null,
      currentView: "home",
      appView: "dashboard",
      loading: false,
      error: null,
      success: null,
      stats: {},
      loginForm: {
        username: '',
        password: ''
      },
      registerForm: {
        username: '',
        email: '',
        password: '',
        name: ''
      },
            // Admin data
            doctors: [],
            patients: [],
            appointments: [],
            appointmentFilter: 'all', // 'all', 'upcoming', 'available', 'past'
            filteredAppointments: [],
            doctorSearchQuery: '',
            patientSearchQuery: '',
            doctorDepartmentFilter: '',
            doctorDepartments: [],
            filteredDoctors: [],
            filteredPatients: [],
            adminView: 'dashboard', // 'dashboard', 'add-doctor', 'edit-doctor', 'edit-patient', 'patient-history', 'departments', 'add-department', 'edit-department'
      newDoctor: {
        name: '',
        email: '',
        department_id: '',
        experience: '',
        phone: '',
        qualification: ''
      },
      editingPatient: null,
      selectedPatient: null,
      patientHistory: [],
      newPatient: {
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        address: '',
        medical_history: '',
        emergency_contact: ''
      },
      // Doctor data
      doctorAppointments: [],
      doctorPatients: [],
      doctorAvailableSlots: [],
      appointmentFilter: 'all',
      selectedPatientHistory: null,
      treatmentForm: {
        appointment_id: '',
        visit_type: '',
        diagnosis: '',
        prescription: '',
        treatment_notes: ''
      },
      // Complete treatment form for appointment completion
      completeTreatmentForm: {
        diagnosis: '',
        prescription: '',
        treatment_notes: ''
      },
      selectedAppointmentForTreatment: null,
      selectedPatientForHistory: null,
      profileForm: {
        name: '',
        department_id: '',
        experience: '',
        phone: '',
        qualification: '',
        consultation_fee: ''
      },
      // Patient data
      departments: [],
      availableDoctors: [],
      patientAppointments: [],
  treatments: [],
  allPatientAppointments: [], // Unified appointments (both current and past)
  selectedAppointmentHistory: null, // For appointment history modal
      selectedDepartment: null,
      selectedDoctor: null,
      availableSlots: [],
      patientInfo: null,
      bookingForm: {
        department_id: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        notes: ''
      },
      // Doctor availability data
      availabilityDays: [], // 7-day availability schedule
      // Auth check flag
      authCheckInProgress: false
    }
  },

  computed: {
    // Get today's date in YYYY-MM-DD format for min date attribute
    minBookingDate() {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  },

  methods: {
    // Get specialization description
    getSpecializationDescription(specialization) {
      const descriptions = {
        'Cardiology': 'Heart and blood vessel disorders',
        'Neurology': 'Brain and nervous system conditions',
        'Orthopedics': 'Bone, joint and muscle treatment',
        'Psychiatry': 'Mental health and emotional disorders',
        'Dermatology': 'Skin, hair and nail conditions',
        'Pediatrics': 'Healthcare for infants and children',
        'Gynecology': 'Women\'s reproductive health care',
        'ENT': 'Ear, nose and throat treatment',
        'Ophthalmology': 'Eye care and vision problems'
      }
      return descriptions[specialization] || 'Specialized medical care and treatment'
    },

    // Get doctor name from treatment
    getTreatmentDoctor(treatment) {
        // Try to get doctor from treatment data directly
        if (treatment.doctor && treatment.doctor.name) {
            return 'Dr. ' + treatment.doctor.name
        }
        // Try to get doctor from appointment
        if (treatment.appointment && treatment.appointment.doctor) {
            return 'Dr. ' + treatment.appointment.doctor.name
        }
        return 'N/A'
    },

  // Truncate text for table display
  truncateText(text, maxLength = 50) {
    if (!text) return 'N/A'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  },
    openProfilePage() {
      this.appView = 'profile'
    },
    openDashboard() {
      this.appView = 'dashboard'
    },
    async checkAuth() {
      if (this.authCheckInProgress) {
        return
      }
      
      this.authCheckInProgress = true
      const response = await window.ApiService.getCurrentUser()
      if (response && response.success) {
        this.currentUser = response.data.user
        console.log('checkAuth - Current user set:', this.currentUser)
        console.log('checkAuth - User role:', this.currentUser.role)
        this.currentView = 'dashboard'
        this.appView = 'dashboard'
        await this.loadDashboardData()
      } else {
        this.currentUser = null
        this.currentView = "home"
      }
      this.authCheckInProgress = false
    },

    async handleLogin() {
      this.loading = true
      this.error = null

      const response = await window.ApiService.login(this.loginForm)
      if (response.success) {
        this.currentUser = response.data.user
        console.log('handleLogin - User logged in:', this.currentUser)
        console.log('handleLogin - User role:', this.currentUser.role)
        this.success = 'Welcome back, ' + this.currentUser.username + '!'
        this.currentView = 'dashboard'
        this.appView = 'dashboard'
        await this.loadDashboardData()
      } else {
        this.error = response.message || 'Login failed'
      }
      this.loading = false
    },

    async handleRegister() {
      this.loading = true
      this.error = null

      const response = await window.ApiService.register(this.registerForm)
      if (response.success) {
        this.success = 'Registration successful! Please login to continue.'
        this.currentView = 'login'
        this.registerForm = {
          username: '',
          email: '',
          password: '',
          name: ''
        }
      } else {
        this.error = response.message || 'Registration failed'
      }
      this.loading = false
    },

    async logout() {
      await window.ApiService.logout()
      this.currentUser = null
      this.currentView = "home"
      this.error = null
      this.stats = {}
      this.clearAllData()
    },

    clearAllData() {
      this.doctors = []
      this.patients = []
      this.appointments = []
      this.doctorAppointments = []
      this.doctorPatients = []
      this.patientAppointments = []
      this.treatments = []
      this.allPatientAppointments = []
      this.selectedAppointmentHistory = null
      this.selectedAppointmentForTreatment = null
      this.departments = []
      this.availableDoctors = []
    },

    async loadDashboardData() {
      if (!this.currentUser) return

      console.log('Loading dashboard for role:', this.currentUser.role)
      console.log('Current user object:', this.currentUser)

      if (this.currentUser.role === 'admin') {
        await this.loadAdminData()
      } else if (this.currentUser.role === 'doctor') {
        await this.loadDoctorData()
      } else if (this.currentUser.role === 'patient') {
        await this.loadPatientData()
      }
    },

    // Open treatment modal for appointment completion
    openTreatmentModal(appointment) {
      this.selectedAppointmentForTreatment = appointment
      this.completeTreatmentForm = {
        diagnosis: '',
        prescription: '',
        treatment_notes: ''
      }
      // Show modal using Bootstrap
      const modal = new bootstrap.Modal(document.getElementById('completeTreatmentModal'))
      modal.show()
    },

    // Complete appointment with treatment notes
    async completeAppointmentWithTreatment() {
      if (!this.completeTreatmentForm.diagnosis.trim()) {
        this.error = 'Diagnosis is required to complete appointment'
        return
      }
      
      if (!this.completeTreatmentForm.treatment_notes.trim()) {
        this.error = 'Treatment notes are required to complete appointment'
        return
      }

      this.loading = true
      this.error = null

      try {
        // First create treatment record
        const treatmentData = {
          appointment_id: this.selectedAppointmentForTreatment.id,
          visit_type: 'consultation',
          diagnosis: this.completeTreatmentForm.diagnosis,
          prescription: this.completeTreatmentForm.prescription,
          treatment_notes: this.completeTreatmentForm.treatment_notes
        }

        const treatmentResponse = await window.ApiService.updatePatientHistory(treatmentData)
        
        if (treatmentResponse.success) {
          // Then mark appointment as completed
          const statusResponse = await window.ApiService.updateAppointmentStatus(
            this.selectedAppointmentForTreatment.id, 
            'completed'
          )
          
          if (statusResponse.success) {
            this.success = 'Appointment completed successfully with treatment notes'
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('completeTreatmentModal'))
            if (modal) modal.hide()
            
            // Clear form
            this.selectedAppointmentForTreatment = null
            this.completeTreatmentForm = {
              diagnosis: '',
              prescription: '',
              treatment_notes: ''
            }
            
            // Reload appointments
            await this.loadDoctorData()
          } else {
            this.error = statusResponse.message || 'Failed to update appointment status'
          }
        } else {
          this.error = treatmentResponse.message || 'Failed to add treatment record'
        }
      } catch (error) {
        this.error = error.message || 'Failed to complete appointment'
      } finally {
        this.loading = false
      }
    },

    async loadAdminData() {
      const stats = await window.ApiService.getAdminStats()
      if (stats.success) {
        this.stats = stats.data
      }
      
      const doctors = await window.ApiService.getDoctors()
      if (doctors.success) {
        this.doctors = doctors.data.doctors
        this.filteredDoctors = this.doctors.slice()
        this.doctorDepartments = []
        for (let i = 0; i < this.doctors.length; i++) {
          if (this.doctorDepartments.indexOf(this.doctors[i].department) === -1) {
            this.doctorDepartments.push(this.doctors[i].department)
          }
        }
      }

      const allDeps = await window.ApiService.getDepartments()
      if (allDeps.success) {
        this.allDepartments = allDeps.data.departments
      }
      
      const patients = await window.ApiService.getPatients()
      if (patients.success) {
        this.patients = patients.data.patients
        this.filteredPatients = this.patients.slice()
      }
      
      const appointments = await window.ApiService.getAppointments()
      if (appointments.success) {
        this.appointments = appointments.data.appointments
        this.filterAppointments()
      }
    },

    async loadDoctorData() {
      await window.DoctorModule.loadDoctorData(this)
    },

    async saveAvailability() {
      await window.DoctorModule.saveAvailability(this)
    },

    async loadPatientData() {
      await window.PatientModule.loadPatientData(this)
    },

    mergeAppointmentsAndTreatments() {
      const allAppts = []
      
      // Collect appointment IDs that already have treatments
      const appointmentIdsWithTreatments = new Set()
      
      if (this.patientAppointments && this.patientAppointments.length > 0) {
        for (let i = 0; i < this.patientAppointments.length; i++) {
          const apt = this.patientAppointments[i]
          allAppts.push({
            id: apt.id,
            appointment_date: apt.appointment_date,
            appointment_time: apt.appointment_time,
            doctor: apt.doctor,
            department: apt.department || (apt.doctor ? apt.doctor.specialization : 'N/A'),
            status: apt.status,
            type: 'appointment',
            treatment: apt.treatment
          })
          
          // Track appointments that already have treatment data
          if (apt.treatment) {
            appointmentIdsWithTreatments.add(apt.id)
          }
        }
      }
      
      // Only add treatments that don't have a corresponding appointment already shown
      if (this.treatments && this.treatments.length > 0) {
        for (let i = 0; i < this.treatments.length; i++) {
          const treat = this.treatments[i]
          
          // Skip if this treatment's appointment is already in the list
          if (treat.appointment_id && appointmentIdsWithTreatments.has(treat.appointment_id)) {
            continue
          }
          
          allAppts.push({
            id: 'treatment_' + treat.id,
            appointment_date: treat.created_at ? treat.created_at.split('T')[0] : '',
            appointment_time: treat.created_at ? treat.created_at.split('T')[1].split('.')[0] : '00:00',
            doctor: treat.doctor || null,
            department: treat.doctor ? treat.doctor.specialization : 'N/A',
            status: 'completed',
            type: 'treatment',
            treatment: treat
          })
        }
      }
      
      allAppts.sort(function(a, b) {
        const dateA = new Date(a.appointment_date + 'T' + a.appointment_time)
        const dateB = new Date(b.appointment_date + 'T' + b.appointment_time)
        return dateB - dateA
      })
      
      this.allPatientAppointments = allAppts
    },

    // Show appointment history on separate page
    showAppointmentHistory(appointment) {
      this.selectedAppointmentHistory = appointment
      // Navigate to appointment history view
      this.appView = 'appointment-history'
    },

    // Go back to appointments dashboard from history
    goBackToAppointments() {
      this.selectedAppointmentHistory = null
      // Navigate back to main dashboard
      this.appView = 'dashboard'
    },

    formatDateTime(date, time) {
      if (!date) return 'N/A'
      
      const dateObj = new Date(date)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const formattedDate = months[dateObj.getMonth()] + ' ' + dateObj.getDate() + ', ' + dateObj.getFullYear()
      
      if (time && time !== '00:00') {
        const parts = time.split(':')
        const hours = parseInt(parts[0])
        const minutes = parts[1]
        const hour12 = hours % 12 || 12
        const ampm = hours >= 12 ? 'PM' : 'AM'
        return formattedDate + ' at ' + hour12 + ':' + minutes + ' ' + ampm
      } else {
        return formattedDate
      }
    },

    // Format time slot (1 hour duration)
    formatTimeSlot(time) {
        if (!time) return 'N/A';
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

    // Capitalize status for display
    capitalizeStatus(status) {
      if (!status) return 'N/A'
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    },

    // Admin methods
    async addDoctor() {
      this.loading = true
      this.error = null

      try {
        const response = await window.ApiService.createDoctor(this.newDoctor)
        if (response.success) {
          this.success = 'Doctor added successfully'
          this.newDoctor = {
            username: '',
            email: '',
            password: '',
            name: '',
            department_id: '',
            experience: '',
            phone: '',
            qualification: ''
          }
          await this.loadAdminData()
        } else {
          this.error = response.message || 'Failed to add doctor'
        }
      } catch (error) {
        this.error = error.message || 'Failed to add doctor'
      } finally {
        this.loading = false
      }
    },

    async deleteDoctor(doctorId) {
      if (confirm('Are you sure you want to delete this doctor?')) {
        try {
          const response = await window.ApiService.deleteDoctor(doctorId)
          if (response.success) {
            this.success = 'Doctor deleted successfully'
            await this.loadAdminData()
          }
        } catch (error) {
          this.error = 'Failed to delete doctor'
        }
      }
    },

    // Doctor methods
    async completeAppointment(appointment) {
      if (confirm('Mark this appointment as completed?')) {
        try {
          const response = await window.ApiService.updateAppointment(appointment.id, { status: 'completed' })
          if (response.success) {
            this.success = 'Appointment marked as completed'
            await this.loadDoctorData()
          }
        } catch (error) {
          this.error = 'Failed to update appointment'
        }
      }
    },

    async cancelAppointment(appointmentId) {
      if (confirm('Cancel this appointment?')) {
        try {
          const response = await window.ApiService.updateAppointment(appointmentId, { status: 'cancelled' })
          if (response.success) {
            this.success = 'Appointment cancelled'
            await this.loadDoctorData()
          }
        } catch (error) {
          this.error = 'Failed to cancel appointment'
        }
      }
    },

    async addTreatment() {
      this.loading = true
      this.error = null

      try {
        const response = await window.ApiService.updatePatientHistory(this.treatmentForm)
        if (response.success) {
          this.success = 'Treatment record added successfully'
          this.treatmentForm = {
            appointment_id: '',
            visit_type: '',
            diagnosis: '',
            prescription: '',
            treatment_notes: ''
          }
          await this.loadDoctorData()
        } else {
          this.error = response.message || 'Failed to add treatment record'
        }
      } catch (error) {
        this.error = error.message || 'Failed to add treatment record'
      } finally {
        this.loading = false
      }
    },

    // Doctor Treatment Management Methods
    openTreatmentPage(appointment) {
      window.DoctorModule.openTreatmentPage(this, appointment)
    },

    async submitTreatment() {
      await window.DoctorModule.submitTreatment(this)
    },

    async markAsCompleted() {
      await window.DoctorModule.markAsCompleted(this)
    },

    isFormComplete() {
      return window.DoctorModule.isFormComplete(this)
    },

    backToDoctorAppointments() {
      window.DoctorModule.backToDoctorAppointments(this)
    },

    viewPatientTreatmentHistory(patient) {
      window.DoctorModule.viewPatientTreatmentHistory(this, patient)
    },

    backToAssignedPatients() {
      window.DoctorModule.backToAssignedPatients(this)
    },

    async cancelDoctorAppointment(appointmentId) {
      if (confirm('Are you sure you want to cancel this appointment?')) {
        const response = await window.ApiService.updateAppointmentStatus(appointmentId, 'cancelled')
        if (response.success) {
          this.success = 'Appointment cancelled successfully'
          await this.loadDoctorData()
        } else {
          this.error = response.message || 'Failed to cancel appointment'
        }
      }
    },

    // Patient methods
    async loadDoctorsByDepartment() { await window.PatientModule.loadDoctorsByDepartment(this) },

    async bookAppointment() {
      this.loading = true
      this.error = null

      try {
        const response = await window.ApiService.bookAppointment(this.bookingForm)
        if (response.success) {
          this.success = 'Appointment booked successfully'
          this.bookingForm = {
            department_id: '',
            doctor_id: '',
            appointment_date: '',
            appointment_time: '',
            notes: ''
          }
          await this.loadPatientData()
        } else {
          this.error = response.message || 'Failed to book appointment'
        }
      } catch (error) {
        this.error = error.message || 'Failed to book appointment'
      } finally {
        this.loading = false
      }
    },

    async cancelPatientAppointment(appointmentId) {
      if (confirm('Are you sure you want to cancel this appointment?')) {
        try {
          const response = await window.ApiService.cancelAppointment(appointmentId)
          if (response.success) {
            this.success = 'Appointment cancelled successfully'
            await this.loadPatientData()
          }
        } catch (error) {
          this.error = 'Failed to cancel appointment'
        }
      }
    },

    async exportHistory() {
      try {
        this.loading = true
        const response = await window.ApiService.exportPatientHistory()
        if (response.success) {
          this.success = response.message
        } else {
          this.error = response.message || 'Failed to start CSV export'
        }
      } catch (error) {
        this.error = 'Failed to start CSV export'
      } finally {
        this.loading = false
      }
    },

    getStatusClass(status) {
      switch (status) {
        case 'booked': return 'bg-info text-white'
        case 'completed': return 'bg-success text-white'
        case 'cancelled': return 'bg-danger text-white'
        case 'available': return 'bg-dark text-white'
        default: return 'bg-secondary text-white'
      }
    },

    async loadAvailableSlots() {
      if (this.bookingForm.doctor_id && this.bookingForm.appointment_date) {
        try {
          const response = await window.ApiService.getAvailableSlots(
            this.bookingForm.doctor_id, 
            this.bookingForm.appointment_date
          )
          if (response.success) {
            this.availableSlots = response.data.slots
          }
        } catch (error) {
          this.error = 'Failed to load available slots'
        }
      }
    },

    // Admin methods
    async addDoctor() {
      this.loading = true
      this.error = null

      try {
        const response = await window.ApiService.addDoctor(this.newDoctor)
        if (response.success) {
          this.success = 'Doctor account created successfully!'
          this.newDoctor = {
            name: '',
            email: '',
            department_id: '',
            experience: '',
            phone: '',
            qualification: ''
          }
          await this.loadDashboardData()
        } else {
          this.error = response.message || 'Failed to create doctor account'
        }
      } catch (error) {
        this.error = error.message || 'Failed to create doctor account'
      } finally {
        this.loading = false
      }
    },

    async generateMonthlyReport() {
      try {
        const response = await window.ApiService.generateMonthlyReport()
        if (response.success) {
          this.success = 'Monthly report generated successfully!'
        }
      } catch (error) {
        this.error = 'Failed to generate monthly report'
      }
    },

    searchDoctors() {
      if (!this.doctorSearchQuery.trim()) {
        this.filteredDoctors = this.doctors.slice()
      } else {
        const query = this.doctorSearchQuery.toLowerCase()
        this.filteredDoctors = []
        for (let i = 0; i < this.doctors.length; i++) {
          const doctor = this.doctors[i]
          if (doctor.name.toLowerCase().indexOf(query) !== -1 || 
              doctor.department.toLowerCase().indexOf(query) !== -1) {
            this.filteredDoctors.push(doctor)
          }
        }
      }
    },

    clearDoctorSearch() {
      this.doctorSearchQuery = ''
      this.filteredDoctors = this.doctors.slice()
    },

    filterDoctorsByDepartment() {
      if (!this.doctorDepartmentFilter) {
        this.filteredDoctors = this.doctors.slice()
      } else {
        this.filteredDoctors = []
        for (let i = 0; i < this.doctors.length; i++) {
          if (this.doctors[i].department === this.doctorDepartmentFilter) {
            this.filteredDoctors.push(this.doctors[i])
          }
        }
      }
    },

    async toggleDoctorStatus(doctor) {
      const action = doctor.is_active ? 'blacklist' : 'activate'
      const actionText = doctor.is_active ? 'blacklist' : 'activate'
      
      if (confirm(`Are you sure you want to ${actionText} Dr. ${doctor.name}?`)) {
        try {
          const response = await window.ApiService.updateDoctor(doctor.id, { is_active: !doctor.is_active })
          if (response.success) {
            this.success = `Doctor ${actionText}ed successfully`
            await this.loadAdminData()
          }
        } catch (error) {
          this.error = `Failed to ${actionText} doctor`
        }
      }
    },

    getPatientPrefix() {
      // Return empty string to display patient names without any prefix
      return ''
    },

    // Admin methods
    editDoctor(doctor) {
      this.editingDoctor = { ...doctor };
      this.adminView = 'edit-doctor';
    },

    async updateDoctor() {
      try {
        this.loading = true;
        const response = await window.ApiService.updateDoctor(this.editingDoctor.id, this.editingDoctor);
        if (response.success) {
          this.success = 'Doctor updated successfully!';
          this.adminView = 'dashboard';
          await this.loadAdminData();
        } else {
          this.error = response.message || 'Failed to update doctor';
        }
      } catch (error) {
        this.error = 'Error updating doctor: ' + error.message;
      } finally {
        this.loading = false;
      }
    },

    async addDoctor() {
      try {
        this.loading = true;
        const response = await window.ApiService.addDoctor(this.newDoctor);
        if (response.success) {
          this.success = 'Doctor added successfully!';
          this.adminView = 'dashboard';
          this.newDoctor = {
            name: '',
            email: '',
            department_id: '',
            experience: '',
            phone: '',
            qualification: '',
            consultation_fee: ''
          };
          await this.loadAdminData();
        } else {
          this.error = response.message || 'Failed to add doctor';
        }
      } catch (error) {
        this.error = 'Error adding doctor: ' + error.message;
      } finally {
        this.loading = false;
      }
    },

    showAddDoctorForm() {
      this.adminView = 'add-doctor';
    },

    async searchPatients() {
      if (!this.patientSearchQuery.trim()) {
        this.filteredPatients = this.patients;
        return;
      }
      this.filteredPatients = this.patients.filter(patient =>
        patient.name.toLowerCase().includes(this.patientSearchQuery.toLowerCase())
      );
    },

    clearPatientSearch() {
      this.patientSearchQuery = '';
      this.filteredPatients = this.patients;
    },

    async togglePatientBlacklist(patient) {
      if (window.AdminModule && window.AdminModule.togglePatientBlacklist) {
        await window.AdminModule.togglePatientBlacklist(this, patient);
      }
    },

    openAdminPatientEdit(patient) {
      if (window.AdminModule && window.AdminModule.openAdminPatientEdit) {
        window.AdminModule.openAdminPatientEdit(this, patient);
      }
    },

    openAdminPatientHistory(patient) {
      if (window.AdminModule && window.AdminModule.openAdminPatientHistory) {
        window.AdminModule.openAdminPatientHistory(this, patient);
      }
    },

    async updatePatient() {
      if (window.AdminModule && window.AdminModule.updatePatient) {
        await window.AdminModule.updatePatient(this);
      }
    },

    showAddPatientForm() {
      if (window.AdminModule && window.AdminModule.showAddPatientForm) {
        window.AdminModule.showAddPatientForm(this);
      }
    },

    async addPatient() {
      if (window.AdminModule && window.AdminModule.addPatient) {
        await window.AdminModule.addPatient(this);
      }
    },

    backToAdminDashboard() {
      this.adminView = 'dashboard';
      this.selectedPatient = null;
      this.patientHistory = [];
    },

    // Appointment filtering methods - simplified to show only relevant appointments

    filterAppointments() {
      // Show only booked, cancelled, and completed appointments (exclude available slots)
      this.filteredAppointments = this.appointments.filter(appointment => 
        appointment.status === 'booked' || 
        appointment.status === 'cancelled' || 
        appointment.status === 'completed'
      );
    },

    async updateProfile() {
      try {
        this.loading = true;
        if (this.currentUser.role === 'doctor') {
          const response = await window.ApiService.updateDoctorProfile(this.profileForm);
          if (response.success) {
            this.success = 'Profile updated successfully!';
            this.doctorInfo = { ...this.doctorInfo, ...this.profileForm };
          } else {
            this.error = response.message || 'Failed to update profile';
          }
        } else if (this.currentUser.role === 'patient') {
          const response = await window.ApiService.updatePatientProfile(this.profileForm);
          if (response.success) {
            this.success = 'Profile updated successfully!';
            this.patientInfo = { ...this.patientInfo, ...this.profileForm };
          } else {
            this.error = response.message || 'Failed to update profile';
          }
        }
      } catch (error) {
        this.error = 'Error updating profile: ' + error.message;
      } finally {
        this.loading = false;
      }
    },

    // Patient methods
    selectDepartment(department) { window.PatientModule.selectDepartment(this, department) },

    selectDoctor(doctor) { window.PatientModule.selectDoctor(this, doctor) },

    async loadAvailableSlots() {
      if (this.bookingForm.doctor_id && this.bookingForm.appointment_date) {
        try {
          const response = await window.ApiService.getAvailableSlots(this.bookingForm.doctor_id, this.bookingForm.appointment_date);
          if (response.success) {
            this.availableSlots = response.data.slots || [];
          }
        } catch (error) {
          console.error('Error loading available slots:', error);
        }
      }
    },

    getTodayDate() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    },

    showEditProfile() {
      if (this.currentUser.role === 'doctor') {
        // Switch to profile tab in doctor dashboard
        const profileTab = document.getElementById('profile-tab');
        if (profileTab) {
          profileTab.click();
        }
      } else if (this.currentUser.role === 'patient') {
        // Switch to edit profile tab in patient dashboard
        const editProfileTab = document.getElementById('edit-profile-tab');
        if (editProfileTab) {
          editProfileTab.click();
        }
      }
    }
  },

  async created() {
    await this.checkAuth()
  },

  mounted() {
    // Add loaded class to prevent template flashing
    this.$nextTick(() => {
      document.getElementById('app').classList.add('loaded')
    })
  }
}

// Create and mount Vue app
const app = createApp(App)
app.component('admin-component', window.AdminComponent)
app.component('doctor-component', window.DoctorComponent)
app.component('patient-component', window.PatientComponent)
app.mount("#app")