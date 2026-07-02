import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Leaf, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2" onClick={() => navigate('/')}>
        <div className="w-10 h-10 bg-ecogreen-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-ecogreen-500/20">
          <Leaf className="w-5.5 h-5.5 fill-current" />
        </div>
        <div>
          <h1 className="font-display font-bold text-base leading-none tracking-tight">EcoClean</h1>
          <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5">Kinshasa Field</p>
        </div>
      </div>

      {profile && (
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800">{profile.name}</p>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
              profile.role === 'AGENT' 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-ecogreen-100 text-ecogreen-800'
            }`}>
              {profile.role === 'AGENT' ? 'Agent de Terrain' : 'Citoyen'}
            </span>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
            title="Mon Profil"
          >
            <UserIcon className="w-5 h-5" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      )}
    </header>
  );
};
