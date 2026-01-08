
import React, { useState } from 'react';
import { Currency, SUPPORTED_CURRENCIES, UserCategories, Transaction, Budget, RecurringPulse, PulseFrequency } from '../types';

interface Props {
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  categories: UserCategories;
  onCategoriesChange: (cats: UserCategories) => void;
  budgets: Budget[];
  onBudgetsChange: (b: Budget[]) => void;
  recurringPulses: RecurringPulse[];
  onRecurringPulsesChange: (p: RecurringPulse[]) => void;
  transactions: Transaction[];
}

const SettingsView: React.FC<Props> = ({ 
  currency, 
  onCurrencyChange, 
  categories, 
  onCategoriesChange, 
  budgets, 
  onBudgetsChange,
  recurringPulses,
  onRecurringPulsesChange,
  transactions 
}) => {
  const [newCat, setNewCat] = useState('');
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');

  // Budget states
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<string>('');
  const [budgetAmount, setBudgetAmount] = useState<string>('');

  // Recurring Pulse states
  const [pulseType, setPulseType] = useState<'expense' | 'income'>('expense');
  const [pulseDesc, setPulseDesc] = useState('');
  const [pulseAmount, setPulseAmount] = useState('');
  const [pulseCat, setPulseCat] = useState('');
  const [pulseFreq, setPulseFreq] = useState<PulseFrequency>('monthly');
  const [pulseStart, setPulseStart] = useState(new Date().toISOString().split('T')[0]);

  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportType, setExportType] = useState<'all' | 'income' | 'expense'>('all');

  const addCategory = () => {
    if (!newCat.trim()) return;
    if (categories[catType].includes(newCat.trim())) return;
    onCategoriesChange({ ...categories, [catType]: [...categories[catType], newCat.trim()] });
    setNewCat('');
  };

  const removeCategory = (type: 'expense' | 'income', name: string) => {
    onCategoriesChange({ ...categories, [type]: categories[type].filter(c => c !== name) });
    if (type === 'expense') onBudgetsChange(budgets.filter(b => b.category !== name));
  };

  const setOrUpdateBudget = () => {
    if (!editingBudgetCategory || !budgetAmount) return;
    const amount = parseFloat(budgetAmount);
    const existingIndex = budgets.findIndex(b => b.category === editingBudgetCategory);
    let newBudgets = [...budgets];
    if (existingIndex >= 0) newBudgets[existingIndex] = { category: editingBudgetCategory, limit: amount };
    else newBudgets.push({ category: editingBudgetCategory, limit: amount });
    onBudgetsChange(newBudgets);
    setEditingBudgetCategory('');
    setBudgetAmount('');
  };

  // Fixed: Added missing removeBudget handler
  const removeBudget = (category: string) => {
    onBudgetsChange(budgets.filter(b => b.category !== category));
  };

  const addPulseNode = () => {
    if (!pulseDesc || !pulseAmount || !pulseCat) return;
    const newPulse: RecurringPulse = {
      id: `node-${Math.random().toString(36).substring(2, 7)}`,
      description: pulseDesc,
      amount: parseFloat(pulseAmount),
      category: pulseCat,
      type: pulseType,
      currencyCode: currency.code,
      frequency: pulseFreq,
      nextPulseDate: pulseStart
    };
    onRecurringPulsesChange([...recurringPulses, newPulse]);
    setPulseDesc('');
    setPulseAmount('');
  };

  const removePulseNode = (id: string) => {
    onRecurringPulsesChange(recurringPulses.filter(p => p.id !== id));
  };

  const handleExportCSV = () => {
    let filtered = transactions;
    if (exportStartDate) filtered = filtered.filter(t => t.date >= exportStartDate);
    if (exportEndDate) filtered = filtered.filter(t => t.date <= exportEndDate);
    if (exportType !== 'all') filtered = filtered.filter(t => t.type === exportType);
    if (filtered.length === 0) { alert("System scan complete: No nodes found for extraction."); return; }
    const headers = ["Date", "Description", "Category", "Type", "Amount", "Currency"];
    const rows = filtered.map(t => [t.date, `"${(t.description || '').replace(/"/g, '""')}"`, `"${t.category}"`, t.type, t.amount, t.currencyCode]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finvue_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* Pulse Node Calibration Sector */}
      <div className="glass rounded-[3rem] p-8 md:p-12 border border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.05)]">
        <h3 className="text-2xl md:text-3xl font-black text-white mb-8 flex items-center gap-6 tracking-tight">
          <i className="fa-solid fa-wave-square text-purple-500 animate-pulse"></i>
          Pulse Node Calibration
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Configure Pulse Stream</h4>
            <div className="space-y-4">
               <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl">
                <button onClick={() => setPulseType('expense')} className={`flex-1 py-3 text-[10px] font-bold rounded-xl transition-all uppercase tracking-wide ${pulseType === 'expense' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}>Drain</button>
                <button onClick={() => setPulseType('income')} className={`flex-1 py-3 text-[10px] font-bold rounded-xl transition-all uppercase tracking-wide ${pulseType === 'income' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>Gain</button>
              </div>
              <input type="text" value={pulseDesc} onChange={(e) => setPulseDesc(e.target.value)} placeholder="Node Label (e.g. Netflix)" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-[11px] font-bold text-slate-200 uppercase" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={pulseAmount} onChange={(e) => setPulseAmount(e.target.value)} placeholder="Magnitude" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-[11px] font-bold text-slate-200 uppercase" />
                <select value={pulseFreq} onChange={(e) => setPulseFreq(e.target.value as any)} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-[10px] font-bold text-slate-200 uppercase tracking-widest">
                  <option value="daily" className="bg-slate-900">Daily</option>
                  <option value="weekly" className="bg-slate-900">Weekly</option>
                  <option value="monthly" className="bg-slate-900">Monthly</option>
                  <option value="yearly" className="bg-slate-900">Yearly</option>
                </select>
              </div>
              <select value={pulseCat} onChange={(e) => setPulseCat(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-[11px] font-bold text-slate-200 uppercase">
                <option value="" className="bg-slate-950">Select Category</option>
                {(pulseType === 'expense' ? categories.expense : categories.income).map(cat => <option key={cat} value={cat} className="bg-slate-950">{cat}</option>)}
              </select>
              <input type="date" value={pulseStart} onChange={(e) => setPulseStart(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-[11px] font-bold text-slate-200" />
              <button onClick={addPulseNode} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-purple-500/10">Initialize Pulse Node</button>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Live Synchronization Nodes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recurringPulses.length > 0 ? recurringPulses.map(p => (
                <div key={p.id} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs border ${p.type === 'income' ? 'border-emerald-500/20 text-emerald-500 animate-pulse' : 'border-rose-500/20 text-rose-500 animate-pulse'}`}>
                      <i className="fa-solid fa-heart-pulse"></i>
                    </div>
                    <div>
                      <h5 className="text-white font-bold text-sm uppercase tracking-tight truncate max-w-[120px]">{p.description}</h5>
                      <div className="flex gap-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">{p.frequency}</span>
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-2 py-0.5 rounded">{currency.symbol}{p.amount}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removePulseNode(p.id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-rose-500/20 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can"></i></button>
                </div>
              )) : (
                <div className="sm:col-span-2 py-16 text-center opacity-30 text-[10px] font-bold uppercase tracking-[0.2em] border-2 border-dashed border-white/5 rounded-[2rem]">No Pulse Nodes Detected</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
        <h3 className="text-2xl md:text-3xl font-black text-white mb-8 flex items-center gap-6 tracking-tight">
          <i className="fa-solid fa-earth-americas text-indigo-500"></i>
          Regional Synthesis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUPPORTED_CURRENCIES.map(c => (
            <button key={c.code} onClick={() => onCurrencyChange(c)} className={`p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-300 text-left relative overflow-hidden group ${currency.code === c.code ? 'border-indigo-600 bg-indigo-600/10 glow-indigo' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black transition-all ${currency.code === c.code ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-500'}`}>{c.symbol}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.code}</span>
              </div>
              <h4 className="text-white font-bold text-base md:text-lg tracking-tight uppercase truncate">{c.name}</h4>
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-[3rem] p-8 md:p-12">
        <h3 className="text-2xl md:text-3xl font-black text-white mb-10 flex items-center gap-6 tracking-tight">
          <i className="fa-solid fa-tags text-indigo-500"></i>
          Classification Layers
        </h3>
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <div className="lg:w-1/3 space-y-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Add Descriptor Node</h4>
            <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl">
              <button onClick={() => setCatType('expense')} className={`flex-1 py-3 text-[10px] font-bold rounded-xl transition-all uppercase tracking-wide ${catType === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-500'}`}>Expenses</button>
              <button onClick={() => setCatType('income')} className={`flex-1 py-3 text-[10px] font-bold rounded-xl transition-all uppercase tracking-wide ${catType === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>Income</button>
            </div>
            <input type="text" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Identify layer..." className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-white/20 outline-none text-xs font-bold text-white placeholder:text-slate-700 uppercase tracking-widest" />
            <button onClick={addCategory} className="w-full py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-500 shadow-xl shadow-indigo-500/10">Commit Layer</button>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-10">
            {['expense', 'income'].map((type) => (
              <div key={type} className="space-y-6">
                <h4 className={`text-[10px] font-bold ${type === 'expense' ? 'text-rose-500' : 'text-emerald-500'} uppercase tracking-widest flex items-center gap-3`}>
                  <div className={`w-2 h-2 rounded-full ${type === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                  {type === 'expense' ? 'Expenses' : 'Income'} Node Set
                </h4>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {categories[type as keyof UserCategories].map(cat => (
                    <span key={cat} className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 text-slate-300 rounded-xl text-[10px] font-bold border border-white/5 uppercase tracking-wide group">
                      {cat}
                      <button onClick={() => removeCategory(type as any, cat)} className="text-slate-500 hover:text-rose-500 transition-colors"><i className="fa-solid fa-xmark"></i></button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-[3rem] p-8 md:p-12 border border-white/10">
        <h3 className="text-2xl md:text-3xl font-black text-white mb-8 flex items-center gap-6 tracking-tight">
          <i className="fa-solid fa-sliders text-indigo-500"></i>
          Fiscal Constraints
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Define Limit Node</h4>
            <div className="space-y-4">
              <select value={editingBudgetCategory} onChange={(e) => setEditingBudgetCategory(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-[11px] font-bold text-slate-200 uppercase tracking-wide">
                <option value="" className="bg-slate-950">Select Category</option>
                {categories.expense.map(cat => <option key={cat} value={cat} className="bg-slate-950">{cat}</option>)}
              </select>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-400">{currency.symbol}</span>
                <input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder="Limit Value" className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-white/20 outline-none text-xs font-bold text-white placeholder:text-slate-700 uppercase" />
              </div>
              <button onClick={setOrUpdateBudget} className="w-full py-4 bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all">Apply Constraint</button>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Active Overwatch Nodes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {budgets.length > 0 ? budgets.map(b => (
                <div key={b.category} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-between group">
                  <div>
                    <h5 className="text-white font-bold text-sm uppercase tracking-tight">{b.category}</h5>
                    <p className="text-[10px] font-bold text-indigo-400 tracking-widest">{currency.symbol}{b.limit.toLocaleString()}</p>
                  </div>
                  <button onClick={() => removeBudget(b.category)} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-rose-500/20 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can"></i></button>
                </div>
              )) : (
                <div className="sm:col-span-2 py-10 text-center opacity-30 text-[10px] font-bold uppercase tracking-[0.2em]">Zero Constraints Calibrated</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-[3rem] p-8 md:p-12 border border-white/10">
        <h3 className="text-2xl md:text-3xl font-black text-white mb-8 flex items-center gap-6 tracking-tight">
          <i className="fa-solid fa-satellite-dish text-indigo-500"></i>
          Data Transmission
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 md:p-10 bg-white/[0.02] rounded-[2.5rem] border border-white/5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Temporal Start</label>
              <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="w-full px-5 py-4 bg-slate-950 border border-white/10 rounded-2xl focus:border-indigo-600 outline-none text-xs font-bold text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Temporal End</label>
              <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="w-full px-5 py-4 bg-slate-950 border border-white/10 rounded-2xl focus:border-indigo-600 outline-none text-xs font-bold text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Nexus Filter</label>
              <select value={exportType} onChange={(e) => setExportType(e.target.value as any)} className="w-full px-5 py-4 bg-slate-950 border border-white/10 rounded-2xl outline-none text-xs font-bold text-white uppercase tracking-wider appearance-none">
                <option value="all">Globalnexus (All)</option>
                <option value="income">Income Stream</option>
                <option value="expense">Expenses Stream</option>
              </select>
            </div>
          </div>
          <button onClick={handleExportCSV} className="w-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-[10px] uppercase tracking-widest rounded-[2.5rem] shadow-2xl hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-4 p-8">
            <i className="fa-solid fa-cloud-arrow-down text-3xl"></i>
            Extract .CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
