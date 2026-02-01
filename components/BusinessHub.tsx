
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldCheck, FileText, CreditCard, Building2, TrendingUp, Download, Calendar, Loader2, Clock, Sparkles, FileJson, Coffee, Zap, UserCheck, Receipt, Plus, Tag } from 'lucide-react';
import { suggestMeetingTimes, generateTravelReportSummary } from '../services/geminiService';

const BusinessHub: React.FC = () => {
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [meetingInput, setMeetingInput] = useState('3 potential client workshops, 1 internal sync');
  const [arrivalInfo, setArrivalInfo] = useState('Arrive Tokyo Narita at 14:30 on Monday');
  const [meetingSuggestion, setMeetingSuggestion] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportSummary, setReportSummary] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Invoicing State
  const [invoices, setInvoices] = useState([
    { id: 1, merchant: 'Marriott International', amount: 3200, category: 'Accommodation', status: 'Pending' },
    { id: 2, merchant: 'ANA Airlines', amount: 4500, category: 'Flight', status: 'Verified' },
  ]);

  const expenseData = [
    { name: 'Transport', value: 4500, color: '#4f46e5' },
    { name: 'Hotel', value: 3200, color: '#818cf8' },
    { name: 'Food', value: 1200, color: '#c7d2fe' },
    { name: 'Meeting', value: 800, color: '#e0e7ff' },
  ];

  const efficiencyTools = [
    { title: 'SkyTeam Lounge', hub: 'HND T3', status: 'Available', icon: Coffee, desc: 'Quiet work zone, High-speed Wi-Fi.' },
    { title: 'Fast-Track Pass', hub: 'PVG T2', status: 'Active', icon: Zap, desc: 'Priority security lane via Corp ID.' },
    { title: 'VIP Pick-up', hub: 'Tokyo Center', status: 'Booked', icon: UserCheck, desc: 'Driver waits at arrivals, Exit 4.' },
  ];

  const policyAlerts = [
    { id: 1, title: 'Budget Limit', desc: 'Shanghai flights currently exceed policy standard (¥3000).', status: 'warning' },
    { id: 2, title: 'Invoicing Reminder', desc: '3 receipts from Marriott Shanghai are pending upload.', status: 'info' },
  ];

  const handleGetMeetingAdvice = async () => {
    setMeetingLoading(true);
    try {
      const advice = await suggestMeetingTimes(arrivalInfo, meetingInput);
      setMeetingSuggestion(advice);
    } catch (err) {
      console.error(err);
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!showReport) {
      setShowReport(true);
      setReportLoading(true);
      try {
        const tripSummary = {
          destination: 'Tokyo',
          project: 'Tokyo Q2 Expansion',
          expenses: expenseData,
          total: 9700,
          compliance: '92%'
        };
        const summary = await generateTravelReportSummary(tripSummary);
        setReportSummary(summary);
      } catch (err) {
        console.error(err);
      } finally {
        setReportLoading(false);
      }
    } else {
      setShowReport(false);
      setReportSummary('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Top Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Policy Compliance</h3>
            <ShieldCheck size={20} className="text-emerald-500" />
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl font-black text-slate-800">92%</div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Current Trip Score</p>
          </div>
          <div className="mt-8 space-y-3">
            {policyAlerts.map(alert => (
              <div key={alert.id} className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                alert.status === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-blue-50 border-blue-100 text-blue-800'
              }`}>
                <p className="font-bold mb-1">{alert.title}</p>
                <p className="opacity-80">{alert.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Cost Distribution</h3>
            <div className="flex gap-2">
               <button className="text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-bold text-slate-600">Quarterly</button>
               <button 
                 onClick={handleGenerateReport}
                 disabled={reportLoading}
                 className="text-xs bg-indigo-600 px-3 py-1.5 rounded-lg text-white font-bold flex items-center gap-1 hover:bg-indigo-700 transition-all"
               >
                 {reportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {showReport ? "Close Report" : "Generate Report"}
               </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {showReport && (
        <div className="bg-white p-8 rounded-3xl border border-indigo-200 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Business Travel Expense Report</h3>
              <p className="text-sm text-slate-500">Project: Tokyo Q2 Expansion • Jun 2024</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Approved for Reimbursement</span>
            </div>
          </div>
          
          {reportSummary && (
            <div className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-indigo-600">
                <Sparkles size={18} />
                <h4 className="font-bold text-sm">AI Executive Summary</h4>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {reportSummary}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-400 font-bold mb-1">Total Spent</p>
              <p className="text-xl font-black text-indigo-600">¥9,700</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-400 font-bold mb-1">Company Paid</p>
              <p className="text-xl font-black text-slate-800">¥7,200</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-400 font-bold mb-1">Out of Pocket</p>
              <p className="text-xl font-black text-rose-600">¥2,500</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-400 font-bold mb-1">Billable Hours</p>
              <p className="text-xl font-black text-slate-800">12.5h</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
               <FileJson size={18} /> Download JSON
             </button>
             <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
               <FileText size={18} /> Export PDF Itinerary
             </button>
          </div>
        </div>
      )}

      {/* Invoice Assistant Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <Receipt size={20} className="text-indigo-600" />
             Invoice & Receipt Tracker
           </h3>
           <button className="flex items-center gap-2 text-indigo-600 text-sm font-bold hover:underline">
             <Plus size={16} /> Scan New Receipt
           </button>
        </div>
        <div className="overflow-hidden border border-slate-100 rounded-2xl">
           <table className="w-full text-sm">
             <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px]">
               <tr>
                 <th className="px-6 py-3 text-left">Merchant</th>
                 <th className="px-6 py-3 text-left">Category</th>
                 <th className="px-6 py-3 text-right">Amount</th>
                 <th className="px-6 py-3 text-center">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {invoices.map(inv => (
                 <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-700">{inv.merchant}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Tag size={12} /> {inv.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-800">¥{inv.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                        inv.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>

      {/* Business Efficiency Tools Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {efficiencyTools.map((tool, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-start hover:border-indigo-400 transition-all group">
            <div className="bg-slate-50 p-3 rounded-2xl mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
              <tool.icon size={24} className="text-slate-600 group-hover:text-indigo-600" />
            </div>
            <div className="flex justify-between items-start w-full mb-2">
              <h4 className="font-bold text-slate-800">{tool.title}</h4>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                tool.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {tool.status}
              </span>
            </div>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{tool.hub}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{tool.desc}</p>
          </div>
        ))}
      </div>

      {/* AI Meeting Optimizer Section */}
      <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles size={24} /> AI Meeting Optimizer
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-indigo-100 uppercase mb-1 block">Arrival Logistics</label>
                <input 
                  value={arrivalInfo}
                  onChange={(e) => setArrivalInfo(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-white/50 transition-all text-sm"
                  placeholder="e.g. Arrive Tokyo 14:30 Mon"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-indigo-100 uppercase mb-1 block">Meeting List</label>
                <textarea 
                  value={meetingInput}
                  onChange={(e) => setMeetingInput(e.target.value)}
                  className="w-full h-24 bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-white/50 transition-all text-sm resize-none"
                  placeholder="e.g. 2 client syncs, 1 lunch workshop"
                />
              </div>
              <button 
                onClick={handleGetMeetingAdvice}
                disabled={meetingLoading}
                className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
              >
                {meetingLoading ? <Loader2 className="animate-spin" size={20} /> : <><Calendar size={18} /> Optimize Schedule</>}
              </button>
            </div>
          </div>
          
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 min-h-[200px] overflow-y-auto">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Clock size={16} /> Recommended Itinerary
            </h4>
            {meetingSuggestion ? (
              <div className="text-sm space-y-2 opacity-90 leading-relaxed prose prose-invert whitespace-pre-wrap">
                {meetingSuggestion}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-indigo-200 text-center py-8">
                <Calendar size={48} className="opacity-20 mb-4" />
                <p className="text-xs">Provide details to generate your optimized business schedule.</p>
              </div>
            )}
          </div>
        </div>
        <div className="absolute right-[-100px] bottom-[-100px] opacity-5 pointer-events-none">
          <TrendingUp size={400} />
        </div>
      </div>
    </div>
  );
};

export default BusinessHub;
