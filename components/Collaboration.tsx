
import React, { useState } from 'react';
import { 
  Users, Share2, DollarSign, Plus, UserPlus, Link as LinkIcon, 
  Trash2, PieChart, Sparkles, Loader2, CheckSquare, 
  Briefcase, Plane, Home, UserCheck, Shield, ChevronRight, Copy
} from 'lucide-react';
import { analyzeBudgetSplit } from '../services/geminiService';

const Collaboration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'share' | 'budget' | 'tasks'>('share');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Tasks State
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Book Flight Tickets', owner: 'Alex', icon: Plane, done: true },
    { id: 2, title: 'Reserve Boutique Hotel', owner: 'Sarah', icon: Home, done: false },
    { id: 3, title: 'Prepare Business Slides', owner: 'Alex', icon: Briefcase, done: false },
    { id: 4, title: 'Local Transport Research', owner: 'Sarah', icon: LinkIcon, done: false },
  ]);

  // Collaborative Budget State
  const [expenses, setExpenses] = useState([
    { id: 1, title: 'Hotel Booking', amount: 3200, paidBy: 'Alex', split: 'Equal' },
    { id: 2, title: 'Dinner at Tokyo Central', amount: 850, paidBy: 'Sarah', split: 'Equal' },
    { id: 3, title: 'Train Tickets', amount: 1200, paidBy: 'Alex', split: 'Equal' },
  ]);

  const [newExpense, setNewExpense] = useState({ title: '', amount: '' });

  const addExpense = () => {
    if (!newExpense.title || !newExpense.amount) return;
    setExpenses([...expenses, { 
      id: Date.now(), 
      title: newExpense.title, 
      amount: parseFloat(newExpense.amount), 
      paidBy: 'Alex', 
      split: 'Equal' 
    }]);
    setNewExpense({ title: '', amount: '' });
  };

  const getAiSettlementAdvice = async () => {
    setAiLoading(true);
    try {
      const advice = await analyzeBudgetSplit(expenses);
      setAiAdvice(advice);
    } catch (err) {
      console.error("AI Budget advice error:", err);
      setAiAdvice("Failed to calculate settlement. Please check the expense data.");
    } finally {
      setAiLoading(false);
    }
  };

  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: 'share', label: 'Shared Trips', icon: Share2 },
          { id: 'tasks', label: 'Team Tasks', icon: UserCheck },
          { id: 'budget', label: 'Group Budget', icon: DollarSign },
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
            {activeTab === t.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full animate-in fade-in slide-in-from-bottom-1"></div>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'share' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-bold text-slate-800 text-xl">Active Collaborations</h3>
                  <p className="text-xs text-slate-400 font-medium">Synced itineraries with your team or family.</p>
                </div>
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                  <Plus size={18} /> New Session
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { id: 1, title: 'Summer in Tokyo', people: 4, status: 'Editing', lastActive: '2m ago' },
                  { id: 2, title: 'Paris Business Summit', people: 2, status: 'Finalized', lastActive: '1h ago' },
                ].map(trip => (
                  <div key={trip.id} className="group p-6 rounded-[32px] border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-[20px] bg-indigo-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                          <Users size={24} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{trip.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-white border border-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">{trip.status}</span>
                            <span className="text-[10px] text-slate-400 font-bold">• {trip.lastActive}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex -space-x-3">
                        {[1,2,3,4].slice(0, trip.people).map(i => (
                          <img key={i} src={`https://i.pravatar.cc/150?u=${trip.id+i}`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="avatar" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="bg-white/10 p-3 rounded-2xl w-fit mb-6">
                  <UserPlus size={28} className="text-indigo-300" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Invite Collaborators</h3>
                <p className="text-indigo-200 text-sm mb-8 max-w-sm leading-relaxed">Give your companions instant access to the timeline, tickets, and shared expenses.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3 backdrop-blur-md">
                    <LinkIcon size={18} className="text-indigo-300" />
                    <span className="text-xs text-indigo-100 truncate font-mono">voyagemaster.ai/share/tk-9281-xb</span>
                  </div>
                  <button className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-lg whitespace-nowrap">
                    <Copy size={18} /> Copy Link
                  </button>
                </div>
              </div>
              <div className="absolute right-[-40px] bottom-[-40px] opacity-10 pointer-events-none rotate-12">
                <UserPlus size={280} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Shield size={18} className="text-indigo-600" />
                Team Roster
              </h3>
              <div className="space-y-6">
                {[
                  { name: 'Alex Nomad', role: 'Owner', avatar: 'https://i.pravatar.cc/150?u=alex', status: 'Online' },
                  { name: 'Sarah Chen', role: 'Editor', avatar: 'https://i.pravatar.cc/150?u=sarah', status: 'Online' },
                  { name: 'Mike Ross', role: 'Viewer', avatar: 'https://i.pravatar.cc/150?u=mike', status: 'Away' },
                ].map((user, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={user.avatar} className="w-12 h-12 rounded-2xl shadow-sm border border-slate-50" alt={user.name} />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${user.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{user.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.role}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-400 transition-all" />
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-4 bg-slate-50 text-slate-500 text-xs font-bold rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all">
                Manage All Access
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="max-w-3xl mx-auto space-y-6">
           <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-10">
               <div>
                 <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                   <CheckSquare size={28} className="text-indigo-600" />
                   Trip Division
                 </h3>
                 <p className="text-xs text-slate-400 font-medium mt-1">Coordinate roles and assignments for the team.</p>
               </div>
               <div className="text-right">
                 <p className="text-2xl font-black text-indigo-600">{tasks.filter(t => t.done).length}/{tasks.length}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
               </div>
             </div>
             <div className="space-y-4">
               {tasks.map(task => (
                 <div key={task.id} className="flex items-center gap-4 p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1">
                    <div className={`p-4 rounded-2xl shadow-sm transition-all ${
                      task.done ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-600 text-white'
                    }`}>
                       <task.icon size={24} />
                    </div>
                    <div className="flex-1">
                       <p className={`font-bold text-base ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</p>
                       <div className="flex items-center gap-2 mt-2">
                         <img src={`https://i.pravatar.cc/150?u=${task.owner}`} className="w-5 h-5 rounded-full border border-white shadow-sm" alt={task.owner} />
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Lead: {task.owner}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setTasks(tasks.map(t => t.id === task.id ? {...t, done: !t.done} : t))}
                      className={`px-6 py-3 rounded-2xl text-xs font-black uppercase transition-all shadow-sm ${
                        task.done 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600'
                      }`}
                    >
                      {task.done ? 'Task Done' : 'Complete'}
                    </button>
                 </div>
               ))}
             </div>
             <button className="w-full mt-8 py-5 bg-indigo-600 text-white font-black rounded-3xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-[2px] text-xs">
               <Plus size={20} /> Add New Responsibility
             </button>
           </div>
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-bold text-slate-800 text-xl">Collaborative Ledger</h3>
                  <p className="text-xs text-slate-400 font-medium">Tracking group spend in real-time.</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-indigo-600">¥{total.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Shared Pool</p>
                </div>
              </div>

              <div className="overflow-hidden border border-slate-100 rounded-[32px]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                    <tr>
                      <th className="px-8 py-5 text-left">Expense Item</th>
                      <th className="px-8 py-5 text-left">Payer</th>
                      <th className="px-8 py-5 text-right">Amount</th>
                      <th className="px-8 py-5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map(expense => (
                      <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6 font-bold text-slate-700">{expense.title}</td>
                        <td className="px-8 py-6">
                          <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-tight">{expense.paidBy}</span>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-slate-800 text-base">¥{expense.amount.toLocaleString()}</td>
                        <td className="px-8 py-6 text-center">
                          <button 
                            onClick={() => setExpenses(expenses.filter(e => e.id !== expense.id))}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 text-lg">Add Shared Entry</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <input 
                  placeholder="Expense description..." 
                  className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" 
                  value={newExpense.title}
                  onChange={e => setNewExpense({...newExpense, title: e.target.value})}
                />
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                  <input 
                    type="number" 
                    placeholder="Amount" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-black"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                  />
                </div>
                <button 
                  onClick={addExpense}
                  className="bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 text-sm uppercase tracking-widest"
                >
                  <Plus size={20} /> Commit
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm sticky top-8">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3">
                <PieChart size={24} className="text-indigo-600" />
                Settlement IQ
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">AI Audit Log</p>
                    <button 
                      onClick={getAiSettlementAdvice}
                      disabled={aiLoading}
                      className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-2xl flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100"
                    >
                      {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Resolve Debts
                    </button>
                  </div>
                  
                  {aiAdvice ? (
                    <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[32px] text-sm text-indigo-900 leading-relaxed prose prose-indigo whitespace-pre-wrap animate-in fade-in slide-in-from-top-4 font-medium shadow-inner">
                      {aiAdvice}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 bg-emerald-50 border border-emerald-100 rounded-[24px]">
                        <div className="flex items-center gap-4">
                          <img src="https://i.pravatar.cc/150?u=alex" className="w-10 h-10 rounded-xl shadow-sm" alt="Alex" />
                          <div>
                             <p className="text-sm font-bold text-emerald-800 leading-none">Alex Nomad</p>
                             <p className="text-[10px] font-black text-emerald-600 uppercase mt-1">Net Owed</p>
                          </div>
                        </div>
                        <span className="text-base font-black text-emerald-800">+¥2,100</span>
                      </div>
                      <div className="flex items-center justify-between p-5 bg-rose-50 border border-rose-100 rounded-[24px]">
                        <div className="flex items-center gap-4">
                          <img src="https://i.pravatar.cc/150?u=sarah" className="w-10 h-10 rounded-xl shadow-sm" alt="Sarah" />
                          <div>
                             <p className="text-sm font-bold text-rose-800 leading-none">Sarah Chen</p>
                             <p className="text-[10px] font-black text-rose-600 uppercase mt-1">Debt Total</p>
                          </div>
                        </div>
                        <span className="text-base font-black text-rose-800">-¥2,100</span>
                      </div>
                    </div>
                  )}
                </div>
                {!aiAdvice && (
                  <div className="pt-8 border-t border-slate-50">
                    <p className="text-xs text-slate-500 italic leading-relaxed text-center font-medium">
                      "System: To balance the trip, Sarah should transfer ¥2,100 to Alex via favored method."
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collaboration;
