// Global utilities for Vue CDN app (no build step)
// Expose as window.UtilsModule

(function() {
  const getStatusClass = function(status) {
    switch (status) {
      case 'booked': return 'status-booked'
      case 'completed': return 'status-completed'
      case 'cancelled': return 'status-cancelled'
      case 'available': return 'status-available'
      default: return 'status-pending'
    }
  }

  const getTodayDate = function() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  const getPatientPrefix = function() {
    return ''
  }

  window.UtilsModule = {
    getStatusClass,
    getTodayDate,
    getPatientPrefix
  }
})();

