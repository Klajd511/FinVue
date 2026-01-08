
import React, { useState } from 'react';
import { Transaction, Currency, SUPPORTED_CURRENCIES } from '../types';
import CalendarPicker from './CalendarPicker';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  preferredCurrency: Currency;
}

const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit, preferredCurrency }) => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filtered = transactions
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(t => !startDate || t.date >= startDate)
    .filter(t => !endDate || t.date <= endDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getFormatValue = (val: number, currencyCode: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || preferredCurrency;
    const isLek = currency.code === 'ALL';
    const formatted = val.toLocaleString(undefined, { 
      maximumFractionDigits: isLek ? 0 : 2,
      minimumFractionDigits: isLek ? 0 : 2
    });
    return isLek ? `${formatted} Lek` : `${currency.symbol}${formatted}`;
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setFilter('all');
  };

  const hasActiveFilters = searchTerm || filter !== 'all' || startDate || endDate;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Filter Container with higher z-index to prevent calendar from being hidden */}
      <div className="glass rounded-[2rem] p-6 md:p-8 space-y-6 relative z-40">
        {/* Header and Search */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Temporal Ledger</h3>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-80">History Node Index</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group flex-1 md:flex-none">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs transition-colors group-focus-within:text-indigo-400"></i>
              <input 
                type="text" 
                placeholder="Search index..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-6 py-3 bg-white/5 border border-white/5 rounded-xl focus:bg-white/[0.08] focus:border-white/10 outline-none text-[10px] md:text-xs font-bold text-white transition-all w-full md:w-64 placeholder:text-slate-600 uppercase tracking-wider"
              />
            </div>
            
            <div className="flex p-1 bg-white/5 border border-white/5 rounded-xl">
              {['all', 'income', 'expense'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all uppercase tracking-wide ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {f === 'expense' ? 'Expenses' : f === 'all' ? 'All' : 'Income'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Range Filter Row */}
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4 pt-4 border-t border-white/5">
          <div className="w-full md:w-auto flex flex-col gap-1.5 flex-1">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Temporal Start</label>
             <CalendarPicker value={startDate} onChange={setStartDate} placeholder="Start Origin" />
          </div>
          <div className="hidden md:block text-slate-600 mt-5">
             <i className="fa-solid fa-arrow-right-long"></i>
          </div>
          <div className="w-full md:w-auto flex flex-col gap-1.5 flex-1">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Temporal End</label>
             <CalendarPicker value={endDate} onChange={setEndDate} placeholder="End Boundary" />
          </div>
          <div className="flex items-center gap-2 mt-2 md:mt-5">
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="px-4 py-3.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 text-[10px] font-bold uppercase tracking-widest transition-all"
                title="Reset all filters"
              >
                Clear Node Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 relative z-10">
        {filtered.length > 0 ? filtered.map(t => (
          <div key={t.id} className="glass rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 hover:bg-white/[0.05] transition-all duration-300 flex items-center justify-between group relative overflow-hidden border-l-4" 
               style={{ borderLeftColor: t.type === 'income' ? '#10b981' : '#f43f5e' }}>
            
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${t.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

            <div className="flex items-center gap-4 md:gap-6 relative z-10 overflow-hidden">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-sm md:text-lg transition-all duration-300 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]'}`}>
                <i className={`fa-solid ${t.type === 'income' ? 'fa-arrow-up-right' : 'fa-arrow-down-left'}`}></i>
              </div>
              
              <div className="overflow-hidden">
                <h4 className="font-bold text-white text-base md:text-lg tracking-tight mb-1 truncate group-hover:translate-x-1 transition-transform">
                  {t.description || <span className="text-slate-600 italic text-sm">No Descriptor</span>}
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5 truncate max-w-[100px] md:max-w-none">{t.category}</span>
                  <span className="text-[9px] md:text-[10px] font-semibold text-slate-500 tracking-wider whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right flex items-center gap-4 md:gap-6 relative z-10 flex-shrink-0">
              <div className="flex flex-col items-end">
                <span className={`text-lg md:text-2xl lg:text-3xl font-black tracking-tight transition-all duration-300 ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.type === 'income' ? '+' : '-'}{getFormatValue(t.amount, t.currencyCode)}
                </span>
                <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{t.currencyCode}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onEdit(t)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-slate-500 hover:bg-indigo-500/20 hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-500/20 active:scale-90"
                  title="Edit entry"
                >
                  <i className="fa-solid fa-pen-to-square text-sm md:text-base"></i>
                </button>
                <button 
                  onClick={() => onDelete(t.id)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-slate-500 hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20 active:scale-90"
                  title="Delete entry"
                >
                  <i className="fa-solid fa-trash-can text-sm md:text-base"></i>
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="glass rounded-[2.5rem] py-24 text-center text-slate-500 px-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 opacity-20 border border-white/10">
               <i className="fa-solid fa-ghost text-3xl"></i>
            </div>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">No data points found in local memory</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
