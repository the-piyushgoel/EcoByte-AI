import api from './axios';

/**
 * Upload files for analysis.
 *
 * @param {File[]} files - Array of File objects to upload
 * @param {string} sessionName - Human-readable session name
 * @param {function} [onProgress] - Upload progress callback (0–100)
 * @returns {Promise<object>} Unwrapped response data
 */
export async function uploadFiles(files, sessionName, onProgress) {
  const formData = new FormData();

  // Build fileMeta as object keyed by original filename
  const fileMeta = {};
  files.forEach((file) => {
    fileMeta[file.name] = {
      lastModified: file.lastModified,
      size: file.size,
      type: file.type,
    };
  });

  // Backend Multer expects field name 'files' (not 'files[]')
  files.forEach((file) => {
    formData.append('files', file);
  });

  formData.append('sessionName', sessionName || '');
  formData.append('fileMeta', JSON.stringify(fileMeta));

  const response = await api.post('/analysis/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000, // 2 min for large uploads
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percent);
      }
    },
  });

  return response.data.data;
}

/**
 * Fetch paginated analysis sessions.
 *
 * @param {number} [page=1]
 * @param {number} [limit=10]
 * @param {string} [status] - Optional status filter
 * @returns {Promise<object>} { items: [], pagination: {} }
 */
export async function getSessions(page = 1, limit = 10, status) {
  const params = { page, limit };
  if (status) params.status = status;

  const response = await api.get('/analysis/sessions', { params });
  // Backend returns paginated: { data: [...], pagination: {...} }
  return response.data;
}

/**
 * Fetch a single session by ID.
 *
 * @param {string} sessionId
 * @returns {Promise<object>}
 */
export async function getSessionById(sessionId) {
  const response = await api.get(`/analysis/sessions/${sessionId}`);
  return response.data.data;
}

/**
 * Fetch files belonging to a session.
 *
 * @param {string} sessionId
 * @param {object} [params] - Query params for filtering/sorting
 * @returns {Promise<object>}
 */
export async function getSessionFiles(sessionId, params = {}) {
  const response = await api.get(`/analysis/sessions/${sessionId}/files`, {
    params,
  });
  return response.data;
}

/**
 * Fetch duplicate file groups for a session.
 *
 * @param {string} sessionId
 * @returns {Promise<object>}
 */
export async function getSessionDuplicates(sessionId) {
  const response = await api.get(`/analysis/sessions/${sessionId}/duplicates`);
  return response.data.data;
}

/**
 * Delete a session and all its associated data.
 *
 * @param {string} sessionId
 * @returns {Promise<object>}
 */
export async function deleteSession(sessionId) {
  const response = await api.delete(`/analysis/sessions/${sessionId}`);
  return response.data.data;
}

/**
 * Fetch global analysis statistics.
 *
 * @returns {Promise<object>}
 */
export async function getGlobalStats() {
  const response = await api.get('/analysis/stats');
  return response.data.data;
}

/**
 * Health check endpoint.
 *
 * @returns {Promise<object>}
 */
export async function checkHealth() {
  const response = await api.get('/health');
  return response.data.data;
}
