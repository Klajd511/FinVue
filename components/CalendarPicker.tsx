
import React, { useState, useRef, useEffect } from 'react';

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
}

const CalendarPicker: React.FC<Props> = ({ value, onChange, placeholder = "Select Date" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current date
  const selectedDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const offset = newDate.getTimezoneOffset();
    const adjustedDate = new Date(newDate.getTime() - (offset * 60 * 1000));
    onChange(adjustedDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const adjustedDate = new Date(today.getTime() - (offset * 60 * 1000));
    const dateStr = adjustedDate.toISOString().split('T')[0];
    onChange(dateStr);
    setViewDate(new Date());
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = daysInMonth(year, month);
    const startDay = startDayOfMonth(year, month);
    const today = new Date().toISOString().split('T')[0];

    const prevMonthDays = daysInMonth(year, month - 1);
    const calendarCells = [];

    // Prev month padding
    for (let i = startDay - 1; i >= 0; i--) {
      calendarCells.push(
        <div key={`prev-${i}`} className="h-9 w-9 flex items-center justify-center text-[10px] text-slate-700 font-bold">
          {prevMonthDays - i}
        </div>
      );
    }

    // Current month days
    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = value === dateStr;
      const isToday = today === dateStr;

      calendarCells.push(
        <button
          key={d}
          type="button"
          onClick={() => handleSelectDate(d)}
          className={`h-9 w-9 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all relative group
            ${isSelected ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-slate-300 hover:bg-white/10'}
            ${isToday && !isSelected ? 'border border-indigo-500/50 text-indigo-400' : ''}
          `}
        >
          {d}
          {isToday && !isSelected && <div className="absolute bottom-1.5 w-1 h-1 bg-indigo-500 rounded-full"></div>}
        </button>
      );
    }

    return calendarCells;
  };

  const formattedValue = value 
    ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : placeholder;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/[0.08] hover:border-white/20 outline-none transition-all group min-w-[140px]"
      >
        <span className={`text-[11px] md:text-sm font-bold uppercase tracking-wide transition-all ${value ? 'text-slate-200 group-hover:text-white' : 'text-slate-500'}`}>
          {formattedValue}
        </span>
        <i className={`fa-solid fa-calendar-day transition-colors ${isOpen ? 'text-indigo-400' : 'text-slate-500'}`}></i>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-[280px] glass rounded-[2rem] p-5 shadow-2xl z-[100] border border-white/10 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
          <div className="flex items-center justify-between mb-4 px-1">
            <button type="button" onClick={handlePrevMonth} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">
              <i className="fa-solid fa-chevron-left text-[10px]"></i>
            </button>
            <div className="text-[11px] font-black text-white uppercase tracking-widest">
              {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
            <button type="button" onClick={handleNextMonth} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">
              <i className="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="h-8 w-8 flex items-center justify-center text-[9px] font-black text-slate-600 uppercase">
                {d}
              </div>
            ))}
            {renderCalendar()}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <button
              type="button"
              onClick={handleSetToday}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 uppercase tracking-widest rounded-xl transition-all"
            >
              Align to Today
            </button>
            {value && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false); }}
                className="w-full py-2.5 text-[10px] font-bold text-rose-500 uppercase tracking-widest rounded-xl transition-all hover:bg-rose-500/10"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPicker;
