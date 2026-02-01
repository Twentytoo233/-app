
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldCheck, FileText, CreditCard, Building2, TrendingUp, Download, Calendar, Loader2, Clock, Sparkles, FileJson, Coffee, Zap, UserCheck, Receipt, Plus, Tag } from 'lucide-react';
import { suggestMeetingTimes, generateTravelReportSummary } from '../services/geminiService';
import { Language } from '../types';

interface BusinessHubProps {
  lang: Language;
}

const BusinessHub: React.FC<BusinessHubProps> = ({ lang }) => {
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [meetingInput, setMeetingInput] = useState(lang === 'cn' ? '3场潜在客户工作坊，1场内部同步会议' : '3 potential client workshops, 1 internal sync');
  const [arrivalInfo, setArrivalInfo] = useState(lang === 'cn' ? '周一 14:30 到达东京成田机场' : 'Arrive Tokyo Narita at 14:30 on Monday');
  const [meetingSuggestion, setMeetingSuggestion] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportSummary, setReportSummary] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const handleGetMeetingAdvice = async () => {
    setMeetingLoading(true);
    try {
      const advice = await suggestMeetingTimes(arrivalInfo, meetingInput, lang);
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
          total: 9700,
          compliance: '92%'
        };
        const summary = await generateTravelReportSummary(tripSummary, lang);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">{lang === 'cn' ? '差旅政策合规性' : 'Policy Compliance'}</h3>
            <ShieldCheck size={20} className="text-emerald-500" />
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl font-black text-slate-800">92%</div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">{lang === 'cn' ? '当前行程得分' : 'Current Trip Score'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">{lang === 'cn' ? '成本分布' : 'Cost Distribution'}</h3>
            <button 
               onClick={handleGenerateReport}
               disabled={reportLoading}
               className="text-xs bg-indigo-600 px-3 py-1.5 rounded-lg text-white font-bold flex items-center gap-1 hover:bg-indigo-700 transition-all"
             >
               {reportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {showReport ? (lang === 'cn' ? "关闭报表" : "Close Report") : (lang === 'cn' ? "生成报表" : "Generate Report")}
            </button>
          </div>
          {showReport && reportSummary && (
            <div className="mt-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3 text-indigo-600">
                <Sparkles size={18} />
                <h4 className="font-bold text-sm">{lang === 'cn' ? 'AI 报表摘要' : 'AI Executive Summary'}</h4>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{reportSummary}</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles size={24} /> {lang === 'cn' ? 'AI 会议优化建议' : 'AI Meeting Optimizer'}
            </h3>
            <div className="space-y-4">
              <textarea 
                value={meetingInput}
                onChange={(e) => setMeetingInput(e.target.value)}
                className="w-full h-24 bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-white/50 transition-all text-sm resize-none"
              />
              <button 
                onClick={handleGetMeetingAdvice}
                disabled={meetingLoading}
                className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
              >
                {meetingLoading ? <Loader2 className="animate-spin" size={20} /> : <Calendar size={18} />} {lang === 'cn' ? '优化日程' : 'Optimize Schedule'}
              </button>
            </div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 min-h-[200px] overflow-y-auto">
             {meetingSuggestion ? (
               <div className="text-sm space-y-2 opacity-90 leading-relaxed prose prose-invert whitespace-pre-wrap">{meetingSuggestion}</div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-indigo-200 text-center py-8">
                 <p className="text-xs">{lang === 'cn' ? '提供信息以生成优化后的商务日程。' : 'Provide details to generate your optimized business schedule.'}</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessHub;
