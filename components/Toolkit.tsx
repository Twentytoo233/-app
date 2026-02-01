
import React, { useState, useRef } from 'react';
import { Package, Languages, ShieldCheck, Loader2, Sparkles, Send, Trash2, CheckCircle2, FileText, Globe, Search, Camera, ImageIcon, X, RefreshCw, MessageCircle, HelpCircle, Plus } from 'lucide-react';
import { generatePackingList, translateText, translateImage, getVisaRequirements } from '../services/geminiService';
import { Language } from '../types';

interface ToolkitProps {
  lang: Language;
}

const Toolkit: React.FC<ToolkitProps> = ({ lang }) => {
  const [activeSubTab, setActiveSubTab] = useState<'luggage' | 'translate' | 'visa' | 'survival' | 'docs'>('luggage');

  const [luggageDest, setLuggageDest] = useState(lang === 'cn' ? '东京' : 'Tokyo');
  const [luggagePurpose, setLuggagePurpose] = useState(lang === 'cn' ? '商务' : 'Business');
  const [luggageDays, setLuggageDays] = useState(5);
  const [luggageList, setLuggageList] = useState<{item: string, checked: boolean}[]>([]);
  const [luggageLoading, setLuggageLoading] = useState(false);

  const [transInput, setTransInput] = useState('');
  const [transTarget, setTransTarget] = useState(lang === 'cn' ? '日语' : 'Japanese');
  const [transOutput, setTransOutput] = useState('');
  const [transLoading, setTransLoading] = useState(false);
  const [isVisionMode, setIsVisionMode] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const [visaOrigin, setVisaOrigin] = useState(lang === 'cn' ? '中国' : 'China');
  const [visaDest, setVisaDest] = useState(lang === 'cn' ? '日本' : 'Japan');
  const [visaResult, setVisaResult] = useState('');
  const [visaLoading, setVisaLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenLuggage = async () => {
    setLuggageLoading(true);
    try {
      const list = await generatePackingList(luggageDest, luggagePurpose, luggageDays, lang);
      setLuggageList(list.map(item => ({ item, checked: false })));
    } finally {
      setLuggageLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!transInput) return;
    setTransLoading(true);
    try {
      const result = await translateText(transInput, transTarget);
      setTransOutput(result);
    } finally {
      setTransLoading(false);
    }
  };

  const handleVisaCheck = async () => {
    setVisaLoading(true);
    try {
      const result = await getVisaRequirements(visaOrigin, visaDest, lang);
      setVisaResult(result);
    } finally {
      setVisaLoading(false);
    }
  };

  const capturePhoto = async () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
      setTransLoading(true);
      try {
        const result = await translateImage(base64, 'image/jpeg', lang);
        setTransOutput(result);
      } finally {
        setTransLoading(false);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-wrap gap-2 bg-white p-1 rounded-2xl border border-slate-200 w-fit">
        {[
          { id: 'luggage', label: lang === 'cn' ? 'AI 打包' : 'Packing AI', icon: Package },
          { id: 'translate', label: lang === 'cn' ? '翻译器' : 'Translator', icon: Languages },
          { id: 'visa', label: lang === 'cn' ? '签证核查' : 'Visa Checker', icon: Globe },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-semibold text-sm ${
              activeSubTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'luggage' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-4">
              <input value={luggageDest} onChange={e => setLuggageDest(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" />
              <button onClick={handleGenLuggage} disabled={luggageLoading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                {luggageLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18}/>} {lang === 'cn' ? '生成清单' : 'Generate List'}
              </button>
           </div>
           <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              {luggageList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={item.checked} onChange={() => {
                    const newList = [...luggageList];
                    newList[idx].checked = !newList[idx].checked;
                    setLuggageList(newList);
                  }} />
                  <span className={item.checked ? 'text-slate-400 line-through' : ''}>{item.item}</span>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeSubTab === 'visa' && (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input value={visaOrigin} onChange={e => setVisaOrigin(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" />
              <input value={visaDest} onChange={e => setVisaDest(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" />
           </div>
           <button onClick={handleVisaCheck} disabled={visaLoading} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg">
             {visaLoading ? <Loader2 size={24} className="animate-spin" /> : <Search size={20} />} {lang === 'cn' ? '核查签证要求' : 'Verify Requirements'}
           </button>
           {visaResult && <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm whitespace-pre-wrap">{visaResult}</div>}
        </div>
      )}

      {activeSubTab === 'translate' && (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 space-y-6">
           <textarea value={transInput} onChange={e => setTransInput(e.target.value)} className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none" placeholder={lang === 'cn' ? '输入要翻译的内容...' : 'Type to translate...'} />
           <button onClick={handleTranslate} disabled={transLoading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">
             {transLoading ? <Loader2 className="animate-spin" size={24} /> : (lang === 'cn' ? '翻译' : 'Translate')}
           </button>
           {transOutput && <div className="p-6 bg-indigo-50/30 border border-indigo-100 rounded-2xl text-indigo-900 font-semibold">{transOutput}</div>}
        </div>
      )}
    </div>
  );
};

export default Toolkit;
