import axios from 'axios';

const API_BASE_URL = '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Auth Bearer token if available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopping_agent_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const searchProduct = async (query) => {
  const res = await client.post('/products/search', { query });
  return res.data;
};

export const getProductComparison = async (productId) => {
  const res = await client.get(`/products/compare/${productId}`);
  return res.data;
};

export const getFeaturedProducts = async () => {
  const res = await client.get('/products/featured');
  return res.data;
};

export const sendChatMessage = async (message, history = []) => {
  const res = await client.post('/chat/message', { message, history });
  return res.data;
};

export const streamChat = async (message, onChunk, onDone, onError) => {
  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line segment in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (data.done) {
              if (onDone) onDone(data.deep_links || []);
            } else if (data.chunk) {
              if (onChunk) onChunk(data.chunk);
            }
          } catch (e) {
            console.error('Stream JSON parse error:', e);
          }
        }
      }
    }

    if (buffer.trim().startsWith('data: ')) {
      const jsonStr = buffer.trim().slice(6);
      try {
        const data = JSON.parse(jsonStr);
        if (data.done) {
          if (onDone) onDone(data.deep_links || []);
        } else if (data.chunk) {
          if (onChunk) onChunk(data.chunk);
        }
      } catch (e) {
        console.error('Stream JSON parse error:', e);
      }
    }
  } catch (err) {
    console.error('Fetch stream error:', err);
    if (onError) onError(err);
  }
};

export const loginWithGoogle = async (userData = {}) => {
  const res = await client.post('/auth/google', userData);
  return res.data;
};

export const requestGoogleOtp = async (userData = {}) => {
  const res = await client.post('/auth/google/request-otp', userData);
  return res.data;
};

export const verifyGoogleOtp = async (userData = {}) => {
  const res = await client.post('/auth/google/verify-otp', userData);
  return res.data;
};

export const sendPhoneOtp = async (phone) => {
  const res = await client.post('/auth/otp/send', { phone });
  return res.data;
};

export const verifyPhoneOtp = async (phone, otp, idToken = null) => {
  const res = await client.post('/auth/otp/verify', { phone, otp, idToken });
  return res.data;
};

export const updateUserProfile = async (userId, name) => {
  const res = await client.post('/auth/profile', { user_id: userId, name });
  return res.data;
};

export const getWatchlist = async (userId = 'demo-user') => {
  const res = await client.get(`/alerts/watchlist?user_id=${userId}`);
  return res.data;
};

export const addToWatchlist = async (productId, targetPrice, userId = 'demo-user') => {
  const res = await client.post('/alerts/watchlist', {
    user_id: userId,
    product_id: productId,
    target_price: targetPrice,
  });
  return res.data;
};

export const removeFromWatchlist = async (watchlistId) => {
  const res = await client.delete(`/alerts/watchlist/${watchlistId}`);
  return res.data;
};