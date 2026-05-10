import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:8080/api'; // 10.0.2.2 is localhost for Android Emulator

export const apiCall = async (endpoint, method = 'GET', body = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    const config = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const authAPI = {
  login: (credentials) => apiCall('/auth/login', 'POST', credentials),
  register: (userData) => apiCall('/auth/register', 'POST', userData),
};

export const workerAPI = {
  getAll: () => apiCall('/workers', 'GET'),
};
