import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || 'http://localhost:5002/api';

export const fetchNotifications = async () => {
  const response = await axios.get(`${API_BASE_URL}/notifications`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/notifications/${notificationId}/mark-as-read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createNotification = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/notifications`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};


export const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
