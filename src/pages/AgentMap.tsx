import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { WasteReport } from '../types';
import L from 'leaflet';
import { 
  Wifi, 
  WifiOff, 
  MapPin, 
  Loader2, 
  Navigation,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const AgentMap: React.FC = () => {
  const { profile } = useAuth();
  const [wsStatus, setWsStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const [gpsStatus, setGpsStatus] = useState<'SEARCHING' | 'ACTIVE' | 'ERROR'>('SEARCHING');
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  
  // Real-time coordinates
  const [agentLat, setAgentLat] = useState<number | null>(null);
  const [agentLng, setAgentLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const agentMarkerRef = useRef<L.Marker | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Fetch target waste reports to display on the map
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        // Retrieve reports to show on map
        const data = await apiService.getMyReports();
        // Filter to only non-completed reports
        const pending = data.filter(r => r.status !== 'COMPLETED');
        setReports(pending.length > 0 ? pending : mockPendingReports);
      } catch (err) {
        console.error('Failed to fetch pending reports for map, using simulation:', err);
        setReports(mockPendingReports);
      } finally {
        setLoadingPoints(false);
      }
    };
    fetchPoints();
  }, []);

  // Set up WebSocket connection
  useEffect(() => {
    if (!profile) return;

    const connectWS = () => {
      setWsStatus('CONNECTING');
      try {
        const wsUrl = 'wss://ecoclean-backend-7hn0.onrender.com/ws/tracking';
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('EcoClean Tracking WebSocket connected.');
          setWsStatus('CONNECTED');
        };

        socket.onclose = () => {
          console.log('EcoClean Tracking WebSocket disconnected. Retrying in 10s...');
          setWsStatus('DISCONNECTED');
          setTimeout(connectWS, 10000); // Auto reconnect after 10 seconds
        };

        socket.onerror = (err) => {
          console.error('WebSocket Error:', err);
          socket.close();
        };

        wsRef.current = socket;
      } catch (e) {
        console.error('WS Connection failed:', e);
        setWsStatus('DISCONNECTED');
      }
    };

    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [profile]);

  // Set up high accuracy Geolocation tracking (watchPosition)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('ERROR');
      return;
    }

    setGpsStatus('SEARCHING');

    const handleSuccess = (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setAgentLat(lat);
      setAgentLng(lng);
      setAccuracy(position.coords.accuracy);
      setGpsStatus('ACTIVE');

      // Send update over WebSocket if open
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && profile) {
        const payload = {
          agentId: profile.id,
          name: profile.name,
          latitude: lat,
          longitude: lng,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        wsRef.current.send(JSON.stringify(payload));
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error('watchPosition Error:', error);
      setGpsStatus('ERROR');
      
      // Load fallback simulation position (Kinshasa Gombe) to keep the demo fully interactive
      setAgentLat(-4.3120);
      setAgentLng(15.3120);
      setAccuracy(15);
    };

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [profile]);

  // Handle Leaflet Map Mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use current GPS or fallback Gombe center
    const centerLat = agentLat || -4.3150;
    const centerLng = agentLng || 15.3150;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([centerLat, centerLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapRef.current = map;

    // Plot target waste reports on the map
    reports.forEach((report) => {
      const icon = L.divIcon({
        className: 'waste-point-icon',
        html: `<div class="w-7 h-7 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-md animate-bounce">
                🚮
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([report.latitude, report.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="p-1">
            <p class="font-bold text-slate-900 text-xs">${report.type} (${report.commune})</p>
            <p class="text-slate-500 text-[10px] mt-0.5">${report.description}</p>
          </div>
        `);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [reports]);

  // Handle agent movement and map centering
  useEffect(() => {
    if (!mapRef.current || agentLat === null || agentLng === null) return;

    const map = mapRef.current;

    // Build or update Glowing Blue Marker for Agent
    if (!agentMarkerRef.current) {
      const icon = L.divIcon({
        className: 'agent-locator-icon',
        html: `<div class="relative flex items-center justify-center">
                <div class="absolute w-8 h-8 bg-sky-500/30 rounded-full animate-ping"></div>
                <div class="w-5.5 h-5.5 bg-sky-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white">
                  👷
                </div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([agentLat, agentLng], { icon }).addTo(map);
      marker.bindPopup("<p class='font-bold text-xs text-sky-700 p-0.5'>Ma Position en Direct</p>").openPopup();
      agentMarkerRef.current = marker;
      
      // Pan to agent position first time
      map.panTo([agentLat, agentLng]);
    } else {
      agentMarkerRef.current.setLatLng([agentLat, agentLng]);
    }
  }, [agentLat, agentLng]);

  return (
    <div className="h-[100vh] flex flex-col relative">
      {/* Top floating dashboard */}
      <div className="absolute top-4 left-4 right-4 z-40 space-y-2 max-w-md mx-auto">
        {/* WS Status & GPS Status bar */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${
              wsStatus === 'CONNECTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {wsStatus === 'CONNECTED' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4 animate-pulse" />}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WebSocket</p>
              <p className="text-xs font-bold text-slate-800">
                {wsStatus === 'CONNECTED' ? 'En direct (Envoi actif)' : 'Reconnexion...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
            <div className={`p-1.5 rounded-lg ${
              gpsStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <Navigation className={`w-4 h-4 ${gpsStatus === 'SEARCHING' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Traceur GPS</p>
              <p className="text-xs font-bold text-slate-800">
                {gpsStatus === 'ACTIVE' ? `Actif (±${accuracy?.toFixed(0) || 5}m)` : gpsStatus === 'SEARCHING' ? 'Recherche GPS' : 'Simulé'}
              </p>
            </div>
          </div>
        </div>

        {gpsStatus === 'ERROR' && (
          <div className="bg-amber-500 text-white text-[11px] font-bold p-3.5 rounded-xl shadow-md flex items-center gap-2.5">
            <AlertTriangle className="w-4.5 h-4.5 text-white shrink-0" />
            <span>Signal GPS indisponible sur cet appareil. Position simulée au centre-ville.</span>
          </div>
        )}
      </div>

      {/* Main Fullscreen Map Frame */}
      <div className="flex-1 w-full h-full relative z-10 bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" style={{ height: '100%' }} />
      </div>

      {/* Bottom info cards */}
      <div className="absolute bottom-20 left-4 right-4 z-40 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-lg text-white max-w-md mx-auto border border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Statut de la tournée</span>
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Traceur actif pour {profile?.name.split(' ')[0]}
            </p>
          </div>
          <span className="bg-white/10 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            {reports.length} poubelles à vider
          </span>
        </div>
      </div>
    </div>
  );
};

// Mock target containers for maps in Gombe
const mockPendingReports: WasteReport[] = [
  {
    id: 'rep-001',
    type: 'PLASTIC',
    description: 'Bouteilles plastiques accumulées près du rond-point',
    latitude: -4.3039,
    longitude: 15.3135,
    commune: 'Gombe',
    status: 'VALIDATED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'rep-002',
    type: 'ORGANIC',
    description: 'Tas de déchets organiques près du marché local',
    latitude: -4.3150,
    longitude: 15.3180,
    commune: 'Gombe',
    status: 'VALIDATED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'rep-003',
    type: 'METAL',
    description: 'Tôles usagées et fers à béton sur le trottoir',
    latitude: -4.3250,
    longitude: 15.3280,
    commune: 'Limete',
    status: 'VALIDATED',
    createdAt: new Date().toISOString()
  }
];
