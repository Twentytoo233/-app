
import React, { useState } from 'react';
import { Search, MapPin, Calendar, DollarSign, Loader2, CheckCircle2, AlertTriangle, Clock, ArrowRight, Sliders, ExternalLink, Info, PackageOpen, Home, Navigation, ShieldCheck } from 'lucide-react';
import { generateTravelPlans, getLuggageAdvisor } from '../services/geminiService';
import { TripPlanResponse, TravelPreferences, Language } from '../types';

interface TripPlannerProps {
  lang: Language;
}

const TripPlanner: React.FC<TripPlannerProps> = ({ lang }) => {
  const [loading, setLoading] = useState(false);
  const [luggageLoading, setLuggageLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    from: 'Shanghai, China',
    to: 'Tokyo, Japan',
    date: '2024-06-15',
  });
  
  const [preferences, setPreferences] = useState<TravelPreferences>({
    budget: 5000,
    transport: 'Flight',
    seats: 'Window',
    allowRedEye: false,
    businessCompliance: true
  });

  const [results, setResults] = useState<TripPlanResponse | null>(null);
  const [luggageRules, setLuggageRules] = useState('');

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData({ ...formData, from: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` });
      });
    }
  };

  const handlePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLuggageRules('');
    try {
      const userPos = formData.from.includes(',') ? {
        latitude: parseFloat(formData.from.split(',')[0]),
        longitude: parseFloat(formData.from.split(',')[1])
      } : undefined;
      
      const data = await generateTravelPlans(formData.from, formData.to, formData.date, preferences, lang, userPos);
      setResults(data);

      if (preferences.transport === 'Flight') {
        setLuggageLoading(true);
        const rules = await getLuggageAdvisor('Major Airlines on ' + formData.from + ' to ' + formData.to + ' route', lang);
        setLuggageRules(rules);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLuggageLoading(false);
    }
  };

  const getSegmentIcon = (type: string) => {
    switch(type) {
      case 'transit': return Navigation;
      case 'security': return ShieldCheck;
      case 'main': return Navigation;
      case 'arrival': return MapPin;
      default: return Clock;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <form onSubmit={handlePlan} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex justify-between">
                {lang === 'cn' ? '出发地' : 'Origin'}
                <button type="button" onClick={getCurrentLocation} className="text-indigo-600 hover:underline capitalize">{lang === 'cn' ? '附近' : 'Nearby'}</button>
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500">
                <MapPin size={18} className="text-indigo-500" />
                <input value={formData.from} onChange={e => setFormData({...formData, from: e.target.value})} className="bg-transparent outline-none w-full text-sm" placeholder={lang === 'cn' ? '城市或机场' : 'City or airport'} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1">{lang === 'cn' ? '目的地' : 'Destination'}</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500">
                <Search size={18} className="text-indigo-500" />
                <input value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} className="bg-transparent outline-none w-full text-sm" placeholder={lang === 'cn' ? '要去哪儿？' : 'Where to?'} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1">{lang === 'cn' ? '出发日期' : 'Departure'}</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500">
                <Calendar size={18} className="text-indigo-500" />
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-transparent outline-none w-full text-sm" />
              </div>
            </div>
            <div className="flex items-end">
              <button disabled={loading} className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20} /> : (lang === 'cn' ? '生成行程' : "Generate Plan")}
              </button>
            </div>
          </div>

          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-indigo-600">
            <Sliders size={14} /> {showAdvanced ? (lang === 'cn' ? '隐藏' : 'Hide') : (lang === 'cn' ? '显示' : 'Show')} {lang === 'cn' ? '高级偏好' : 'Advanced Preferences'}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-50 animate-in slide-in-from-top-2">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase">{lang === 'cn' ? '交通与预算' : 'Transport & Budget'}</label>
                <select value={preferences.transport} onChange={e => setPreferences({...preferences, transport: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none">
                  <option value="Flight">{lang === 'cn' ? '航班' : 'Flight'}</option>
                  <option value="High-Speed Rail">{lang === 'cn' ? '高铁' : 'High-Speed Rail'}</option>
                  <option value="Car">{lang === 'cn' ? '自驾' : 'Car'}</option>
                  <option value="Bus">{lang === 'cn' ? '大巴' : 'Bus'}</option>
                </select>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <DollarSign size={16} className="text-slate-400" />
                  <input type="number" value={preferences.budget} onChange={e => setPreferences({...preferences, budget: Number(e.target.value)})} className="bg-transparent w-full text-sm outline-none" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase">{lang === 'cn' ? '座位与舒适度' : 'Seating & Comfort'}</label>
                <select value={preferences.seats} onChange={e => setPreferences({...preferences, seats: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none">
                  <option>{lang === 'cn' ? '靠窗' : 'Window'}</option>
                  <option>{lang === 'cn' ? '走道' : 'Aisle'}</option>
                  <option>{lang === 'cn' ? '商务舱' : 'Business Class'}</option>
                  <option>{lang === 'cn' ? '头等舱' : 'First Class'}</option>
                </select>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={preferences.allowRedEye} onChange={e => setPreferences({...preferences, allowRedEye: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{lang === 'cn' ? '接受红眼航班' : 'Accept red-eye flights'}</span>
                </label>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase">{lang === 'cn' ? '企业合规性' : 'Corporate Compliance'}</label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={preferences.businessCompliance} onChange={e => setPreferences({...preferences, businessCompliance: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{lang === 'cn' ? '应用差旅标准' : 'Apply Travel Standards'}</span>
                </label>
              </div>
            </div>
          )}
        </form>
      </section>

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center justify-between">
              {lang === 'cn' ? '全链路行程时间轴' : 'Full-Link Logistics Timeline'}
              <span className="text-xs font-normal text-slate-400">{lang === 'cn' ? '预计总耗时' : 'Total Predicted Transit Time'}</span>
            </h2>
            
            {results.options.map((option) => (
              <div key={option.id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group overflow-hidden">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex gap-4">
                    <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100">
                      <Home size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                        {option.transportType} {lang === 'cn' ? '方案' : 'Strategy'}
                        {option.compliance && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase font-black">{lang === 'cn' ? '符合政策' : 'Corp Policy OK'}</span>}
                      </h3>
                      <p className="text-sm text-slate-400 font-medium">{lang === 'cn' ? '预计到达' : 'Estimated Arrival'}: {option.segments[option.segments.length-1].startTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-indigo-600">¥{option.totalCost.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === 'cn' ? '预估总价' : 'Estimated Total'}</p>
                  </div>
                </div>

                <div className="relative pl-8 space-y-12 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-1 before:bg-slate-100 before:rounded-full">
                  {option.segments.map((seg, idx) => {
                    const Icon = getSegmentIcon(seg.type);
                    return (
                      <div key={seg.id} className="relative">
                        <div className={`absolute -left-[32px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-md transition-all ${
                          seg.type === 'main' ? 'bg-indigo-600' : 
                          seg.type === 'security' ? 'bg-amber-500' : 
                          'bg-slate-300'
                        }`}></div>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="p-1 rounded bg-slate-50 text-slate-400">
                                <Icon size={12} />
                              </div>
                              <p className="text-sm font-bold text-slate-800">{seg.title}</p>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed pr-8">{seg.description}</p>
                            {seg.warning && (
                              <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg w-fit">
                                <AlertTriangle size={10} /> {seg.warning}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-slate-700">{seg.startTime}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{seg.duration} {lang === 'cn' ? '分钟' : 'min'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-8">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-500" /> {lang === 'cn' ? '目的地情报' : 'Destination Intelligence'}
              </h3>
              <div className="space-y-5">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{lang === 'cn' ? '天气状况' : 'Weather Status'}</p>
                  <p className="text-sm font-semibold text-slate-700">{results.localInfo.weather}</p>
                </div>
                
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                   <div className="flex items-center gap-2 mb-2">
                     <PackageOpen size={16} className="text-indigo-600" />
                     <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{lang === 'cn' ? '行李政策建议' : 'Luggage Policy Advisor'}</p>
                   </div>
                   {luggageLoading ? (
                     <div className="flex items-center gap-2 text-indigo-300">
                       <Loader2 size={12} className="animate-spin" />
                       <span className="text-xs">{lang === 'cn' ? '正在获取航线政策...' : 'Fetching route policies...'}</span>
                     </div>
                   ) : luggageRules ? (
                     <div className="text-[11px] text-indigo-700 leading-relaxed whitespace-pre-wrap font-medium">
                       {luggageRules}
                     </div>
                   ) : (
                     <p className="text-[11px] text-indigo-300 italic">{lang === 'cn' ? '生成计划后查看行李规则' : 'Generate a plan to see baggage rules.'}</p>
                   )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{lang === 'cn' ? '出行贴士与交通卡' : 'Travel Tips & Cards'}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{results.localInfo.tips}</p>
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-[10px] font-black uppercase text-rose-400 mb-2 tracking-widest">{lang === 'cn' ? '紧急求助服务' : 'Emergency Services'}</p>
                  <p className="text-sm font-black text-rose-700 font-mono">{results.localInfo.emergency}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlanner;
