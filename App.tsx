
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TripPlanner from './components/TripPlanner';
import TouristGuide from './components/TouristGuide';
import BusinessHub from './components/BusinessHub';
import Toolkit from './components/Toolkit';
import Collaboration from './components/Collaboration';
import LiveAssistant from './components/LiveAssistant';
import { 
  Package, Globe, Clock, ShieldCheck, Heart, ArrowRight, 
  Sparkles, Loader2, Info, 
  ExternalLink, Zap, BellRing, TrendingDown 
} from 'lucide-react';
import { getDailyTravelInsight, getSmartAlerts } from './services/geminiService';
import { Language } from './types';
import { useTranslation } from './services/i18n';

const DashboardHome: React.FC<{onExplore: (tab: string) => void, lang: Language}> = ({onExplore, lang}) => {
  const [insight, setInsight] = useState<{text: string, sources: any[]}>({ text: '', sources: [] });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState({ insight: false, alerts: false });
  const t = useTranslation(lang);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(prev => ({ ...prev, insight: true, alerts: true }));
      try {
        const [insightData, alertsData] = await Promise.all([
          getDailyTravelInsight(),
          getSmartAlerts('Tokyo') // Defaulting to Tokyo for simulation
        ]);
        setInsight(insightData);
        setAlerts(alertsData);
      } catch (e) {
        console.error("Dashboard data fetch error:", e);
      } finally {
        setLoading({ insight: false, alerts: false });
      }
    };
    fetchData();
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'warning': return Zap;
      case 'event': return BellRing;
      case 'price': return TrendingDown;
      default: return Info;
    }
  };

  const getColor = (color: string) => {
    switch(color) {
      case 'amber': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'rose': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'indigo': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <section className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 md:p-12 rounded-[40px] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-black uppercase tracking-widest mb-6">
            <Sparkles size={12} /> AI Travel Companion Active
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {t('hello')} ✈️
          </h2>
          <p className="text-indigo-100 text-lg md:text-xl opacity-90 leading-relaxed max-w-xl">
            {lang === 'en' 
              ? <>Your Tokyo (HND) flight departs in <span className="font-black text-white underline decoration-wavy decoration-indigo-400">48 hours</span>. All documents are verified and compliant.</>
              : <>您的东京 (HND) 航班将在 <span className="font-black text-white underline decoration-wavy decoration-indigo-400">48 小时</span> 后起飞。所有文档已通过验证且符合政策。</>}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <button 
              onClick={() => onExplore('plan')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
            >
              {t('viewItinerary')} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => onExplore('business')}
              className="bg-indigo-500/30 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold border border-white/20 hover:bg-indigo-500/50 transition-all"
            >
              {t('complianceReport')}
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
        ) : (
          alerts.length > 0 ? alerts.map(alert => {
            const IconComp = getIcon(alert.type);
            const colorClass = getColor(alert.color);
            return (
              <div key={alert.id} className={`${colorClass} p-6 rounded-[32px] border shadow-sm flex items-start gap-4 animate-in slide-in-from-bottom-4 duration-500`}>
                <div className={`p-4 rounded-2xl bg-white shadow-sm ${colorClass.split(' ')[0]}`}>
                  <IconComp size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">{alert.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{alert.desc}</p>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-8 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-[32px]">
              No active alerts for your current route.
            </div>
          )
        )}
      </div>

      <div className="bg-white border border-indigo-100 rounded-[40px] p-8 shadow-sm flex flex-col gap-6 group hover:border-indigo-300 transition-all">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="bg-indigo-600 p-5 rounded-[24px] text-white shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform">
            <Sparkles size={40} className={loading.insight ? 'animate-pulse' : ''} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h3 className="text-xl font-bold text-slate-800">Smart Situational Awareness</h3>
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{t('liveSearch')}</span>
            </div>
            {loading.insight ? (
              <div className="flex items-center gap-2 text-slate-400 justify-center md:justify-start">
                <Loader2 size={16} className="animate-spin" />
                <p className="text-sm font-medium">Analyzing global events and pricing trends...</p>
              </div>
            ) : (
              <div className="text-slate-600 leading-relaxed prose prose-indigo max-w-none text-sm md:text-base font-medium">
                {insight.text || "Everything looks smooth for your travels. No significant disruptions detected on the global network today."}
              </div>
            )}
          </div>
        </div>
        
        {insight.sources.length > 0 && (
          <div className="pt-6 border-t border-slate-50">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">{t('groundingCitations')}</p>
            <div className="flex flex-wrap gap-3">
              {insight.sources.map((chunk, i) => (
                chunk.web && (
                  <a 
                    key={i} 
                    href={chunk.web.uri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all font-bold"
                  >
                    <ExternalLink size={12} /> {chunk.web.title}
                  </a>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         {[
           { icon: Clock, label: 'Total Trips', val: '42', color: 'blue' },
           { icon: ShieldCheck, label: 'Insurance', val: 'Active', color: 'emerald' },
           { icon: Heart, label: 'Rewards', val: '12.4k', color: 'rose' },
           { icon: Package, label: 'Avg Bag', val: '15.2kg', color: 'amber' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 hover:shadow-lg hover:-translate-y-1 transition-all cursor-default">
              <div className={`bg-${stat.color}-50 p-4 rounded-2xl text-${stat.color}-600`}>
                <stat.icon size={28}/>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{stat.val}</p>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState<Language>('en');

  const renderContent = () => {
    switch (activeTab) {
      case 'plan': return <TripPlanner lang={lang} />;
      case 'guide': return <TouristGuide lang={lang} />;
      case 'business': return <BusinessHub lang={lang} />;
      case 'toolkit': return <Toolkit lang={lang} />;
      case 'collab': return <Collaboration lang={lang} />;
      case 'dashboard': return <DashboardHome onExplore={(tab) => setActiveTab(tab)} lang={lang} />;
      default: return <DashboardHome onExplore={(tab) => setActiveTab(tab)} lang={lang} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} setLang={setLang}>
      <div className="max-w-7xl mx-auto min-h-full">
        {renderContent()}
      </div>
      <LiveAssistant />
    </Layout>
  );
};

export default App;
