import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.100.5:8080/api'; // PC IPv4 address

export const apiCall = async (endpoint, method = 'GET', body = null) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const config  = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data     = await response.json();

    if (!response.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const authAPI = {
  login:    (credentials) => apiCall('/auth/login',    'POST', credentials),
  register: (userData)    => apiCall('/auth/register', 'POST', userData),
};

export const workerAPI = {
  getAll:   ()         => apiCall('/workers',       'GET'),
  getById:  (id)       => apiCall(`/workers/${id}`, 'GET'),
};

export const bookingAPI = {
  create:          (data)       => apiCall('/bookings',                    'POST', data),
  getByCustomer:   (customerId) => apiCall(`/bookings/customer/${customerId}`, 'GET'),
  getByWorker:     (workerId)   => apiCall(`/bookings/worker/${workerId}`,     'GET'),
  updateStatus:    (bookingId, status) => apiCall(`/bookings/${bookingId}/status`, 'PUT', { status }),
};

export const userAPI = {
  getProfile:    (userId)       => apiCall(`/users/${userId}`, 'GET'),
  updateProfile: (userId, data) => apiCall(`/users/${userId}`, 'PUT', data),
};

export const messageAPI = {
  getConversation: (user1, user2) => apiCall(`/messages?user1=${user1}&user2=${user2}`, 'GET'),
  send:            (data)         => apiCall('/messages', 'POST', data),
};

export const adminAPI = {
  getStats:          ()                 => apiCall('/admin/stats',           'GET'),
  getPendingWorkers: ()                 => apiCall('/admin/workers/pending', 'GET'),
  getAllWorkers:      ()                 => apiCall('/admin/workers/all',     'GET'),
  getAllCustomers:    ()                 => apiCall('/admin/customers',       'GET'),
  getAllBookings:     ()                 => apiCall('/admin/bookings',        'GET'),
  approveWorker:     (workerId, status) => apiCall('/admin/workers/approve', 'POST', { workerId, status }),
  deleteUser:        (userId)           => apiCall('/admin/users/delete',    'POST', { userId }),
};
