import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Leaf, 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  Chrome, 
  AlertCircle, 
  Loader2, 
  UserCheck, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { apiService } from '../services/api';

export const Login: React.FC = () => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, loading, error: authError, refreshProfile } = useAuth();
  
  // Selection choice state: null = show selection screen, 'CITIZEN' | 'AGENT' = show login/register form
  const [selectedRole, setSelectedRole] = useState<'CITIZEN' | 'AGENT' | null>(() => {
    const saved = sessionStorage.getItem('ecoclean_selected_role');
    return (saved === 'CITIZEN' || saved === 'AGENT') ? saved : null;
  });

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'CITIZEN' | 'AGENT') => {
    setSelectedRole(role);
    sessionStorage.setItem('ecoclean_selected_role', role);
    setLocalError(null);
    setAgentMessage(null);
  };

  const handleResetRole = () => {
    setSelectedRole(null);
    sessionStorage.removeItem('ecoclean_selected_role');
    setLocalError(null);
    setAgentMessage(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setAgentMessage(null);

    if (!email || !password) {
      setLocalError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (isRegister && !name) {
      setLocalError('Veuillez renseigner votre nom complet.');
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password, name);
        
        // If selected role is AGENT, trigger agent request immediately after registration
        if (selectedRole === 'AGENT') {
          try {
            await apiService.requestAgent();
            await refreshProfile();
          } catch (agentErr) {
            console.error("Erreur lors de la demande d'agent:", agentErr);
          }
          setAgentMessage("Votre demande d'intégration comme Agent EcoClean a été envoyée aux administrateurs pour validation.");
        }
      } else {
        await loginWithEmail(email, password);
      }

      // Short delay if showing agent pending message before redirecting
      if (selectedRole === 'AGENT' && isRegister) {
        setTimeout(() => {
          navigate('/');
        }, 2200);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setLocalError(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setAgentMessage(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();

      if (selectedRole === 'AGENT') {
        try {
          await apiService.requestAgent();
          await refreshProfile();
        } catch (agentErr) {
          console.error("Erreur lors de la demande d'agent avec Google:", agentErr);
        }
        setAgentMessage("Votre demande d'intégration comme Agent EcoClean a été envoyée aux administrateurs pour validation.");
      }

      setTimeout(() => {
        navigate('/');
      }, selectedRole === 'AGENT' ? 1800 : 0);
    } catch (err: any) {
      console.error(err);
      setLocalError('La connexion avec Google a échoué. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentError = localError || authError;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-8 relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-ecogreen-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>

      <div className="w-full max-w-md mx-auto z-10">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ecogreen-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-ecogreen-500/20 mb-3 animate-bounce">
            <Leaf className="w-8 h-8 fill-current" />
          </div>
          <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">EcoClean Field</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium max-w-xs mx-auto">
            La plateforme citoyenne & professionnelle d'assainissement de Kinshasa.
          </p>
        </div>

        {/* STEP 1: INITIAL ROLE SELECTION SCREEN */}
        {selectedRole === null ? (
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-100/80 border border-slate-100 space-y-5">
            <div className="text-center pb-1">
              <h3 className="font-display font-bold text-xl text-slate-900">Bienvenue ! Qui êtes-vous ?</h3>
              <p className="text-slate-500 text-xs mt-1">Sélectionnez votre profil d'accès pour continuer</p>
            </div>

            <div className="space-y-4">
              {/* BUTTON 1: JE SUIS CITOYEN */}
              <button
                type="button"
                onClick={() => handleRoleSelect('CITIZEN')}
                className="w-full p-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98] text-white rounded-3xl shadow-lg shadow-emerald-600/20 border border-emerald-500/30 flex items-center gap-4 text-left transition-all group cursor-pointer"
              >
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    <h4 className="font-display font-bold text-lg leading-tight">Je suis Citoyen</h4>
                  </div>
                  <p className="text-emerald-100 text-xs mt-1 font-medium leading-relaxed">
                    Signaler des déchets, accumuler des Éco-points & assainir ma commune.
                  </p>
                </div>
              </button>

              {/* BUTTON 2: JE SUIS AGENT DE TERRAIN */}
              <button
                type="button"
                onClick={() => handleRoleSelect('AGENT')}
                className="w-full p-5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 active:scale-[0.98] text-white rounded-3xl shadow-lg shadow-sky-600/20 border border-sky-500/30 flex items-center gap-4 text-left transition-all group cursor-pointer"
              >
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-300 animate-pulse"></span>
                    <h4 className="font-display font-bold text-lg leading-tight">Je suis Agent de terrain</h4>
                  </div>
                  <p className="text-sky-100 text-xs mt-1 font-medium leading-relaxed">
                    Exécuter les missions de collecte & suivre les circuits optimisés.
                  </p>
                </div>
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-400 font-medium pt-1">
              Vous pourrez changer de profil à tout moment.
            </p>
          </div>
        ) : (
          /* STEP 2: AUTHENTICATION FORM */
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-100/80 border border-slate-100">
            {/* Header Badge showing selected role with Back button */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <button
                type="button"
                onClick={handleResetRole}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Changer</span>
              </button>

              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                selectedRole === 'AGENT' 
                  ? 'bg-sky-100 text-sky-800 border border-sky-200' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {selectedRole === 'AGENT' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Espace Agent de terrain</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Espace Citoyen</span>
                  </>
                )}
              </div>
            </div>

            {/* Login / Register Toggle */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setLocalError(null); setAgentMessage(null); }}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                  !isRegister 
                    ? 'bg-white text-slate-950 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setLocalError(null); setAgentMessage(null); }}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                  isRegister 
                    ? 'bg-white text-slate-950 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                S'inscrire
              </button>
            </div>

            {/* Special Agent Registration Banner */}
            {isRegister && selectedRole === 'AGENT' && (
              <div className="mb-4 bg-sky-50 border border-sky-200 text-sky-900 p-3 rounded-2xl text-xs font-medium flex items-start gap-2.5 leading-relaxed">
                <Briefcase className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  Lors de l'inscription, votre demande d'intégration comme Agent EcoClean sera transmise aux administrateurs pour validation.
                </span>
              </div>
            )}

            {/* Success message banner for agent request */}
            {agentMessage && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{agentMessage}</span>
              </div>
            )}

            {/* Error Banner */}
            {currentError && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{currentError}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nom complet</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="ex. Jean Kabeya"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ecogreen-500/20 focus:border-ecogreen-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Adresse e-mail</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ecogreen-500/20 focus:border-ecogreen-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Mot de passe</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ecogreen-500/20 focus:border-ecogreen-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 text-sm uppercase tracking-wide disabled:bg-slate-300 disabled:shadow-none cursor-pointer ${
                  selectedRole === 'AGENT' 
                    ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20' 
                    : 'bg-ecogreen-500 hover:bg-ecogreen-600 shadow-ecogreen-500/20'
                }`}
              >
                {submitting || loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    {isRegister ? "Créer mon compte" : "Se connecter"}
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6 text-center">
              <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-slate-100"></span>
              <span className="relative bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">ou continuer avec</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting || loading}
              className="w-full py-3.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2.5 text-sm disabled:opacity-50 cursor-pointer"
            >
              <Chrome className="w-5 h-5 text-rose-500" />
              Compte Google
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6 font-medium leading-normal">
          En vous connectant, vous contribuez à assainir l'environnement urbain de la capitale. Merci pour Kinshasa !
        </p>
      </div>
    </div>
  );
};
