import { getFirebaseToken } from '../firebase';
import { UserProfile, WasteReport, Mission } from '../types';

export const API_BASE_URL = 'https://ecoclean-backend-7hn0.onrender.com/api';
const BASE_URL = API_BASE_URL;

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

// Custom error class to handle detailed backend errors
export class APIError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// A helper to make authenticated requests to the EcoClean backend with auto-retry for Render cold starts
async function apiRequest<T>(endpoint: string, options: FetchOptions = {}, retries = 3, retryDelayMs = 12000): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // Inject Firebase token unless explicitly skipped
  if (!options.skipAuth) {
    const token = await getFirebaseToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn(`No active session token for endpoint: ${endpoint}`);
    }
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, mergedOptions);
      
      // Handle Render cold start HTTP gateway statuses (502/503/504)
      if ((response.status === 502 || response.status === 503 || response.status === 504) && attempt < retries) {
        console.warn(`[Render Cold-Start] Le serveur démarre, veuillez patienter... (Tentative ${attempt}/${retries})`);
        await new Promise((res) => setTimeout(res, retryDelayMs));
        continue;
      }

      // Handle HTTP errors
      if (!response.ok) {
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch (e) {
          // Response is not JSON
        }
        throw new APIError(
          errorData?.message || `La requête a échoué avec le code ${response.status}`,
          response.status,
          errorData
        );
      }

      // Return parsed json or success indicator
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json() as T;
      }
      return {} as T;
    } catch (error: any) {
      if (error instanceof APIError) {
        throw error;
      }
      
      const isNetworkErr = error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError';
      if (isNetworkErr && attempt < retries) {
        console.warn(`[Render Cold-Start] Le serveur démarre, veuillez patienter... (Tentative ${attempt}/${retries})`);
        await new Promise((res) => setTimeout(res, retryDelayMs));
        continue;
      }

      // Network or parse errors
      throw new Error(
        isNetworkErr 
          ? "Le serveur démarre, veuillez patienter... Si le serveur met trop de temps (30s à 60s), rafraîchissez dans quelques instants."
          : error.message || "Une erreur inconnue s'est produite."
      );
    }
  }

  throw new Error("Le serveur Render met trop de temps à répondre. Veuillez réessayer dans quelques secondes.");
}

export const apiService = {
  // Get current logged-in user profiles
  async getCurrentUser(): Promise<UserProfile> {
    try {
      return await apiRequest<UserProfile>('/users/me');
    } catch (err: any) {
      // If user doesn't exist on backend yet, create profile or handle
      if (err instanceof APIError && err.status === 404) {
        // Fallback or attempt to auto-create user on backend
        return await this.createProfile();
      }
      throw err;
    }
  },

  // Create or sync user profile on the backend
  async createProfile(): Promise<UserProfile> {
    return await apiRequest<UserProfile>('/users/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
  },

  // Submit request to become an Agent de terrain
  async requestAgent(): Promise<UserProfile> {
    return await apiRequest<UserProfile>('/users/me/request-agent', {
      method: 'POST',
    });
  },

  // Get waste reports (can be filtered or retrieved via 'me' or all reports)
  async getMyReports(): Promise<WasteReport[]> {
    // Attempt to fetch my specific reports.
    // If '/reports/me' doesn't exist, we fall back to /reports
    try {
      return await apiRequest<WasteReport[]>('/reports/me');
    } catch {
      try {
        const allReports = await apiRequest<WasteReport[]>('/reports');
        return allReports;
      } catch {
        // Return fallback mockup for demo purposes if backend fails or has no reports
        return [];
      }
    }
  },

  // Submit a new waste report
  async submitReport(data: {
    type: string;
    description: string;
    commune: string;
    latitude: number;
    longitude: number;
    avenue?: string;
    address?: string;
    photoFile?: File;
    photoBase64?: string;
  }): Promise<WasteReport> {
    const reportData = {
      type: data.type,
      description: data.description,
      commune: data.commune,
      latitude: data.latitude,
      longitude: data.longitude,
      avenue: data.avenue || '',
      address: data.address || '',
      adresseComplete: data.address || (data.avenue ? `Avenue ${data.avenue}, ${data.commune}` : data.commune),
      photo: data.photoBase64 || '',
    };

    try {
      if (data.photoFile) {
        // Attempt using FormData first
        const formData = new FormData();
        formData.append('type', data.type);
        formData.append('description', data.description);
        formData.append('commune', data.commune);
        formData.append('latitude', String(data.latitude));
        formData.append('longitude', String(data.longitude));
        if (data.avenue) formData.append('avenue', data.avenue);
        if (data.address) {
          formData.append('address', data.address);
          formData.append('adresseComplete', data.address);
        } else {
          formData.append('adresseComplete', reportData.adresseComplete);
        }
        formData.append('photo', data.photoFile);

        return await apiRequest<WasteReport>('/reports', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Send as JSON
        return await apiRequest<WasteReport>('/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reportData),
        });
      }
    } catch (err) {
      // If multipart/form-data failed, try fallback with JSON base64 if possible
      if (data.photoFile && !data.photoBase64) {
        const base64 = await fileToBase64(data.photoFile);
        return await apiRequest<WasteReport>('/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...reportData,
            photo: base64,
          }),
        });
      }
      throw err;
    }
  },

  // Get active missions assigned to the agent using GET /api/missions
  async getAgentMissions(agentId: string): Promise<Mission[]> {
    try {
      const allMissions = await apiRequest<Mission[]>('/missions');
      if (Array.isArray(allMissions)) {
        const filtered = allMissions.filter(
          (m: any) => m.agentId === agentId || m.assignedTo === agentId || m.agent?.id === agentId
        );
        // Return agent's missions or all missions if filter matches none or agent is assigned
        return filtered.length > 0 ? filtered : allMissions;
      }
      return [];
    } catch {
      return [];
    }
  },

  // Update mission status
  async updateMissionStatus(missionId: string, status: 'IN_PROGRESS' | 'COMPLETED'): Promise<Mission> {
    // Try updating via /missions/:id/status or general patch /missions/:id
    try {
      return await apiRequest<Mission>(`/missions/${missionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
    } catch {
      return await apiRequest<Mission>(`/missions/${missionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
    }
  }
};

// Helper utility to convert a File to a Base64 string
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}
