'use client';

import React, { useState } from 'react';
import Layout from '../components/Layout';
import TripPlanner from '../components/TripPlanner';
import TouristGuide from '../components/TouristGuide';
import BusinessHub from '../components/BusinessHub';
import Toolkit from '../components/Toolkit';
import Collaboration from '../components/Collaboration';
import LiveAssistant from '../components/LiveAssistant';
import { Language, TripContext } from '../types';
import { 
  Package, Globe, Clock, ShieldCheck, Heart, ArrowRight, 
  Sparkles, Loader2, Info, 
  ExternalLink, Zap, BellRing, TrendingDown, AlertCircle, MapPin
} from 'lucide-react';
import { getDailyTravelInsight, getSmartAlerts, GeminiError } from '../services/geminiService';
import { useTranslation } from '../services/i18n';

const DashboardHome: React.FC<{onExplore: (tab: string) => void, lang: Language, context: TripContext}> = ({onExplore, lang, context}) => {
  const [insight, setInsight] = useState<{text: string, sources: any[]}>({ text: '', sources: [] });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState({ insight: false, alerts: false });
  const [errors, setErrors] = useState<{ insight: string | null, alerts: string | null }>({ insight: null, alerts: null });
  const t = useTranslation(lang);
  const fetchRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const currentRequestKey = `${lang}_${context.to}`;
      if (fetchRef.current === currentRequestKey) return;
      fetchRef.current = currentRequestKey;

      setLoading({ insight: true, alerts: true });
      setErrors({ insight: null, alerts: null });

      const results = await Promise.allSettled([
        getDailyTravelInsight(lang),
        getSmartAlerts(context.to, lang)
      ]);

      if (results[0].status === 'fulfilled') {
        setInsight(results[0].value);
      } else {
        const err = results[0].reason as GeminiError;
        setErrors(prev => ({ ...prev, insight: err.code === 429 ? "Quota limited" : "Insight unavailable" }));
      }

      if (results[1].status === 'fulfilled') {
        setAlerts(results[1].value);
      } else {
        const err = results[1].reason as GeminiError;
        setErrors(prev => ({ ...prev, alerts: err.code === 429 ? "Quota limited" : "Alerts unavailable" }));
      }

      setLoading({ insight: false, alerts: false });
      fetchRef.current = null;
    };

    fetchData();
  }, [lang, context.to]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <section className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 md:p-12 rounded-[40px] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-black uppercase tracking-widest mb-6">
            <Sparkles size={12} /> AI Context: {context.to}
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {t('hello')} ✈️
          </h2>
          <p className="text-indigo-100 text-lg md:text-xl opacity-90 leading-relaxed max-w-xl">
            {lang === 'en' 
              ? <>Heading to <span className="font-black text-white underline decoration-wavy decoration-indigo-400">{context.to}</span> on <span className="font-bold">{context.date}</span>. All insights have been updated.</>
              : <>您的行程：前往 <span className="font-black text-white underline decoration-wavy decoration-indigo-400">{context.to}</span>，日期 <span className="font-bold">{context.date}</span>。所有情报已实时更新。</>}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <button 
              onClick={() => onExplore('plan')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
            >
              {t('viewItinerary')} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        <div className="absolute right-[-80px] bottom-[-80px] opacity-10 pointer-events-none rotate-12">
          <Globe size={450} />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading.alerts ? (
          [1,2,3].map(i => (
            <div key={i} className="bg-white h-32 rounded-[32px] animate-pulse border border-slate-100 shadow-sm"></div>
          ))
        ) : errors.alerts ? (
          <div className="col-span-full py-6 px-8 bg-slate-50 border border-slate-200 border-dashed rounded-[32px] flex items-center gap-3 text-slate-400 font-medium">
            <AlertCircle size={18} />
            {errors.alerts === 'Quota limited' ? 'Quota limit, retrying...' : 'Unable to fetch alerts.'}
          </div>
        ) : (
          alerts.length > 0 ? alerts.map(alert => (
            <div key={alert.id} className={`${alert.color === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'} p-6 rounded-[32px] border shadow-sm flex items-start gap-4`}>
              <div className="p-4 rounded-2xl bg-white shadow-sm">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base mb-1">{alert.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{alert.desc}</p>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-8 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-[32px]">
              No active alerts for {context.to}.
            </div>
          )
        )}
      </div>

      <div className="bg-white border border-indigo-100 rounded-[40px] p-8 shadow-sm flex flex-col gap-6 group hover:border-indigo-300 transition-all">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="bg-indigo-600 p-5 rounded-[24px] text-white shadow-xl shadow-indigo-100">
            <Sparkles size={40} className={loading.insight ? 'animate-pulse' : ''} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-slate-800 mb-2">{lang === 'cn' ? `针对 ${context.to} 的智能洞察` : `Smart Insights for ${context.to}`}</h3>
            {loading.insight ? (
              <Loader2 size={24} className="animate-spin text-slate-300" />
            ) : (
              <div className="text-slate-600 leading-relaxed font-medium">
                {insight.text || "Scanning for latest destination news..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState<Language>('en');
  const [tripContext, setTripContext] = useState<TripContext>({
    from: 'Shanghai, China',
    to: 'Tokyo, Japan',
    date: '2024-06-15'
  });

  const handleContextUpdate = (newContext: TripContext) => {
    setTripContext(newContext);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'plan': return <TripPlanner lang={lang} context={tripContext} onPlanGenerated={handleContextUpdate} />;
      case 'guide': return <TouristGuide lang={lang} defaultDest={tripContext.to} />;
      case 'business': return <BusinessHub lang={lang} context={tripContext} />;
      case 'toolkit': return <Toolkit lang={lang} context={tripContext} />;
      case 'collab': return <Collaboration lang={lang} />;
      case 'dashboard': return <DashboardHome onExplore={(tab) => setActiveTab(tab)} lang={lang} context={tripContext} />;
      default: return <DashboardHome onExplore={(tab) => setActiveTab(tab)} lang={lang} context={tripContext} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} setLang={setLang}>
      <div className="max-w-7xl mx-auto min-h-full">
        {renderContent()}
      </div>
      <LiveAssistant lang={lang} />
    </Layout>
  );
}
