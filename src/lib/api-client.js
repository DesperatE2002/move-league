// API Client Helper
// Tüm API çağrıları için merkezi helper

const API_BASE = typeof window !== 'undefined' 
  ? `${window.location.origin}/api`
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api');

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.message || 'API request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500, null);
  }
}

// Auth API
export const authApi = {
  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Token'ı kaydet
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    return response;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getCurrentUserFromAPI: async () => {
    return apiRequest('/auth/me');
  },

  getEnrolledWorkshops: () => {
    return apiRequest('/workshops/enrolled');
  },

  changePassword: (currentPassword, newPassword) => {
    return apiRequest('/profile/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  getActiveBattles: () => {
    return apiRequest('/battles/active');
  },

  getAllUsers: () => {
    return apiRequest('/users/all');
  },
};

// Users API
export const usersApi = {
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/users?${query}`);
  },
};

// Battles API
export const battlesApi = {
  getBattles: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/battles?${query}`);
  },

  createBattle: (data) => {
    return apiRequest('/battles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateBattle: (id, data) => {
    return apiRequest(`/battles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Notifications API
export const notificationsApi = {
  getNotifications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/notifications?${query}`);
  },

  markAsRead: (id) => {
    return apiRequest(`/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  markAllAsRead: () => {
    return apiRequest('/notifications/read-all', {
      method: 'POST',
    });
  },
};

// Studios API
export const studiosApi = {
  getStudios: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/studios?${query}`);
  },

  getStudio: (id) => {
    return apiRequest(`/studios/${id}`);
  },

  createStudio: (data) => {
    return apiRequest('/studios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStudio: (id, data) => {
    return apiRequest(`/studios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteStudio: (id) => {
    return apiRequest(`/studios/${id}`, {
      method: 'DELETE',
    });
  },

  // League API
  getBattleLeague: () => {
    return apiRequest('/leagues/battle');
  },

  getTeamLeague: () => {
    return apiRequest('/leagues/team');
  },

  // Move Show Competition API
  getCompetitions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/competitions${query ? '?' + query : ''}`);
  },

  getCompetition: (id) => {
    return apiRequest(`/competitions/${id}`);
  },

  createCompetition: (data) => {
    return apiRequest('/competitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  revealSong: (competitionId, songData) => {
    return apiRequest(`/competitions/${competitionId}/reveal-song`, {
      method: 'POST',
      body: JSON.stringify(songData),
    });
  },

  // Competition Teams
  getDancers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/competition-teams${query ? '?' + query : ''}`);
  },

  createCompetitionTeam: (data) => {
    return apiRequest('/competition-teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendTeamInvitation: (teamId, data) => {
    return apiRequest(`/competition-teams/${teamId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Competition Invitations
  getCompetitionInvitations: (status = 'PENDING') => {
    return apiRequest(`/competition-invitations?status=${status}`);
  },

  respondToInvitation: (invitationId, action) => {
    return apiRequest(`/competition-invitations/${invitationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
  },
};

// Default export
export default authApi;
