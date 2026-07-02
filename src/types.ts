export type UserRole = 'CITIZEN' | 'AGENT' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  points: number;
  badge: string;
  agentRequestStatus: 'NONE' | 'PENDING' | 'APPROVED';
}

export type WasteType = 'PLASTIC' | 'ORGANIC' | 'METAL' | 'HAZARDOUS' | 'GLASS' | 'OTHER';

export type ReportStatus = 'SUBMITTED' | 'VALIDATED' | 'IN_PROGRESS' | 'COMPLETED';

export interface WasteReport {
  id: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  type: WasteType;
  description: string;
  commune: string;
  avenue?: string;
  address?: string;
  status: ReportStatus;
  createdAt: string;
  pointsWorth?: number;
}

export interface Mission {
  id: string;
  title: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  reports: WasteReport[];
  agentId: string;
  routeCoordinates?: [number, number][]; // coordinates for Leaflet map line
  createdAt: string;
}
