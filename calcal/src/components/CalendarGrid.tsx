/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft,
  X
} from 'lucide-react';
import { 
  getMonthDays, 
  JALALI_MONTH_NAMES, 
  JALALI_WEEKDAY_NAMES,
  CURRENT_JALALI_YEAR
} from '../utils/jalali';
import { JalaliDate, CalendarDay } from '../types';

interface CalendarGridProps {
  selectedDate: JalaliDate;
  activeMonth: number; // 1 to 12
  onDateSelect: (date: JalaliDate) => void;
  onMonthChange: (month: number) => void;
  eventsCountMap: Record<string, number>;
  todayDate: JalaliDate;
  hasActiveGoal: boolean;
  crossedDays: string[];
}

export default function CalendarGrid({
  selectedDate,
  activeMonth,
  onDateSelect,
  onMonthChange,
  eventsCountMap,
  todayDate,
  hasActiveGoal,
  crossedDays = []
}: CalendarGridProps) {
  
  // Calculate grid days memoized for year 1405
  const daysGrid: CalendarDay[] = useMemo(() => {
    return getMonthDays(CURRENT_JALALI_YEAR, activeMonth);
  }, [activeMonth]);

  // Check if a date is strictly in the past compared to today Date
  const isPastDate = (dayDate: JalaliDate) => {
    if (dayDate.jy < todayDate.jy) return true;
    if (dayDate.jy > todayDate.jy) return false;
    if (dayDate.jm < todayDate.jm) return true;
    if (dayDate.jm > todayDate.jm) return false;
    return dayDate.jd < todayDate.jd;
  };

  function prevMonth() {
    if (activeMonth === 1) {
      onMonthChange(12);
    } else {
      onMonthChange(activeMonth - 1);
    }
  }

  function nextMonth() {
    if (activeMonth === 12) {
      onMonthChange(1);
    } else {
      onMonthChange(activeMonth + 1);
    }
  }

  return (
    <div id="calendar-grid-container" className="bg-white border border-stone-200 p-6 shadow-sm select-none rounded-xl">
      
      {/* Calendar Header/Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-100 pb-5 mb-5">
        
        {/* Navigation Selector */}
        <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={nextMonth} // RTL order
              className="p-2 text-stone-600 hover:bg-stone-50 hover:text-black rounded-lg transition-colors cursor-pointer border border-stone-200/60"
              title="ماه بعدی"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={prevMonth} // RTL order
              className="p-2 text-stone-600 hover:bg-stone-50 hover:text-black rounded-lg transition-colors cursor-pointer border border-stone-200/60"
              title="ماه قبلی"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block mb-0.5">تقویم سال {CURRENT_JALALI_YEAR}</span>
            <h1 className="text-2xl font-black font-sans text-stone-900 tracking-tight">
              {JALALI_MONTH_NAMES[activeMonth - 1]}
            </h1>
          </div>
        </div>

        {/* Quick Month Tabs */}
        <div className="flex flex-wrap gap-1 bg-stone-50 p-1 rounded-lg border border-stone-150">
          {JALALI_MONTH_NAMES.map((name, idx) => {
            const monthNumber = idx + 1;
            const isSelected = activeMonth === monthNumber;
            return (
              <button
                key={name}
                onClick={() => onMonthChange(monthNumber)}
                className={`px-3 py-1.5 text-xs font-sans font-medium rounded-md transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-black text-white shadow-xs' 
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/70'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weekday headers (Sh to Jo) */}
      <div className="grid grid-cols-7 gap-1 text-center mb-3">
        {JALALI_WEEKDAY_NAMES.map((name, idx) => {
          const isFriday = idx === 6;
          return (
            <div 
              key={name}
              className={`py-2 text-xs font-bold font-sans ${
                isFriday ? 'text-red-500' : 'text-stone-400'
              }`}
            >
              {name}
            </div>
          );
        })}
      </div>

      {/* 42-cell Grid */}
      <div className="grid grid-cols-7 gap-2">
        {daysGrid.map((day, ix) => {
          const dateKey = `${day.jalaliDate.jy}-${day.jalaliDate.jm}-${day.jalaliDate.jd}`;
          const currentEventsCount = eventsCountMap[dateKey] || 0;
          
          const isSelected = selectedDate.jy === day.jalaliDate.jy && 
                             selectedDate.jm === day.jalaliDate.jm && 
                             selectedDate.jd === day.jalaliDate.jd;

          // Check if this day is actively crossed off
          const isCrossed = crossedDays.includes(dateKey);

          // Compute cell styles
          let cellStyle = "min-h-[85px] sm:min-h-[100px] p-2.5 flex flex-col justify-between transition-all rounded-lg relative cursor-pointer border ";
          
          if (isSelected) {
            // Selected style (full inverted black card)
            cellStyle += "bg-stone-900 text-white border-stone-900 z-10 shadow-md ring-2 ring-stone-950/20";
          } else if (day.isToday) {
            // Today's style (elegant highlight with custom border)
            cellStyle += "bg-emerald-50/50 text-emerald-950 border-emerald-300 ring-1 ring-emerald-300/35 hover:bg-emerald-100/50";
          } else if (!day.isCurrentMonth) {
            // Out of month (extremely subtle gray text)
            cellStyle += "bg-stone-50 text-stone-300 border-stone-100/70 hover:bg-stone-100/40 hover:text-stone-400";
          } else {
            // Regular day within active month
            cellStyle += "bg-white text-stone-800 border-stone-200/80 hover:border-stone-400 hover:bg-stone-50/50";
          }

          const hasPassed = isPastDate(day.jalaliDate);

          return (
            <div
              key={ix}
              id={`cell-${dateKey}`}
              onClick={() => onDateSelect(day.jalaliDate)}
              className={cellStyle}
            >
              {/* Elegant big Cross overlay in the middle of crossed-off days */}
              {hasActiveGoal && isCrossed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Visual ❌ Strike through overlay */}
                    <span className={`text-[4.5rem] sm:text-[5.5rem] font-bold select-none leading-none opacity-80 ${
                      isSelected ? 'text-rose-400' : 'text-rose-600'
                    }`}>
                      ×
                    </span>
                  </div>
                </div>
              )}

              {/* Day Number and small indicators */}
              <div className="flex justify-between items-start z-20">
                <span className={`text-base font-black font-sans ${
                  day.isHoliday && !isSelected ? 'text-red-500 font-extrabold' : ''
                }`}>
                  {day.dayNumber}
                </span>

                {/* Event Dot */}
                {currentEventsCount > 0 && (
                  <span 
                    className={`flex h-2.5 w-2.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-stone-900'
                    }`} 
                    title={`${currentEventsCount} یادداشت ثبت شده`} 
                  />
                )}
              </div>

              {/* Holiday text abbreviated if space permits */}
              <div className="mt-2 leading-none select-none z-20">
                {day.holidays.length > 0 && (
                  <p 
                    className={`text-[9.5px] line-clamp-2 leading-relaxed ${
                      isSelected 
                        ? 'text-stone-300' 
                        : day.isHoliday 
                          ? 'text-red-500/80 font-medium' 
                          : 'text-stone-400'
                    }`}
                  >
                    {day.holidays[0]}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend / Info Footer */}
      <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap gap-4 text-xs text-stone-500 justify-start select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 bg-emerald-100 border border-emerald-300 rounded block"></span>
          <span>امروز</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-stone-900"></div>
          <span>دارای یادداشت یا رویداد</span>
        </div>
        {hasActiveGoal && (
          <div className="flex items-center gap-1.5 text-stone-700">
            <span className="text-rose-600 font-bold font-sans text-sm">×</span>
            <span>روز سپری شده و خط زده شده (❌)</span>
          </div>
        )}
      </div>
    </div>
  );
}
