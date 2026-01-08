
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, Currency, SUPPORTED_CURRENCIES, UserCategories, INITIAL_CATEGORIES, EXCHANGE_RATES, Budget, UserConfig, RecurringPulse } from './types';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import AIInsightsView from './components/AIInsightsView';
import SettingsView from './components/SettingsView';

const STORAGE_KEY = 'finvue_transactions';
const CONFIG_KEY = 'finvue_config';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [config, setConfig] = useState<UserConfig>(() => {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        currency: parsed.currency || SUPPORTED_CURRENCIES[0],
        categories: parsed.categories || INITIAL_CATEGORIES,
        budgets: parsed.budgets || [],
        recurringPulses: parsed.recurringPulses || []
      };
    }
    return {
      currency: SUPPORTED_CURRENCIES[0],
      categories: INITIAL_CATEGORIES,
      budgets: [],
      recurringPulses: []
    };
  });

  const { currency, categories, budgets, recurringPulses } = config;
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ai' | 'settings'>('dashboard');

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  // Pulse Node Synchronization Logic
  const synchronizePulseNodes = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let updatedPulses = [...recurringPulses];
    let newTransactions: Transaction[] = [];
    let modified = false;

    updatedPulses = updatedPulses.map(pulse => {
      let nextDate = new Date(pulse.nextPulseDate);
      nextDate.setHours(0, 0, 0, 0);
      
      let currentPulse = { ...pulse };

      // Process all pulses that happened since last visit
      while (nextDate <= today) {
        modified = true;
        // Create Transaction
        const tx: Transaction = {
          id: `pulse-${Math.random().toString(36).substring(2, 7)}`,
          date: nextDate.toISOString().split('T')[0],
          description: `[PULSE] ${pulse.description}`,
          amount: pulse.amount,
          category: pulse.category,
          type: pulse.type,
          currencyCode: pulse.currencyCode
        };
        newTransactions.push(tx);

        // Advance Date
        if (pulse.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (pulse.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (pulse.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (pulse.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
      
      currentPulse.nextPulseDate = nextDate.toISOString().split('T')[0];
      return currentPulse;
    });

    if (modified) {
      setTransactions(prev => [...newTransactions, ...prev]);
      setConfig(prev => ({ ...prev, recurringPulses: updatedPulses }));
    }
  }, [recurringPulses]);

  // Run synchronization on mount
  useEffect(() => {
    synchronizePulseNodes();
  }, []);

  const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: Math.random().toString(36).substring(2, 9)
    };
    setTransactions(prev => [tx, ...prev]);
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
    setEditingTransaction(null);
  };

  const deleteTransaction = (id: string) => {
    if (editingTransaction?.id === id) setEditingTransaction(null);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateCurrency = (c: Currency) => setConfig(prev => ({ ...prev, currency: c }));
  const updateCategories = (cats: UserCategories) => setConfig(prev => ({ ...prev, categories: cats }));
  const updateBudgets = (b: Budget[]) => setConfig(prev => ({ ...prev, budgets: b }));
  const updateRecurringPulses = (p: RecurringPulse[]) => setConfig(prev => ({ ...prev, recurringPulses: p }));

  const totalBalanceInPreferred = useMemo(() => {
    return transactions.reduce((sum, t) => {
      const rateFrom = EXCHANGE_RATES[t.currencyCode] || 1;
      const rateTo = EXCHANGE_RATES[currency.code] || 1;
      return sum + (t.type === 'income' ? (t.amount / rateFrom) * rateTo : -(t.amount / rateFrom) * rateTo);
    }, 0);
  }, [transactions, currency]);

  const formatCurrency = (val: number) => {
    const isLek = currency.code === 'ALL';
    const formatted = Math.abs(val).toLocaleString(undefined, { 
      maximumFractionDigits: isLek ? 0 : 2,
      minimumFractionDigits: isLek ? 0 : 2 
    });
    return isLek ? `${val < 0 ? '-' : ''}${formatted} Lek` : `${val < 0 ? '-' : ''}${currency.symbol}${formatted}`;
  };

  const navItems = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
    { id: 'transactions', icon: 'fa-list-check', label: 'Activity' },
    { id: 'ai', icon: 'fa-robot', label: 'AI Advisor' },
    { id: 'settings', icon: 'fa-gear', label: 'Settings' },
  ] as const;

  const handleEditRequest = (tx: Transaction) => {
    setEditingTransaction(tx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#020617] text-slate-100 pb-20 md:pb-0 relative">
      <div className="fixed top-[-10%] left-[-5%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full -z-10 animate-pulse-slow"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/10 blur-[150px] rounded-full -z-10 animate-pulse-slow"></div>

      <aside className="hidden md:flex w-72 glass border-r border-white/5 flex-col sticky top-0 h-screen z-20">
        <div className="p-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg glow-indigo">
              <i className="fa-solid fa-layer-group text-xl"></i>
            </div>
            <div>
               <h1 className="text-2xl font-black text-white tracking-tight">FinVue</h1>
               <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Quantum Ed.</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 group relative ${activeTab === item.id ? 'bg-white/5 text-white shadow-inner border border-white/10' : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'}`}
            >
              <i className={`fa-solid ${item.icon} text-lg ${activeTab === item.id ? 'text-indigo-400' : 'group-hover:text-indigo-300'}`}></i>
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
              {activeTab === item.id && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div>}
            </button>
          ))}
        </nav>

        <div className="p-8">
          <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Display Unit</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-white tracking-tight">{currency.code}</span>
              <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold border border-white/10">{currency.symbol}</span>
            </div>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 z-50 px-8 py-4 flex items-center justify-between">
        {navItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-indigo-400 scale-105' : 'text-slate-400'}`}
          >
            <i className={`fa-solid ${item.icon} text-xl`}></i>
            <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-30 glass border-b border-white/5 px-6 md:px-12 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <i className="fa-solid fa-layer-group"></i>
             </div>
             <h1 className="text-xl font-black text-white tracking-tight">FinVue</h1>
          </div>
          <h2 className="hidden md:block text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
            {activeTab === 'dashboard' ? 'Quantum Overview' : 
             activeTab === 'transactions' ? 'Temporal Ledger' : 
             activeTab === 'settings' ? 'System Configuration' : 'AI Analysis'}
          </h2>
          <div className="flex items-center gap-6">
             <div className="text-right">
               <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Global Balance</p>
               <p className="text-lg md:text-2xl font-black text-white tracking-tight">
                {formatCurrency(totalBalanceInPreferred)}
               </p>
             </div>
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 bg-gradient-to-br from-slate-800 to-slate-950 p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                   <img src="https://api.dicebear.com/7.x/shapes/svg?seed=finvue" alt="User" />
                </div>
             </div>
          </div>
        </header>

        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12">
          {(activeTab === 'dashboard' || activeTab === 'transactions') && (
            <div className="animate-in fade-in slide-in-from-top-8 duration-700">
              <TransactionForm 
                onAdd={addTransaction} 
                onUpdate={updateTransaction}
                editData={editingTransaction}
                onCancel={() => setEditingTransaction(null)}
                categories={categories} 
                preferredCurrency={currency} 
              />
            </div>
          )}

          <div className="space-y-12 transition-all duration-500">
            {activeTab === 'dashboard' && <Dashboard transactions={transactions} preferredCurrency={currency} budgets={budgets} recurringPulses={recurringPulses} />}
            {activeTab === 'transactions' && (
              <TransactionList 
                transactions={transactions} 
                onDelete={deleteTransaction} 
                onEdit={handleEditRequest}
                preferredCurrency={currency} 
              />
            )}
            {activeTab === 'ai' && <AIInsightsView transactions={transactions} currency={currency} />}
            {activeTab === 'settings' && (
              <SettingsView 
                currency={currency} 
                onCurrencyChange={updateCurrency} 
                categories={categories} 
                onCategoriesChange={updateCategories}
                budgets={budgets}
                onBudgetsChange={updateBudgets}
                recurringPulses={recurringPulses}
                onRecurringPulsesChange={updateRecurringPulses}
                transactions={transactions}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
