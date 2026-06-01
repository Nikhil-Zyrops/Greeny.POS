// Configuration file for dynamic API URL injection
(function() {
  // Check if API_BASE_URL is already set (e.g., from HTML inline script)
  if (typeof window !== 'undefined' && !window.API_BASE_URL) {
    // Try to get from environment variable or use default
    window.API_BASE_URL = 'http://localhost:3000';
  }
})();
