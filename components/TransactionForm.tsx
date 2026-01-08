
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, UserCategories, Currency, SUPPORTED_CURRENCIES } from '../types';
import CalendarPicker from './CalendarPicker';
import { parseNaturalLanguageTransaction } from '../services/geminiService';

interface Props {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate?: (transaction: Transaction) => void;
  editData?: Transaction | null;
  onCancel?: () => void;
  categories: UserCategories;
  preferredCurrency: Currency;
}

const TransactionForm: React.FC<Props> = ({ onAdd, onUpdate, editData, onCancel, categories, preferredCurrency }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [currencyCode, setCurrencyCode] = useState(preferredCurrency.code);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Neural Entry State
  const [neuralInput, setNeuralInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Populate form when editData changes
  useEffect(() => {
    if (editData) {
      setType(editData.type);
      setDescription(editData.description);
      setAmount(editData.amount.toString());
      setCategory(editData.category);
      setCurrencyCode(editData.currencyCode);
      setDate(editData.date);
    } else {
      // Reset form if not editing
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setCurrencyCode(preferredCurrency.code);
    }
  }, [editData, preferredCurrency]);

  useEffect(() => {
    const currentCats = type === 'expense' ? categories.expense : categories.income;
    if (!currentCats.includes(category)) {
      setCategory(currentCats[0] || '');
    }
  }, [type, categories]);

  const handleNeuralSync = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!neuralInput.trim() || isParsing) return;

    setIsParsing(true);
    const parsed = await parseNaturalLanguageTransaction(neuralInput, categories);
    
    if (parsed) {
      setType(parsed.type);
      setAmount(parsed.amount.toString());
      setDescription(parsed.description);
      setCategory(parsed.category);
      setCurrencyCode(parsed.currencyCode);
      setDate(parsed.date);
      setNeuralInput('');
    }
    setIsParsing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    if (editData && onUpdate) {
      onUpdate({
        id: editData.id,
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        type,
        date,
        currencyCode
      });
    } else {
      onAdd({
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        type,
        date,
        currencyCode
      });
      setDescription('');
      setAmount('');
    }
  };

  const selectedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || preferredCurrency;

  return (
    <div className="glass rounded-[2.5rem] p-6 md:p-10 relative">
      <div className={`absolute top-0 right-0 w-64 h-64 blur-[120px] -z-10 transition-colors duration-1000 ${type === 'expense' ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}></div>
      
      {/* Neural Entry Input */}
      <div className="mb-10 relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[2rem] blur-sm -z-10"></div>
        <div className="bg-slate-950/40 border border-indigo-500/20 rounded-3xl p-4 md:p-6 backdrop-blur-md">
           <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 ${isParsing ? 'animate-spin' : ''}`}>
                <i className={`fa-solid ${isParsing ? 'fa-circle-notch' : 'fa-brain'} text-xs text-indigo-400`}></i>
              </div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Neural Command Input</p>
           </div>
           <form onSubmit={handleNeuralSync} className="flex flex-col md:flex-row gap-4">
              <input 
                type="text"
                value={neuralInput}
                onChange={(e) => setNeuralInput(e.target.value)}
                placeholder="e.g., Spent 50 USD on groceries yesterday..."
                className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white placeholder:text-slate-600 focus:bg-white/[0.08] focus:border-indigo-500/30 transition-all outline-none"
                disabled={isParsing}
              />
              <button 
                type="submit"
                disabled={isParsing || !neuralInput.trim()}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/10 transition-all active:scale-95"
              >
                {isParsing ? 'Processing Node...' : 'Sync Neural Node'}
              </button>
           </form>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div>
           <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full animate-pulse shadow-[0_0_15px] ${type === 'expense' ? 'bg-rose-500 shadow-rose-500' : 'bg-emerald-500 shadow-emerald-500'}`}></div>
            {editData ? 'Modify Transaction' : 'Initialize Transaction'}
          </h3>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 ml-6 md:ml-7 opacity-70">
            {editData ? `Edit Node: ${editData.id}` : 'Entry Protocol v2.4.0'}
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {editData && (
            <button
              onClick={onCancel}
              className="px-6 py-2 text-[10px] md:text-xs font-bold rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white transition-all uppercase tracking-wide"
            >
              Cancel Edit
            </button>
          )}
          <div className="flex p-1 bg-white/5 border border-white/5 rounded-xl md:rounded-2xl w-full md:w-64 shadow-inner">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg md:rounded-xl transition-all duration-300 uppercase tracking-wide ${type === 'expense' ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg md:rounded-xl transition-all duration-300 uppercase tracking-wide ${type === 'income' ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Income
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Magnitude</label>
            <div className="relative group">
               <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-xl transition-colors ${type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {selectedCurrency.symbol}
               </span>
               <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/[0.08] focus:border-white/20 focus:ring-2 outline-none transition-all text-xl md:text-2xl font-black text-white tracking-tight ${type === 'expense' ? 'focus:ring-rose-500/10' : 'focus:ring-emerald-500/10'}`}
                  required
                />
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Cluster</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/[0.08] focus:border-white/20 outline-none transition-all text-[11px] md:text-sm font-bold text-slate-200 uppercase tracking-wide appearance-none cursor-pointer"
            >
              {(type === 'expense' ? categories.expense : categories.income).map(cat => (
                <option key={cat} value={cat} className="bg-slate-950 text-slate-100">{cat}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Origin</label>
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/[0.08] focus:border-white/20 outline-none transition-all text-[11px] md:text-sm font-bold text-slate-200 uppercase tracking-wide appearance-none cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map(c => (
                <option key={c.code} value={c.code} className="bg-slate-950 text-slate-100">{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Temporal</label>
            <CalendarPicker value={date} onChange={setDate} />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Memo</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Source identifier or memo..."
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/[0.08] focus:border-white/20 outline-none transition-all text-[13px] md:text-base font-semibold text-white placeholder:text-slate-600"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1 flex items-end">
            <button
              type="submit"
              className={`w-full py-4 md:py-5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-2xl transition-all duration-500 flex items-center justify-center gap-2 active:scale-95 group overflow-hidden relative ${type === 'expense' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative">{editData ? 'Update Entry' : 'Execute Post'}</span>
              <i className="fa-solid fa-chevron-right text-[9px] relative transition-transform group-hover:translate-x-1"></i>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
