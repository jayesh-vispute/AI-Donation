export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  const url = `${API_URL}/api${endpoint}`;
  
  // Inject auth token if it exists
  const token = localStorage.getItem('authToken');
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(errorData.detail || errorData.message || errorData.error?.message || `Request failed (${response.status})`);
      err.status = response.status;
      err.detail = errorData.detail;
      throw err;
    }

    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Network') || error.message.includes('Failed to fetch'))) {
      throw new Error(`Cannot connect to backend server at ${API_URL}. Please ensure the backend is running.`);
    }
    throw error;
  }
}

export const api = {
  // ===== Auth =====
  login: (data) => request('/auth/login', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
    body: new URLSearchParams(data) 
  }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  registerNgo: (data) => request('/auth/register/ngo', { method: 'POST', body: JSON.stringify(data) }),
  getMe: (token) => request('/auth/me', { headers: { 'Authorization': `Bearer ${token}` } }),
  loginWithGoogle: (data) => request('/auth/google', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  // ===== AI Detection (REAL API) =====
  predictImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/ai/predict', { method: 'POST', body: formData });
  },

  // ===== Donations =====
  saveDonation: (data) => request('/donations', { method: 'POST', body: JSON.stringify(data) }),
  updateDonation: (id, data) => request(`/donations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getDonations: () => request('/donations'),
  getDonation: (id) => request(`/donations/${id}`),
  getDonationHistory: (id) => request(`/status/donations/${id}`),
  getDonationMatches: (id) => request(`/donations/${id}/item-matches`),
  getDonationItemMatches: (id) => request(`/donations/${id}/item-matches`),
  allocateItemNgo: (itemId, data) => request(`/donations/items/${itemId}/allocate`, { method: 'POST', body: JSON.stringify(data) }),
  getDeliveryOtp: (id) => request(`/donations/${id}/delivery-otp`),
  resendDeliveryOtp: (id) => request(`/donations/${id}/delivery-otp/resend`, { method: 'POST' }),
  confirmDonationReceipt: (id, data) => request(`/status/donations/${id}/receipt`, { method: 'POST', body: JSON.stringify(data) }),

  // ===== Demands =====
  getDemands: () => request('/demands'),
  getMyDemands: () => request('/demands/me'),
  getDemand: (id) => request(`/demands/${id}`),
  createDemand: (data) => request('/demands', { method: 'POST', body: JSON.stringify(data) }),
  updateDemand: (id, data) => request(`/demands/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDemand: (id) => request(`/demands/${id}`, { method: 'DELETE' }),

  // ===== Matches =====
  getMatches: () => request('/matches'),
  getMatch: (id) => request(`/matches/${id}`),
  findMatches: (donationId) => request(`/matches/find`, { method: 'POST', body: JSON.stringify({ donation_id: donationId }) }),

  // ===== Pickup =====
  schedulePickup: (id, data) => request(`/pickup/donations/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  updatePickup: (id, data) => request(`/pickup/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getPickups: () => request('/pickup/slots'),
  getPickupDetails: (id) => request(`/pickup/donations/${id}`),

  // ===== Notifications =====
  getNotifications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/notifications/${query ? '?' + query : ''}`);
  },
  getUnreadCount: () => request('/notifications/unread-count'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),

  // ===== NGO =====
  getNgos: () => request('/ngos'),
  getNgo: (id) => request(`/ngos/${id}`),
  getNgoAnalytics: () => request('/ngos/analytics'),
  getNgoProfile: () => request('/ngos/me'),
  updateNgoProfile: (data) => request('/ngos/me', { method: 'PUT', body: JSON.stringify(data) }),
  uploadNgoLogo: async (formData) => {
    // Custom request for multipart/form-data
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/ngos/me/logo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Upload failed');
    return data;
  },
  uploadNgoDocument: async (docType, formData) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/ngos/me/documents/${docType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Document upload failed');
    return data;
  },

  // ===== Admin =====
  getAdminStats: () => request('/admin/dashboard'),
  getSystemHealth: () => request('/health'),
  getImpactMetrics: () => request('/admin/dashboard'),
  getAdminUsers: () => request('/admin/users'),
  createAdminUser: (data) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  getAdminDonors: () => request('/admin/donors'),
  getAdminNgos: () => request('/admin/ngos'),
  getAdminNgoById: (id) => request(`/admin/ngos/${id}`),
  getAdminDonations: () => request('/admin/donations'),
  getAdminDetections: () => request('/admin/ai/detections'),
  getAdminAiStats: () => request('/admin/ai/statistics'),
  updateNgoStatus: (id, status) => request(`/admin/ngos/${id}/${status.toLowerCase()}`, { method: 'PUT' }),
  updateAdminUser: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleAdminUserStatus: (id) => request(`/admin/users/${id}/toggle-status`, { method: 'PUT' }),
  deleteAdminUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  // ===== User Profile =====
  getProfile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // ===== NEW ADMIN ROUTES =====
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  
  getAdminInventory: () => request('/admin/inventory'),
  getAdminDetections: () => request('/admin/ai/detections'),
  deleteAdminDetection: (id) => request(`/admin/ai/detections/${id}`, { method: 'DELETE' }),
  getAuditLogs: () => request('/admin/audit-logs'),
  updateAdminSettings: (data) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // ===== NEW NGO ROUTES =====
  getNgoInventory: () => request('/inventory/'),
  getNgoInventoryStats: () => request('/inventory/stats'),
  updateNgoInventory: (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  importNgoInventory: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/inventory/import', { method: 'POST', body: formData });
  },
  addNgoInventoryItem: (data) => request('/inventory/', { method: 'POST', body: JSON.stringify(data) }),
  deleteNgoInventoryItem: (id) => request(`/inventory/${id}`, { method: 'DELETE' }),
  
  getNgoDonors: (params = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.search) query.append('search', params.search);
    if (params.skip) query.append('skip', params.skip);
    if (params.limit) query.append('limit', params.limit);
    
    const queryString = query.toString();
    return request(`/ngos/donors${queryString ? `?${queryString}` : ''}`);
  },
  getNgoDonorStats: () => request('/ngos/donors/statistics'),
  getNgoDonorDetails: (id) => request(`/ngos/donors/${id}`),
  getNgoReports: () => request('/ngos/reports'),
  
  // ===== NGO AI DETECTIONS =====
  getNgoAiDetections: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    
    const queryString = query.toString();
    return request(`/ngos/ai-detections${queryString ? `?${queryString}` : ''}`);
  },
  getNgoAiDetection: (id) => request(`/ngos/ai-detections/${id}`),
  updateNgoAiDetection: (id, data) => request(`/ngos/ai-detections/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateNgoSettings: (data) => request('/ngos/me', { method: 'PUT', body: JSON.stringify(data) }),

  // ===== NEW DONOR ROUTES =====
  getDonorProfile: () => request('/donor/profile'),
  updateDonorSettings: (data) => request('/donor/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getDonorDashboard: () => request('/donor/dashboard'),
  getDonorDonations: (filter = 'all') => request(`/donor/donations?filter_type=${filter}`),
  getDonorAiDetections: () => request('/donor/ai-detections'),
  getDonorAiDetection: (id) => request(`/donor/ai-detections/${id}`),
  selectMatch: (matchId) => request(`/matches/${matchId}/select`, { method: 'POST' }),
  getUnreadNotificationCount: () => request('/notifications/unread-count'),
  
  // ===== NGO DONATION REQUESTS =====
  getNgoDonationRequests: () => request('/ngos/donation-requests'),
  getNgoDonationRequestsStats: () => request('/ngos/donation-requests/statistics'),
  getNgoDonationRequest: (id) => request(`/ngos/donation-requests/${id}`),
  acceptDonationRequest: (id) => request(`/ngos/donation-requests/${id}/accept`, { method: 'POST' }),
  rejectDonationRequest: (id) => request(`/ngos/donation-requests/${id}/reject`, { method: 'POST' }),
  scheduleDonationPickup: (id, data) => request(`/ngos/donation-requests/${id}/schedule-pickup`, { method: 'POST', body: JSON.stringify(data) }),
  markDonationCollected: (id) => request(`/ngos/donation-requests/${id}/mark-collected`, { method: 'POST' }),
  markDonationDelivered: (id) => request(`/ngos/donation-requests/${id}/mark-delivered`, { method: 'POST' }),
  acknowledgeDonation: (id) => request(`/ngos/donation-requests/${id}/acknowledge`, { method: 'POST' }),
  updateDonationStatus: (id, data) => request(`/status/donations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  verifyDelivery: (id, formData) => request(`/status/donations/${id}/verify-delivery`, { method: 'POST', body: formData }),
  addDonationToInventory: (id) => request(`/inventory/from-donation/${id}`, { method: 'POST' }),
  updatePickup: (id, data) => request(`/pickup/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // ===== Packaging Checklist =====
  getPackagingChecklist: (donationId) => request(`/donations/${donationId}/packaging`),
  updatePackagingItem: (donationId, itemId, data) => request(`/donations/${donationId}/packaging/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  markPacked: (donationId) => request(`/donations/${donationId}/packaging/mark-packed`, { method: 'POST' }),
  markSealed: (donationId) => request(`/donations/${donationId}/packaging/mark-sealed`, { method: 'POST' }),
};
