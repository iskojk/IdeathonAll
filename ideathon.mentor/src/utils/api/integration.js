import ax from '../axios';

/**
 * Integration API Functions
 * OAuth entegrasyonları için API istekleri
 */

/**
 * Kullanıcının tüm entegrasyonlarını getirir
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export const getIntegrations = async () => {
  try {
    const response = await ax.get('/mentornet/integrations');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Google OAuth akışını başlatır
 * @returns {Promise<{success: boolean, authUrl: string}>}
 */
export const connectGoogle = async () => {
  try {
    const response = await ax.get('/mentornet/integrations/google/connect');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Microsoft OAuth akışını başlatır
 * @returns {Promise<{success: boolean, authUrl: string}>}
 */
export const connectMicrosoft = async () => {
  try {
    const response = await ax.get('/mentornet/integrations/microsoft/connect');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Zoom OAuth akışını başlatır
 * @returns {Promise<{success: boolean, authUrl: string}>}
 */
export const connectZoom = async () => {
  try {
    const response = await ax.get('/mentornet/integrations/zoom/connect');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Provider entegrasyonunu kaldırır
 * @param {string} provider - "google" | "microsoft" | "zoom"
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const disconnectProvider = async (provider) => {
  try {
    const response = await ax.delete(`/mentornet/integrations/${provider}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};






