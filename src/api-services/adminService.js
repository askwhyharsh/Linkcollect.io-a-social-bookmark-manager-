import http from './httpService';
import api from './apiConfig.json';

const apiEndpoint = api.baseUrl + '/admin';

export function updateSubscription(userId, isPremium) {
  // const token = localStorage.getItem('token');

  // const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return http.post(`${apiEndpoint}/subscription`, {
    userId,
    isPremium,
  });
}

export function getUsers(query = '', page = 1, pageSize = 20) {
  const token = localStorage.getItem('token');

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  return http.get(`${apiEndpoint}/users`, {
    params: { q: query, page, pageSize },
    headers,
  });
}

export function getUserStats(userId) {
  return http.get(`${apiEndpoint}/users/${userId}/stats`);
}

export function isAdmin(email) {
  return email === 'askwhyharsh@gmail.com';
}
