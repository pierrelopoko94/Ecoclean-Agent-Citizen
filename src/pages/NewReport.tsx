import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  Trash2, 
  Loader2, 
  Send, 
  Check, 
  ArrowLeft,
  AlertTriangle,
  MapPinOff,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

const COMMUNES = [
  'Gombe', 
  'Limete', 
  'Bandalungwa', 
  'Ngaliema', 
  'Kalamu', 
  'Lemba', 
  'Matete', 
  'Ngiri-Ngiri', 
  'Barumbu', 
  'Kinshasa (centre)'
];

const WASTE_TYPES = [
  { value: 'PLASTIC', label: 'Plastique / Bouteilles', color: 'bg-sky-50 text-sky-700' },
  { value: 'ORGANIC', label: 'Organique / Restes de nourriture', color: 'bg-amber-50 text-amber-700' },
  { value: 'METAL', label: 'Métal / Ferraille', color: 'bg-slate-100 text-slate-800' },
  { value: 'HAZARDOUS', label: 'Dangereux / Piles / Électronique', color: 'bg-rose-50 text-rose-700' },
  { value: 'GLASS', label: 'Verre', color: 'bg-teal-50 text-teal-700' },
  { value: 'OTHER', label: 'Autre / Tout-venant', color: 'bg-purple-50 text-purple-700' }
];

export const NewReport: React.FC = () => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  
  const [type, setType] = useState('PLASTIC');
  const [description, setDescription] = useState('');
  const [commune, setCommune] = useState('');
  const [avenue, setAvenue] = useState('');
  const [address, setAddress] = useState('');
  
  // Geolocation
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Fetch geolocation automatically on mount
  useEffect(() => {
    getGeolocation();
  }, []);

  const getGeolocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas supportée par votre navigateur.");
      setGpsLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsLoading(false);
      },
      (err) => {
        console.error('GPS Error:', err);
        let msg = "Impossible de récupérer votre position GPS.";
        if (err.code === 1) msg = "Veuillez autoriser l'accès GPS dans les paramètres.";
        else if (err.code === 2) msg = "Signal GPS indisponible (vérifiez que votre localisation est activée).";
        else if (err.code === 3) msg = "Délai de recherche GPS dépassé.";
        setGpsError(msg);
        setGpsLoading(false);
      },
      options
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);

      // Also convert to base64 as backup
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setPhotoBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!commune) {
      setError("La commune est obligatoire pour orienter les équipes de ramassage.");
      return;
    }

    if (!latitude || !longitude) {
      setError("La géolocalisation GPS est requise pour guider l'agent de terrain.");
      return;
    }

    setSubmitting(true);
    try {
      await apiService.submitReport({
        type,
        description,
        commune,
        latitude,
        longitude,
        avenue,
        address,
        photoFile: photo || undefined,
        photoBase64: photoBase64 || undefined
      });
      setSubmitSuccess(true);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err.message || "Une erreur s'est produite lors de l'envoi du signalement. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-12 text-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.1, 1] }}
          transition={{ duration: 0.5 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-xl shadow-emerald-500/10"
        >
          <Check className="w-12 h-12 stroke-[3]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 fill-current" /> +15 Points Éco-Citoyens
          </span>
          <h2 className="font-display font-bold text-2xl text-slate-900 leading-tight">Signalement Envoyé !</h2>
          <p className="text-slate-500 text-sm mt-2.5 leading-relaxed">
            Merci ! Votre signalement a été enregistré avec succès et sera affecté à un agent de terrain d'EcoClean dans les plus brefs délais.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full mt-8 space-y-3"
        >
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-ecogreen-500 hover:bg-ecogreen-600 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-ecogreen-500/25 transition-all"
          >
            Retour à l'accueil
          </button>
          <button
            onClick={() => {
              setPhoto(null);
              setPhotoPreview(null);
              setPhotoBase64(null);
              setDescription('');
              setAvenue('');
              setAddress('');
              setSubmitSuccess(false);
              getGeolocation();
            }}
            className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all text-sm"
          >
            Signaler un autre déchet
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-display font-bold text-base text-slate-900">Nouveau Signalement</h3>
        <div className="w-9"></div> {/* Spacer to center title */}
      </div>

      <div className="px-5 pt-4 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo Capture Area */}
          <div>
            <span className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Photo du Déchet</span>
            {photoPreview ? (
              <div className="relative rounded-3xl overflow-hidden aspect-video border border-slate-200 shadow-sm bg-slate-50">
                <img 
                  src={photoPreview} 
                  alt="Aperçu déchet" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute bottom-4 right-4 bg-rose-600 text-white p-2.5 rounded-2xl shadow-lg hover:bg-rose-700 transition-colors active:scale-95"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-3xl border-2 border-dashed border-slate-300 hover:border-ecogreen-500 bg-white hover:bg-ecogreen-50/20 transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer text-slate-500 group"
              >
                <div className="w-14 h-14 bg-slate-50 text-slate-500 group-hover:bg-ecogreen-100 group-hover:text-ecogreen-600 rounded-2xl flex items-center justify-center shadow-sm transition-colors">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800">Prendre une photo</p>
                  <p className="text-slate-400 text-xs mt-0.5">Ouvre l'appareil photo de votre smartphone</p>
                </div>
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* GPS Auto-Location Info Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Géolocalisation</span>
              <button
                type="button"
                onClick={getGeolocation}
                disabled={gpsLoading}
                className="text-xs font-bold text-ecogreen-600 hover:text-ecogreen-700 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {gpsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5" />
                )}
                Actualiser GPS
              </button>
            </div>

            {latitude && longitude ? (
              <div className="flex items-center gap-3 text-emerald-800 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs font-medium">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-900">Position acquise avec succès</p>
                  <p className="text-emerald-700/80 mt-0.5">Lat : {latitude.toFixed(5)} , Long : {longitude.toFixed(5)}</p>
                </div>
              </div>
            ) : gpsLoading ? (
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-medium">
                <Loader2 className="w-5 h-5 text-ecogreen-500 animate-spin shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">Recherche de la position en cours...</p>
                  <p className="text-slate-400 mt-0.5">Veuillez patienter quelques secondes...</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-rose-800 bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs font-medium">
                <MapPinOff className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-semibold text-rose-900">Localisation GPS manquante</p>
                  <p className="text-rose-700/80 mt-0.5">{gpsError || "Cliquez sur 'Actualiser GPS' ci-dessus."}</p>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Commune Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Commune (Obligatoire)</label>
              <select
                required
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ecogreen-500/20 focus:border-ecogreen-500 transition-all"
              >
                <option value="">Sélectionnez votre commune...</option>
                {COMMUNES.map((com) => (
                  <option key={com} value={com}>{com}</option>
                ))}
              </select>
            </div>

            {/* Avenue Input */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Avenue (Optionnel)</label>
              <input
                type="text"
                placeholder="ex. Avenue de la Libération"
                value={avenue}
                onChange={(e) => setAvenue(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-ecogreen-500/20 focus:border-ecogreen-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Reference Address Input */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Point de repère / Adresse complète (Optionnel)</label>
              <input
                type="text"
                placeholder="ex. En face de la station Total, près du grand manguier"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-ecogreen-500/20 focus:border-ecogreen-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Waste Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Type de Déchet</label>
              <div className="grid grid-cols-2 gap-2">
                {WASTE_TYPES.map((wt) => (
                  <button
                    key={wt.value}
                    type="button"
                    onClick={() => setType(wt.value)}
                    className={`p-3.5 rounded-2xl text-xs font-semibold border text-left transition-all ${
                      type === wt.value
                        ? 'bg-ecogreen-500 border-ecogreen-500 text-white shadow-md shadow-ecogreen-500/15'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {wt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Description</label>
              <textarea
                placeholder="Précisez la taille du tas, s'il bloque la route, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-ecogreen-500/20 focus:border-ecogreen-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4.5 bg-ecogreen-500 hover:bg-ecogreen-600 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-ecogreen-500/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:bg-slate-300 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-4.5 h-4.5" />
                Envoyer le signalement
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
