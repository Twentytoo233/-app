
import React, { useState } from 'react';
import { Users, Share2, DollarSign, Plus, UserPlus, Link as LinkIcon, Trash2, PieChart, Sparkles, Loader2, CheckSquare, Briefcase, Plane, Home, UserCheck, Shield, ChevronRight, Copy } from 'lucide-react';
import { analyzeBudgetSplit } from '../services/geminiService';
import { Language } from '../types';

interface CollaborationProps {
  lang: Language;
}

const Collaboration: React.FC<CollaborationProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<'share' | 'budget' | 'tasks'>('share');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  
  const [expenses, setExpenses] = useState([
    { id: 1, title: lang === 'cn' ? '酒店预订' : 'Hotel Booking', amount: 3200, paidBy: 'Alex', split: 'Equal' },
    { id: 2, title: lang === 'cn' ? '东京中心晚餐' : 'Dinner at Tokyo Central', amount: 850, paidBy: 'Sarah', split: 'Equal' },
  ]);

  const getAiSettlementAdvice = async () => {
    setAiLoading(true);
    try {
      const advice = await analyzeBudgetSplit(expenses, lang);
      setAiAdvice(advice);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: 'share', label: lang === 'cn' ? '共享行程' : 'Shared Trips', icon: Share2 },
          { id: 'budget', label: lang === 'cn' ? '团队预算' : 'Group Budget', icon: DollarSign },
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-4 px-4 font-bold text-sm transition-all flex items-center gap-2 relative ${
              activeTab === t.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <t.icon size={16} />
            {t.label}
            {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
          </button>
        ))}
      </div>

      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-8">
               <h3 className="font-bold text-slate-800 text-xl">{lang === 'cn' ? '协作账本' : 'Collaborative Ledger'}</h3>
               <p className="text-3xl font-black text-indigo-600">¥{expenses.reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
             </div>
             <table className="w-full text-sm">
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id} className="border-t border-slate-50">
                      <td className="py-4 font-bold">{e.title}</td>
                      <td className="py-4 text-indigo-600">{e.paidBy}</td>
                      <td className="py-4 text-right font-black">¥{e.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm h-fit">
              <button onClick={getAiSettlementAdvice} disabled={aiLoading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {lang === 'cn' ? 'AI 债务清算' : 'Resolve Debts'}
              </button>
              {aiAdvice && <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs whitespace-pre-wrap">{aiAdvice}</div>}
           </div>
        </div>
      )}
    </div>
  );
};

export default Collaboration;
