import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { WasteReport } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw, 
  Loader2, 
  MapPin, 
  Trash2,
  Calendar
} from 'lucide-react';

export const CitizenHome: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      const data = await apiService.getMyReports();
      // Sort reports by date (newest first)
      const sorted = [...data].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setReports(sorted);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshProfile(),
      fetchReports()
    ]);
  };

  const getStatusBadge = (status?: string | null) => {
    const statusUpper = status?.toUpperCase() ?? 'SUBMITTED';
    switch (statusUpper) {
      case 'SUBMITTED':
      case 'SIGNALE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <Clock className="w-3.5 h-3.5" /> Signalé
          </span>
        );
      case 'VALIDATED':
      case 'VALIDE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Validé
          </span>
        );
      case 'IN_PROGRESS':
      case 'EN_COURS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> En cours
          </span>
        );
      case 'COMPLETED':
      case 'TERMINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terminé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-100">
            {status ?? 'Inconnu'}
          </span>
        );
    }
  };

  const getWasteTypeLabel = (type?: string | null) => {
    const typeUpper = type?.toUpperCase() ?? 'OTHER';
    const mapping: Record<string, string> = {
      PLASTIC: 'Plastique',
      ORGANIC: 'Organique',
      METAL: 'Métal',
      HAZARDOUS: 'Dangereux',
      GLASS: 'Verre',
      OTHER: 'Autre'
    };
    return mapping[typeUpper] || type || 'Autre';
  };

  const getWasteTypeColor = (type?: string | null) => {
    const typeUpper = type?.toUpperCase() ?? 'OTHER';
    switch (typeUpper) {
      case 'PLASTIC': return 'bg-sky-100 text-sky-800';
      case 'ORGANIC': return 'bg-amber-100 text-amber-800';
      case 'METAL': return 'bg-slate-100 text-slate-800';
      case 'HAZARDOUS': return 'bg-rose-100 text-rose-800';
      case 'GLASS': return 'bg-teal-100 text-teal-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="pb-24">
      {/* Upper header section with score counter */}
      <div className="bg-gradient-to-b from-ecogreen-500 to-ecogreen-600 text-white rounded-b-[2.5rem] px-5 pt-6 pb-8 shadow-xl shadow-ecogreen-500/10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-ecogreen-100 text-xs font-medium uppercase tracking-wider">Mon Niveau Éco-Citoyen</p>
              <h3 className="font-display font-bold text-2xl tracking-tight mt-0.5">
                {(profile?.name ?? 'Citoyen').split(' ')[0]} 🇨🇩
              </h3>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-50 rounded-xl transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Pending Agent Request Banner */}
          {profile?.agentRequestStatus === 'PENDING' && (
            <div className="mb-4 bg-amber-400/20 backdrop-blur-md text-amber-100 p-3.5 rounded-2xl border border-amber-300/30 text-xs font-medium flex items-start gap-2.5 shadow-sm leading-relaxed">
              <Clock className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span>Votre demande d'intégration comme Agent EcoClean a été envoyée aux administrateurs pour validation.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
              <div className="p-2.5 bg-amber-400 text-amber-950 rounded-xl">
                <Award className="w-5.5 h-5.5 fill-current" />
              </div>
              <div>
                <span className="text-[10px] text-ecogreen-100 font-medium block uppercase tracking-wide">Badge actuel</span>
                <span className="text-sm font-bold block truncate">{profile?.badge || 'Éco-Recrue'}</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
              <div className="p-2.5 bg-white text-ecogreen-600 rounded-xl">
                <TrendingUp className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-[10px] text-ecogreen-100 font-medium block uppercase tracking-wide">Points accumulés</span>
                <span className="text-base font-extrabold block">{profile?.points ?? 0} pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Big Pulsing Signal Button */}
      <div className="px-5 -translate-y-5 max-w-md mx-auto">
        <button
          onClick={() => navigate('/report/new')}
          className="w-full bg-white text-slate-900 hover:text-ecogreen-600 border border-slate-100 p-5 rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between gap-4 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-ecogreen-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-ecogreen-500/20 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h4 className="font-display font-bold text-lg text-slate-900">Signaler un déchet</h4>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">Capturez et géolocalisez en 3 clics</p>
            </div>
          </div>
          <span className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-ecogreen-50 group-hover:text-ecogreen-600 transition-colors">
            ➔
          </span>
        </button>
      </div>

      {/* Reports tracking list */}
      <div className="px-5 mt-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-slate-900">Mes signalements</h3>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {reports.length} total
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-ecogreen-500 mb-2" />
            <p className="text-sm font-medium">Chargement des signalements...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 text-center max-w-sm mx-auto">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">Aucun signalement trouvé</h4>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
              Vous n'avez pas encore envoyé de signalement. Contribuez à assainir votre commune en signalant le premier tas d'ordures ou de déchets plastiques !
            </p>
            <button
              onClick={() => navigate('/report/new')}
              className="mt-5 px-5 py-2.5 bg-ecogreen-500 hover:bg-ecogreen-600 text-white font-bold text-xs rounded-xl shadow-md shadow-ecogreen-500/15 transition-all"
            >
              Signaler maintenant
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div 
                key={report.id} 
                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
              >
                {report.photoUrl ? (
                  <img 
                    src={report.photoUrl} 
                    alt={report.type || 'déchet'} 
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-50 shrink-0 flex items-center justify-center text-slate-400 border border-slate-100">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getWasteTypeColor(report.type)}`}>
                      {getWasteTypeLabel(report.type)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                      <Calendar className="w-3 h-3" />
                      {report.createdAt ? (() => {
                        const d = new Date(report.createdAt);
                        return isNaN(d.getTime()) ? 'Récemment' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                      })() : 'Récemment'}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-900 mt-1.5 truncate">
                    {report.description || 'Pas de description'}
                  </p>

                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {report.commune}{report.avenue ? `, Av. ${report.avenue}` : ''}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2.5">
                    {getStatusBadge(report.status)}
                    {report.pointsWorth && (
                      <span className="text-xs font-bold text-ecogreen-600">
                        +{report.pointsWorth} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
