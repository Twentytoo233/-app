
import React, { useState, useEffect } from 'react';
import { Map, Coffee, Camera, Umbrella, ArrowRight, Loader2, Sparkles, MapPin, Play, Film, X, Zap, DollarSign, Smartphone, AlertCircle, Key } from 'lucide-react';
import { generateTouristGuide, generateDestinationVideo } from '../services/geminiService';
import { ItineraryDay, Language } from '../types';

interface TouristGuideProps {
  lang: Language;
  defaultDest?: string;
}

const TouristGuide: React.FC<TouristGuideProps> = ({ lang, defaultDest }) => {
  const [dest, setDest] = useState(defaultDest || (lang === 'cn' ? '日本，京都' : 'Kyoto, Japan'));
  const [loading, setLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isNiche, setIsNiche] = useState(false);
  const [interests, setInterests] = useState(lang === 'cn' ? '寺庙，街头美食，手工艺店' : 'Temples, street food, artisan shops');
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sync with global destination if it changes
  useEffect(() => {
    if (defaultDest) setDest(defaultDest);
  }, [defaultDest]);

  const fetchGuide = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateTouristGuide(dest, 3, interests, isNiche, lang);
      setItinerary(data);
    } catch (err: any) {
      console.error(err);
      setError(lang === 'cn' ? "生成指南失败，请重试。" : "Failed to generate guide. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    setError(null);
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setError(lang === 'cn' ? "生成视频需要付费 API 密钥，请在对话框中选择。" : "Veo video generation requires a paid API key. Please select one in the dialog.");
        await aistudio.openSelectKey();
      }
    }
    
    setVideoLoading(true);
    try {
      const url = await generateDestinationVideo(dest);
      setVideoUrl(url);
    } catch (err: any) {
      console.error("Video generation error:", err);
      setError(lang === 'cn' ? "视频生成过程中发生意外错误，请重试。" : "An unexpected error occurred during video generation. Please try again.");
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="animate-in highlight-fade">
            <label className="text-xs font-black text-slate-400 uppercase mb-1 block">{lang === 'cn' ? '城市 / 地标' : 'City / Landmark'}</label>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500">
              <Map size={20} className="text-indigo-600" />
              <input value={dest} onChange={e => setDest(e.target.value)} className="bg-transparent outline-none w-full text-sm font-semibold" placeholder={lang === 'cn' ? '下一站去哪？' : 'Where next?'} />
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase mb-1 block">{lang === 'cn' ? '旅行偏好' : 'Your Vibe'}</label>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500">
              <Coffee size={20} className="text-amber-600" />
              <input value={interests} onChange={e => setInterests(e.target.value)} className="bg-transparent outline-none w-full text-sm font-semibold" placeholder={lang === 'cn' ? '例如：拉面，安静的公园' : 'e.g. Ramen, quiet parks'} />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-50">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className={`w-12 h-6 rounded-full transition-all relative ${isNiche ? 'bg-indigo-600' : 'bg-slate-200'}`} onClick={() => setIsNiche(!isNiche)}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isNiche ? 'left-7' : 'left-1'}`}></div>
            </div>
            <span className="text-sm font-bold text-slate-600">{lang === 'cn' ? '探索小众路线' : 'Explore Off-the-Beaten-Path'}</span>
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
                  <span className="text-xs">{lang === 'cn' ? '正在生成视频...' : 'Generating Video...'}</span>
                </div>
              ) : <><Film size={20} /> {lang === 'cn' ? 'AI 预告片' : 'AI Cinematic Teaser'}</>}
            </button>
            <button 
              onClick={fetchGuide} 
              disabled={loading} 
              className="flex-1 md:flex-none px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> {lang === 'cn' ? '定制指南' : 'Curate Guide'}</>}
            </button>
          </div>
        </div>
      </div>

      {itinerary.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-12 pb-20">
            {itinerary.map((day) => (
              <div key={day.day} className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black text-indigo-100 tracking-tighter italic">{lang === 'cn' ? `第 ${day.day} 天` : `DAY ${day.day}`}</span>
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
        </div>
      )}
    </div>
  );
};

export default TouristGuide;
