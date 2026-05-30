/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  FileText, 
  CalendarDays,
  Sparkles,
  Server,
  XSquare,
  CheckCircle
} from 'lucide-react';
import { JalaliDate, DecryptedEvent } from '../types';
import { JALALI_MONTH_NAMES, toGregorian, getHolidaysForDate } from '../utils/jalali';

interface EventNotesProps {
  selectedDate: JalaliDate;
  decryptedEvents: DecryptedEvent[]; // plain text events
  onAddEvent: (title: string, description: string, time: string) => Promise<void>;
  onDeleteEvent: (id: string) => void;
  hasActiveGoal: boolean;
  isCrossed: boolean;
  onToggleCrossed: () => void;
  isPast: boolean;
}

export default function EventNotes({
  selectedDate,
  decryptedEvents,
  onAddEvent,
  onDeleteEvent,
  hasActiveGoal,
  isCrossed,
  onToggleCrossed,
  isPast
}: EventNotesProps) {
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const dateKey = `${selectedDate.jy}-${selectedDate.jm}-${selectedDate.jd}`;

  // Get Gregorian representation
  const greg = toGregorian(selectedDate.jy, selectedDate.jm, selectedDate.jd);
  const dateStrGregorian = `${greg.gy}/${greg.gm.toString().padStart(2, '0')}/${greg.gd.toString().padStart(2, '0')}`;

  // Get national holidays for this date
  const { titles: holidays } = getHolidaysForDate(selectedDate.jy, selectedDate.jm, selectedDate.jd);

  // Filter events for the active day
  const activeEvents = decryptedEvents.filter(e => e.dateKey === dateKey);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsAdding(true);
      await onAddEvent(title, description, time);
      
      // Clear input fields
      setTitle('');
      setDescription('');
      setTime('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div id="event-notes-container" className="bg-white border border-stone-200 p-6 shadow-sm flex flex-col justify-between h-full rounded-xl select-none">
      <div>
        {/* Selected Date Header */}
        <div className="border-b border-stone-100 pb-5 mb-5 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black font-sans text-stone-900 leading-tight">
              {selectedDate.jd} {JALALI_MONTH_NAMES[selectedDate.jm - 1]} {selectedDate.jy}
            </h2>
            <p className="text-xs text-stone-400 font-mono mt-1">
              {dateStrGregorian} میلادی
            </p>
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-50 border border-stone-150 rounded-md text-xs font-medium text-stone-500">
              <CalendarDays className="w-4 h-4 text-stone-400" />
              <span>روز {selectedDate.jd} ماه</span>
            </span>
          </div>
        </div>

        {/* Dynamic Goal Tracking Cross Button (highly interactive) */}
        {hasActiveGoal && isPast && (
          <div className="mb-5 p-3.5 bg-rose-50/40 border border-rose-100 rounded-lg flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-rose-700 block">علامت‌گذاری برای هدف اصلی سال:</span>
              <p className="text-xs text-stone-700 leading-normal font-medium">
                {isCrossed ? 'روز گذشته متعهد بودید و خط خورده است' : 'این روز را به عنوان تلاش خط نزده‌اید'}
              </p>
            </div>
            <button
              onClick={onToggleCrossed}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all flex items-center gap-1.5 ${
                isCrossed 
                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs' 
                  : 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              {isCrossed ? (
                <>
                  <XSquare className="w-3.5 h-3.5" />
                  <span>✖ لغو خط زدن</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>❌ خط زدن این روز</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* National Holidays / Events */}
        {holidays.length > 0 && (
          <div className="mb-5 p-4 bg-red-50/50 border border-red-100 rounded-lg space-y-1">
            <span className="text-[10px] font-bold text-red-600 block tracking-widest leading-none mb-1.5">رویدادها و مناسبت‌های رسمی:</span>
            {holidays.map((h, i) => (
              <div key={i} className="text-sm text-red-950 font-bold flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-red-500 rounded-full flex-shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        )}

        {/* Notes Workspace */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">یادداشت‌ها و قرار ملاقات روزانه</h3>
          
          {activeEvents.length === 0 ? (
            <div className="py-12 border border-dashed border-stone-200 text-center text-stone-400 text-sm rounded-lg flex flex-col items-center justify-center gap-2">
              <FileText className="w-8 h-8 text-stone-300" />
              <span>هیچ رویداد یا یادداشتی برای این روز ثبت نشده است.</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {activeEvents.map((ev) => (
                <div key={ev.id} className="border border-stone-150 p-4 bg-stone-50/40 rounded-lg hover:bg-stone-50/80 transition-all flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-stone-900 font-sans leading-snug break-all">
                        {ev.title}
                      </h4>
                      {ev.time && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{ev.time}</span>
                        </span>
                      )}
                    </div>
                    {ev.description && (
                      <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap break-all">
                        {ev.description}
                      </p>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => onDeleteEvent(ev.id)}
                    className="text-stone-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all cursor-pointer flex-shrink-0 border border-transparent hover:border-red-100"
                    title="حذف یادداشت"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Note Form */}
      <div className="mt-8 border-t border-stone-100 pt-6">
        {isAdding ? (
          <div className="py-4 text-center text-xs text-stone-400 animate-pulse">
            در حال ذخیره‌سازی رویداد...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="text-xs font-bold text-stone-850 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-stone-800" />
              <span>افزودن یادداشت جدید:</span>
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                required
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان یادداشت (مثال: جلسه کاری، تولد مریم)"
                className="w-full bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 outline-none text-xs text-stone-800 focus:ring-1 focus:ring-black focus:border-black placeholder:text-stone-400 transition-all font-sans"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  maxLength={10}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="ساعت (مثال: ۱۶:۳۰)"
                  className="bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 outline-none text-xs text-stone-850 text-center focus:ring-1 focus:ring-black focus:border-black placeholder:text-stone-400 transition-all font-sans"
                />
                <input
                  type="text"
                  maxLength={300}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات بیشتر یادداشت..."
                  className="sm:col-span-2 bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 outline-none text-xs text-stone-850 focus:ring-1 focus:ring-black focus:border-black placeholder:text-stone-400 transition-all font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white hover:bg-stone-800 rounded-lg py-2.5 text-xs font-bold transition-all active:scale-[0.99] cursor-pointer shadow-xs font-sans flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>ثبت رویداد جدید در تقویم</span>
            </button>
          </form>
        )}
      </div>


    </div>
  );
}
