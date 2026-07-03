import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { WasteReport } from '../types';
import { 
  User, 
  Mail, 
  Award, 
  Check, 
  ShieldAlert, 
  Briefcase, 
  ArrowRight, 
  Loader2, 
  CheckCircle,
  FileText,
  Clock,
  LogOut,
  MapPin,
  Calendar
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { profile, user, logout, refreshProfile } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingAgent, setSubmittingAgent] = useState(false);
  const [agentRequestError, setAgentRequestError] = useState<string | null>(null);
  const [agentRequestSuccess, setAgentRequestSuccess] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const myReports = await apiService.getMyReports();
        const sorted = [...myReports].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setReports(sorted);
      } catch (err) {
        console.error('Failed to load profile reports history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleBecomeAgent = async () => {
    setSubmittingAgent(true);
    setAgentRequestError(null);
    setAgentRequestSuccess(false);
    try {
      await apiService.requestAgent();
      setAgentRequestSuccess(true);
      await refreshProfile();
    } catch (err: any) {
      console.error('Failed to request agent status:', err);
      setAgentRequestError(
        err.message || "Une erreur s'est produite lors de l'envoi de votre demande d'agent."
      );
    } finally {
      setSubmittingAgent(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch ((status || '').toUpperCase()) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'VALIDATED': return 'bg-amber-100 text-amber-800';
      case 'IN_PROGRESS': return 'bg-indigo-100 text-indigo-800';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch ((status || '').toUpperCase()) {
      case 'SUBMITTED': return 'Signalé';
      case 'VALIDATED': return 'Validé';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Terminé';
      default: return status || 'Inconnu';
    }
  };

  const getWasteTypeLabel = (type?: string) => {
    const mapping: Record<string, string> = {
      PLASTIC: 'Plastique',
      ORGANIC: 'Organique',
      METAL: 'Métal',
      HAZARDOUS: 'Dangereux',
      GLASS: 'Verre',
      OTHER: 'Autre'
    };
    return mapping[(type || '').toUpperCase()] || type || 'Signalement';
  };

  return (
    <div className="pb-24">
      {/* Profile Header Cards */}
      <div className="bg-white border-b border-slate-100 px-5 pt-6 pb-6 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <div className="w-16 h-16 bg-ecogreen-100 text-ecogreen-700 rounded-3xl flex items-center justify-center font-display font-bold text-2xl shadow-inner border border-ecogreen-200">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-xl text-slate-900 truncate leading-tight">
              {profile?.name || user?.displayName || 'Citoyen EcoClean'}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium truncate">
              <Mail className="w-3.5 h-3.5" />
              {profile?.email || user?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5 max-w-md mx-auto">
        {/* Stat metrics cards */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Award className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Badge Actuel</span>
              <span className="text-sm font-bold text-slate-800 block mt-1">{profile?.badge || 'Éco-Recrue'}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-xl bg-ecogreen-50 text-ecogreen-600 flex items-center justify-center mb-3">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Eco Points</span>
              <span className="text-base font-extrabold text-slate-900 block mt-0.5">{profile?.points ?? 0} pts</span>
            </div>
          </div>
        </div>

        {/* WORKFLOW : Become field agent */}
        {profile?.role !== 'AGENT' && (
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
            {/* Visual shine */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-ecogreen-500 rounded-full filter blur-2xl opacity-20 translate-x-12 -translate-y-12"></div>

            <div className="flex items-start gap-3.5 z-10 relative">
              <div className="p-2.5 bg-white/10 rounded-xl text-ecogreen-400">
                <Briefcase className="w-5.5 h-5.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-bold text-base tracking-tight text-white">Rejoignez l'équipe terrain !</h4>
                <p className="text-slate-300 text-xs mt-1.5 leading-relaxed font-medium">
                  Devenez Agent de terrain agréé EcoClean pour valider les signalements, organiser les tournées de ramassage optimisées et gagner des primes !
                </p>

                {/* Condition-based Agent status view */}
                {profile?.agentRequestStatus === 'PENDING' ? (
                  <div className="mt-4 bg-amber-500/20 text-amber-300 p-3 rounded-xl border border-amber-500/30 text-xs font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Demande d'agent en attente d'approbation</span>
                  </div>
                ) : agentRequestSuccess ? (
                  <div className="mt-4 bg-emerald-500/20 text-emerald-300 p-3 rounded-xl border border-emerald-500/30 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Demande envoyée avec succès !</span>
                  </div>
                ) : (
                  <button
                    onClick={handleBecomeAgent}
                    disabled={submittingAgent}
                    className="mt-4 w-full bg-ecogreen-500 hover:bg-ecogreen-600 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-ecogreen-500/20"
                  >
                    {submittingAgent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Devenir Agent de Terrain</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                {agentRequestError && (
                  <div className="mt-3 bg-rose-500/10 text-rose-300 border border-rose-500/20 p-2.5 rounded-lg text-xs font-medium">
                    {agentRequestError}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AGENT ALREADY STATUS CARD */}
        {profile?.role === 'AGENT' && (
          <div className="bg-emerald-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-white/10 text-emerald-300 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base leading-snug">Agent Officiel EcoClean</h4>
                <p className="text-emerald-200 text-xs mt-0.5 font-medium">Vos permissions professionnelles sont actives.</p>
              </div>
            </div>
          </div>
        )}

        {/* History layout */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4.5 h-4.5 text-slate-500" />
            <h3 className="font-display font-bold text-base text-slate-800">Historique des Signalements</h3>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-ecogreen-500 mx-auto mb-2" />
              <p className="text-xs font-medium">Chargement de l'historique...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-400">
              <p className="text-xs">Aucun signalement dans l'historique.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {reports.map((report) => (
                <div 
                  key={report.id}
                  className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-800 truncate">
                        {getWasteTypeLabel(report.type)}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${getStatusColor(report.status)}`}>
                        {getStatusLabel(report.status)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3 h-3" />
                      {report.commune}{report.avenue ? `, Av. ${report.avenue}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0 bg-slate-50 px-2 py-1 rounded-lg">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
