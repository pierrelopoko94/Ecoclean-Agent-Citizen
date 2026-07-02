import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, PlusCircle, User, Briefcase, Map } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { profile } = useAuth();

  if (!profile) return null;

  const isAgent = profile.role === 'AGENT';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        {!isAgent ? (
          <>
            {/* CITIZEN NAV */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                  isActive ? 'text-ecogreen-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Home className="w-5.5 h-5.5" />
              <span className="text-[10px] tracking-wide">Accueil</span>
            </NavLink>

            <NavLink
              to="/report/new"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                  isActive ? 'text-ecogreen-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <div className="p-2 bg-ecogreen-500 text-white rounded-full -translate-y-4 shadow-lg shadow-ecogreen-500/30 flex items-center justify-center">
                <PlusCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] tracking-wide -translate-y-3">Signaler</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                  isActive ? 'text-ecogreen-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <User className="w-5.5 h-5.5" />
              <span className="text-[10px] tracking-wide">Profil</span>
            </NavLink>
          </>
        ) : (
          <>
            {/* AGENT NAV */}
            <NavLink
              to="/missions"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                  isActive ? 'text-ecogreen-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Briefcase className="w-5.5 h-5.5" />
              <span className="text-[10px] tracking-wide">Missions</span>
            </NavLink>

            <NavLink
              to="/map"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                  isActive ? 'text-ecogreen-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Map className="w-5.5 h-5.5" />
              <span className="text-[10px] tracking-wide">Carte</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                  isActive ? 'text-ecogreen-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <User className="w-5.5 h-5.5" />
              <span className="text-[10px] tracking-wide">Profil</span>
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
};
