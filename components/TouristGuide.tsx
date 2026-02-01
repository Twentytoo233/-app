
import React, { useState } from 'react';
import { Map, Coffee, Camera, Umbrella, ArrowRight, Loader2, Sparkles, MapPin, Play, Film, X, Zap, DollarSign, Smartphone, AlertCircle, Key } from 'lucide-react';
import { generateTouristGuide, generateDestinationVideo } from '../services/geminiService';
import { ItineraryDay } from '../types';

const TouristGuide: React.FC = () => {
  const [dest, setDest] = useState('Kyoto, Japan');
  const [loading, setLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isNiche, setIsNiche] = useState(false);
  const [interests, setInterests] = useState('Temples, street food, artisan shops');
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchGuide = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateTouristGuide(dest, 3, interests, isNiche);
      setItinerary(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate guide. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkAndPromptKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
        return true; // Assume success after opening
      }
    }
    return true;
  };

  const handleGenerateVideo = async () => {
    setError(null);
    
    // Veo models require a paid API key selected via openSelectKey()
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setError("Veo video generation requires a paid API key. Please select one in the dialog.");
        await aistudio.openSelectKey();
        // Proceeding anyway as per instructions (mitigate race condition)
      }
    }
    
    setVideoLoading(true);
    try {
      const url = await generateDestinationVideo(dest);
      setVideoUrl(url);
    } catch (err: any) {
      console.error("Video generation error:", err);
      const errorStr = JSON.stringify(err);
      
      if (errorStr.includes("403") || errorStr.includes("PERMISSION_DENIED")) {
        setError("Access Denied: Please ensure you have selected an API key from a PAID Google Cloud project with billing enabled.");
        if (aistudio) await aistudio.openSelectKey();
      } else if (errorStr.includes("404") || errorStr.includes("not found")) {
        setError("Model not found: Please re-select your API key.");
        if (aistudio) await aistudio.openSelectKey();
      } else {
        setError("An unexpected error occurred during video generation. Please try again.");
      }
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase mb-1 block">City / Landmark</label>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500">
              <Map size={20} className="text-indigo-600" />
              <input value={dest} onChange={e => setDest(e.target.value)} className="bg-transparent outline-none w-full text-sm font-semibold" placeholder="Where next?" />
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase mb-1 block">Your Vibe</label>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500">
              <Coffee size={20} className="text-amber-600" />
              <input value={interests} onChange={e => setInterests(e.target.value)} className="bg-transparent outline-none w-full text-sm font-semibold" placeholder="e.g. Ramen, quiet parks" />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-50">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className={`w-12 h-6 rounded-full transition-all relative ${isNiche ? 'bg-indigo-600' : 'bg-slate-200'}`} onClick={() => setIsNiche(!isNiche)}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isNiche ? 'left-7' : 'left-1'}`}></div>
            </div>
            <span className="text-sm font-bold text-slate-600">Explore Off-the-Beaten-Path</span>
          </label>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleGenerateVideo}
              disabled={videoLoading}
              className="flex-1 md:flex-none px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {videoLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-xs">Generating Video...</span>
                </div>
              ) : <><Film size={20} /> AI Cinematic Teaser</>}
            </button>
            <button 
              onClick={fetchGuide} 
              disabled={loading} 
              className="flex-1 md:flex-none px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> Curate Guide</>}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 text-rose-700 text-xs font-bold">
              <AlertCircle size={16} />
              {error}
            </div>
            {error.includes("API key") && (
              <button 
                onClick={() => (window as any).aistudio?.openSelectKey()}
                className="text-xs text-rose-600 underline font-bold hover:text-rose-800 text-left pl-7"
              >
                Open API Key Selector
              </button>
            )}
          </div>
        )}
      </div>

      {videoUrl && (
        <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-500 aspect-video group">
          <video src={videoUrl} controls autoPlay className="w-full h-full object-cover" />
          <button 
            onClick={() => setVideoUrl(null)}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 backdrop-blur p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {itinerary.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-12 pb-20">
            {itinerary.map((day) => (
              <div key={day.day} className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black text-indigo-100 tracking-tighter italic">DAY {day.day}</span>
                  <div className="h-px flex-1 bg-slate-200/50"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {day.activities.map((act, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">{act.time}</span>
                        {act.mapUrl && (
                          <a href={act.mapUrl} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-indigo-600 transition-colors">
                            <MapPin size={18} />
                          </a>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800 text-xl mb-3 group-hover:text-indigo-600 transition-colors">{act.location}</h4>
                      <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-4">{act.description}</p>
                      <div className="pt-4 border-t border-slate-50 flex items-start gap-3">
                        <div className="bg-emerald-50 p-2 rounded-lg">
                          <Umbrella size={16} className="text-emerald-500" />
                        </div>
                        <p className="text-[11px] text-emerald-700 font-bold leading-relaxed">{act.travelTip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-8">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600" />
                  Local Practical Info
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                    <Zap size={16} className="text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Power & Voltage</p>
                      <p className="text-xs font-bold text-slate-700">Type A/C, 100-110V</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                    <DollarSign size={16} className="text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Currency & Payments</p>
                      <p className="text-xs font-bold text-slate-700">JPY (¥). Cash heavy, Suica/Pasmo for transit.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                    <Smartphone size={16} className="text-indigo-500 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">SIM & Connectivity</p>
                      <p className="text-xs font-bold text-slate-700">eSIM recommended. Rental WiFi at Hub.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Billing Status</p>
                  <button 
                    onClick={() => (window as any).aistudio?.openSelectKey()}
                    className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-200"
                  >
                    <Key size={14} /> Update API Key
                  </button>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-center mt-3 text-[9px] text-slate-400 hover:text-indigo-600 underline"
                  >
                    Billing Documentation
                  </a>
                </div>
             </div>
          </div>
        </div>
      )}

      {itinerary.length === 0 && !loading && (
        <div className="text-center py-32 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
          <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Camera className="text-slate-200" size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Your Next Adventure Starts Here</h3>
          <p className="text-slate-400 max-w-sm mx-auto font-medium">Define your vibe and destination. Our AI will craft a unique story for your journey.</p>
        </div>
      )}
    </div>
  );
};

export default TouristGuide;
