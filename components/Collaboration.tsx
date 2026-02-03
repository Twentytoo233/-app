
import React, { useState } from 'react';
// Added Zap to the import list
import { Users, Share2, DollarSign, Plus, UserPlus, Link as LinkIcon, Trash2, PieChart, Sparkles, Loader2, CheckSquare, Briefcase, Plane, Home, UserCheck, Shield, ChevronRight, Copy, Clock, RefreshCw, Zap } from 'lucide-react';
import { analyzeBudgetSplit } from '../services/geminiService';
import { Language } from '../types';

interface CollaborationProps {
  lang: Language;
}

const Collaboration: React.FC<CollaborationProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<'share' | 'budget'>('share');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [expenses, setExpenses] = useState([
    { id: 1, title: lang === 'cn' ? '酒店预订' : 'Hotel Booking', amount: 3200, paidBy: 'Alex', split: 'Equal' },
    { id: 2, title: lang === 'cn' ? '东京中心晚餐' : 'Dinner at Tokyo Central', amount: 850, paidBy: 'Sarah', split: 'Equal' },
  ]);

  const [activeTrips] = useState([
    {
      id: 'trip-1',
      dest: lang === 'cn' ? '东京夏季大逃亡' : 'Tokyo Summer Escape',
      dates: '2024.06.15 - 06.20',
      members: ['Alex', 'Sarah', 'Mike'],
      status: 'In Sync',
      recentActivity: lang === 'cn' ? 'Sarah 更新了涩谷酒店预订' : 'Sarah updated Shibuya hotel booking'
    },
    {
      id: 'trip-2',
      dest: lang === 'cn' ? '京都周末深度游' : 'Kyoto Weekend Deep-dive',
      dates: '2024.07.02 - 07.04',
      members: ['Alex', 'Jane'],
      status: 'Planning',
      recentActivity: lang === 'cn' ? 'Alex 添加了岚山观光计划' : 'Alex added Arashiyama sightseeing'
    }
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

  const copyInviteLink = () => {
    navigator.clipboard.writeText('https://voyagemaster.ai/join/v39dk2');
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'share', label: lang === 'cn' ? '共享行程' : 'Shared Trips', icon: Share2 },
          { id: 'budget', label: lang === 'cn' ? '团队预算' : 'Group Budget', icon: DollarSign },
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-4 px-4 font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap relative ${
              activeTab === t.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <t.icon size={16} />
            {t.label}
            {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
          </button>
        ))}
      </div>

      {activeTab === 'share' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">{lang === 'cn' ? '进行中的多人协作' : 'Active Collaborations'}</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                <Plus size={16} /> {lang === 'cn' ? '新建协作行程' : 'New Shared Trip'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {activeTrips.map((trip) => (
                <div key={trip.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{trip.dest}</h4>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                        <Clock size={12} /> {trip.dates}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <RefreshCw size={10} className="animate-spin-slow" /> {trip.status}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex -space-x-3">
                      {trip.members.map((m, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 ring-1 ring-slate-100 overflow-hidden">
                          <img src={`https://i.pravatar.cc/150?u=${m}`} alt={m} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 ring-1 ring-slate-100">
                        <Plus size={12} />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] text-slate-500 italic">“{trip.recentActivity}”</p>
                      <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 h-fit sticky top-8">
            <div className="bg-indigo-50 border border-indigo-100 rounded-[32px] p-8 space-y-6">
              <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <UserPlus size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-indigo-900">{lang === 'cn' ? '邀请伙伴加入' : 'Invite Travel Buds'}</h4>
                <p className="text-sm text-indigo-700/70 mt-2 leading-relaxed">
                  {lang === 'cn' ? '将行程链接发给你的朋友，他们可以直接编辑、投票景点并分摊费用。' : 'Send the magic link to your friends. They can edit, vote, and split bills instantly.'}
                </p>
              </div>
              <button 
                onClick={copyInviteLink}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-indigo-600 font-bold rounded-2xl shadow-sm border border-indigo-100 hover:bg-indigo-100 transition-all group"
              >
                {copySuccess ? <UserCheck size={18} /> : <Copy size={18} />}
                {copySuccess ? (lang === 'cn' ? '链接已复制！' : 'Link Copied!') : (lang === 'cn' ? '复制邀请链接' : 'Copy Invite Link')}
              </button>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Zap size={18} />
                <h4 className="text-sm font-bold">{lang === 'cn' ? '协作小建议' : 'Team Pro-tip'}</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === 'cn' ? '开启“实时投票”模式，让大家在选择晚餐餐厅时不再纠结！' : 'Turn on "Live Voting" mode to help the team decide on dinner spots without the endless group chat!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-8">
               <h3 className="font-bold text-slate-800 text-xl">{lang === 'cn' ? '协作账本' : 'Collaborative Ledger'}</h3>
               <p className="text-3xl font-black text-indigo-600">¥{expenses.reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-50">
                      <td className="pb-4">{lang === 'cn' ? '项目' : 'Item'}</td>
                      <td className="pb-4">{lang === 'cn' ? '付款人' : 'Paid By'}</td>
                      <td className="pb-4 text-right">{lang === 'cn' ? '金额' : 'Amount'}</td>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-bold text-slate-700">{e.title}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <img src={`https://i.pravatar.cc/150?u=${e.paidBy}`} className="w-6 h-6 rounded-full border border-slate-100" />
                            <span className="text-indigo-600 font-medium">{e.paidBy}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right font-black text-slate-800">¥{e.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           </div>
           
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm h-fit space-y-6">
              <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-100 inline-block mb-2">
                <PieChart size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">{lang === 'cn' ? '智能债务结算' : 'Smart Settlement'}</h4>
                <p className="text-xs text-slate-400 mt-2">{lang === 'cn' ? 'AI 自动分析谁欠谁钱，并计算出最简单的转账路径。' : 'AI analyzes who owes what and finds the simplest path to settle all debts.'}</p>
              </div>
              <button onClick={getAiSettlementAdvice} disabled={aiLoading} className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md">
                {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} {lang === 'cn' ? '分析结算方案' : 'Analyze Debts'}
              </button>
              {aiAdvice && (
                <div className="mt-4 p-5 bg-indigo-50 border border-indigo-100 rounded-[24px] text-sm text-indigo-900 leading-relaxed font-medium animate-in zoom-in-95 duration-300">
                  {aiAdvice}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Collaboration;
