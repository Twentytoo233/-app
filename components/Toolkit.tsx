
import React, { useState, useRef, useEffect } from 'react';
import { Package, Languages, ShieldCheck, Loader2, Sparkles, Send, Trash2, CheckCircle2, FileText, AlertCircle, MessageCircle, Camera, ImageIcon, X, RefreshCw, Search, Globe, ChevronRight, Plus, HelpCircle } from 'lucide-react';
import { generatePackingList, translateText, translateImage, getVisaRequirements } from '../services/geminiService';

const Toolkit: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'luggage' | 'translate' | 'docs' | 'visa' | 'survival'>('luggage');

  // Luggage State
  const [luggageDest, setLuggageDest] = useState('Tokyo');
  const [luggagePurpose, setLuggagePurpose] = useState('Business');
  const [luggageDays, setLuggageDays] = useState(5);
  const [luggageList, setLuggageList] = useState<{item: string, checked: boolean}[]>([]);
  const [luggageLoading, setLuggageLoading] = useState(false);

  // Translation State
  const [transInput, setTransInput] = useState('');
  const [transTarget, setTransTarget] = useState('Japanese');
  const [transOutput, setTransOutput] = useState('');
  const [transLoading, setTransLoading] = useState(false);
  const [isVisionMode, setIsVisionMode] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // Visa State
  const [visaOrigin, setVisaOrigin] = useState('China');
  const [visaDest, setVisaDest] = useState('Japan');
  const [visaResult, setVisaResult] = useState('');
  const [visaLoading, setVisaLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const survivalPhrases = [
    { text: "Where is the nearest hospital?", trans: "一番近い病院はどこですか？", category: "Medical" },
    { text: "I have lost my passport.", trans: "パスポートを失くしました。", category: "Emergency" },
    { text: "Can you help me, please?", trans: "助けてもらえますか？", category: "General" },
    { text: "Where is the train station?", trans: "駅はどこですか？", category: "Transit" },
  ];

  const handleGenLuggage = async () => {
    setLuggageLoading(true);
    try {
      const list = await generatePackingList(luggageDest, luggagePurpose, luggageDays);
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
      const result = await getVisaRequirements(visaOrigin, visaDest);
      setVisaResult(result);
    } finally {
      setVisaLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = async () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      
      const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
      stopCamera();
      setTransLoading(true);
      try {
        const result = await translateImage(base64, 'image/jpeg');
        setTransOutput(result);
      } finally {
        setTransLoading(false);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setTransLoading(true);
      try {
        const result = await translateImage(base64, file.type);
        setTransOutput(result);
      } finally {
        setTransLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-wrap gap-2 bg-white p-1 rounded-2xl border border-slate-200 w-fit">
        {[
          { id: 'luggage', label: 'Packing AI', icon: Package },
          { id: 'translate', label: 'Translator', icon: Languages },
          { id: 'survival', label: 'Survival Phrases', icon: MessageCircle },
          { id: 'visa', label: 'Visa Checker', icon: Globe },
          { id: 'docs', label: 'Vault', icon: ShieldCheck },
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
            <h3 className="font-bold text-slate-800">Personalize Your List</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Destination</label>
                <input value={luggageDest} onChange={e => setLuggageDest(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" />
              </div>
              <button 
                onClick={handleGenLuggage}
                disabled={luggageLoading}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                {luggageLoading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18}/> Generate List</>}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Your AI-Generated Gear List</h3>
              <button onClick={() => setLuggageList([])} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
            </div>
            <div className="p-6 space-y-2">
              {luggageList.length > 0 ? luggageList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group" onClick={() => {
                  const newList = [...luggageList];
                  newList[idx].checked = !newList[idx].checked;
                  setLuggageList(newList);
                }}>
                  <div className={`w-5 h-5 rounded-md border-2 transition-colors flex items-center justify-center ${item.checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}>
                    {item.checked && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <span className={`text-sm ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>{item.item}</span>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Package size={48} className="mb-4 opacity-20" />
                  <p>Your checklist will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'survival' && (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8">
           <div className="flex items-center gap-3 mb-8">
             <div className="bg-indigo-600 p-2 rounded-xl text-white">
               <HelpCircle size={24} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-slate-800">Survival Phrases</h3>
               <p className="text-xs text-slate-400 font-medium">Common emergency and utility expressions in your destination's language.</p>
             </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {survivalPhrases.map((phrase, i) => (
               <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group">
                  <span className="text-[10px] font-black uppercase text-indigo-500 mb-2 block tracking-widest">{phrase.category}</span>
                  <p className="font-bold text-slate-800 mb-1">{phrase.text}</p>
                  <p className="text-lg text-indigo-600 font-medium">{phrase.trans}</p>
               </div>
             ))}
           </div>
        </div>
      )}

      {activeSubTab === 'visa' && (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Globe size={24} className="text-indigo-600" />
                Global Entry Advisor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="text-xs font-black text-slate-400 uppercase mb-1 block">Passport Issued By</label>
                   <input 
                      value={visaOrigin}
                      onChange={e => setVisaOrigin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. China"
                   />
                </div>
                <div>
                   <label className="text-xs font-black text-slate-400 uppercase mb-1 block">Destination Country</label>
                   <input 
                      value={visaDest}
                      onChange={e => setVisaDest(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Japan"
                   />
                </div>
              </div>
              <button 
                onClick={handleVisaCheck}
                disabled={visaLoading}
                className="mt-6 w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
              >
                {visaLoading ? <Loader2 size={24} className="animate-spin" /> : <><Search size={20} /> Verify Requirements</>}
              </button>
           </div>
           <div className="p-8 bg-slate-50/50 min-h-[200px]">
              {visaResult ? (
                <div className="prose prose-slate max-w-none animate-in fade-in slide-in-from-top-4">
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {visaResult}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300 py-12">
                   <ShieldCheck size={48} className="opacity-20 mb-4" />
                   <p className="text-sm">Entry requirements will appear here after verification.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeSubTab === 'translate' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setIsVisionMode(false)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!isVisionMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>Text</button>
              <button onClick={() => setIsVisionMode(true)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isVisionMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>Vision AI</button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                {!isVisionMode ? (
                  <>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Source</span>
                    <textarea value={transInput} onChange={e => setTransInput(e.target.value)} placeholder="Type to translate..." className="w-full h-48 bg-slate-50 border border-slate-200 rounded-3xl p-4 outline-none resize-none" />
                    <button onClick={handleTranslate} disabled={transLoading || !transInput} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                      {transLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Image Capture</span>
                    {!isCameraActive ? (
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={startCamera} className="h-48 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl flex flex-col items-center justify-center text-indigo-700 hover:bg-indigo-100 transition-all">
                          <Camera size={40} className="mb-2" />
                          <span className="text-xs font-bold">Open Camera</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-600 hover:bg-slate-100 transition-all">
                          <ImageIcon size={40} className="mb-2" />
                          <span className="text-xs font-bold">Upload File</span>
                        </button>
                        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
                      </div>
                    ) : (
                      <div className="relative h-64 bg-black rounded-3xl overflow-hidden shadow-2xl">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                          <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full border-4 border-indigo-500 shadow-xl flex items-center justify-center hover:scale-110 transition-all">
                            <Camera size={28} className="text-indigo-600" />
                          </button>
                          <button onClick={stopCamera} className="bg-slate-800/80 text-white p-4 rounded-full backdrop-blur-md">
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    )}
                    <canvas ref={canvasRef} hidden />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Translation</span>
                  <select value={transTarget} onChange={e => setTransTarget(e.target.value)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded outline-none">
                    <option>Japanese</option>
                    <option>Chinese</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
                <div className="w-full h-48 bg-indigo-50/30 border border-indigo-100 rounded-3xl p-6 text-indigo-900 font-semibold overflow-y-auto whitespace-pre-wrap shadow-inner">
                  {transLoading ? <div className="flex items-center gap-2 text-indigo-400"><RefreshCw className="animate-spin" size={16} /> Translating...</div> : (transOutput || <span className="text-slate-300 font-normal italic">Output...</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'docs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { type: 'Passport', num: 'E92***12', expiry: '2028-10-12', status: 'valid' },
            { type: 'Japan VISA', num: 'S-92183', expiry: '2024-12-01', status: 'valid' },
            { type: 'Travel Insurance', num: 'POL-331', expiry: '2024-06-25', status: 'expiring' },
          ].map((doc, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <FileText size={24} />
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${doc.status === 'valid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {doc.status}
                </div>
              </div>
              <h4 className="font-bold text-slate-800">{doc.type}</h4>
              <p className="text-sm text-slate-500 font-mono mt-1">{doc.num}</p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-xs">
                <span className="text-slate-400">Valid until</span>
                <span className="font-bold text-slate-700">{doc.expiry}</span>
              </div>
            </div>
          ))}
          <button className="border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-6 text-slate-400 hover:bg-slate-50 hover:border-indigo-300 transition-all">
            <Plus size={24} className="mb-1" />
            <span className="text-sm font-bold">Add Digital Document</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Toolkit;
