import { Island } from '../projects/types';
import { JourneyState, WorkspaceSnapshot, WorkspaceTab, WorkspaceTabId } from './types';

const baseWorkspaceTabs: WorkspaceTab[] = [{
  id: 'cases',
  label: 'تابلوی پرونده‌ها',
  description: 'تمرکز بر مالکیت، ارجاع و هشدار SLA',
  accent: 'from-sky-50 to-indigo-50'
}, {
  id: 'reports',
  label: 'میز گزارش‌گیری',
  description: 'تحلیل کیفیت اجرا و آماده‌سازی خروجی‌ها',
  accent: 'from-orange-50 to-rose-50'
}, {
  id: 'workbench',
  label: 'میز کار',
  description: 'پروژه‌های فعال + مهر و امضای دیجیتال',
  accent: 'from-purple-50 to-blue-50'
}];

export const workspaceTabs: WorkspaceTab[] = [
  baseWorkspaceTabs[0],
  {
    id: 'calendarPath',
    label: 'Ù…Ø³ÛŒØ± ØªÙ‚ÙˆÛŒÙ…ÛŒ',
    description: 'Ù¾ÛŒÚ¯ÛŒØ±ÛŒ Ù…Ø³ÛŒØ± Ø²Ù…Ø§Ù†ÛŒ Ù¾Ø±ÙˆÙ†Ø¯Ù‡â€ŒÙ‡Ø§ÛŒ Ø­ÛŒØ§ØªÛŒ Ùˆ Ù‡Ù…Ø§Ù‡Ù†Ú¯ÛŒ ØªÛŒÙ…â€ŒÙ‡Ø§ÛŒ Ù…ÛŒØ¯Ø§Ù†ÛŒ',
    accent: 'from-cyan-50 to-sky-100'
  },
  ...baseWorkspaceTabs.slice(1)
];

export const workspaceSnapshots = {
  cases: {
    headline: 'اتاق عملیات فنی',
    subline: '۱۲ ارجاع فعال · ۶ پرونده در مسیر اضطراری',
    priority: 'پیش از جلسه عصر، پرونده‌های پرریسک را پایدار و مستند کنید.',
    metrics: [{
      id: 'cases-open',
      label: 'پرونده‌های باز',
      value: '۲۴',
      trend: {
        isPositive: true,
        value: '+۱۲%'
      }
    }, {
      id: 'cases-sla',
      label: 'هشدار SLA',
      value: '۴',
      trend: {
        isPositive: false,
        value: '-۳%'
      }
    }, {
      id: 'cases-handovers',
      label: 'تحویل شیفت',
      value: '۸',
      trend: {
        isPositive: true,
        value: '+۲'
      }
    }],
    reminders: [{
      id: 'cases-1',
      title: 'پروژه بدنه UTN-2045 منتظر تایید طراحی است',
      owner: 'سارا رحیمی',
      due: 'امروز ۱۵:۰۰'
    }, {
      id: 'cases-2',
      title: 'ارسال خلاصه بازرسی برای یگان ۳',
      owner: 'علی محمدی',
      due: 'فردا'
    }, {
      id: 'cases-3',
      title: 'آماده‌سازی گزارش برای تماس مدیران',
      owner: 'فاطمه کریمی',
      due: 'جمعه'
    }]
  },
  reports: {
    headline: 'کنسول بینش',
    subline: 'گزارش کیفیت تکنسین‌ها تا ۱۸ ساعت دیگر مهلت دارد',
    priority: 'نمونه‌ها را تایید و خروجی قابل ارائه به ممیزی آماده کنید.',
    metrics: [{
      id: 'reports-coverage',
      label: 'پوشش نمونه',
      value: '۹۲%',
      trend: {
        isPositive: true,
        value: '+۴%'
      }
    }, {
      id: 'reports-outliers',
      label: 'موارد غیرمعمول',
      value: '۳',
      trend: {
        isPositive: false,
        value: '+۱'
      }
    }, {
      id: 'reports-shares',
      label: 'بسته‌های اشتراک‌گذاری',
      value: '۱۱',
      trend: {
        isPositive: true,
        value: '+۲'
      }
    }],
    reminders: [{
      id: 'reports-1',
      title: 'ضمیمه‌کردن تشخیص‌ها به بسته CAPA',
      owner: 'علی محمدی',
      due: 'امروز ۱۸:۰۰'
    }, {
      id: 'reports-2',
      title: 'انتشار نسخه آماده ممیزی',
      owner: 'فاطمه کریمی',
      due: 'دوشنبه آینده'
    }]
  },
  workbench: {
    headline: 'میز کار دیجیتال',
    subline: '۳ پروژه حساس منتظر مهر و امضا هستند',
    priority: 'چک‌لیست‌ها را تکمیل و مهر AsiaClass را برای پرونده‌های فعال ثبت کنید.',
    metrics: [{
      id: 'workbench-projects',
      label: 'پروژه‌های فعال',
      value: '۳',
      trend: {
        isPositive: true,
        value: '+۱'
      }
    }, {
      id: 'workbench-stamps',
      label: 'مهرهای صادرشده',
      value: '۵',
      trend: {
        isPositive: true,
        value: '+۲'
      }
    }, {
      id: 'workbench-checklists',
      label: 'چک‌لیست تکمیل‌شده',
      value: '۸۶%',
      trend: {
        isPositive: true,
        value: '+۶%'
      }
    }],
    reminders: [{
      id: 'workbench-1',
      title: 'تایید مدارک UTN-2045',
      owner: 'سارا رحیمی',
      due: 'امروز ۱۵:۳۰'
    }, {
      id: 'workbench-2',
      title: 'ثبت امضای دیجیتال UTN-2101',
      owner: 'محمد رضوی',
      due: 'فردا ۰۹:۰۰'
    }]
  }
} as Record<WorkspaceTabId, WorkspaceSnapshot>;

const journeyBase: Island[] = [{
  id: 'intake',
  title: 'دریافت و ارجاع',
  variant: 'light',
  tasks: [{
    id: 'task-assign',
    title: 'ارجاع پرونده ارتعاش بدنه',
    subtitle: 'UTN-2038 · تیم بدنه',
    avatar: 'https://i.pravatar.cc/120?img=21',
    hasCheck: true,
    hasMenu: true
  }, {
    id: 'task-brief',
    title: 'بارگذاری خلاصه مهندسی',
    subtitle: 'یادداشت بازرسی در انتظار',
    avatar: 'https://i.pravatar.cc/120?img=35',
    hasMenu: true
  }, {
    id: 'task-sync',
    title: 'زمان‌بندی جلسه با QA',
    subtitle: 'نیازمند بازه تقویمی',
    avatar: 'https://i.pravatar.cc/120?img=49',
    hasCalendar: true
  }]
}, {
  id: 'execution',
  title: 'اجرای میدانی',
  variant: 'dark',
  tasks: [{
    id: 'task-lab',
    title: 'آزمایشگاه ارتعاش',
    subtitle: 'ماشین‌آلات · بار موتور',
    avatar: 'https://i.pravatar.cc/120?img=14',
    hasCheck: true,
    hasMenu: true
  }, {
    id: 'task-field',
    title: 'صحت‌سنجی میدانی',
    subtitle: 'حوض B · تیم شیفت شب',
    avatar: 'https://i.pravatar.cc/120?img=18',
    hasCalendar: true
  }]
}, {
  id: 'handover',
  title: 'تحویل و بستن پرونده',
  variant: 'light',
  tasks: [{
    id: 'task-recap',
    title: 'تهیه گزارش جمع‌بندی',
    subtitle: 'ارسال برای مدیران',
    avatar: 'https://i.pravatar.cc/120?img=28',
    hasMenu: true
  }, {
    id: 'task-signoff',
    title: 'تایید دیجیتال',
    subtitle: 'منتظر تایید بازبین ارشد',
    avatar: 'https://i.pravatar.cc/120?img=40',
    hasCheck: true
  }]
}];

const cloneIslands = (islands: Island[]): Island[] => islands.map(island => ({
  ...island,
  tasks: island.tasks.map(task => ({ ...task }))
}));

export function createInitialJourneyState(): JourneyState {
  return {
    cases: cloneIslands(journeyBase),
    calendarPath: cloneIslands(journeyBase),
    reports: cloneIslands(journeyBase),
    workbench: cloneIslands(journeyBase)
  };
}

export const workspaceTabsFixed: WorkspaceTab[] = [
  {
    id: 'cases',
    label: 'تابلوی پرونده‌ها',
    description: 'تمرکز بر مالکیت، ارجاع و هشدار SLA',
    accent: 'from-sky-50 to-indigo-50'
  },
  {
    id: 'calendarPath',
    label: 'مسیر تقویمی',
    description:
      'پیگیری مسیر زمانی پرونده‌های حیاتی و هماهنگی تیم‌های میدانی',
    accent: 'from-cyan-50 to-sky-100'
  },
  {
    id: 'reports',
    label: 'میز گزارش‌گیری',
    description: 'تحلیل کیفیت اجرا و آماده‌سازی خروجی‌ها',
    accent: 'from-orange-50 to-rose-50'
  },
  {
    id: 'workbench',
    label: 'میز کار',
    description: 'پروژه‌های فعال + مهر و امضای دیجیتال',
    accent: 'from-purple-50 to-blue-50'
  }
];
