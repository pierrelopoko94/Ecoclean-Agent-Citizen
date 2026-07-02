import React from 'react';
import { useAuth } from '../context/AuthContext';
import { WifiOff, Loader2, RefreshCw } from 'lucide-react';

export const NotificationBanner: React.FC = () => {
  const { error, refreshProfile, loading } = useAuth();

  if (!error) return null;

  const isServerAsleep = error.includes('démarre') || error.includes('serveur') || error.includes('plateforme') || error.includes('contacter');

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3">
      <div className="p-1 bg-amber-100 rounded-lg text-amber-700">
        <WifiOff className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">Difficulté de connexion</p>
        <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
          {error}
        </p>
        {isServerAsleep && (
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => refreshProfile()}
              disabled={loading}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Réessayer la connexion
            </button>
            <span className="text-[10px] text-amber-600 italic">
              (La première requête peut prendre 1 minute)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
