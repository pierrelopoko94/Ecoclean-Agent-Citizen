import { auth, getFirebaseToken } from '../firebase';
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
async function apiRequest<T>(endpoint: string, options: FetchOptions = {}, retries = 3, retryDelayMs = 10000): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // Inject Firebase token strictly unless explicitly skipped
  if (!options.skipAuth) {
    const token = await getFirebaseToken();
    if (token && token !== 'undefined' && token !== 'null') {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn(`[API] Token absent ou invalide pour endpoint: ${endpoint}`);
      throw new APIError("Utilisateur non authentifié. Veuillez vous connecter.", 401);
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
  // Get current logged-in user profile with automatic 404/401 backend user sync
  async getCurrentUser(): Promise<UserProfile> {
    try {
      console.log("[API] Executing GET /users/me ...");
      return await apiRequest<UserProfile>('/users/me');
    } catch (err: any) {
      if (err instanceof APIError && (err.status === 404 || err.status === 401)) {
        console.warn(`[API] GET /users/me returned ${err.status}. Triggering automatic POST /users/me sync...`);
        try {
          await this.createProfile();
          console.log("[API] POST /users/me succeeded. Re-fetching GET /users/me...");
          return await apiRequest<UserProfile>('/users/me');
        } catch (postErr) {
          console.error("[API] Automatic profile creation failed:", postErr);
          throw err;
        }
      }
      throw err;
    }
  },

  // Create or sync user profile on the backend
  async createProfile(customData?: Partial<UserProfile>): Promise<UserProfile> {
    const currentUser = auth.currentUser;
    const payload = {
      firebaseUid: currentUser?.uid || customData?.id || '',
      email: currentUser?.email || customData?.email || '',
      name: customData?.name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Citoyen'),
      role: customData?.role || 'CITIZEN'
    };

    console.log("[API] Executing POST /users/me with payload:", payload);
    return await apiRequest<UserProfile>('/users/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  // Submit request to become an Agent de terrain
  async requestAgent(): Promise<UserProfile> {
    return await apiRequest<UserProfile>('/users/me/request-agent', {
      method: 'POST',
    });
  },

  // Get waste reports (directly from GET /reports and filter by current user's ID)
  async getMyReports(): Promise<WasteReport[]> {
    try {
      const currentUser = await this.getCurrentUser().catch(() => null);
      const allReports = await apiRequest<WasteReport[]>('/reports');
      if (currentUser?.id) {
        const myReports = allReports.filter(r => r.userId === currentUser.id || (r as any).user_id === currentUser.id);
        return myReports;
      }
      return allReports;
    } catch {
      return [];
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
    imageUrl?: string;
    photoFile?: File;
    photoBase64?: string;
  }): Promise<WasteReport> {
    const fallbackImage = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80';
    let photoUrl = data.imageUrl || '';

    // If photoUrl is missing or is a long base64 string, sanitize to fallback URL
    if (!photoUrl || photoUrl.startsWith('data:')) {
      photoUrl = fallbackImage;
    }

    const adresseComplete = data.address || (data.avenue ? `Avenue ${data.avenue}, ${data.commune}` : `Kinshasa, ${data.commune}`);

    const reportData = {
      wasteType: data.type,
      type: data.type,
      description: data.description,
      commune: data.commune,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      avenue: data.avenue || '',
      address: data.address || adresseComplete,
      adresseComplete: adresseComplete,
      estimatedVolume: 1.0,
      imageUrl: photoUrl,
      photo: photoUrl,
    };

    return await apiRequest<WasteReport>('/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });
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
