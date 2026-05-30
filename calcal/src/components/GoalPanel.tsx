/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Target, Trash2, CheckCircle2, Sparkles, Edit2, Calendar } from 'lucide-react';
import { Goal } from '../types';
import { JALALI_MONTH_NAMES, CURRENT_JALALI_YEAR } from '../utils/jalali';

interface GoalPanelProps {
  activeGoal: Goal | null;
  onSaveGoal: (title: string, targetMonth: number, targetDay: number) => Promise<void>;
  onDeleteGoal: () => Promise<void>;
}

export default function GoalPanel({
  activeGoal,
  onSaveGoal,
  onDeleteGoal
}: GoalPanelProps) {
  const [goalText, setGoalText] = useState('');
  const [targetMonth, setTargetMonth] = useState(12);
  const [targetDay, setTargetDay] = useState(29);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if activeGoal changes
  useEffect(() => {
    if (activeGoal) {
      setGoalText(activeGoal.title);
      setTargetMonth(activeGoal.targetMonth || 12);
      setTargetDay(activeGoal.targetDay || 29);
    } else {
      setGoalText('');
      setTargetMonth(12);
      setTargetDay(29);
    }
  }, [activeGoal]);

  // Determine days in the selected Jalali month
  const getMaxDays = (month: number) => {
    if (month >= 1 && month <= 6) return 31;
    if (month >= 7 && month <= 11) return 30;
    if (month === 12) return 29; // Year 1405 Esfand is 29 days
    return 30;
  };

  const maxDays = getMaxDays(targetMonth);

  // If selected day is out of range for the new month, clamp it
  useEffect(() => {
    if (targetDay > maxDays) {
      setTargetDay(maxDays);
    }
  }, [targetMonth, maxDays, targetDay]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goalText.trim()) return;

    try {
      setIsSubmitting(true);
      await onSaveGoal(goalText, targetMonth, targetDay);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleStartEdit() {
    if (activeGoal) {
      setGoalText(activeGoal.title);
      setTargetMonth(activeGoal.targetMonth || 12);
      setTargetDay(activeGoal.targetDay || 29);
      setIsEditing(true);
    }
  }

  return (
    <div id="goal-panel-container" className="bg-white border border-stone-200 p-5 rounded-xl shadow-sm select-none">
      <div className="flex items-center gap-2 mb-3.5 border-b border-stone-100 pb-3">
        <div className="bg-amber-500/10 text-amber-600 p-1.5 rounded">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black font-sans text-stone-900">هدف اصلی سال</h3>
          <p className="text-[10px] text-stone-400">فقط یک هدف با تاریخ پایان مشخص برای پیگیری مستمر</p>
        </div>
      </div>

      {activeGoal && !isEditing ? (
        /* Active Goal Mode */
        <div className="flex flex-col gap-4 p-4 bg-stone-50 border border-stone-200 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 my-0.5 flex-1">
              <span className="text-[9.5px] uppercase font-bold tracking-wider text-amber-600 block">هدف سال ۱۴۰۵:</span>
              <p className="text-xs font-sans font-extrabold text-stone-900 leading-relaxed">
                {activeGoal.title}
              </p>
              
              <div className="flex items-center gap-1 text-[11px] text-stone-500 font-sans mt-2 pt-1 border-t border-dashed border-stone-200">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>مهلت دستیابی:</span>
                <span className="font-bold text-stone-800">
                  {activeGoal.targetDay} {JALALI_MONTH_NAMES[activeGoal.targetMonth - 1]} {CURRENT_JALALI_YEAR}
                </span>
              </div>
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={handleStartEdit}
                className="p-1.5 text-stone-500 hover:text-black hover:bg-stone-100 rounded-md transition-colors cursor-pointer border border-stone-200"
                title="ویرایش هدف"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onDeleteGoal}
                className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer border border-stone-200"
                title="حذف هدف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[10px] bg-white p-2.5 border border-stone-150 rounded-md text-stone-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="leading-normal">
              هر زمان یک خانه در تقویم گذشته شود، در صورت نزدیک شدن به هدف با علامت ضربدر <code className="font-bold text-red-500 font-mono">❌</code> علامت‌گذاری شده تا تعهد روزانه شما نمایان گردد.
            </p>
          </div>
        </div>
      ) : (
        /* Create or Edit Goal Form */
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-500">عنوان هدف سالانه:</label>
            <input
              type="text"
              required
              maxLength={150}
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="هدف خود را وارد کنید (مثلاً: یادگیری مکالمه انگلیسی)"
              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 outline-none text-xs text-stone-850 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder:text-stone-400 transition-all font-sans"
            />
          </div>

          {/* New Jalali Target Date Selector */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-500">ماه هدف:</label>
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(Number(e.target.value))}
                className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-2.5 outline-none text-xs text-stone-850 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-sans cursor-pointer"
              >
                {JALALI_MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-500">روز هدف:</label>
              <select
                value={targetDay}
                onChange={(e) => setTargetDay(Number(e.target.value))}
                className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-2.5 outline-none text-xs text-stone-850 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-sans cursor-pointer"
              >
                {Array.from({ length: maxDays }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 text-xs text-stone-500 hover:text-stone-850 hover:bg-stone-50 transition-colors cursor-pointer rounded-lg border border-stone-200"
              >
                انصراف
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !goalText.trim()}
              className="bg-stone-900 hover:bg-black text-white text-xs font-bold font-sans px-4 py-2.5 rounded-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEditing ? 'ذخیره تغییرات هدف' : 'ثبت هدف سالانه با مهلت'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
