/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { JalaliDate, DecryptedEvent, Goal } from './types';
import { dateToJalali, CURRENT_JALALI_YEAR, JALALI_MONTH_NAMES } from './utils/jalali';
import CalendarGrid from './components/CalendarGrid';
import EventNotes from './components/EventNotes';
import GoalPanel from './components/GoalPanel';

export default function App() {
  
  // Year is strictly 1405 (current Persian year)
  const today = useMemo(() => {
    const jalaliToday = dateToJalali(new Date());
    return {
      jy: CURRENT_JALALI_YEAR,
      jm: jalaliToday.jm,
      jd: jalaliToday.jd
    };
  }, []);

  // Compute yesterday's Jalali date
  const yesterday = useMemo(() => {
    const now = new Date();
    // Subtract 24 hours to get yesterday
    const yesterdayDateObj = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return dateToJalali(yesterdayDateObj);
  }, []);

  const yesterdayKey = `${yesterday.jy}-${yesterday.jm}-${yesterday.jd}`;

  const [selectedDate, setSelectedDate] = useState<JalaliDate>(today);
  const [activeMonth, setActiveMonth] = useState<number>(today.jm);

  // States for Goal and Events loaded from backend File Store or local storage fallback
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [events, setEvents] = useState<DecryptedEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [usingLocalStorage, setUsingLocalStorage] = useState<boolean>(false);

  // Load goal and events on startup
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/data');
        if (res.ok) {
          const data = await res.json();
          const serverEvents = data.events || [];
          const serverGoal = data.goal || null;
          setEvents(serverEvents);
          setActiveGoal(serverGoal);
          setUsingLocalStorage(false);
          // Sync to localStorage as backup
          localStorage.setItem('cal_events', JSON.stringify(serverEvents));
          localStorage.setItem('cal_goal', JSON.stringify(serverGoal));
        } else {
          throw new Error('Server returned non-ok status');
        }
      } catch (err) {
        console.warn('Backend API not available or errored. Switching seamlessly to LocalStorage...', err);
        setUsingLocalStorage(true);
        // Fallback to local storage
        const cachedEvents = localStorage.getItem('cal_events');
        const cachedGoal = localStorage.getItem('cal_goal');
        setEvents(cachedEvents ? JSON.parse(cachedEvents) : []);
        setActiveGoal(cachedGoal ? JSON.parse(cachedGoal) : null);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute event counters for each calendar cell
  const eventsCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => {
      map[e.dateKey] = (map[e.dateKey] || 0) + 1;
    });
    return map;
  }, [events]);

  // Saves a new event to the server
  async function handleAddEvent(title: string, description: string, time: string) {
    const dateKey = `${selectedDate.jy}-${selectedDate.jm}-${selectedDate.jd}`;
    const newEvent: DecryptedEvent = {
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      dateKey,
      title: title.trim(),
      description: (description || '').trim(),
      time: (time || '').trim(),
      createdAt: Date.now()
    };

    // Update state and localStorage optimistically
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    localStorage.setItem('cal_events', JSON.stringify(updatedEvents));

    if (!usingLocalStorage) {
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dateKey, title, description, time })
        });
      } catch (err) {
        console.error('Failed to save event to server, saved locally', err);
      }
    }
  }

  // Deletes an event from the server
  async function handleDeleteEvent(id: string) {
    // Update state and localStorage optimistically
    const updatedEvents = events.filter(e => e.id !== id);
    setEvents(updatedEvents);
    localStorage.setItem('cal_events', JSON.stringify(updatedEvents));

    if (!usingLocalStorage) {
      try {
        await fetch(`/api/events/${id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Failed to delete event from server, updated locally', err);
      }
    }
  }

  // Saves/updates the single main goal (including targetMonth/targetDay) on the server
  async function handleSaveGoal(title: string, targetMonth: number, targetDay: number) {
    const newGoal: Goal = {
      title: title.trim(),
      targetMonth,
      targetDay,
      createdAt: activeGoal?.title === title.trim() ? activeGoal.createdAt : Date.now(),
      crossedDays: activeGoal?.crossedDays || []
    };

    // Update state and localStorage optimistically
    setActiveGoal(newGoal);
    localStorage.setItem('cal_goal', JSON.stringify(newGoal));

    if (!usingLocalStorage) {
      try {
        await fetch('/api/goal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title, 
            targetMonth, 
            targetDay,
            crossedDays: newGoal.crossedDays
          })
        });
      } catch (err) {
        console.error('Failed to save goal to server, saved locally', err);
      }
    }
  }

  // Clears the active goal on the server
  async function handleDeleteGoal() {
    // Update state and localStorage optimistically
    setActiveGoal(null);
    localStorage.removeItem('cal_goal');

    if (!usingLocalStorage) {
      try {
        await fetch('/api/goal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '' }) // clears it
        });
      } catch (err) {
        console.error('Failed to delete goal from server, updated locally', err);
      }
    }
  }

  // Toggles if a dateKey is crossed off for the current active goal
  async function handleToggleCrossed(dateKey: string) {
    if (!activeGoal) return;

    const currentCrossed = activeGoal.crossedDays || [];
    let updatedCrossed: string[];

    if (currentCrossed.includes(dateKey)) {
      updatedCrossed = currentCrossed.filter(k => k !== dateKey);
    } else {
      updatedCrossed = [...currentCrossed, dateKey];
    }

    const updatedGoal = {
      ...activeGoal,
      crossedDays: updatedCrossed
    };

    // Update state and localStorage optimistically
    setActiveGoal(updatedGoal);
    localStorage.setItem('cal_goal', JSON.stringify(updatedGoal));

    if (!usingLocalStorage) {
      try {
        await fetch('/api/goal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: activeGoal.title,
            targetMonth: activeGoal.targetMonth,
            targetDay: activeGoal.targetDay,
            crossedDays: updatedCrossed
          })
        });
      } catch (err) {
        console.error('Failed to save crossed status to server, updated locally', err);
      }
    }
  }

  // Check if yesterday is crossed off
  const isYesterdayCrossed = useMemo(() => {
    if (!activeGoal) return true;
    return (activeGoal.crossedDays || []).includes(yesterdayKey);
  }, [activeGoal, yesterdayKey]);

  // Check if selected date is in the past
  const isSelectedDatePast = useMemo(() => {
    if (selectedDate.jy < today.jy) return true;
    if (selectedDate.jy > today.jy) return false;
    if (selectedDate.jm < today.jm) return true;
    if (selectedDate.jm > today.jm) return false;
    return selectedDate.jd < today.jd;
  }, [selectedDate, today]);

  // Check if selected date is crossed off
  const isSelectedDateCrossed = useMemo(() => {
    const key = `${selectedDate.jy}-${selectedDate.jm}-${selectedDate.jd}`;
    if (!activeGoal) return false;
    return (activeGoal.crossedDays || []).includes(key);
  }, [activeGoal, selectedDate]);

  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans antialiased select-none">
      
      {/* Premium minimal header */}
      <header className="bg-white border-b border-stone-200 py-3.5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-stone-900 font-sans tracking-tight">دفترچه تقویم شمسی ۱۴۰۵</h1>
              <p className="text-xs text-stone-400 font-sans mt-0.5 font-medium">سیستم برنامه‌ریزی دفتری هماهنگ با اهداف و بررسی عملکرد روزانه</p>
            </div>
          </div>


        </div>
      </header>

      {/* Dynamic Notification Banner / Daily Prompt */}
      {activeGoal && !isYesterdayCrossed && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 py-3 px-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-stone-900">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="p-1 px-2.5 bg-amber-500 text-white rounded font-bold text-[10px] select-none text-center self-start sm:self-auto uppercase">اعلان پایش هدف</span>
              <p className="text-xs sm:text-xs font-bold leading-relaxed font-sans text-right">
                روز گذشته (<span className="text-amber-700 font-black">{yesterday.jd} {JALALI_MONTH_NAMES[yesterday.jm - 1]}</span>) به پایان رسید! لطفاً به تعهد خود عمل کرده و روز گذشته را با علامت ضربدر ❌ در تقویم خط بزنید.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
              <button
                onClick={() => handleToggleCrossed(yesterdayKey)}
                className="bg-black hover:bg-stone-850 text-white text-[11px] font-black font-sans px-4 py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                ❌ خط زدن روز قبل (دیروز)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main body */}
      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full flex-1">
        
        {isLoading ? (
          <div className="lg:col-span-12 flex flex-col items-center justify-center py-32 space-y-3">
            <div className="h-8 w-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-stone-500 font-medium">در حال بارگذاری اطلاعات تقویم و پرونده اهداف از سرور...</p>
          </div>
        ) : (
          <>
            {/* Left Column: Calendar grid */}
            <section className="lg:col-span-8 flex flex-col gap-6">
              <CalendarGrid 
                selectedDate={selectedDate}
                activeMonth={activeMonth}
                onDateSelect={setSelectedDate}
                onMonthChange={setActiveMonth}
                eventsCountMap={eventsCountMap}
                todayDate={today}
                hasActiveGoal={!!activeGoal}
                crossedDays={activeGoal?.crossedDays || []}
              />
            </section>

            {/* Right Column: Goal and Notes List */}
            <section className="lg:col-span-4 flex flex-col gap-6">
              {/* Goal panel at the top of the sidebar */}
              <GoalPanel 
                activeGoal={activeGoal}
                onSaveGoal={handleSaveGoal}
                onDeleteGoal={handleDeleteGoal}
              />

              <EventNotes 
                selectedDate={selectedDate}
                decryptedEvents={events}
                onAddEvent={handleAddEvent}
                onDeleteEvent={handleDeleteEvent}
                hasActiveGoal={!!activeGoal}
                isCrossed={isSelectedDateCrossed}
                onToggleCrossed={() => handleToggleCrossed(`${selectedDate.jy}-${selectedDate.jm}-${selectedDate.jd}`)}
                isPast={isSelectedDatePast}
              />
            </section>
          </>
        )}

      </main>

      {/* Minimalist Footer */}
      <footer className="mt-auto py-5 border-t border-stone-200 text-center text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-6">
          <p>© {today.jy} دفترچه تقویم شخصی. ثبت پایدار عملکرد شما در سیستم داخلی و فایل داده‌گاه.</p>
        </div>
      </footer>

    </div>
  );
}
