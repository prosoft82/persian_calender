/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JalaliDate, GregorianDate, StaticHoliday, CalendarDay } from '../types';

// Strict definitions for Solar Hijri year 1405 (equivalent to March 21, 2026 - March 20, 2027)
export const CURRENT_JALALI_YEAR = 1405;

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

export const JALALI_WEEKDAY_NAMES = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه'
];

// Months metadata specifically for Year 1405
const MONTH_META_1405: Record<number, { length: number; startWeekday: number }> = {
  1: { length: 31, startWeekday: 0 }, // Farvardin starts on Saturday (0)
  2: { length: 31, startWeekday: 3 }, // Ordibehesht starts on Tuesday (3)
  3: { length: 31, startWeekday: 6 }, // Khordad starts on Friday (6)
  4: { length: 31, startWeekday: 2 }, // Tir starts on Monday (2)
  5: { length: 31, startWeekday: 5 }, // Mordad starts on Thursday (5)
  6: { length: 31, startWeekday: 1 }, // Shahrivar starts on Sunday (1)
  7: { length: 30, startWeekday: 4 }, // Mehr starts on Wednesday (4)
  8: { length: 30, startWeekday: 6 }, // Aban starts on Friday (6)
  9: { length: 30, startWeekday: 1 }, // Azar starts on Sunday (1)
  10: { length: 30, startWeekday: 3 }, // Dey starts on Tuesday (3)
  11: { length: 30, startWeekday: 5 }, // Bahman starts on Thursday (5)
  12: { length: 29, startWeekday: 0 }  // Esfand starts on Saturday (0)
};

// Check if Jalali Year is Leap
export function isLeapJalaliYear(jy: number): boolean {
  return jy === 1403 || jy === 1407;
}

// Get the number of days in a Jalali month
export function getJalaliMonthLength(jy: number, jm: number): number {
  if (jy === CURRENT_JALALI_YEAR) {
    return MONTH_META_1405[jm].length;
  }
  // Fallbacks
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) return 29;
  return 30;
}

// Converts 1405 Jalali month/day to Gregorian with UTMost precision
export function toGregorian(jy: number, jm: number, jd: number): GregorianDate {
  // Days of months before current month in 1405
  const lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let daysOffset = 0;
  for (let i = 0; i < jm - 1; i++) {
    daysOffset += lengths[i];
  }
  daysOffset += (jd - 1);

  // March 21, 2026 is Farvardin 1, 1405
  const baseDate = new Date(Date.UTC(2026, 2, 21)); // March 21
  baseDate.setUTCDate(baseDate.getUTCDate() + daysOffset);

  return {
    gy: baseDate.getUTCFullYear(),
    gm: baseDate.getUTCMonth() + 1,
    gd: baseDate.getUTCDate()
  };
}

// Convert Gregorian back to Jalali specifically within 1405 context
export function dateToJalali(date: Date): JalaliDate {
  // Target year is strictly 1405
  const cy = date.getFullYear();
  const cm = date.getMonth() + 1;
  const cd = date.getDate();

  // Find day offset from March 21, 2026
  const baseDate = new Date(Date.UTC(2026, 2, 21));
  const currentDate = new Date(Date.UTC(cy, cm - 1, cd));
  
  const diffTime = currentDate.getTime() - baseDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // If before Farvardin 1, 1405, default to Farvardin 1
    return { jy: CURRENT_JALALI_YEAR, jm: 1, jd: 1 };
  }

  // Find month and day
  const lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let remaining = diffDays;
  let jm = 1;
  
  for (let i = 0; i < 12; i++) {
    if (remaining < lengths[i]) {
      jm = i + 1;
      break;
    }
    remaining -= lengths[i];
  }

  if (jm === 12 && remaining >= 29) {
    // Cap at Esfand 29
    return { jy: CURRENT_JALALI_YEAR, jm: 12, jd: 29 };
  }

  return {
    jy: CURRENT_JALALI_YEAR,
    jm,
    jd: remaining + 1
  };
}

// Static Persian Calendar (Solar) Holidays specifically for Jalali Month
export const SOLAR_HOLIDAYS_1405: StaticHoliday[] = [
  { month: 1, day: 1, title: 'آغاز نوروز (تعطیل)', isHoliday: true },
  { month: 1, day: 2, title: 'عید نوروز (تعطیل)', isHoliday: true },
  { month: 1, day: 3, title: 'عید نوروز (تعطیل)', isHoliday: true },
  { month: 1, day: 4, title: 'عید نوروز (تعطیل)', isHoliday: true },
  { month: 1, day: 12, title: 'روز جمهوری اسلامی ایران (تعطیل)', isHoliday: true },
  { month: 1, day: 13, title: 'روز طبیعت / سیزده‌بدر (تعطیل)', isHoliday: true },
  { month: 1, day: 18, title: 'روز جهانی بهداشت', isHoliday: false },
  { month: 1, day: 25, title: 'روز بزرگداشت عطار نیشابوری', isHoliday: false },
  { month: 1, day: 29, title: 'روز ارتش جمهوری اسلامی ایران', isHoliday: false },
  
  { month: 2, day: 1, title: 'روز بزرگداشت سعدی شیرازی', isHoliday: false },
  { month: 2, day: 3, title: 'روز بزرگداشت شیخ بهایی / روز معمار', isHoliday: false },
  { month: 2, day: 10, title: 'روز ملی خلیج فارس', isHoliday: false },
  { month: 2, day: 12, title: 'روز معلم / شهادت مرتضی مطهری', isHoliday: false },
  { month: 2, day: 15, title: 'روز بزرگداشت شیخ کلینی / روز شیراز', isHoliday: false },
  { month: 2, day: 25, title: 'روز بزرگداشت فردوسی', isHoliday: false },
  { month: 2, day: 28, title: 'روز بزرگداشت خیام نیشابوری', isHoliday: false },
  
  { month: 3, day: 1, title: 'روز بزرگداشت ملاصدرا', isHoliday: false },
  { month: 3, day: 3, title: 'فتح خرمشهر / روز مقاومت و ایثار', isHoliday: false },
  { month: 3, day: 14, title: 'رحلت امام خمینی (تعطیل)', isHoliday: true },
  { month: 3, day: 15, title: 'قیام خونین ۱۵ خرداد (تعطیل)', isHoliday: true },
  { month: 3, day: 20, title: 'روز جهانی صنایع دستی', isHoliday: false },
  
  { month: 4, day: 1, title: 'روز اصناف', isHoliday: false },
  { month: 4, day: 7, title: 'شهادت دکتر بهشتی و ۷۲ تن از یارانش (تعطیل)', isHoliday: true },
  { month: 4, day: 10, title: 'روز صنعت و معدن', isHoliday: false },
  { month: 4, day: 14, title: 'روز قلم', isHoliday: false },
  { month: 4, day: 25, title: 'روز بهزیستی و تامین اجتماعی', isHoliday: false },
  
  { month: 5, day: 8, title: 'روز بزرگداشت سهروردی', isHoliday: false },
  { month: 5, day: 14, title: 'صدور فرمان مشروطیت', isHoliday: false },
  { month: 5, day: 17, title: 'روز خبرنگار', isHoliday: false },
  { month: 5, day: 28, title: 'سالروز کودتای ۲۸ مرداد', isHoliday: false },
  
  { month: 6, day: 1, title: 'روز پزشک / بزرگداشت ابن سینا', isHoliday: false },
  { month: 6, day: 4, title: 'روز کارمند', isHoliday: false },
  { month: 6, day: 5, title: 'روز داروساز / بزرگداشت زکریای رازی', isHoliday: false },
  { month: 6, day: 21, title: 'روز ملی سینما', isHoliday: false },
  { month: 6, day: 27, title: 'روز شعر و ادب فارسی / بزرگداشت استاد شهریار', isHoliday: false },
  
  { month: 7, day: 1, title: 'آغاز سال تحصیلی جدید و بازگشایی مدارس', isHoliday: false },
  { month: 7, day: 8, title: 'روز جهانی ناشنوایان / بزرگداشت مولوی', isHoliday: false },
  { month: 7, day: 13, title: 'روز نیروی انتظامی', isHoliday: false },
  { month: 7, day: 16, title: 'روز جهانی کودک', isHoliday: false },
  { month: 7, day: 20, title: 'روز بزرگداشت حافظ شیرازی', isHoliday: false },
  
  { month: 8, day: 8, title: 'روز نوجوان / شهادت محمدحسین فهمیده', isHoliday: false },
  { month: 8, day: 13, title: 'روز دانش‌آموز', isHoliday: false },
  { month: 8, day: 14, title: 'روز فرهنگ عمومی', isHoliday: false },
  { month: 8, day: 24, title: 'روز کتاب و کتابخوانی', isHoliday: false },
  
  { month: 9, day: 5, title: 'روز بسیج مستضعفین', isHoliday: false },
  { month: 9, day: 7, title: 'روز نیروی دریایی', isHoliday: false },
  { month: 9, day: 16, title: 'روز دانشجو', isHoliday: false },
  { month: 9, day: 30, title: 'شب یلدا (شنبه مهر)', isHoliday: false },
  
  { month: 10, day: 5, title: 'روز ملی ایمنی در برابر زلزله', isHoliday: false },
  { month: 10, day: 20, title: 'شهادت امیرکبیر در حمام فین کاشان', isHoliday: false },
  
  { month: 11, day: 12, title: 'آغاز دهه فجر انقلاب اسلامی', isHoliday: false },
  { month: 11, day: 22, title: 'پیروزی انقلاب اسلامی ایران (تعطیل)', isHoliday: true },
  { month: 11, day: 29, title: 'روز سپندارمزگان / روز عشق ایرانی', isHoliday: false },
  
  { month: 12, day: 5, title: 'روز مهندس / بزرگداشت خواجه نصیرالدین طوسی', isHoliday: false },
  { month: 12, day: 15, title: 'روز درختکاری', isHoliday: false },
  { month: 12, day: 29, title: 'روز ملی شدن صنعت نفت ایران (تعطیل)', isHoliday: true }
];

// Hijri Lunar shifted holidays accurately matched onto solar months for solar y1405
export const LUNAR_HOLIDAYS_1405: StaticHoliday[] = [
  { month: 1, day: 1, title: 'تعطیل به مناسبت عید سعید فطر', isHoliday: true },
  { month: 1, day: 24, title: 'شهادت امام جعفر صادق (ع) (تعطیل)', isHoliday: true },
  { month: 3, day: 6, title: 'عید سعید قربان (تعطیل)', isHoliday: true },
  { month: 3, day: 14, title: 'عید سعید غدیر خم (تعطیل)', isHoliday: true },
  { month: 4, day: 3, title: 'تاسوعای حسینی (تعطیل)', isHoliday: true },
  { month: 4, day: 4, title: 'عاشورای حسینی (تعطیل)', isHoliday: true },
  { month: 5, day: 13, title: 'اربعین حسینی (تعطیل)', isHoliday: true },
  { month: 5, day: 21, title: 'رحلت رسول اکرم و شهادت امام حسن مجتبی (ع) (تعطیل)', isHoliday: true },
  { month: 5, day: 23, title: 'شهادت امام رضا (ع) (تعطیل)', isHoliday: true },
  { month: 5, day: 31, title: 'شهادت امام حسن عسکری (ع) (تعطیل)', isHoliday: true },
  { month: 6, day: 10, title: 'میلاد رسول اکرم (ص) و امام جعفر صادق (ع) (تعطیل)', isHoliday: true },
  { month: 7, day: 24, title: 'شهادت حضرت فاطمه زهرا (س) (تعطیل)', isHoliday: true },
  { month: 9, day: 3, title: 'ولادت امام علی (ع) و روز پدر (تعطیل)', isHoliday: true },
  { month: 9, day: 17, title: 'مبعث رسول اکرم (ص) (تعطیل)', isHoliday: true },
  { month: 10, day: 4, title: 'ولادت امام زمان (عج) / نیمه شعبان (تعطیل)', isHoliday: true },
  { month: 11, day: 10, title: 'شهادت امام علی (ع) (تعطیل)', isHoliday: true },
  { month: 11, day: 19, title: 'عید سعید فطر (تعطیل)', isHoliday: true },
  { month: 11, day: 20, title: 'تعطیل به مناسبت عید سعید فطر', isHoliday: true }
];

// Gets all holidays and events for a specific 1405 day
export function getHolidaysForDate(jy: number, jm: number, jd: number): { titles: string[]; isHoliday: boolean } {
  const titles: string[] = [];
  let isHoliday = false;

  // 1. Check Solar Holidays of 1405
  for (const h of SOLAR_HOLIDAYS_1405) {
    if (h.month === jm && h.day === jd) {
      titles.push(h.title);
      if (h.isHoliday) isHoliday = true;
    }
  }

  // 2. Check Lunar Shifted Holidays of 1405
  for (const lh of LUNAR_HOLIDAYS_1405) {
    if (lh.month === jm && lh.day === jd) {
      titles.push(lh.title);
      if (lh.isHoliday) isHoliday = true;
    }
  }

  // 3. Fridays (Jomeh) are official off-days
  const meta = MONTH_META_1405[jm];
  if (meta) {
    const weekday = (meta.startWeekday + jd - 1) % 7;
    if (weekday === 6) { // Friday
      isHoliday = true;
      if (!titles.includes('جمعه / تعطیل پایان هفته')) {
        titles.push('جمعه / تعطیل پایان هفته');
      }
    }
  }

  return { titles, isHoliday };
}

// Builds the grid of 42 cells for Month view of 1405 with absolute precision
export function getMonthDays(jy: number, jm: number): CalendarDay[] {
  const meta = MONTH_META_1405[jm];
  const monthLength = meta.length;
  const startWeekday = meta.startWeekday; // 0 (Sat) to 6 (Fri)
  
  const days: CalendarDay[] = [];

  // Previous month representation
  let prevJm = jm - 1;
  if (prevJm === 0) {
    prevJm = 12; // previous is of 1404
  }
  
  // Previous month length (Esfand of 1404 is 29 days)
  const prevMonthLength = prevJm === 12 ? 29 : MONTH_META_1405[prevJm].length;

  // Pad start with previous month trailing days
  for (let i = startWeekday - 1; i >= 0; i--) {
    const prevJd = prevMonthLength - i;
    const gDate = toGregorian(CURRENT_JALALI_YEAR, prevJm, prevJd);
    const { titles, isHoliday } = getHolidaysForDate(CURRENT_JALALI_YEAR, prevJm, prevJd);
    const weekday = (startWeekday - 1 - i) % 7;

    days.push({
      dayNumber: prevJd,
      jalaliDate: { jy: CURRENT_JALALI_YEAR, jm: prevJm, jd: prevJd },
      gregorianDate: gDate,
      isCurrentMonth: false,
      isToday: false,
      holidays: titles,
      isHoliday,
      weekday,
      eventsCount: 0
    });
  }

  // Current month days
  const todaySolar = dateToJalali(new Date());

  for (let jd = 1; jd <= monthLength; jd++) {
    const gDate = toGregorian(CURRENT_JALALI_YEAR, jm, jd);
    const { titles, isHoliday } = getHolidaysForDate(CURRENT_JALALI_YEAR, jm, jd);
    const weekday = (startWeekday + jd - 1) % 7;

    const isToday = todaySolar.jy === CURRENT_JALALI_YEAR && todaySolar.jm === jm && todaySolar.jd === jd;

    days.push({
      dayNumber: jd,
      jalaliDate: { jy: CURRENT_JALALI_YEAR, jm, jd },
      gregorianDate: gDate,
      isCurrentMonth: true,
      isToday,
      holidays: titles,
      isHoliday,
      weekday,
      eventsCount: 0
    });
  }

  // Pad end with next month leading days to complete standard 42-grid
  const rem = 42 - days.length;
  let nextJm = jm + 1;
  if (nextJm === 13) {
    nextJm = 1;
  }

  for (let jd = 1; jd <= rem; jd++) {
    const gDate = toGregorian(CURRENT_JALALI_YEAR, nextJm, jd);
    const { titles, isHoliday } = getHolidaysForDate(CURRENT_JALALI_YEAR, nextJm, jd);
    const weekday = (days.length) % 7;

    days.push({
      dayNumber: jd,
      jalaliDate: { jy: CURRENT_JALALI_YEAR, jm: nextJm, jd },
      gregorianDate: gDate,
      isCurrentMonth: false,
      isToday: false,
      holidays: titles,
      isHoliday,
      weekday,
      eventsCount: 0
    });
  }

  return days;
}
