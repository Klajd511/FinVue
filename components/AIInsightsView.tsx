
import React, { useState, useEffect } from 'react';
import { Transaction, Currency } from '../types';
import { getFinancialInsights } from '../services/geminiService';

interface Props {
  transactions: Transaction[];
  currency: Currency;
}

const AIInsightsView: React.FC<Props> = ({ transactions, currency }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const text = await getFinancialInsights(transactions, currency);
      setInsight(text);
    } catch (e) {
      setInsight("Error: Cognitive core connection failure.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0) {
      fetchInsights();
    }
  }, [transactions, currency]);

  return (
    <div className="glass rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 relative overflow-hidden border border-indigo-500/20">
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/10 blur-[100px] -z-10 animate-pulse-slow"></div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 md:mb-10">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            <i className="fa-solid fa-robot text-xl md:text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">AI Cognition Unit</h3>
            <p className="text-[10px] md:text-xs font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Status: Analyzing Data Streams</p>
          </div>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="w-full md:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-xl md:rounded-2xl border border-white/10 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Recalibrate'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-5 bg-white/5 rounded-full w-3/4"></div>
          <div className="h-5 bg-white/5 rounded-full w-full"></div>
          <div className="h-5 bg-white/5 rounded-full w-5/6"></div>
          <div className="h-32 bg-white/5 rounded-[2rem] w-full mt-8"></div>
        </div>
      ) : insight ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/[0.03] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-white/5 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/40"></div>
            <div className="prose prose-invert max-w-none text-slate-200 leading-relaxed font-medium text-sm md:text-base">
              {insight.split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2"></div>;
                const isHeader = line.startsWith('#');
                return (
                  <div key={i} className={isHeader ? 'text-white font-black text-lg md:text-xl mb-4 mt-6 tracking-tight' : 'mb-3'}>
                    {line.replace(/^#+ /, '')}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 px-6">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
            <i className="fa-solid fa-chart-line text-2xl opacity-20"></i>
          </div>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Neural pathways empty. Feed system with financial data nodes.</p>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap gap-6 justify-center md:justify-start">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
          <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wide">Secured</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div>
          <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wide">Real-time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></div>
          <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wide">Gemini 3</span>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsView;
