
import React, { useMemo, useState } from 'react';
import { Transaction, Currency, EXCHANGE_RATES, Budget, RecurringPulse } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import CalendarPicker from './CalendarPicker';

interface Props {
  transactions: Transaction[];
  preferredCurrency: Currency;
  budgets: Budget[];
  recurringPulses: RecurringPulse[];
}

const COLORS = {
  expense: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#e11d48', '#be123c', '#9f1239'],
  income: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#047857', '#064e3b'],
  general: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#4f46e5', '#4338ca', '#3730a3']
};

const Dashboard: React.FC<Props> = ({ transactions, preferredCurrency, budgets, recurringPulses }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const normalize = (amount: number, fromCode: string) => {
    const rateFrom = EXCHANGE_RATES[fromCode] || 1;
    const rateTo = EXCHANGE_RATES[preferredCurrency.code] || 1;
    return (amount / rateFrom) * rateTo;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const isAfterStart = !startDate || t.date >= startDate;
      const isBeforeEnd = !endDate || t.date <= endDate;
      return isAfterStart && isBeforeEnd;
    });
  }, [transactions, startDate, endDate]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + normalize(t.amount, t.currencyCode), 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + normalize(t.amount, t.currencyCode), 0);
    
    return { income, expense, balance: income - expense, savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0 };
  }, [filteredTransactions, preferredCurrency]);

  const expenseCategoryData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + normalize(t.amount, t.currencyCode);
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions, preferredCurrency]);

  const budgetPerformance = useMemo(() => {
    return budgets.map(b => {
      const actual = expenseCategoryData.find(d => d.name === b.category)?.value || 0;
      const percent = b.limit > 0 ? (actual / b.limit) * 100 : 0;
      return { ...b, actual, percent };
    }).sort((a, b) => b.percent - a.percent);
  }, [budgets, expenseCategoryData]);

  const pulseCommitments = useMemo(() => {
    return recurringPulses.reduce((acc, p) => {
      const normalized = normalize(p.amount, p.currencyCode);
      // Simplify recurring to a monthly estimate for visualization
      let monthlyEst = normalized;
      if (p.frequency === 'daily') monthlyEst *= 30;
      else if (p.frequency === 'weekly') monthlyEst *= 4;
      else if (p.frequency === 'yearly') monthlyEst /= 12;
      
      if (p.type === 'income') acc.income += monthlyEst;
      else acc.expense += monthlyEst;
      return acc;
    }, { income: 0, expense: 0 });
  }, [recurringPulses, preferredCurrency]);

  const formatValue = (val: number, compact = false) => {
    const isLek = preferredCurrency.code === 'ALL';
    const absVal = Math.abs(val);
    let formatted = absVal.toLocaleString(undefined, { 
      maximumFractionDigits: isLek ? 0 : (compact && absVal > 1000 ? 1 : 2),
      minimumFractionDigits: isLek ? 0 : (compact && absVal > 1000 ? 0 : 2) 
    });
    if (compact && absVal >= 1000000) formatted = (absVal / 1000000).toFixed(1) + 'M';
    else if (compact && absVal >= 1000) formatted = (absVal / 1000).toFixed(1) + 'k';
    return isLek ? `${val < 0 ? '-' : ''}${formatted} Lek` : `${val < 0 ? '-' : ''}${preferredCurrency.symbol}${formatted}`;
  };

  const slides = [
    {
      title: 'Financial Vitals',
      subtitle: 'Real-time Liquidity Status',
      icon: 'fa-shield-halved',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8 py-6 w-full max-w-full">
          <div className="space-y-2 px-4">
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">
              {startDate || endDate ? 'Filtered Net Asset' : 'Global Net Asset'}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-indigo-400 tracking-tighter drop-shadow-2xl">
              {formatValue(stats.balance)}
            </h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full px-4 max-w-4xl">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 md:p-6 rounded-[2rem] backdrop-blur-xl">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Income</p>
              <p className="text-xl md:text-2xl font-black text-emerald-400 truncate">{formatValue(stats.income, true)}</p>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 md:p-6 rounded-[2rem] backdrop-blur-xl">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Expenses</p>
              <p className="text-xl md:text-2xl font-black text-rose-400 truncate">{formatValue(stats.expense, true)}</p>
            </div>
            <div className="hidden md:block bg-indigo-500/10 border border-indigo-500/20 p-4 md:p-6 rounded-[2rem] backdrop-blur-xl">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Savings</p>
              <p className="text-xl md:text-2xl font-black text-indigo-400">{stats.savingsRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Temporal Projections',
      subtitle: 'Monthly Pulse Commitment Load',
      icon: 'fa-wave-square',
      content: (
        <div className="flex flex-col items-center justify-center h-full space-y-12 py-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
            <div className="glass p-8 rounded-[2.5rem] border border-white/5 relative group overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Est. Monthly Gain</p>
               <h4 className="text-3xl md:text-5xl font-black text-emerald-400 tracking-tighter">
                 {formatValue(pulseCommitments.income)}
               </h4>
               <p className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-widest">Active Income Pulses: {recurringPulses.filter(p => p.type === 'income').length}</p>
            </div>
            <div className="glass p-8 rounded-[2.5rem] border border-white/5 relative group overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                 <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]"></div>
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Est. Monthly Drain</p>
               <h4 className="text-3xl md:text-5xl font-black text-rose-400 tracking-tighter">
                 {formatValue(pulseCommitments.expense)}
               </h4>
               <p className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-widest">Active Expense Pulses: {recurringPulses.filter(p => p.type === 'expense').length}</p>
            </div>
          </div>
          <div className="w-full max-w-2xl px-4">
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center">
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Pulse Commitment Health</p>
               <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-1000"
                    style={{ width: `${Math.min((pulseCommitments.expense / Math.max(pulseCommitments.income, 1)) * 100, 100)}%` }}
                  ></div>
               </div>
               <div className="flex justify-between mt-3 px-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Burn Rate: {((pulseCommitments.expense / Math.max(pulseCommitments.income, 1)) * 100).toFixed(1)}%</span>
                  <span>Commitment Load</span>
               </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Sector Overwatch',
      subtitle: 'Burn Rate & Constraint Monitoring',
      icon: 'fa-gauge-high',
      content: (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-6 md:space-y-10 py-4">
          {budgetPerformance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-5xl px-4 overflow-y-auto max-h-[450px] scrollbar-hide">
              {budgetPerformance.map((b, i) => (
                <div key={i} className="bg-white/5 border border-white/5 rounded-[2rem] p-5 md:p-6 relative group overflow-hidden">
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div>
                      <h4 className="text-white font-black text-sm md:text-base tracking-tight uppercase">{b.category}</h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sector Constraint</p>
                    </div>
                    <div className="text-right">
                       <p className={`text-lg md:text-xl font-black ${b.percent > 100 ? 'text-rose-500' : 'text-white'}`}>
                        {formatValue(b.actual, true)}
                       </p>
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Limit: {formatValue(b.limit, true)}</p>
                    </div>
                  </div>
                  <div className="relative h-2.5 md:h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${b.percent > 100 ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' : b.percent > 80 ? 'bg-amber-500 shadow-[0_0_15px_#f59e0b]' : 'bg-indigo-500 shadow-[0_0_15px_#6366f1]'}`}
                      style={{ width: `${Math.min(b.percent, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20 border border-white/10">
                <i className="fa-solid fa-sliders text-2xl"></i>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-xs mx-auto">No fiscal constraints defined. Initialise in Settings.</p>
            </div>
          )}
        </div>
      )
    }
  ];

  const handleNext = () => setActiveSlide((prev) => (prev + 1) % slides.length);
  const handlePrev = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="space-y-6 animate-in fade-in duration-1000">
      <div className="glass rounded-[2rem] p-6 border border-white/10 flex flex-col xl:flex-row items-center justify-between gap-6 relative z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400 border border-white/5">
            <i className="fa-solid fa-clock-rotate-left text-sm"></i>
          </div>
          <div>
            <h4 className="text-sm font-black text-white tracking-tight uppercase">Temporal Filter</h4>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Adjust Dashboard Scope</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div className="w-full md:w-[180px]">
              <CalendarPicker value={startDate} onChange={setStartDate} placeholder="Origin" />
            </div>
            <i className="fa-solid fa-arrow-right text-[10px] text-slate-700 hidden md:block"></i>
            <div className="w-full md:w-[180px]">
              <CalendarPicker value={endDate} onChange={setEndDate} placeholder="Boundary" />
            </div>
          </div>
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="px-4 py-4 rounded-xl text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 transition-all border border-rose-500/10">Reset</button>
          )}
        </div>
      </div>

      <div className="glass rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden border border-white/10 relative group/main">
        <div className="absolute top-6 md:top-10 left-6 md:left-10 right-6 md:right-10 flex items-center justify-between z-20 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-lg">
               <i className={`fa-solid ${slides[activeSlide].icon} text-lg md:text-2xl`}></i>
            </div>
            <div>
              <h3 className="text-base md:text-2xl font-black text-white tracking-tight">{slides[activeSlide].title}</h3>
              <p className="text-[10px] md:text-xs font-bold text-indigo-400 uppercase tracking-widest leading-none">{slides[activeSlide].subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 pointer-events-auto">
            <button onClick={handlePrev} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white"><i className="fa-solid fa-chevron-left text-sm"></i></button>
            <button onClick={handleNext} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white"><i className="fa-solid fa-chevron-right text-sm"></i></button>
          </div>
        </div>
        <div className="relative pt-24 md:pt-32 pb-12 md:pb-16 px-6 md:px-10 min-h-[550px] md:min-h-[650px] flex items-center justify-center">
          <div key={activeSlide} className="w-full h-full animate-in fade-in slide-in-from-right-10 duration-500">
            {slides[activeSlide].content}
          </div>
        </div>
        <div className="absolute bottom-6 md:bottom-10 left-0 right-0 flex justify-center gap-2 md:gap-3">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setActiveSlide(i)} className={`h-1.5 transition-all duration-500 rounded-full ${activeSlide === i ? 'w-8 md:w-12 bg-indigo-500' : 'w-1.5 md:w-2 bg-white/20'}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
