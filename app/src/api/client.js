const config = window.igniteBookings || { restUrl: '/wp-json/ignite/v1/', nonce: '' };

export const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${config.restUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-WP-Nonce': config.nonce,
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      // 🛡️ SECURITY STEP 1: Inspect the Content-Type header before attempting to parse it as JSON [INDEX]!
      const contentType = response.headers.get('Content-Type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        // If the content is valid JSON, safe-parse it securely [INDEX]
        data = await response.json();
      } else {
        // 🔮 SELF-HEALING FALLBACK: Intercept raw text dumps (HTML errors, server crashes) cleanly [INDEX]
        const rawText = await response.text();
        
        if (!response.ok) {
          // If the server crashed with an HTML payload, strip out a clean message or throw a safe fallback string [INDEX]
          throw new Error(
            rawText.includes('</div>') 
              ? 'The booking database is undergoing optimization. Please try again in a few moments.'
              : rawText.substring(0, 100) || 'Unexpected network communication format.'
          );
        }
        return rawText; // Fallback return for non-JSON success responses
      }

      // 🛡️ SECURITY STEP 2: Handle response failure codes with an intelligent WordPress Error Normalizer [INDEX]
      if (!response.ok) {
        let normalizedErrorMessage = 'API Execution Error';

        if (data) {
          // 🧠 WORDPRESS ERROR NORMALIZATION MATRIX: Digs through nested WP REST structures to extract the true error message [INDEX]
          if (typeof data === 'string') {
            normalizedErrorMessage = data;
          } else if (data.message) {
            normalizedErrorMessage = data.message;
          } else if (Array.isArray(data) && data[0]?.message) {
            normalizedErrorMessage = data[0].message;
          } else if (data.code && data.data?.status) {
            normalizedErrorMessage = `${data.code}: ${data.message || 'Validation Failure'}`;
          } else if (typeof data === 'object') {
            // Fallback for custom associative error arrays
            const firstKey = Object.keys(data)[0];
            normalizedErrorMessage = typeof data[firstKey] === 'string' ? data[firstKey] : normalizedErrorMessage;
          }
        }

        throw new Error(normalizedErrorMessage);
      }

      return data;

    } catch (error) {
      // Catch any lower-level runtime or structural network anomalies cleanly
      console.error(`[API Network Exception Tracking Key -> ${endpoint}]:`, error);
      
      // Normalize generic browser connection drop strings into actionable user-friendly logs [INDEX]
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Connection to the checkout desk lost. Please verify your internet link and try again.');
      }
      
      throw error; // Pass the normalized error message back up to the layout notification toasts cleanly [INDEX]
    }
  }
};