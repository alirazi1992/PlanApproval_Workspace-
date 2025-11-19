import React, {
  useMemo,
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { WorkspaceAppShell } from "../components/layout/WorkspaceAppShell";
import { GlassCard } from "../components/common/GlassCard";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Donut } from "../components/charts/Donut";
import { AreaSpark } from "../components/charts/AreaSpark";
import { mockAvatars } from "../mocks/db";
import {
  WorkspaceProvider,
  useWorkspace,
} from "../features/workspace/WorkspaceContext";
import {
  createInitialJourneyState,
  workspaceSnapshots,
} from "../features/workspace/data";
import { JourneyState, SnapshotReminder } from "../features/workspace/types";
import { Island } from "../features/projects/types";

// 🔹 تقویم شمسی
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

type TimeRange = "today" | "7d" | "30d";

const todayMetrics = [
  {
    id: "total",
    label: "کل گردش امروز",
    value: "۹۴ پرونده",
    helper: "همه فعالیت‌ها",
  },
  {
    id: "urgent",
    label: "ارجاع اضطراری",
    value: "۱۸",
    helper: "نیازمند اقدام فوری",
  },
  {
    id: "active",
    label: "در حال اقدام",
    value: "۳۲",
    helper: "پرونده‌های باز",
  },
  { id: "closed", label: "بسته شده", value: "۴۴", helper: "تحویل و نهایی شده" },
];

const weekMetrics = [
  {
    id: "total",
    label: "کل گردش ۷ روز اخیر",
    value: "۵۴۰ پرونده",
    helper: "همه فعالیت‌ها",
  },
  {
    id: "urgent",
    label: "ارجاع اضطراری",
    value: "۷۴",
    helper: "نیازمند اقدام فوری",
  },
  {
    id: "active",
    label: "در حال اقدام",
    value: "۱۵۸",
    helper: "میانگین روزانه ۲۲",
  },
  {
    id: "closed",
    label: "بسته شده",
    value: "۳۰۸",
    helper: "بسته شده در ۷ روز",
  },
];

const monthMetrics = [
  {
    id: "total",
    label: "کل گردش ۳۰ روز اخیر",
    value: "۲۲۴۰ پرونده",
    helper: "همه فعالیت‌ها",
  },
  {
    id: "urgent",
    label: "ارجاع اضطراری",
    value: "۲۹۶",
    helper: "میانگین روزانه ۱۰",
  },
  {
    id: "active",
    label: "در حال اقدام",
    value: "۵۹۰",
    helper: "پرونده‌های باز فعلی",
  },
  {
    id: "closed",
    label: "بسته شده",
    value: "۱۳۵۴",
    helper: "بسته شده در ۳۰ روز",
  },
];

const metricsByRange: Record<TimeRange, typeof todayMetrics> = {
  today: todayMetrics,
  "7d": weekMetrics,
  "30d": monthMetrics,
};

const quickStats = [
  {
    id: "sla",
    label: "پوشش SLA امروز",
    value: "۹۲٪",
    change: "+۴٪",
    tone: "positive" as const,
  },
  {
    id: "handover",
    label: "تحویل‌های موفق",
    value: "۱۲",
    change: "+۲",
    tone: "positive" as const,
  },
  {
    id: "alerts",
    label: "هشدارهای فعال",
    value: "۶",
    change: "-۱",
    tone: "positive" as const,
  },
  {
    id: "backlog",
    label: "پرونده‌های معوق",
    value: "۸",
    change: "+۳",
    tone: "negative" as const,
  },
];

const donutToday = [
  { label: "بازرسی میدانی", value: 32, color: "#2563eb" },
  { label: "تحلیل آزمایشگاهی", value: 18, color: "#0ea5e9" },
  { label: "مستندسازی", value: 26, color: "#f97316" },
  { label: "سایر فعالیت‌ها", value: 18, color: "#10b981" },
];

const donutWeek = [
  { label: "بازرسی میدانی", value: 180, color: "#2563eb" },
  { label: "تحلیل آزمایشگاهی", value: 110, color: "#0ea5e9" },
  { label: "مستندسازی", value: 130, color: "#f97316" },
  { label: "سایر فعالیت‌ها", value: 120, color: "#10b981" },
];

const donutMonth = [
  { label: "بازرسی میدانی", value: 720, color: "#2563eb" },
  { label: "تحلیل آزمایشگاهی", value: 430, color: "#0ea5e9" },
  { label: "مستندسازی", value: 520, color: "#f97316" },
  { label: "سایر فعالیت‌ها", value: 570, color: "#10b981" },
];

const donutByRange: Record<TimeRange, typeof donutToday> = {
  today: donutToday,
  "7d": donutWeek,
  "30d": donutMonth,
};

const sparkToday = [42, 50, 64, 58, 71, 69, 82, 88, 93, 90, 97, 103];
const sparkWeek = [380, 410, 430, 460, 480, 500, 540, 560, 590, 610, 640, 670];
const sparkMonth = [
  1200, 1400, 1500, 1600, 1700, 1800, 1900, 2050, 2150, 2200, 2300, 2400,
];

const sparkByRange: Record<TimeRange, number[]> = {
  today: sparkToday,
  "7d": sparkWeek,
  "30d": sparkMonth,
};

const priorityTasks = [
  {
    id: "alert-1",
    title: "پروژه بدنه UTN-2045 منتظر تایید طراحی است",
    owner: "سارا رحیمی",
    due: "امروز · ۱۵:۰۰",
  },
  {
    id: "alert-2",
    title: "ارسال خلاصه بازرسی برای یگان ۳",
    owner: "علی محمدی",
    due: "فردا · ۱۰:۳۰",
  },
  {
    id: "alert-3",
    title: "آماده‌سازی گزارش برای تماس مدیران",
    owner: "فاطمه کریمی",
    due: "جمعه · ۰۹:۰۰",
  },
];

type CollabCalendarEvent = {
  id: string;
  day: number;
  label: string;
  channel: string;
  accent: string;
  badgeClass: string;
};

type CollabBoardItem = {
  id: string;
  utn: string;
  title: string;
  owner: string;
  status: string;
  statusClass: string;
  location: string;
  due: string;
  channel: string;
};

type CollabActionItem = {
  id: string;
  title: string;
  owner: string;
  due: string;
  channel: string;
  badgeClass: string;
};

type CollabTeamStream = {
  id: string;
  title: string;
  focus: string;
  owner: string;
  progress: number;
  progressClass: string;
  channel: string;
};

type CollabQuickLink = {
  id: string;
  title: string;
  detail: string;
  badge: string;
  badgeClass: string;
};

type FeatureHighlight = {
  id: string;
  label: string;
  value: string;
  tone?: "positive" | "warning" | "negative";
  helper?: string;
};

type FeatureChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  note?: string;
};

type FeatureAction = {
  id: string;
  label: string;
  helper?: string;
  intent?: "primary" | "secondary" | "ghost";
};

type FeatureEvent = {
  id: string;
  title: string;
  detail: string;
  time?: string;
};

type FeatureDetail = {
  summary: string;
  highlights: FeatureHighlight[];
  checklist: FeatureChecklistItem[];
  actions: FeatureAction[];
  events?: FeatureEvent[];
};

type ProjectFeatureDetails = Record<string, Record<string, FeatureDetail>>;

type FeatureChecklistState = Record<
  string,
  Record<string, Record<string, boolean>>
>;

type ProjectWorkspaceProject = {
  id: string;
  utn: string;
  title: string;
  owner: string;
  vessel: string;
  location: string;
  port: string;
  focus: string;
  due: string;
  progress: number;
  capa: string;
  risk: string;
  features: { id: string; label: string; helper: string; count?: number }[];
  callouts: { id: string; label: string; detail: string }[];
};

const initialCollabCalendarEvents: CollabCalendarEvent[] = [
  {
    id: "cal-23-1",
    day: 23,
    label: "واکشی کابل بدنه",
    channel: "میدانی",
    accent: "border-emerald-200 bg-emerald-50/50",
    badgeClass: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    id: "cal-24-1",
    day: 24,
    label: "بازرسی مشترک QA",
    channel: "QA",
    accent: "border-slate-200 bg-slate-50/70",
    badgeClass: "border border-slate-200 bg-white text-slate-700",
  },
  {
    id: "cal-25-1",
    day: 25,
    label: "جلسه هماهنگی پمپ",
    channel: "هماهنگی",
    accent: "border-blue-200 bg-blue-50/70",
    badgeClass: "border border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    id: "cal-25-2",
    day: 25,
    label: "تحویل فاز اول",
    channel: "مدیریت",
    accent: "border-amber-200 bg-amber-50/70",
    badgeClass: "border border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    id: "cal-27-1",
    day: 27,
    label: "تست میدانی الکتریک",
    channel: "کارگاه",
    accent: "border-indigo-200 bg-indigo-50/70",
    badgeClass: "border border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  {
    id: "cal-28-1",
    day: 28,
    label: "همایش بهره‌بردار",
    channel: "بهره‌بردار",
    accent: "border-rose-200 bg-rose-50/70",
    badgeClass: "border border-rose-200 bg-rose-50 text-rose-700",
  },
  {
    id: "cal-29-1",
    day: 29,
    label: "به‌روزرسانی مستندات",
    channel: "مستندسازی",
    accent: "border-purple-200 bg-purple-50/70",
    badgeClass: "border border-purple-200 bg-purple-50 text-purple-700",
  },
];

const initialCollabBoardItems: CollabBoardItem[] = [
  {
    id: "board-1",
    utn: "UTN-2045",
    title: "بدنه · لرزش غیرعادی",
    owner: "ندا شریفی",
    status: "در جریان",
    statusClass: "bg-blue-50 text-blue-700 border-blue-200",
    location: "عرشه A / اسکله ۳",
    due: "امروز · ۱۴:۳۰",
    channel: "میدانی",
  },
  {
    id: "board-2",
    utn: "UTN-1980",
    title: "نشت روغن · پایش آنلاین",
    owner: "محمد رضوی",
    status: "در انتظار QA",
    statusClass: "bg-amber-50 text-amber-700 border-amber-200",
    location: "اتاق ماشین‌آلات",
    due: "امروز · ۱۷:۰۰",
    channel: "کنترل کیفیت",
  },
  {
    id: "board-3",
    utn: "UTN-2101",
    title: "بارگیری بردهای الکتریک",
    owner: "مهدی سلیمانی",
    status: "آماده ارسال",
    statusClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    location: "کارگاه مرکزی",
    due: "فردا · ۰۹:۳۰",
    channel: "کارگاه",
  },
  {
    id: "board-4",
    utn: "UTN-1766",
    title: "تکمیل مستندات سیستم عمومی",
    owner: "فاطمه کریمی",
    status: "نیازمند اطلاعات",
    statusClass: "bg-rose-50 text-rose-600 border-rose-200",
    location: "اتاق داده ایمن",
    due: "فردا · ۱۲:۰۰",
    channel: "مستندسازی",
  },
];

const initialCollabActionItems: CollabActionItem[] = [
  {
    id: "action-1",
    title: "ارسال گزارش لرزش به QA",
    owner: "ندا شریفی",
    due: "۲ ساعت دیگر",
    channel: "QA",
    badgeClass: "bg-rose-50 text-rose-600 border-rose-100",
  },
  {
    id: "action-2",
    title: "هم‌رسانی نقشه‌های اصلاحی",
    owner: "محمد رضوی",
    due: "پیش از پایان شیفت",
    channel: "کارگاه",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    id: "action-3",
    title: "به‌روزرسانی وضعیت در برد مدیران",
    owner: "مهدی سلیمانی",
    due: "تا ساعت ۲۰",
    channel: "داشبورد مدیران",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-100",
  },
];

const collabTeamStreams: CollabTeamStream[] = [
  {
    id: "stream-body",
    title: "هماهنگی بدنه",
    focus: "کابل‌کشی + تست لرزش",
    owner: "سارا رحیمی",
    progress: 72,
    progressClass: "bg-emerald-400",
    channel: "میدانی",
  },
  {
    id: "stream-electric",
    title: "شبکه الکتریک",
    focus: "بردهای کنترل و نرم‌افزار",
    owner: "مهدی سلیمانی",
    progress: 58,
    progressClass: "bg-indigo-400",
    channel: "کارگاه",
  },
  {
    id: "stream-field",
    title: "میدانی و بهره‌بردار",
    focus: "جلسات حضوری + هماهنگی QA",
    owner: "ندا شریفی",
    progress: 81,
    progressClass: "bg-blue-400",
    channel: "کنترل کیفیت",
  },
];

const collabQuickLinks: CollabQuickLink[] = [
  {
    id: "quick-1",
    title: "دعوت از QA برای تحویل مشترک",
    detail: " ارسال لینک جلسه آنلاین + یادآور SMS",
    badge: "QA",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    id: "quick-2",
    title: "اشتراک نقشه اصلاحی بدنه",
    detail: "اتاق داده ایمن · PDF + DWG",
    badge: "Data Room",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    id: "quick-3",
    title: "ارسال وضعیت برای مدیر پروژه",
    detail: "داشبورد مدیران · گزارش لحظه‌ای",
    badge: "مدیریت",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-100",
  },
];



const projectWorkspaceProjects: ProjectWorkspaceProject[] = [
  {
    id: "utn-2045-workbench",
    utn: "UTN-2045",
    title: "بدنه کشتی آذرین · نسخه ۳ نقشه",
    owner: "ندا شریفی",
    vessel: "Azarin Class",
    location: "اسکله شهید بهشتی، چابهار",
    port: "چابهار",
    focus: "بازرسی بدنه + هم‌ترازی سازه",
    due: "امروز · ۱۷:۳۰",
    progress: 68,
    capa: "CAPA-311 در حال اقدام",
    risk: "ریسک لرزش ۲.۱g",
    features: [
      { id: "overview", label: "نمای کلی", helper: "طرح + وضعیت لحظه‌ای" },
      { id: "docs", label: "مدارک", helper: "DWG + PDF مهر شده", count: 4 },
      { id: "inspections", label: "بازرسی‌ها", helper: "Field + Lab", count: 1 },
      { id: "certificates", label: "گواهینامه‌ها", helper: "آماده‌سازی", count: 0 },
      { id: "stamps", label: "مهرها", helper: "AsiaClass Digital", count: 0 },
      { id: "capa", label: "CAPA", helper: "اقدام اصلاحی", count: 1 },
    ],
    callouts: [
      { id: "bulkhead", label: "عرشه A3", detail: "انحراف ۱.۴ میلی‌متر" },
      { id: "keel", label: "کیـل مرکزی", detail: "نیازمند تقویت جوش" },
      { id: "sensor", label: "سنسور لرزش", detail: "کالیبراسیون تا ۱۸:۰۰" },
      { id: "docs", label: "DWG", detail: "نسخه ۳ · ۴ پیوست" },
    ],
  },
  {
    id: "utn-1980-workbench",
    utn: "UTN-1980",
    title: "تحلیل نشتی سیستم روغن",
    owner: "محمد رضوی",
    vessel: "Negin Service Vessel",
    location: "اتاق ماشین‌آلات · اسکله کیش",
    port: "کیش",
    focus: "بازرسی میدانی + تحلیل آزمایشگاه",
    due: "فردا · ۰۹:۴۵",
    progress: 54,
    capa: "CAPA-118 تایید شده",
    risk: "ریسک آلودگی ۱.۸٪",
    features: [
      { id: "overview", label: "نمای کلی", helper: "روند فشار + دما" },
      { id: "docs", label: "مدارک", helper: "گزارش تست آزمایشگاه", count: 6 },
      { id: "inspections", label: "بازرسی‌ها", helper: "UT/MT", count: 2 },
      { id: "certificates", label: "گواهینامه‌ها", helper: "در انتظار QA", count: 1 },
      { id: "stamps", label: "مهرها", helper: "AsiaClass", count: 1 },
      { id: "capa", label: "CAPA", helper: "۲ اقدام اصلاحی", count: 2 },
    ],
    callouts: [
      { id: "valve", label: "شیر تغذیه", detail: "ΔP = ۰.۷ بار" },
      { id: "pump", label: "پمپ A2", detail: "نیازمند آب‌بندی" },
      { id: "lab", label: "نمونه آزمایش", detail: "ارسال به تهران" },
      { id: "doc", label: "CAPA", detail: "دو گام باز" },
    ],
  },
  {
    id: "utn-2101-workbench",
    utn: "UTN-2101",
    title: "شبکه الکتریک و اتوماسیون",
    owner: "مهدی سلیمانی",
    vessel: "Pars Offshore",
    location: "کارگاه مرکزی · اتاق کنترل",
    port: "بندرعباس",
    focus: "نقشه‌برداری کابل + تایید نرم‌افزار",
    due: "فردا · ۱۵:۲۰",
    progress: 81,
    capa: "CAPA-412 بسته شد",
    risk: "ریسک تاخیر نرم‌افزاری",
    features: [
      { id: "overview", label: "نمای کلی", helper: "کابل‌کشی + نرم‌افزار" },
      { id: "docs", label: "مدارک", helper: "بسته دیجیتال", count: 5 },
      { id: "inspections", label: "بازرسی‌ها", helper: "QA مشترک", count: 1 },
      { id: "certificates", label: "گواهینامه‌ها", helper: "ارسال به Asiaclass", count: 1 },
      { id: "stamps", label: "مهرها", helper: "دیجیتال", count: 2 },
      { id: "capa", label: "CAPA", helper: "در انتظار تایید", count: 0 },
    ],
    callouts: [
      { id: "panel", label: "تابلو 1C", detail: "Firmware v5.4" },
      { id: "cable", label: "کابل مسیر C", detail: "۷۵٪ نصب" },
      { id: "test", label: "تست عایقی", detail: "نتیجه > ۹۸٪" },
      { id: "stamp", label: "مهر دیجیتال", detail: "۲ نسخه" },
    ],
  },
];

const projectFeatureDetails: ProjectFeatureDetails = {
  "utn-2045-workbench": {
    overview: {
      summary:
        "بازرسی بدنه در فاز سوم قرار دارد و تمرکز اصلی روی هم‌ترازی سازه و تایید سنسورهای لرزش است.",
      highlights: [
        {
          id: "utn2045-overview-progress",
          label: "پیشرفت",
          value: "۶۸٪",
          tone: "positive",
          helper: "براساس جدول پروژه",
        },
        {
          id: "utn2045-overview-risk",
          label: "ریسک لرزش",
          value: "۲.۱g",
          tone: "warning",
          helper: "حد آستانه ۲.۵g",
        },
        {
          id: "utn2045-overview-capa",
          label: "CAPA-311",
          value: "۲ گام باز",
          helper: "در حال اقدام",
        },
      ],
      checklist: [
        {
          id: "utn2045-overview-check-1",
          label: "تایید نسخه ۳ نقشه در اتاق داده",
          done: true,
          note: "امضا شده توسط QA",
        },
        {
          id: "utn2045-overview-check-2",
          label: "ثبت قرائت حسگر لرزش (۴ نمونه)",
          done: false,
          note: "۲ نمونه باقی‌مانده",
        },
        {
          id: "utn2045-overview-check-3",
          label: "هماهنگی بازدید با بهره‌بردار",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn2045-overview-action-1",
          label: "ارسال Snapshot به مدیر پروژه",
          helper: "PDF + نمودار",
          intent: "primary",
        },
        {
          id: "utn2045-overview-action-2",
          label: "درخواست جلسه AsiaClass",
          helper: "هماهنگی آنلاین",
          intent: "secondary",
        },
      ],
    },
    docs: {
      summary: "۴ سند مهرشده و آماده استفاده در اختیار تیم قرار دارد.",
      highlights: [
        {
          id: "utn2045-docs-dwg",
          label: "DWG",
          value: "۲ نسخه",
          helper: "نسخه ۳",
        },
        {
          id: "utn2045-docs-pdf",
          label: "PDF",
          value: "۲ فایل",
          tone: "positive",
          helper: "مهرشده",
        },
        {
          id: "utn2045-docs-log",
          label: "LOG",
          value: "آخرین ۲۴س",
          helper: "به‌روزرسانی شد",
        },
      ],
      checklist: [
        {
          id: "utn2045-docs-check-1",
          label: "بازبینی PDF مهر شده",
          done: true,
        },
        {
          id: "utn2045-docs-check-2",
          label: "آپلود نسخه DWG در اتاق داده",
          done: true,
        },
        {
          id: "utn2045-docs-check-3",
          label: "الحاق لاگ QA به بسته مدارک",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn2045-docs-action-1",
          label: "آپلود فایل جدید",
          helper: "Drag & Drop",
          intent: "primary",
        },
        {
          id: "utn2045-docs-action-2",
          label: "اشتراک در اتاق داده ایمن",
          helper: "لینک ۷۲ ساعته",
          intent: "secondary",
        },
      ],
    },
    inspections: {
      summary: "یک بازرسی میدانی تکمیل شده و گزارش آزمایشگاهی در حال تهیه است.",
      highlights: [
        {
          id: "utn2045-inspection-field",
          label: "Field",
          value: "۱/۲",
          helper: "بازدید امروز",
        },
        {
          id: "utn2045-inspection-lab",
          label: "Lab",
          value: "در حال تحلیل",
          tone: "warning",
        },
        {
          id: "utn2045-inspection-owner",
          label: "مسئول",
          value: "ندا شریفی",
        },
      ],
      checklist: [
        {
          id: "utn2045-inspection-check-1",
          label: "ثبت عکس‌های لرزش در پورتال",
          done: true,
        },
        {
          id: "utn2045-inspection-check-2",
          label: "ارسال نمونه فلز به آزمایشگاه",
          done: false,
          note: "Pickup ساعت ۱۶",
        },
        {
          id: "utn2045-inspection-check-3",
          label: "به‌روزرسانی نتایج در CAPA",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn2045-inspection-action-1",
          label: "ثبت گزارش میدانی",
          helper: "فرم ۱۲ سطری",
        },
        {
          id: "utn2045-inspection-action-2",
          label: "دعوت از QA",
          helper: "جلسه مشترک",
          intent: "secondary",
        },
      ],
    },
    certificates: {
      summary: "گواهینامه نهایی هنوز صادر نشده و مدارک در انتظار تایید AsiaClass است.",
      highlights: [
        {
          id: "utn2045-cert-status",
          label: "وضعیت",
          value: "در انتظار",
          tone: "warning",
        },
        {
          id: "utn2045-cert-owner",
          label: "مسئول",
          value: "دفتر فنی",
        },
        {
          id: "utn2045-cert-deadline",
          label: "مهلت",
          value: "۳ روز",
        },
      ],
      checklist: [
        {
          id: "utn2045-cert-check-1",
          label: "بررسی ترجمه رسمی",
          done: true,
        },
        {
          id: "utn2045-cert-check-2",
          label: "الحاق مهر دیجیتال به بسته",
          done: false,
        },
        {
          id: "utn2045-cert-check-3",
          label: "ارسال درخواست به AsiaClass",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn2045-cert-action-1",
          label: "ثبت درخواست تایید",
          helper: "AsiaClass Portal",
          intent: "primary",
        },
        {
          id: "utn2045-cert-action-2",
          label: "به‌روزرسانی وضعیت در داشبورد",
          intent: "ghost",
        },
      ],
    },
    stamps: {
      summary: "مهر دیجیتال برای نسخه ۳ هنوز فعال نشده و نیاز به تایید سرپرست دارد.",
      highlights: [
        {
          id: "utn2045-stamp-need",
          label: "مهر موردنیاز",
          value: "۱",
          tone: "warning",
        },
        {
          id: "utn2045-stamp-ready",
          label: "نسخه آماده",
          value: "DWG v3",
        },
        {
          id: "utn2045-stamp-signer",
          label: "تکنسین",
          value: "ندا شریفی",
        },
      ],
      checklist: [
        {
          id: "utn2045-stamp-check-1",
          label: "بررسی آخرین تغییرات نقشه",
          done: true,
        },
        {
          id: "utn2045-stamp-check-2",
          label: "هماهنگی امضا با دفتر QA",
          done: false,
        },
        {
          id: "utn2045-stamp-check-3",
          label: "تایید دو مرحله‌ای در AsiaClass",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn2045-stamp-action-1",
          label: "فعال‌سازی مهر دیجیتال",
          intent: "primary",
        },
        {
          id: "utn2045-stamp-action-2",
          label: "ارسال برای امضای فنی",
          intent: "secondary",
        },
      ],
    },
    capa: {
      summary: "CAPA-311 دو اقدام باز دارد و باید تا پایان امروز به‌روزرسانی شود.",
      highlights: [
        {
          id: "utn2045-capa-open",
          label: "اقدام باز",
          value: "۲",
          tone: "warning",
        },
        {
          id: "utn2045-capa-owner",
          label: "مالک",
          value: "سارا رحیمی",
        },
        {
          id: "utn2045-capa-due",
          label: "موعد",
          value: "امروز",
        },
      ],
      checklist: [
        {
          id: "utn2045-capa-check-1",
          label: "تکمیل فرم CAPA در سیستم",
          done: true,
        },
        {
          id: "utn2045-capa-check-2",
          label: "اتصال شواهد تصویری",
          done: false,
        },
        {
          id: "utn2045-capa-check-3",
          label: "تایید نهایی توسط مدیر کیفیت",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn2045-capa-action-1",
          label: "به‌روزرسانی وضعیت CAPA",
          intent: "primary",
        },
        {
          id: "utn2045-capa-action-2",
          label: "اشتراک با تیم بهره‌بردار",
          intent: "ghost",
        },
      ],
    },
  },
  "utn-1980-workbench": {
    overview: {
      summary:
        "تحلیل نشتی سیستم روغن با تمرکز بر داده‌های فشار و دما ادامه دارد و تیم QA منتظر نتیجه آزمایش است.",
      highlights: [
        {
          id: "utn1980-overview-progress",
          label: "پیشرفت",
          value: "۵۴٪",
          tone: "warning",
          helper: "نیازمند تسریع",
        },
        {
          id: "utn1980-overview-risk",
          label: "ریسک آلودگی",
          value: "۱.۸٪",
        },
        {
          id: "utn1980-overview-capa",
          label: "CAPA-118",
          value: "بسته شد",
          tone: "positive",
        },
      ],
      checklist: [
        {
          id: "utn1980-overview-check-1",
          label: "بررسی لاگ فشار آنلاین",
          done: true,
        },
        {
          id: "utn1980-overview-check-2",
          label: "هماهنگی تیم کارگاه برای تعویض اورینگ",
          done: false,
        },
        {
          id: "utn1980-overview-check-3",
          label: "جمع‌بندی برای ارسال به QA",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn1980-overview-action-1",
          label: "ثبت یادداشت میدانی",
          intent: "primary",
        },
        {
          id: "utn1980-overview-action-2",
          label: "هم‌رسانی وضعیت با مشتری",
          intent: "secondary",
        },
      ],
    },
    docs: {
      summary: "۶ سند تحلیلی شامل گزارش تست و عکس‌ها در پوشه پروژه موجود است.",
      highlights: [
        {
          id: "utn1980-docs-lab",
          label: "Lab",
          value: "۳ پیوست",
        },
        {
          id: "utn1980-docs-photos",
          label: "عکس",
          value: "۱۲ فایل",
          tone: "positive",
        },
        {
          id: "utn1980-docs-capalog",
          label: "CAPA",
          value: "۲ لینک",
        },
      ],
      checklist: [
        {
          id: "utn1980-docs-check-1",
          label: "آپلود عکس اورینگ",
          done: true,
        },
        {
          id: "utn1980-docs-check-2",
          label: "تطبیق گزارش فشار با سنسور",
          done: false,
        },
        {
          id: "utn1980-docs-check-3",
          label: "بررسی مهر AsiaClass",
          done: true,
        },
      ],
      actions: [
        {
          id: "utn1980-docs-action-1",
          label: "ارسال بسته مستندات",
          intent: "primary",
        },
        {
          id: "utn1980-docs-action-2",
          label: "باز کردن در اتاق داده",
          intent: "secondary",
        },
      ],
    },
    inspections: {
      summary: "دو بازرسی UT/MT برنامه‌ریزی شده و یکی از آنها تکمیل شده است.",
      highlights: [
        {
          id: "utn1980-inspection-ut",
          label: "UT",
          value: "۱/۲",
        },
        {
          id: "utn1980-inspection-mt",
          label: "MT",
          value: "برنامه‌ریزی",
          tone: "warning",
        },
        {
          id: "utn1980-inspection-tech",
          label: "تکنسین",
          value: "محمد رضوی",
        },
      ],
      checklist: [
        {
          id: "utn1980-inspection-check-1",
          label: "هماهنگی با آزمایشگاه سیار",
          done: true,
        },
        {
          id: "utn1980-inspection-check-2",
          label: "ثبت لاگ دمای سیال",
          done: false,
        },
        {
          id: "utn1980-inspection-check-3",
          label: "به‌روزرسانی فرم MT",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn1980-inspection-action-1",
          label: "افزودن نتیجه جدید",
          intent: "primary",
        },
        {
          id: "utn1980-inspection-action-2",
          label: "اشتراک با QA",
          intent: "ghost",
        },
      ],
    },
    certificates: {
      summary: "یک گواهینامه آماده و در انتظار تایید QA برای انتشار است.",
      highlights: [
        {
          id: "utn1980-cert-ready",
          label: "تعداد",
          value: "۱",
          tone: "positive",
        },
        {
          id: "utn1980-cert-status",
          label: "وضعیت",
          value: "QA",
        },
        {
          id: "utn1980-cert-due",
          label: "مهلت",
          value: "فردا",
        },
      ],
      checklist: [
        {
          id: "utn1980-cert-check-1",
          label: "پیوست مهر دیجیتال",
          done: true,
        },
        {
          id: "utn1980-cert-check-2",
          label: "بازبینی ترجمه",
          done: false,
        },
        {
          id: "utn1980-cert-check-3",
          label: "ارسال برای مشتری",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn1980-cert-action-1",
          label: "درخواست تایید QA",
          intent: "primary",
        },
        {
          id: "utn1980-cert-action-2",
          label: "دانلود PDF مهرشده",
          intent: "secondary",
        },
      ],
    },
    stamps: {
      summary: "یک مهر دیجیتال قبلاً ثبت شده و نسخه دوم در صف تایید است.",
      highlights: [
        {
          id: "utn1980-stamp-count",
          label: "مهر فعال",
          value: "۱",
          tone: "positive",
        },
        {
          id: "utn1980-stamp-pending",
          label: "در انتظار",
          value: "۱",
          tone: "warning",
        },
        {
          id: "utn1980-stamp-signer",
          label: "امضاکننده",
          value: "محمد رضوی",
        },
      ],
      checklist: [
        {
          id: "utn1980-stamp-check-1",
          label: "تایید تغییرات نقشه",
          done: true,
        },
        {
          id: "utn1980-stamp-check-2",
          label: "هماهنگی با AsiaClass",
          done: false,
        },
        {
          id: "utn1980-stamp-check-3",
          label: "ثبت امضای سرپرست",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn1980-stamp-action-1",
          label: "افزودن مهر جدید",
          intent: "primary",
        },
        {
          id: "utn1980-stamp-action-2",
          label: "پیگیری تایید",
          intent: "ghost",
        },
      ],
    },
    capa: {
      summary: "دو اقدام اصلاحی برای پایش نشتی بسته شده و گزارش تکمیلی باید بارگذاری شود.",
      highlights: [
        {
          id: "utn1980-capa-count",
          label: "اقدام",
          value: "۲",
          tone: "positive",
        },
        {
          id: "utn1980-capa-status",
          label: "وضعیت",
          value: "تایید شد",
        },
        {
          id: "utn1980-capa-report",
          label: "گزارش",
          value: "در حال تهیه",
          tone: "warning",
        },
      ],
      checklist: [
        {
          id: "utn1980-capa-check-1",
          label: "به‌روزرسانی عکس قبل/بعد",
          done: true,
        },
        {
          id: "utn1980-capa-check-2",
          label: "ثبت تایید مدیر پروژه",
          done: false,
        },
        {
          id: "utn1980-capa-check-3",
          label: "ارسال گزارش به مشتری",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn1980-capa-action-1",
          label: "تکمیل گزارش CAPA",
          intent: "primary",
        },
        {
          id: "utn1980-capa-action-2",
          label: "به اشتراک‌گذاری در اتاق داده",
          intent: "secondary",
        },
      ],
    },
  },
  "utn-2101-workbench": {
    overview: {
      summary:
        "پروژه شبکه الکتریک در فاز پایانی قرار دارد و تمرکز روی تایید نرم‌افزار و کابل‌کشی مسیر C است.",
      highlights: [
        {
          id: "utn2101-overview-progress",
          label: "پیشرفت",
          value: "۸۱٪",
          tone: "positive",
        },
        {
          id: "utn2101-overview-risk",
          label: "ریسک نرم‌افزار",
          value: "تاخیر",
          tone: "warning",
        },
        {
          id: "utn2101-overview-owner",
          label: "مالک",
          value: "مهدی سلیمانی",
        },
      ],
      checklist: [
        {
          id: "utn2101-overview-check-1",
          label: "تکمیل تست کابل مسیر C",
          done: true,
        },
        {
          id: "utn2101-overview-check-2",
          label: "مرور Firmware v5.4",
          done: false,
        },
        {
          id: "utn2101-overview-check-3",
          label: "هماهنگی با تیم نرم‌افزار",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn2101-overview-action-1",
          label: "ارسال وضعیت به مدیریت",
          intent: "primary",
        },
        {
          id: "utn2101-overview-action-2",
          label: "رزرو جلسه تست نرم‌افزار",
          intent: "secondary",
        },
      ],
    },
    docs: {
      summary: "۵ سند دیجیتال شامل نقشه کابل، چک‌لیست QA و فایل Firmware آماده است.",
      highlights: [
        {
          id: "utn2101-docs-cable",
          label: "نقشه کابل",
          value: "۲ فایل",
        },
        {
          id: "utn2101-docs-qa",
          label: "QA",
          value: "۱ چک‌لیست",
        },
        {
          id: "utn2101-docs-fw",
          label: "Firmware",
          value: "v5.4",
          tone: "warning",
        },
      ],
      checklist: [
        {
          id: "utn2101-docs-check-1",
          label: "آپلود نسخه جدید Firmware",
          done: false,
        },
        {
          id: "utn2101-docs-check-2",
          label: "ضمیمه چک‌لیست QA",
          done: true,
        },
        {
          id: "utn2101-docs-check-3",
          label: "بررسی دسترسی AsiaClass",
          done: true,
        },
      ],
      actions: [
        {
          id: "utn2101-docs-action-1",
          label: "باز کردن در اتاق داده",
          intent: "primary",
        },
        {
          id: "utn2101-docs-action-2",
          label: "ارسال برای تایید QA",
          intent: "secondary",
        },
      ],
    },
    inspections: {
      summary: "یک بازرسی QA مشترک انجام شده و نتیجه نهایی در انتظار امضا است.",
      highlights: [
        {
          id: "utn2101-inspection-qa",
          label: "QA",
          value: "۱",
          tone: "positive",
        },
        {
          id: "utn2101-inspection-field",
          label: "Field",
          value: "۰",
        },
        {
          id: "utn2101-inspection-status",
          label: "وضعیت",
          value: "در انتظار امضا",
          tone: "warning",
        },
      ],
      checklist: [
        {
          id: "utn2101-inspection-check-1",
          label: "جمع‌آوری عکس تابلو 1C",
          done: true,
        },
        {
          id: "utn2101-inspection-check-2",
          label: "تایید نتایج تست عایقی",
          done: true,
        },
        {
          id: "utn2101-inspection-check-3",
          label: "ثبت امضای مشترک QA",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn2101-inspection-action-1",
          label: "ارسال گزارش QA",
          intent: "primary",
        },
        {
          id: "utn2101-inspection-action-2",
          label: "ثبت یادداشت جدید",
          intent: "ghost",
        },
      ],
    },
    certificates: {
      summary: "گواهینامه نرم‌افزاری در حال آماده‌سازی و نیازمند آخرین آزمون است.",
      highlights: [
        {
          id: "utn2101-cert-count",
          label: "تعداد",
          value: "۱",
        },
        {
          id: "utn2101-cert-status",
          label: "وضعیت",
          value: "در حال تهیه",
          tone: "warning",
        },
        {
          id: "utn2101-cert-due",
          label: "موعد",
          value: "۵ روز",
        },
      ],
      checklist: [
        {
          id: "utn2101-cert-check-1",
          label: "تکمیل تست نرم‌افزار",
          done: false,
        },
        {
          id: "utn2101-cert-check-2",
          label: "پیگیری امضا از AsiaClass",
          done: false,
        },
        {
          id: "utn2101-cert-check-3",
          label: "ضمیمه گزارش QA",
          done: true,
        },
      ],
      actions: [
        {
          id: "utn2101-cert-action-1",
          label: "ایجاد پیش‌نویس گواهینامه",
          intent: "primary",
        },
        {
          id: "utn2101-cert-action-2",
          label: "ارسال به AsiaClass",
          intent: "secondary",
        },
      ],
    },
    stamps: {
      summary: "دو مهر دیجیتال برای نسخه‌های Firmware فعال است و نسخه سوم در صف تایید قرار دارد.",
      highlights: [
        {
          id: "utn2101-stamp-active",
          label: "مهر فعال",
          value: "۲",
          tone: "positive",
        },
        {
          id: "utn2101-stamp-pending",
          label: "در انتظار",
          value: "۱",
          tone: "warning",
        },
        {
          id: "utn2101-stamp-owner",
          label: "مسئول",
          value: "مهدی سلیمانی",
        },
      ],
      checklist: [
        {
          id: "utn2101-stamp-check-1",
          label: "بررسی Firmware v5.4",
          done: true,
        },
        {
          id: "utn2101-stamp-check-2",
          label: "هماهنگی با تیم QA",
          done: true,
        },
        {
          id: "utn2101-stamp-check-3",
          label: "ارسال برای امضای AsiaClass",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn2101-stamp-action-1",
          label: "افزودن مهر Firmware",
          intent: "primary",
        },
        {
          id: "utn2101-stamp-action-2",
          label: "ارسال یادآور",
          intent: "ghost",
        },
      ],
    },
    capa: {
      summary: "CAPA-412 بسته شده اما نیاز است گزارش نهایی در اختیار مشتری قرار گیرد.",
      highlights: [
        {
          id: "utn2101-capa-status",
          label: "وضعیت",
          value: "بسته شد",
          tone: "positive",
        },
        {
          id: "utn2101-capa-owner",
          label: "مالک",
          value: "دفتر فنی",
        },
        {
          id: "utn2101-capa-share",
          label: "اشتراک",
          value: "در انتظار",
          tone: "warning",
        },
      ],
      checklist: [
        {
          id: "utn2101-capa-check-1",
          label: "ارسال گزارش نهایی",
          done: false,
        },
        {
          id: "utn2101-capa-check-2",
          label: "به‌روزرسانی وضعیت در داشبورد",
          done: true,
        },
        {
          id: "utn2101-capa-check-3",
          label: "تایید مشتری",
          done: false,
        },
      ],
      actions: [
        {
          id: "utn2101-capa-action-1",
          label: "اشتراک CAPA با مشتری",
          intent: "primary",
        },
        {
          id: "utn2101-capa-action-2",
          label: "دانلود مستند تکمیلی",
          intent: "secondary",
        },
      ],
    },
  },
};

const defaultFeatureSelections: Record<string, string> =
  projectWorkspaceProjects.reduce((acc, project) => {
    acc[project.id] = project.features[0]?.id ?? "overview";
    return acc;
  }, {} as Record<string, string>);

const createInitialFeatureChecklistState = (): FeatureChecklistState => {
  const state: FeatureChecklistState = {};
  Object.entries(projectFeatureDetails).forEach(([projectId, features]) => {
    state[projectId] = {};
      Object.entries(features).forEach(([featureId, detail]) => {
        state[projectId][featureId] = detail.checklist.reduce<
          Record<string, boolean>
        >((acc, item) => {
          acc[item.id] = item.done;
          return acc;
        }, {});
      });
  });
  return state;
};

type ProjectApprovalState = {
  stampRequested: boolean;
  signatureRequested: boolean;
};

type ReportRangeKey = "week" | "month" | "quarter";
type ReportStageFilter = "all" | "draft" | "ready" | "shared";
type ReportStage =
  | "در حال تحلیل"
  | "در انتظار تایید"
  | "آماده انتشار"
  | "ارسال شد";

type ReportMetricSummary = {
  id: string;
  label: string;
  value: string;
  change: string;
  tone: "positive" | "negative" | "neutral";
  helper?: string;
};

type ReportQueueItem = {
  id: string;
  utn: string;
  subject: string;
  owner: string;
  stage: ReportStage;
  due: string;
  channel: string;
  completeness: number;
  attachments: number;
  sensitivity: "عادی" | "محرمانه";
};

type ReportQualityGate = {
  id: string;
  title: string;
  detail: string;
  status: "passed" | "pending" | "warning";
};

type ReportTemplateShortcut = {
  id: string;
  title: string;
  detail: string;
  badge: string;
  badgeClass: string;
};

type ReportSensitivity = "عادی" | "محرمانه";

const triggerDownload = (content: string, filename: string, mime: string) => {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const reportRangeMetrics: Record<ReportRangeKey, ReportMetricSummary[]> = {
  week: [
    {
      id: "coverage",
      label: "پوشش گزارش‌ها",
      value: "۷۶٪",
      change: "+۳٪",
      tone: "positive",
      helper: "ارسال به‌روز در ۷ روز اخیر",
    },
    {
      id: "ready",
      label: "نسخه‌های آماده انتشار",
      value: "۱۲",
      change: "+۲",
      tone: "positive",
      helper: "در صف ارسال امروز",
    },
    {
      id: "rework",
      label: "نیازمند بازنگری",
      value: "۳",
      change: "-۱",
      tone: "positive",
      helper: "در حال اصلاح با QA",
    },
  ],
  month: [
    {
      id: "coverage",
      label: "پوشش گزارش‌ها",
      value: "۸۶٪",
      change: "+۵٪",
      tone: "positive",
      helper: "۱۸۰ بسته طی ۳۰ روز",
    },
    {
      id: "ready",
      label: "نسخه‌های آماده انتشار",
      value: "۴۸",
      change: "+۹",
      tone: "positive",
      helper: "در انتظار تایید مدیران",
    },
    {
      id: "rework",
      label: "نیازمند بازنگری",
      value: "۱۱",
      change: "-۳",
      tone: "positive",
      helper: "مرتبط با CAPA فعال",
    },
  ],
  quarter: [
    {
      id: "coverage",
      label: "پوشش گزارش‌ها",
      value: "۹۲٪",
      change: "+۷٪",
      tone: "positive",
      helper: "هم‌راستا با اهداف OKR",
    },
    {
      id: "ready",
      label: "نسخه‌های آماده انتشار",
      value: "۱۴۰",
      change: "+۱۶",
      tone: "positive",
      helper: "ارسال به هیئت مدیره",
    },
    {
      id: "rework",
      label: "نیازمند بازنگری",
      value: "۱۸",
      change: "-۵",
      tone: "positive",
      helper: "کاهش انحراف کیفیت",
    },
  ],
};

const reportDistributionByRange: Record<
  ReportRangeKey,
  { label: string; value: number; color: string }[]
> = {
  week: [
    { label: "ممیزی QA", value: 28, color: "#2563eb" },
    { label: "کنترل میدانی", value: 18, color: "#0ea5e9" },
    { label: "خلاصه مدیریتی", value: 16, color: "#f97316" },
    { label: "پیوست فنی", value: 10, color: "#a855f7" },
  ],
  month: [
    { label: "ممیزی QA", value: 120, color: "#2563eb" },
    { label: "کنترل میدانی", value: 90, color: "#0ea5e9" },
    { label: "خلاصه مدیریتی", value: 70, color: "#f97316" },
    { label: "پیوست فنی", value: 64, color: "#a855f7" },
  ],
  quarter: [
    { label: "ممیزی QA", value: 360, color: "#2563eb" },
    { label: "کنترل میدانی", value: 260, color: "#0ea5e9" },
    { label: "خلاصه مدیریتی", value: 240, color: "#f97316" },
    { label: "پیوست فنی", value: 210, color: "#a855f7" },
  ],
};

const reportSparkByRange: Record<ReportRangeKey, number[]> = {
  week: [32, 38, 40, 46, 52, 55, 60, 64, 67, 70],
  month: [110, 120, 138, 150, 168, 178, 186, 198, 210, 224, 238, 250],
  quarter: [
    260, 280, 298, 320, 340, 360, 380, 400, 420, 438, 452, 468,
  ],
};

const reportChannelFilters = [
  { id: "all", label: "تمام کانال‌ها" },
  { id: "QA", label: "QA" },
  { id: "بدنه", label: "بدنه" },
  { id: "کارگاه", label: "کارگاه" },
  { id: "مستندسازی", label: "مستندسازی" },
];

const reportStatusFilters = [
  { id: "all", label: "همه وضعیت‌ها" },
  { id: "draft", label: "در حال تهیه" },
  { id: "ready", label: "آماده ارسال" },
  { id: "shared", label: "ارسال شده" },
];

const reportStageOptions: ReportStage[] = [
  "در حال تحلیل",
  "در انتظار تایید",
  "آماده انتشار",
  "ارسال شد",
];

const reportStageClasses: Record<ReportStage, string> = {
  "در حال تحلیل": "bg-slate-50 text-slate-600 border-slate-200",
  "در انتظار تایید": "bg-amber-50 text-amber-700 border-amber-200",
  "آماده انتشار": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "ارسال شد": "bg-blue-50 text-blue-700 border-blue-200",
};

const reportGateStatusClasses: Record<
  ReportQualityGate["status"],
  string
> = {
  passed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  warning: "bg-rose-50 text-rose-600 border-rose-100",
};

const initialReportQualityGates: ReportQualityGate[] = [
  {
    id: "gate-data",
    title: "اعتبارسنجی داده خام",
    detail: "۵۶۹ قرائت حسگر بدون خطا",
    status: "passed",
  },
  {
    id: "gate-field",
    title: "ترکیب لاگ میدانی",
    detail: "۲ یادداشت در صف تایید",
    status: "pending",
  },
  {
    id: "gate-risk",
    title: "بررسی مدیریت ریسک",
    detail: "منتظر امضای مدیر فنی",
    status: "warning",
  },
];

const reportInsightHighlights = [
  {
    id: "sla",
    title: "انحراف SLA",
    value: "-۴٪",
    helper: "میانگین تحویل گزارش QA",
  },
  {
    id: "capa",
    title: "CAPA باز",
    value: "۶",
    helper: "اقدام اصلاحی متصل به گزارش",
  },
  {
    id: "shares",
    title: "گزارش‌های اشتراک‌گذاری شده",
    value: "۱۳",
    helper: "۷ روز اخیر",
  },
];

const reportTemplateShortcuts: ReportTemplateShortcut[] = [
  {
    id: "tpl-board",
    title: "الگوی گزارش هیئت مدیره",
    detail: "PDF + نمودار مقایسه‌ای آماده ارائه",
    badge: "Template",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    id: "tpl-qa",
    title: "پکیج گزارش QA",
    detail: "Excel + پیوست فنی برای مهندسان",
    badge: "QA",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    id: "tpl-daily",
    title: "Snapshot روزانه پایش",
    detail: "ارسال سریع به پیام‌رسان مدیریتی",
    badge: "Live",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-100",
  },
];

const initialReportQueue: ReportQueueItem[] = [
  {
    id: "report-1",
    utn: "UTN-2045",
    subject: "ممیزی لرزش بدنه · نسخه ۳",
    owner: "ندا شریفی",
    stage: "در انتظار تایید",
    due: "امروز · ۱۸:۰۰",
    channel: "QA",
    completeness: 78,
    attachments: 6,
    sensitivity: "محرمانه",
  },
  {
    id: "report-2",
    utn: "UTN-1980",
    subject: "تحلیل نشتی روغن و CAPA",
    owner: "محمد رضوی",
    stage: "در حال تحلیل",
    due: "امروز · ۲۱:۰۰",
    channel: "کارگاه",
    completeness: 52,
    attachments: 3,
    sensitivity: "عادی",
  },
  {
    id: "report-3",
    utn: "UTN-2101",
    subject: "خلاصه مدیریتی شبکه الکتریک",
    owner: "مهدی سلیمانی",
    stage: "آماده انتشار",
    due: "فردا · ۱۰:۰۰",
    channel: "مستندسازی",
    completeness: 91,
    attachments: 4,
    sensitivity: "عادی",
  },
  {
    id: "report-4",
    utn: "UTN-1766",
    subject: "به‌روزرسانی مستندات عمومی",
    owner: "فاطمه کریمی",
    stage: "ارسال شد",
    due: "دیروز · ۱۶:۰۰",
    channel: "بدنه",
    completeness: 100,
    attachments: 8,
    sensitivity: "محرمانه",
  },
  {
    id: "report-5",
    utn: "UTN-2120",
    subject: "ارزیابی عملکرد پمپ‌های اسکله ۲",
    owner: "سارا رحیمی",
    stage: "در انتظار تایید",
    due: "فردا · ۱۴:۳۰",
    channel: "QA",
    completeness: 67,
    attachments: 2,
    sensitivity: "عادی",
  },
];

const persianWeekdays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const collabChannelThemes: Record<
  string,
  { accent: string; badgeClass: string }
> = {
  میدانی: {
    accent: "border-emerald-200 bg-emerald-50/50",
    badgeClass: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  "کنترل کیفیت": {
    accent: "border-slate-200 bg-slate-50/70",
    badgeClass: "border border-slate-200 bg-white text-slate-700",
  },
  QA: {
    accent: "border-slate-200 bg-slate-50/70",
    badgeClass: "border border-slate-200 bg-white text-slate-700",
  },
  هماهنگی: {
    accent: "border-blue-200 bg-blue-50/70",
    badgeClass: "border border-blue-200 bg-blue-50 text-blue-700",
  },
  مدیریت: {
    accent: "border-amber-200 bg-amber-50/70",
    badgeClass: "border border-amber-200 bg-amber-50 text-amber-700",
  },
  کارگاه: {
    accent: "border-indigo-200 bg-indigo-50/70",
    badgeClass: "border border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  بهره‌بردار: {
    accent: "border-rose-200 bg-rose-50/70",
    badgeClass: "border border-rose-200 bg-rose-50 text-rose-700",
  },
  مستندسازی: {
    accent: "border-purple-200 bg-purple-50/70",
    badgeClass: "border border-purple-200 bg-purple-50 text-purple-700",
  },
  default: {
    accent: "border-gray-200 bg-gray-50",
    badgeClass: "border border-gray-200 bg-white text-gray-700",
  },
};

const getChannelTheme = (channel: string) =>
  collabChannelThemes[channel] ?? collabChannelThemes.default;

const boardStatusThemes: Record<string, string> = {
  "در جریان": "bg-blue-50 text-blue-700 border-blue-200",
  "در انتظار QA": "bg-amber-50 text-amber-700 border-amber-200",
  "آماده ارسال": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "نیازمند اطلاعات": "bg-rose-50 text-rose-600 border-rose-200",
  "تحویل شد": "bg-gray-100 text-gray-600 border-gray-200",
  default: "bg-gray-50 text-gray-700 border-gray-200",
};

const getBoardStatusTheme = (status: string) =>
  boardStatusThemes[status] ?? boardStatusThemes.default;

const boardStatusOptions = [
  "در جریان",
  "در انتظار QA",
  "آماده ارسال",
  "نیازمند اطلاعات",
  "تحویل شد",
];

const knowledgeBaseResources = [
  {
    id: "kb-root-cause",
    title: "راهنمای تحلیل ریشه‌ای ارتعاش",
    detail: "چک‌لیست ۱۲ مرحله‌ای برای یافتن سریع منشأ ایراد",
  },
  {
    id: "kb-report-kit",
    title: "الگوی گزارش مدیران",
    detail: "نسخه آماده ارائه با نمودارهای مقایسه‌ای",
  },
  {
    id: "kb-field-validation",
    title: "بسته معتبرسازی میدانی",
    detail: "استانداردهای پذیرش برای تیم QA",
  },
];

const supportShortcuts = [
  {
    id: "ticket",
    title: "ثبت تیکت",
    detail: "برای هماهنگی با واحد پشتیبانی",
  },
  {
    id: "chat",
    title: "چت با مهندس آماده‌باش",
    detail: "میانگین پاسخ‌گویی ۶ دقیقه",
  },
  {
    id: "meeting",
    title: "رزرو جلسه هم‌آهنگی",
    detail: "انتخاب بازه ۳۰ دقیقه‌ای",
  },
  {
    id: "secure-room",
    title: "اتاق داده ایمن",
    detail: "آپلود نقشه‌ها و مدارک حجیم",
  },
];

type WorkflowAssignment = {
  id: string;
  utn: string;
  title: string;
  tech: string;
  stage: string;
  sla: string;
};

const initialWorkflowAssignments: WorkflowAssignment[] = [
  {
    id: "wf-1",
    utn: "UTN-2045",
    title: "بدنه / لرزش غیرعادی",
    tech: "سارا رحیمی",
    stage: "بازرسی میدانی",
    sla: "۲ ساعت",
  },
  {
    id: "wf-2",
    utn: "UTN-1980",
    title: "ماشین‌آلات / نشت روغن",
    tech: "محمد رضوی",
    stage: "در انتظار تحویل",
    sla: "تا پایان امروز",
  },
  {
    id: "wf-3",
    utn: "UTN-2101",
    title: "الکتریک / قطع مقطعی",
    tech: "مهدی سلیمانی",
    stage: "تحلیل آزمایشگاهی",
    sla: "فردا صبح",
  },
  {
    id: "wf-4",
    utn: "UTN-1766",
    title: "سیستم عمومی / به‌روزرسانی مدارک",
    tech: "فاطمه کریمی",
    stage: "مستندسازی",
    sla: "در حال اقدام",
  },
];

type QuickNote = {
  id: string;
  text: string;
  createdAt: string;
};

type CustomAlert = {
  id: string;
  title: string;
  owner: string;
  due: string;
};

type WorkflowFilter = "all" | "pending" | "mine";
type WorkflowStageKey = "receive" | "field" | "handover";

const technicianOptions = [
  "سارا رحیمی",
  "محمد رضوی",
  "مهدی سلیمانی",
  "فاطمه کریمی",
];

// 🔹 چت و اتاق داده ایمن
type ChatMessage = {
  id: string;
  from: "user" | "engineer";
  text: string;
  time: string;
};

type SecureFileItem = {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size.toFixed(1)} ${sizes[i]}`;
}

type TechnicianCalendarPathTabProps = {
  onOpenWorkflow: (stage: WorkflowStageKey) => void;
};

function TechnicianCalendarPathTab({
  onOpenWorkflow,
}: TechnicianCalendarPathTabProps) {
  const navigate = useNavigate();
  const [calendarEvents, setCalendarEvents] =
    useState<CollabCalendarEvent[]>(initialCollabCalendarEvents);
  const [calendarViewMode, setCalendarViewMode] = useState<
    "month" | "week" | "today"
  >("month");
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(
    25
  );
  const [boardItems, setBoardItems] =
    useState<CollabBoardItem[]>(initialCollabBoardItems);
  const [boardChannelFilter, setBoardChannelFilter] = useState<string>("all");
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(
    initialCollabBoardItems[0]?.id ?? null
  );
  const [actionItems, setActionItems] =
    useState<CollabActionItem[]>(initialCollabActionItems);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDay, setNewEventDay] = useState<number>(25);
  const [newEventChannel, setNewEventChannel] = useState<string>("میدانی");

  const collabCalendarCells = useMemo<
    { id: string; day?: number; events: CollabCalendarEvent[] }[]
  >(() => {
    const totalDays = 30;
    const startOffset = 2;
    const cells: { id: string; day?: number; events: CollabCalendarEvent[] }[] =
      [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ id: `empty-${i}`, events: [] });
    }
    for (let day = 1; day <= totalDays; day++) {
      const events = calendarEvents.filter((event) => event.day === day);
      cells.push({ id: `day-${day}`, day, events });
    }
    return cells;
  }, [calendarEvents]);

  const visibleCalendarDays = useMemo(() => {
    if (calendarViewMode === "month") return null;
    const baseSelected = selectedCalendarDay ?? 1;
    if (calendarViewMode === "today") {
      return new Set<number>([baseSelected]);
    }
    const rangeStart = Math.max(1, baseSelected - 3);
    const rangeEnd = Math.min(30, rangeStart + 6);
    const set = new Set<number>();
    for (let day = rangeStart; day <= rangeEnd; day++) {
      set.add(day);
    }
    return set;
  }, [calendarViewMode, selectedCalendarDay]);

  const eventsForSelectedDay = useMemo(
    () =>
      selectedCalendarDay
        ? calendarEvents.filter((event) => event.day === selectedCalendarDay)
        : [],
    [calendarEvents, selectedCalendarDay]
  );

  const filteredBoardItems = useMemo(() => {
    if (boardChannelFilter === "all") return boardItems;
    return boardItems.filter((item) => item.channel === boardChannelFilter);
  }, [boardItems, boardChannelFilter]);

  const activeBoardItem = useMemo(() => {
    if (!selectedBoardId) return filteredBoardItems[0] ?? null;
    return (
      filteredBoardItems.find((item) => item.id === selectedBoardId) ??
      filteredBoardItems[0] ??
      null
    );
  }, [filteredBoardItems, selectedBoardId]);

  const calendarChannelOptions = useMemo(
    () =>
      Object.keys(collabChannelThemes).filter((key) => key !== "default"),
    []
  );
  const calendarDayOptions = useMemo(
    () => Array.from({ length: 30 }, (_, index) => index + 1),
    []
  );

  const handleSelectCalendarDay = (day: number) => {
    setSelectedCalendarDay(day);
    setNewEventDay(day);
  };

  const handleCalendarViewChange = (mode: "month" | "week" | "today") => {
    setCalendarViewMode(mode);
  };

  const handleAddCalendarEvent = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!newEventTitle.trim()) return;
    const styles = getChannelTheme(newEventChannel);
    const newEvent: CollabCalendarEvent = {
      id: `cal-${Date.now()}`,
      day: newEventDay,
      label: newEventTitle.trim(),
      channel: newEventChannel,
      accent: styles.accent,
      badgeClass: styles.badgeClass,
    };
    setCalendarEvents((prev) => [...prev, newEvent]);
    setSelectedCalendarDay(newEventDay);
    setNewEventTitle("");
  };

  const handleRemoveCalendarEvent = (eventId: string) => {
    setCalendarEvents((prev) => prev.filter((event) => event.id !== eventId));
  };

  const handleChannelFilterChange = (channel: string) => {
    setBoardChannelFilter(channel);
  };

  const handleSelectBoard = (boardId: string) => {
    setSelectedBoardId(boardId);
  };

  const handleUpdateBoardStatus = (boardId: string, nextStatus: string) => {
    const statusClass = getBoardStatusTheme(nextStatus);
    setBoardItems((prev) =>
      prev.map((item) =>
        item.id === boardId ? { ...item, status: nextStatus, statusClass } : item
      )
    );
  };

  const handleCompleteAction = (actionId: string) => {
    setActionItems((prev) => prev.filter((item) => item.id !== actionId));
  };

  return (
    <div className="space-y-6" dir="rtl" lang="fa">
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-row-reverse">
          <div className="text-right space-y-1">
            <p className="text-xs text-gray-500">
              برنامه مشترک تیم‌های میدانی، کارگاهی و مستندسازی
            </p>
            <h2 className="text-lg font-semibold text-gray-900">
              هاب مسیر تقویمی پرونده‌ها
            </h2>
            <p className="text-xs text-gray-500">
              قبل از خروج از اسکله مالکیت، مهلت و نفرات را هماهنگ کنید.
            </p>
          </div>
          <div className="flex flex-row-reverse gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/technician-calendar")}
            >
              مشاهده تقویم کامل
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenWorkflow("field")}
            >
              ثبت رویداد جدید
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between flex-row-reverse">
              <div>
                <p className="text-xs text-gray-500">آبان ۱۴۰۴</p>
                <h5 className="text-sm font-semibold text-gray-900">
                  تقویم مشترک میدانی + کارگاهی
                </h5>
              </div>
              <div className="flex gap-1 flex-row-reverse text-[11px]">
                {(["month", "week", "today"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      handleCalendarViewChange(
                        mode === "month"
                          ? "month"
                          : mode === "week"
                          ? "week"
                          : "today"
                      )
                    }
                    className={`px-2 py-0.5 rounded-full transition-colors ${
                      calendarViewMode === mode
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {mode === "month"
                      ? "ماه"
                      : mode === "week"
                      ? "هفته"
                      : "امروز"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-gray-500">
              {persianWeekdays.map((weekday) => (
                <div key={weekday} className="py-1">
                  {weekday}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-[11px] mt-2">
              {collabCalendarCells.map((cell) => {
                if (!cell.day) {
                  return (
                    <div
                      key={cell.id}
                      className="h-[70px] rounded-xl border border-dashed border-gray-100 bg-gray-50"
                    />
                  );
                }
                const accent =
                  cell.events.length > 0
                    ? cell.events[0].accent
                    : "border-gray-100 bg-white";
                const isSelected = selectedCalendarDay === cell.day;
                const isDimmed =
                  !!visibleCalendarDays && !visibleCalendarDays.has(cell.day);
                return (
                  <button
                    key={cell.id}
                    type="button"
                    onClick={() => handleSelectCalendarDay(cell.day!)}
                    className={`text-right min-h-[70px] rounded-xl border p-2 flex flex-col gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${accent} ${
                      isSelected ? "ring-2 ring-blue-500 border-blue-400" : ""
                    } ${isDimmed ? "opacity-50" : ""}`}
                    aria-pressed={isSelected}
                  >
                    <div className="text-xs text-gray-500">{cell.day}</div>
                    {cell.events.slice(0, 2).map((event) => (
                      <span
                        key={`${cell.id}-${event.id}`}
                        className={`block text-[10px] rounded-full px-1.5 py-0.5 text-right ${event.badgeClass}`}
                      >
                        {event.label}
                      </span>
                    ))}
                    {cell.events.length > 2 && (
                      <span className="text-[10px] text-gray-400">
                        +{cell.events.length - 2} رویداد
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 border-t border-gray-100 pt-3 space-y-3">
              <div className="flex items-start justify-between flex-row-reverse gap-3">
                <div className="text-right">
                  <h5 className="text-sm font-semibold text-gray-900">
                    {selectedCalendarDay
                      ? `رویدادهای روز ${selectedCalendarDay}`
                      : "یک روز را انتخاب کنید"}
                  </h5>
                  <p className="text-[11px] text-gray-500">
                    {calendarViewMode === "month"
                      ? "نمای کلی ماهانه نشان داده می‌شود."
                      : calendarViewMode === "week"
                      ? "فقط ۷ روز اطراف تاریخ انتخابی نمایش داده می‌شود."
                      : "تمرکز روی امروز/روز انتخاب‌شده است."}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedCalendarDay(null)}
                  disabled={!selectedCalendarDay}
                >
                  پاک‌سازی انتخاب
                </Button>
              </div>
              <div className="space-y-2">
                {!selectedCalendarDay ? (
                  <p className="text-[11px] text-gray-500 text-right">
                    برای مشاهده جزئیات، یک روز از تقویم را انتخاب کنید.
                  </p>
                ) : eventsForSelectedDay.length === 0 ? (
                  <p className="text-[11px] text-gray-500 text-right">
                    برای این روز رویدادی ثبت نشده است. از فرم زیر یک رویداد
                    جدید اضافه کنید.
                  </p>
                ) : (
                  eventsForSelectedDay.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between flex-row-reverse rounded-2xl border border-gray-100 px-3 py-2 text-right text-sm bg-white"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {event.label}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          کانال: {event.channel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCalendarEvent(event.id)}
                        className="text-[11px] text-rose-500 hover:text-rose-600"
                      >
                        حذف
                      </button>
                    </div>
                  ))
                )}
              </div>
              <form
                className="grid gap-2 md:grid-cols-[1.5fr,0.6fr,0.8fr,auto]"
                onSubmit={handleAddCalendarEvent}
              >
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  placeholder="مثلاً: هماهنگی با QA"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                />
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  value={newEventDay}
                  onChange={(e) => setNewEventDay(Number(e.target.value))}
                >
                  {calendarDayOptions.map((day) => (
                    <option key={day} value={day}>
                      روز {day}
                    </option>
                  ))}
                </select>
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  value={newEventChannel}
                  onChange={(e) => setNewEventChannel(e.target.value)}
                >
                  {calendarChannelOptions.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  size="sm"
                  disabled={newEventTitle.trim().length < 2}
                >
                  افزودن رویداد
                </Button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-slate-900 p-4 text-white space-y-4">
            <div className="flex items-center justify-between flex-row-reverse">
              <div>
                <h5 className="text-sm font-semibold text-white">
                  هم‌راستاسازی تیمی
                </h5>
                <p className="text-[11px] text-white/70">تمرکز نوبت امروز</p>
              </div>
              <span className="text-[11px] text-white/60">
                به‌روزرسانی ۳ دقیقه پیش
              </span>
            </div>
            <div className="space-y-3">
              {collabTeamStreams.map((stream) => {
                const isActive = boardChannelFilter === stream.channel;
                return (
                  <button
                    key={stream.id}
                    type="button"
                    onClick={() =>
                      handleChannelFilterChange(
                        isActive ? "all" : stream.channel
                      )
                    }
                    aria-pressed={isActive}
                    className={`w-full text-right rounded-2xl border p-3 space-y-2 transition-colors ${
                      isActive
                        ? "bg-emerald-500/20 border-emerald-300"
                        : "bg-slate-800/70 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center justify-between flex-row-reverse gap-2">
                      <div>
                        <p className="text-sm font-semibold">{stream.title}</p>
                        <p className="text-[11px] text-white/70">
                          {stream.focus}
                        </p>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/20">
                        {stream.owner}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stream.progressClass}`}
                        style={{ width: `${stream.progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-white/60">
                      {isActive
                        ? "فیلتر فعال روی این کانال است"
                        : `کلیک برای فیلتر روی ${stream.channel}`}
                    </p>
                  </button>
                );
              })}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full border border-white/30 bg-white text-slate-900"
              onClick={() => onOpenWorkflow("receive")}
            >
              ثبت وضعیت در برد
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between flex-row-reverse">
          <div className="text-right">
            <h5 className="text-sm font-semibold text-gray-900">
              برد همکاری تکنسین‌ها
            </h5>
            <p className="text-[11px] text-gray-500">
              {filteredBoardItems.length} مورد فعال برای هماهنگی
            </p>
          </div>
          <div className="flex items-center gap-2 flex-row-reverse">
            {boardChannelFilter !== "all" && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                فیلتر: {boardChannelFilter}
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleChannelFilterChange("all")}
              disabled={boardChannelFilter === "all"}
            >
              نمایش همه
            </Button>
          </div>
        </div>
        {filteredBoardItems.length === 0 ? (
          <p className="text-[11px] text-gray-500 text-right">
            با فیلتر فعلی موردی یافت نشد. فیلتر دیگری انتخاب کنید یا فیلتر را
            حذف نمایید.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm min-w-[520px]">
              <thead className="text-[11px] text-gray-500">
                <tr className="border-b border-gray-100">
                  <th className="py-2 text-right font-medium">UTN</th>
                  <th className="py-2 text-right font-medium">شرح</th>
                  <th className="py-2 text-right font-medium">مسئول</th>
                  <th className="py-2 text-right font-medium">وضعیت</th>
                  <th className="py-2 text-right font-medium">موعد</th>
                  <th className="py-2 text-right font-medium">کانال</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-gray-700">
                {filteredBoardItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-50 cursor-pointer transition-colors ${
                      selectedBoardId === item.id
                        ? "bg-blue-50/60"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleSelectBoard(item.id)}
                    aria-selected={selectedBoardId === item.id}
                  >
                    <td className="py-2 font-mono text-xs text-gray-500">
                      {item.utn}
                    </td>
                    <td className="py-2">{item.title}</td>
                    <td className="py-2 text-gray-600">{item.owner}</td>
                    <td className="py-2">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${item.statusClass}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 text-[11px] text-gray-500">
                      {item.due}
                    </td>
                    <td className="py-2 text-[11px] text-gray-500">
                      {item.channel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeBoardItem && (
          <div className="rounded-2xl border border-dashed border-gray-200 p-3 text-right space-y-3">
            <div className="flex items-center justify-between flex-row-reverse">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {activeBoardItem.title}
                </p>
                <p className="text-[11px] text-gray-500">
                  {activeBoardItem.location} · {activeBoardItem.due}
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-600">
                {activeBoardItem.utn}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">
                  وضعیت / هماهنگی
                </label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activeBoardItem.status}
                  onChange={(e) =>
                    handleUpdateBoardStatus(activeBoardItem.id, e.target.value)
                  }
                >
                  {boardStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-row-reverse gap-2 items-end justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    handleUpdateBoardStatus(activeBoardItem.id, "تحویل شد")
                  }
                >
                  ثبت تحویل
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenWorkflow("handover")}
                >
                  باز کردن در Workflow
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between flex-row-reverse">
            <h5 className="text-sm font-semibold text-gray-900">
              وظایف فوری تکنسین‌ها
            </h5>
            <span className="text-[11px] text-gray-400">همگام با برد بالا</span>
          </div>
          <div className="space-y-3">
            {actionItems.length === 0 ? (
              <p className="text-[11px] text-gray-500 text-right">
                تمام وظایف فوری تکمیل شده‌اند.
              </p>
            ) : (
              actionItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between flex-row-reverse border border-gray-100 rounded-2xl px-3 py-2 gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {item.owner} · {item.channel}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border ${item.badgeClass}`}
                    >
                      {item.due}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCompleteAction(item.id)}
                      className="text-[10px] text-emerald-600 hover:text-emerald-700"
                    >
                      انجام شد
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between flex-row-reverse">
            <h5 className="text-sm font-semibold text-gray-900">
              لینک‌های همکاری سریع
            </h5>
            <span className="text-[11px] text-gray-400">
              پیشنهاد برای هم‌آوری
            </span>
          </div>
          <div className="space-y-3">
            {collabQuickLinks.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between flex-row-reverse border border-dashed border-gray-200 rounded-2xl px-3 py-2"
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-gray-500">{item.detail}</p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${item.badgeClass}`}
                >
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function TechnicianDashboardView() {
  const { activeTab } = useWorkspace();
  const navigate = useNavigate();

  const [journeys, setJourneys] = useState<JourneyState>(() =>
    createInitialJourneyState()
  );
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projectWorkspaceProjects[0]?.id ?? ""
  );
  const [projectApprovals, setProjectApprovals] = useState<
    Record<string, ProjectApprovalState>
  >(() =>
    projectWorkspaceProjects.reduce(
      (acc, project) => {
        const stampCount =
          project.features.find((feature) => feature.id === "stamps")?.
            count ?? 0;
        acc[project.id] = {
          stampRequested: stampCount > 0,
          signatureRequested: false,
        };
        return acc;
      },
      {} as Record<string, ProjectApprovalState>
    )
  );
  const [activeFeatureByProject, setActiveFeatureByProject] = useState<
    Record<string, string>
  >(() => ({ ...defaultFeatureSelections }));
  const [featureChecklistState, setFeatureChecklistState] =
    useState<FeatureChecklistState>(() => createInitialFeatureChecklistState());
  const [projectActionNotice, setProjectActionNotice] = useState<
    { projectId: string; message: string } | null
  >(null);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState("");
  const [actionOwner, setActionOwner] = useState("سارا رحیمی");
  const [actionDate, setActionDate] = useState("");
  const [actionHour, setActionHour] = useState("");
  const [actionMinute, setActionMinute] = useState("");

  const [customAlerts, setCustomAlerts] = useState<CustomAlert[]>([]);
  const [pinnedResources, setPinnedResources] = useState<string[]>([]);
  const [activeSupportId, setActiveSupportId] = useState<string | null>(null);
  const [activeTechnician, setActiveTechnician] = useState<any | null>(null);

  const [timeRange, setTimeRange] = useState<TimeRange>("today");

  const [workflowAssignments, setWorkflowAssignments] = useState<
    WorkflowAssignment[]
  >(initialWorkflowAssignments);
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowFilter>("all");

  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowModalStage, setWorkflowModalStage] =
    useState<WorkflowStageKey>("receive");
  const [workflowFormTitle, setWorkflowFormTitle] = useState("");
  const [workflowFormTech, setWorkflowFormTech] = useState<string>(
    technicianOptions[0]
  );
  const [workflowFormDate, setWorkflowFormDate] = useState<DateObject | null>(
    null
  );
  const [workflowFormTime, setWorkflowFormTime] = useState<string>("");

  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState<string[]>([]);

  // 🔹 state مخصوص بخش پشتیبانی
  // ثبت تیکت
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketUTN, setTicketUTN] = useState("");
  const [ticketCategory, setTicketCategory] = useState("بدنه");
  const [ticketPriority, setTicketPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketFiles, setTicketFiles] = useState<File[]>([]);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // چت
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      from: "engineer",
      text: "سلام، من مهندس آماده‌باش هستم. لطفاً خیلی کوتاه بفرمایید روی کدام کشتی و چه سیستمی مشکل دارید.",
      time: "الان",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // رزرو جلسه
  const [meetingDate, setMeetingDate] = useState<DateObject | null>(null);
  const [meetingTime, setMeetingTime] = useState<string>("");
  const [meetingDuration, setMeetingDuration] = useState<string>("30");
  const [meetingMode, setMeetingMode] = useState<"online" | "onsite">("online");
  const [meetingTopic, setMeetingTopic] = useState<string>("");
  const [meetingSuccess, setMeetingSuccess] = useState(false);

  // اتاق داده ایمن
  const [secureSelectedFiles, setSecureSelectedFiles] = useState<File[]>([]);
  const [secureUploadedFiles, setSecureUploadedFiles] = useState<
    SecureFileItem[]
  >([]);
  const [secureUploading, setSecureUploading] = useState(false);

  const [reportRange, setReportRange] = useState<ReportRangeKey>("month");
  const [reportOwnerFilter, setReportOwnerFilter] = useState<string>("all");
  const [reportStatusFilter, setReportStatusFilter] =
    useState<ReportStageFilter>("all");
  const [reportSearch, setReportSearch] = useState("");
  const [reportQueueItems, setReportQueueItems] =
    useState<ReportQueueItem[]>(initialReportQueue);
  const [sharedReportIds, setSharedReportIds] = useState<string[]>([]);
  const [focusedReportId, setFocusedReportId] = useState<string | null>(
    initialReportQueue[0]?.id ?? null
  );
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [newReportSubject, setNewReportSubject] = useState("");
  const [newReportOwner, setNewReportOwner] = useState(technicianOptions[0]);
  const [newReportChannel, setNewReportChannel] = useState(
    reportChannelFilters.find((filter) => filter.id !== "all")?.id ?? "QA"
  );
  const [newReportStage, setNewReportStage] = useState<ReportStage>(
    reportStageOptions[0]
  );
  const [newReportDueDate, setNewReportDueDate] = useState("");
  const [newReportDueTime, setNewReportDueTime] = useState("");
  const [newReportCompleteness, setNewReportCompleteness] = useState(60);
  const [newReportAttachments, setNewReportAttachments] = useState(0);
  const [newReportSensitivity, setNewReportSensitivity] =
    useState<ReportSensitivity>("عادی");
  const [qualityGates, setQualityGates] = useState<ReportQualityGate[]>(
    initialReportQualityGates
  );
  const [qualityGateModalOpen, setQualityGateModalOpen] = useState(false);
  const [qualityGateTitle, setQualityGateTitle] = useState("");
  const [qualityGateDetail, setQualityGateDetail] = useState("");
  const [qualityGateStatus, setQualityGateStatus] =
    useState<ReportQualityGate["status"]>("pending");
  const [reportReminders, setReportReminders] = useState<SnapshotReminder[]>(
    []
  );
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderOwner, setReminderOwner] = useState("دفتر فنی");
  const [reminderDue, setReminderDue] = useState("");
  const [reportShareNotice, setReportShareNotice] = useState<string | null>(
    null
  );

  const snapshot = workspaceSnapshots[activeTab];
  const islands = journeys[activeTab] ?? [];
  const isReportsTab = activeTab === "reports";
  const isCalendarPathTab = activeTab === "calendarPath";
  const isWorkbenchTab = activeTab === "workbench";
  const currentReportMetrics = reportRangeMetrics[reportRange];
  const currentReportDistribution = reportDistributionByRange[reportRange];
  const currentReportSpark = reportSparkByRange[reportRange];
  const reportDistributionTotal = currentReportDistribution.reduce(
    (sum, item) => sum + item.value,
    0
  );
  const topReportType =
    currentReportDistribution.length > 0
      ? currentReportDistribution.reduce((prev, item) =>
          item.value > prev.value ? item : prev
        )
      : null;
  const topReportPercent =
    reportDistributionTotal > 0 && topReportType
      ? Math.round((topReportType.value * 100) / reportDistributionTotal)
      : 0;

  const alerts = useMemo(
    () => [...priorityTasks, ...customAlerts],
    [customAlerts]
  );

  const workflowStageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    islands.forEach((island) => {
      counts[island.title] =
        (island.tasks?.length || 0) + (counts[island.title] || 0);
    });
    return counts;
  }, [islands]);

  const filteredReportQueue = useMemo(() => {
    const normalizedSearch = reportSearch.trim().toLowerCase();
    return reportQueueItems.filter((item) => {
      const matchesChannel =
        reportOwnerFilter === "all" || item.channel === reportOwnerFilter;
      const matchesStatus =
        reportStatusFilter === "all"
          ? true
          : reportStatusFilter === "draft"
          ? item.stage.includes("تحلیل") || item.stage.includes("انتظار")
          : reportStatusFilter === "ready"
          ? item.stage.includes("آماده")
          : item.stage.includes("ارسال");
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.utn.toLowerCase().includes(normalizedSearch) ||
        item.subject.toLowerCase().includes(normalizedSearch);
      return matchesChannel && matchesStatus && matchesSearch;
    });
  }, [reportQueueItems, reportOwnerFilter, reportStatusFilter, reportSearch]);

  const focusedReport = useMemo(
    () =>
      filteredReportQueue.find((item) => item.id === focusedReportId) ??
      filteredReportQueue[0] ??
      null,
    [filteredReportQueue, focusedReportId]
  );

  useEffect(() => {
    if (filteredReportQueue.length === 0) {
      setFocusedReportId(null);
      return;
    }
    if (
      focusedReportId &&
      !filteredReportQueue.some((item) => item.id === focusedReportId)
    ) {
      setFocusedReportId(filteredReportQueue[0].id);
    }
  }, [filteredReportQueue, focusedReportId]);

  useEffect(() => {
    if (isReportsTab) {
      setReportReminders(snapshot?.reminders ?? []);
    }
  }, [isReportsTab, snapshot]);

  useEffect(() => {
    if (!reportShareNotice) return;
    const timeout = window.setTimeout(() => setReportShareNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [reportShareNotice]);

  useEffect(() => {
    if (!isReportsTab) {
      setReportModalOpen(false);
      setQualityGateModalOpen(false);
      setReminderModalOpen(false);
    }
  }, [isReportsTab]);

  const handleTaskReorder = (
    islandId: string,
    taskId: string,
    newOrder: number
  ) => {
    setJourneys((prev) => {
      const sourceIslands = prev[activeTab] ?? [];
      const updatedIslands = sourceIslands.map((island) => {
        if (island.id !== islandId) return island;
        const tasks = [...island.tasks];
        const currentIndex = tasks.findIndex((task) => task.id === taskId);
        if (currentIndex === -1) return island;
        const [moved] = tasks.splice(currentIndex, 1);
        const targetIndex = Math.min(Math.max(newOrder, 0), tasks.length);
        tasks.splice(targetIndex, 0, moved);
        return { ...island, tasks };
      }) as Island[];

      return {
        ...prev,
        [activeTab]: updatedIslands,
      };
    });
  };

  const handleReportStageChange = (reportId: string, nextStage: ReportStage) => {
    setReportQueueItems((prev) =>
      prev.map((item) =>
        item.id === reportId ? { ...item, stage: nextStage } : item
      )
    );
  };

  const toggleReportShare = (reportId: string) => {
    setSharedReportIds((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const buildDueLabel = (dateValue: string, timeValue: string) => {
    if (dateValue && timeValue) return `${dateValue} · ${timeValue}`;
    if (dateValue) return dateValue;
    if (timeValue) return `ساعت ${timeValue}`;
    return "بدون موعد";
  };

  const handleExportReports = () => {
    if (filteredReportQueue.length === 0) {
      setReportShareNotice("ابتدا گزارشی را برای خروجی انتخاب یا اضافه کنید.");
      return;
    }
    const header = [
      "UTN",
      "عنوان",
      "مسئول",
      "مرحله",
      "کانال",
      "موعد",
      "درصد تکمیل",
      "سطح محرمانگی",
    ];
    const rows = filteredReportQueue
      .map((item) =>
        [
          item.utn,
          item.subject,
          item.owner,
          item.stage,
          item.channel,
          item.due,
          `${item.completeness}%`,
          item.sensitivity,
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const csv = `\uFEFF${header.join(",")}\n${rows}`;
    triggerDownload(csv, `report-desk-${reportRange}.csv`, "text/csv;charset=utf-8;");
    setReportShareNotice("خروجی اکسل آماده و دانلود شد.");
  };

  const handleCreateReport = () => {
    if (!newReportSubject.trim()) return;
    const randomUTN =
      "UTN-" + (1800 + Math.floor(Math.random() * 900)).toString();
    const newItem: ReportQueueItem = {
      id: `report-${Date.now()}`,
      utn: randomUTN,
      subject: newReportSubject.trim(),
      owner: newReportOwner,
      stage: newReportStage,
      due: buildDueLabel(newReportDueDate, newReportDueTime),
      channel: newReportChannel,
      completeness: newReportCompleteness,
      attachments: newReportAttachments,
      sensitivity: newReportSensitivity,
    };
    setReportQueueItems((prev) => [newItem, ...prev]);
    setFocusedReportId(newItem.id);
    setReportModalOpen(false);
    setNewReportSubject("");
    setNewReportDueDate("");
    setNewReportDueTime("");
    setNewReportAttachments(0);
    setNewReportCompleteness(60);
    setNewReportStage(reportStageOptions[0]);
    setNewReportSensitivity("عادی");
  };

  const handleAddQualityGate = () => {
    if (!qualityGateTitle.trim()) return;
    const newGate: ReportQualityGate = {
      id: `gate-${Date.now()}`,
      title: qualityGateTitle.trim(),
      detail: qualityGateDetail.trim() || "بدون توضیح تکمیلی",
      status: qualityGateStatus,
    };
    setQualityGates((prev) => [newGate, ...prev]);
    setQualityGateTitle("");
    setQualityGateDetail("");
    setQualityGateStatus("pending");
    setQualityGateModalOpen(false);
  };

  const handleAddReminder = () => {
    if (!reminderTitle.trim()) return;
    const newReminder: SnapshotReminder = {
      id: `reminder-${Date.now()}`,
      title: reminderTitle.trim(),
      owner: reminderOwner.trim() || "دفتر فنی",
      due: reminderDue.trim() || "بدون موعد",
    };
    setReportReminders((prev) => [newReminder, ...prev]);
    setReminderTitle("");
    setReminderOwner("دفتر فنی");
    setReminderDue("");
    setReminderModalOpen(false);
  };

  const handleQuickChannelShare = (channelId: string, channelLabel: string) => {
    if (!focusedReport) {
      setReportShareNotice(
        `برای اشتراک در کانال ${channelLabel} ابتدا یک گزارش را انتخاب کنید.`
      );
      return;
    }
    toggleReportShare(focusedReport.id);
    setReportShareNotice(
      `گزارش ${focusedReport.utn} برای کانال ${channelLabel} ارسال شد.`
    );
  };

  const handleDownloadReport = () => {
    if (!focusedReport) {
      setReportShareNotice("ابتدا یک گزارش را از لیست انتخاب کنید.");
      return;
    }
    const summary = `گزارش: ${focusedReport.subject}\nUTN: ${
      focusedReport.utn
    }\nمسئول: ${focusedReport.owner}\nکانال: ${
      focusedReport.channel
    }\nمرحله فعلی: ${focusedReport.stage}\nموعد: ${
      focusedReport.due
    }\nدرصد تکمیل: ${focusedReport.completeness}%\nپیوست‌ها: ${
      focusedReport.attachments
    }\nسطح محرمانگی: ${focusedReport.sensitivity}`;
    triggerDownload(
      summary,
      `${focusedReport.utn}-summary.txt`,
      "text/plain;charset=utf-8;"
    );
    setReportShareNotice(`خلاصه گزارش ${focusedReport.utn} دانلود شد.`);
  };

  const handleAddNote = () => {
    if (!noteDraft.trim()) return;
    setQuickNotes((prev) => [
      {
        id: `note-${Date.now()}`,
        text: noteDraft.trim(),
        createdAt: new Date().toLocaleString("fa-IR"),
      },
      ...prev,
    ]);
    setNoteDraft("");
    setNoteModalOpen(false);
  };

  const handleSaveAction = () => {
    if (!actionTitle.trim()) return;

    let dueLabel = "بدون موعد";
    if (actionDate) {
      const hh = actionHour || "00";
      const mm = actionMinute || "00";
      dueLabel = `${actionDate} · ${hh}:${mm}`;
    } else if (actionHour || actionMinute) {
      dueLabel = `ساعت ${actionHour || "00"}:${actionMinute || "00"}`;
    }

    setCustomAlerts((prev) => [
      {
        id: `alert-${Date.now()}`,
        title: actionTitle.trim(),
        owner: actionOwner.trim() || "نامشخص",
        due: dueLabel,
      },
      ...prev,
    ]);

    setActionTitle("");
    setActionOwner("سارا رحیمی");
    setActionDate("");
    setActionHour("");
    setActionMinute("");
    setActionModalOpen(false);
  };

  const togglePin = (id: string) => {
    setPinnedResources((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleWorkflowSelection = (id: string) => {
    setSelectedWorkflowIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const currentMetrics = metricsByRange[timeRange];
  const currentDonut = donutByRange[timeRange];
  const currentSpark = sparkByRange[timeRange];

  const totalActivities = currentDonut.reduce(
    (sum, item) => sum + item.value,
    0
  );
  const topActivity =
    currentDonut.length > 0
      ? (currentDonut as any).reduce(
          (top: any, item: any) => (item.value > top.value ? item : top),
          currentDonut[0]
        )
      : { label: "", value: 0, color: "" };
  const topPercent =
    totalActivities > 0
      ? Math.round((topActivity.value * 100) / totalActivities)
      : 0;

  const filteredAssignments = useMemo(() => {
    if (workflowFilter === "all") return workflowAssignments;

    if (workflowFilter === "mine") {
      const currentTech = "سارا رحیمی"; // تکنسین فعلی
      return workflowAssignments.filter((item) => item.tech === currentTech);
    }

    // pending
    return workflowAssignments.filter(
      (item) =>
        item.stage.includes("در انتظار") ||
        item.stage.includes("آماده") ||
        item.stage.includes("معوق")
    );
  }, [workflowAssignments, workflowFilter]);

  const receiveCases = filteredAssignments.filter((item) =>
    item.stage.includes("در انتظار")
  );
  const fieldCases = filteredAssignments.filter(
    (item) => item.stage.includes("بازرسی") || item.stage.includes("تحلیل")
  );
  const handoverCases = filteredAssignments.filter((item) =>
    item.stage.includes("مستندسازی")
  );

  const selectedProject = useMemo(
    () =>
      projectWorkspaceProjects.find(
        (project) => project.id === selectedProjectId
      ) ?? projectWorkspaceProjects[0] ?? null,
    [selectedProjectId]
  );

  const selectedProjectApprovals = selectedProject
    ? projectApprovals[selectedProject.id] ?? {
        stampRequested: false,
        signatureRequested: false,
      }
    : { stampRequested: false, signatureRequested: false };

  const selectedProjectFeatureId = selectedProject
    ? activeFeatureByProject[selectedProject.id] ??
      selectedProject.features[0]?.id ??
      null
    : null;

  const selectedProjectFeatureDetail =
    selectedProject && selectedProjectFeatureId
      ? projectFeatureDetails[selectedProject.id]?.[
          selectedProjectFeatureId
        ]
      : undefined;

  const selectedFeatureChecklistState =
    selectedProject && selectedProjectFeatureId
      ? featureChecklistState[selectedProject.id]?.[
          selectedProjectFeatureId
        ] ?? {}
      : {};

  const selectedFeatureChecklistMeta = useMemo(() => {
    if (!selectedProjectFeatureDetail) {
      return { total: 0, completed: 0, percent: 0 };
    }
    const total = selectedProjectFeatureDetail.checklist.length;
    if (total === 0) {
      return { total: 0, completed: 0, percent: 0 };
    }
    const completed = selectedProjectFeatureDetail.checklist.reduce(
      (count, item) =>
        count + (selectedFeatureChecklistState[item.id] ? 1 : 0),
      0
    );
    const percent = Math.round((completed / total) * 100);
    return { total, completed, percent };
  }, [selectedProjectFeatureDetail, selectedFeatureChecklistState]);

  const selectedProjectFeatureEvents =
    selectedProjectFeatureDetail?.events ?? [];

  useEffect(() => {
    if (!selectedProject) return;
    setActiveFeatureByProject((prev) => {
      if (prev[selectedProject.id]) return prev;
      return {
        ...prev,
        [selectedProject.id]: selectedProject.features[0]?.id ?? "overview",
      };
    });
  }, [selectedProject]);

  useEffect(() => {
    if (!projectActionNotice) return;
    const timer = setTimeout(() => setProjectActionNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [projectActionNotice]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectActionNotice((prev) =>
      prev?.projectId === projectId ? prev : null
    );
  };

  const handleSelectProjectFeature = (featureId: string) => {
    if (!selectedProject) return;
    setActiveFeatureByProject((prev) => ({
      ...prev,
      [selectedProject.id]: featureId,
    }));
  };

  const handleToggleFeatureChecklist = (checklistId: string) => {
    if (!selectedProject || !selectedProjectFeatureId) return;
    setFeatureChecklistState((prev) => {
      const projectState = prev[selectedProject.id] ?? {};
      const featureState = projectState[selectedProjectFeatureId] ?? {};
      const currentValue = featureState[checklistId];
      return {
        ...prev,
        [selectedProject.id]: {
          ...projectState,
          [selectedProjectFeatureId]: {
            ...featureState,
            [checklistId]: typeof currentValue === "boolean" ? !currentValue : true,
          },
        },
      };
    });
  };

  const handleRunFeatureAction = (actionLabel: string) => {
    if (!selectedProject) return;
    setProjectActionNotice({
      projectId: selectedProject.id,
      message: `${actionLabel} برای ${selectedProject.utn} ثبت شد.`,
    });
  };

  const handleOpenWorkflowModal = (stage: WorkflowStageKey) => {
    setWorkflowModalStage(stage);
    setWorkflowFormTitle("");
    setWorkflowFormTech(technicianOptions[0]);
    setWorkflowFormDate(null);
    setWorkflowFormTime("");
    setWorkflowModalOpen(true);
  };

  const handleAddWorkflow = () => {
    if (!workflowFormTitle.trim()) return;

    const newStageLabel =
      workflowModalStage === "receive"
        ? "در انتظار بررسی"
        : workflowModalStage === "field"
        ? "بازرسی میدانی"
        : "مستندسازی";

    const randomUTN =
      "UTN-" + (1500 + Math.floor(Math.random() * 800)).toString();

    let slaLabel = "بدون موعد";
    if (workflowFormDate && workflowFormTime) {
      const dateStr = workflowFormDate.format("YYYY/MM/DD");
      slaLabel = `${dateStr} · ${workflowFormTime}`;
    } else if (workflowFormDate) {
      slaLabel = workflowFormDate.format("YYYY/MM/DD");
    } else if (workflowFormTime) {
      slaLabel = `ساعت ${workflowFormTime}`;
    }

    const newItem: WorkflowAssignment = {
      id: `wf-${Date.now()}`,
      utn: randomUTN,
      title: workflowFormTitle.trim(),
      tech: workflowFormTech.trim() || "نامشخص",
      stage: newStageLabel,
      sla: slaLabel,
    };

    setWorkflowAssignments((prev) => [...prev, newItem]);
    setWorkflowModalOpen(false);
  };

  // 🔹 هندلرهای بخش پشتیبانی

  const handleTicketFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setTicketFiles(Array.from(e.target.files));
  };

  const handleSubmitTicket = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDescription.trim()) return;

    setTicketSubmitting(true);
    setTicketSuccess(false);

    // اینجا بعداً به API واقعی وصل می‌شود
    await new Promise((res) => setTimeout(res, 900));

    console.log("Support ticket payload", {
      ticketTitle,
      ticketUTN,
      ticketCategory,
      ticketPriority,
      ticketDescription,
      ticketFiles,
    });

    setTicketSubmitting(false);
    setTicketSuccess(true);

    // ریست نرم
    setTicketTitle("");
    setTicketUTN("");
    setTicketDescription("");
    setTicketFiles([]);
    setTicketCategory("بدنه");
    setTicketPriority("medium");
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const now = new Date().toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setChatMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        from: "user",
        text: chatInput.trim(),
        time: now,
      },
    ]);
    setChatInput("");

    // شبیه‌سازی پاسخ مهندس
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          from: "engineer",
          text: "دریافت شد، لطفاً اگر لاگ یا عکس از خطا دارید در اتاق داده ایمن آپلود کنید.",
          time: new Date().toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }, 1200);
  };

  const handleSubmitMeeting = async (e: FormEvent) => {
    e.preventDefault();
    if (!meetingDate || !meetingTime.trim()) return;

    const dateStr = meetingDate.format("YYYY/MM/DD");
    console.log("Meeting request", {
      date: dateStr,
      time: meetingTime,
      duration: meetingDuration,
      mode: meetingMode,
      topic: meetingTopic,
    });

    setMeetingSuccess(true);
    setTimeout(() => {
      setMeetingSuccess(false);
      setMeetingDate(null);
      setMeetingTime("");
      setMeetingDuration("30");
      setMeetingMode("online");
      setMeetingTopic("");
    }, 1200);
  };

  const handleSecureFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSecureSelectedFiles(Array.from(e.target.files));
  };

  const handleUploadSecureFiles = async () => {
    if (secureSelectedFiles.length === 0) return;
    setSecureUploading(true);

    await new Promise((res) => setTimeout(res, 1000));

    const now = new Date().toLocaleString("fa-IR");
    const newItems: SecureFileItem[] = secureSelectedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      name: file.name,
      size: file.size,
      uploadedAt: now,
    }));

    setSecureUploadedFiles((prev) => [...newItems, ...prev]);
    setSecureSelectedFiles([]);
    setSecureUploading(false);
  };

  const handleCloseSupportModal = () => {
    setActiveSupportId(null);
  };

  const handleProjectAction = (
    projectId: string,
    action: "stamp" | "signature"
  ) => {
    setProjectApprovals((prev) => {
      const current = prev[projectId] ?? {
        stampRequested: false,
        signatureRequested: false,
      };
      const updated = {
        ...current,
        ...(action === "stamp"
          ? { stampRequested: true }
          : { signatureRequested: true }),
      };
      return { ...prev, [projectId]: updated };
    });

    const project = projectWorkspaceProjects.find(
      (item) => item.id === projectId
    );
    const projectLabel = project?.utn ?? "پروژه";
    setProjectActionNotice({
      projectId,
      message:
        action === "stamp"
          ? `مهر دیجیتال آسیاکلاس برای ${projectLabel} فعال شد.`
          : `امضای الکترونیکی ${projectLabel} ثبت شد.`,
    });
  };

  return (
    <WorkspaceAppShell>
      {isReportsTab ? (
        <div className="space-y-8" dir="rtl" lang="fa">
          <section className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
            <GlassCard className="p-6 space-y-5 bg-white/90 border border-gray-100 shadow-sm">
              <div className="flex flex-row-reverse items-start justify-between gap-6">
                <div className="flex flex-col items-end gap-3">
                  <div className="flex flex-row-reverse gap-2">
                    {(["week", "month", "quarter"] as ReportRangeKey[]).map(
                      (rangeKey) => (
                        <button
                          key={rangeKey}
                          type="button"
                          onClick={() => setReportRange(rangeKey)}
                          className={`px-3 py-1 rounded-full text-[11px] ${
                            reportRange === rangeKey
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {rangeKey === "week"
                            ? "۷ روز اخیر"
                            : rangeKey === "month"
                            ? "۳۰ روز اخیر"
                            : "۱۳ هفته گذشته"}
                        </button>
                      )
                    )}
                  </div>
                  <div className="flex flex-row-reverse gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExportReports}
                    >
                      خروجی Excel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setReportModalOpen(true)}
                    >
                      ساخت گزارش جدید
                    </Button>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs text-gray-400">
                    {snapshot?.subline ?? "مرکز گزارش‌های ممیزی"}
                  </p>
                  <h2 className="text-[22px] font-semibold text-gray-900">
                    میز گزارش‌گیری و کنترل ممیزی
                  </h2>
                  <p className="text-sm text-gray-500">
                    {snapshot?.priority ??
                      "پیگیری نسخه‌ها تا انتشار در داشبورد مدیران"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {currentReportMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-right"
                  >
                    <p className="text-xs text-gray-500">{metric.label}</p>
                    <p className="text-xl font-semibold text-gray-900 mt-1">
                      {metric.value}
                    </p>
                    <div className="flex flex-row-reverse items-center justify-between text-[11px] mt-1">
                      <span className="text-gray-500">{metric.helper}</span>
                      <span
                        className={`font-medium ${
                          metric.tone === "negative"
                            ? "text-rose-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {metric.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">روند پوشش</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentReportMetrics[0]?.value ?? "۰٪"}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {reportRange === "week"
                        ? "هفت روز اخیر"
                        : reportRange === "month"
                        ? "۳۰ روزه"
                        : "سه‌ماهه"}
                    </span>
                  </div>
                  <AreaSpark
                    data={currentReportSpark}
                    width={360}
                    height={90}
                    color="#2563eb"
                  />
                  <p className="text-[11px] text-gray-500 text-right">
                    این روند نسبت پوشش گزارش‌های تکمیل‌شده نسبت به برنامه
                    اصلی را نشان می‌دهد.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3 text-right">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <h4 className="text-sm font-semibold text-gray-900">
                      ترکیب انواع گزارش
                    </h4>
                    <span className="text-[11px] text-gray-400">
                      {totalActivities} بسته
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Donut
                      data={currentReportDistribution}
                      size={150}
                      centerLabel={
                        currentReportMetrics[0]?.value?.replace("٪", "") ?? "0"
                      }
                    />
                    {topReportType && (
                      <p className="text-xs text-gray-500 mt-2">
                        بیشترین سهم: {topReportType.label} ({topReportPercent}
                        ٪)
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 text-[11px] text-gray-600">
                    {currentReportDistribution.map((item) => (
                      <div
                        key={item.label}
                        className="flex flex-row-reverse items-center justify-between"
                      >
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.label}
                        </span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <h3 className="text-base font-semibold text-gray-900">
                    دروازه‌های کیفیت
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    وضعیت آخرین کنترل‌ها پیش از انتشار
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQualityGateModalOpen(true)}
                >
                  ثبت کنترل جدید
                </Button>
              </div>
              <div className="space-y-3">
                {qualityGates.map((gate) => (
                  <div
                    key={gate.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3 flex flex-col gap-1"
                  >
                    <div className="flex flex-row-reverse items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {gate.title}
                      </p>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${reportGateStatusClasses[gate.status]}`}
                      >
                        {gate.status === "passed"
                          ? "تایید شد"
                          : gate.status === "pending"
                          ? "در انتظار"
                          : "نیاز به اقدام"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{gate.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between flex-row-reverse">
                <h4 className="text-sm font-semibold text-gray-900">
                  شاخص‌های میز گزارش
                </h4>
                <span className="text-[11px] text-gray-400">
                  به‌روزرسانی خودکار
                </span>
              </div>
              <div className="space-y-2">
                {snapshot?.metrics?.map((metric) => (
                  <div
                    key={metric.id}
                    className="rounded-2xl border border-gray-100 px-3 py-2 bg-white"
                  >
                    <div className="flex flex-row-reverse items-center justify-between">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{metric.label}</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {metric.value}
                        </p>
                      </div>
                      {metric.trend && (
                        <span
                          className={`text-[11px] font-medium ${
                            metric.trend.isPositive
                              ? "text-emerald-600"
                              : "text-rose-500"
                          }`}
                        >
                          {metric.trend.value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between flex-row-reverse">
                <h4 className="text-sm font-semibold text-gray-900">
                  نبض عملکرد
                </h4>
                <span className="text-[11px] text-gray-400">
                  بر اساس پایش لحظه‌ای
                </span>
              </div>
              <div className="space-y-3">
                {reportInsightHighlights.map((insight) => (
                  <div
                    key={insight.id}
                    className="rounded-2xl border border-gray-100 px-3 py-2 flex flex-row-reverse items-center justify-between"
                  >
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{insight.title}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {insight.value}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {insight.helper}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between flex-row-reverse">
                <h4 className="text-sm font-semibold text-gray-900">
                  یادآورهای حیاتی
                </h4>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setReminderModalOpen(true)}
                >
                  افزودن
                </Button>
              </div>
              <div className="space-y-2">
                {reportReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-right"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {reminder.title}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {reminder.owner} · {reminder.due}
                    </p>
                  </div>
                ))}
                {!reportReminders.length && (
                  <p className="text-[11px] text-gray-500 text-right">
                    یادآوری فعالی ثبت نشده است.
                  </p>
                )}
              </div>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.5fr,0.9fr]">
            <Card className="p-6 space-y-5">
              <div className="flex flex-col gap-3">
                <div className="flex flex-row-reverse items-center justify-between gap-3">
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-gray-900">
                      صف گزارش‌ها و وضعیت انتشار
                    </h3>
                    <p className="text-xs text-gray-500">
                      مدیریت نسخه‌ها بر اساس کانال و موعد
                    </p>
                  </div>
                  <input
                    type="search"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="جست‌وجوی UTN یا عنوان گزارش..."
                    className="w-56 border border-gray-200 rounded-2xl px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2 justify-start flex-row-reverse">
                  {reportChannelFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setReportOwnerFilter(filter.id)}
                      className={`px-3 py-1 rounded-full text-[11px] ${
                        reportOwnerFilter === filter.id
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-row-reverse gap-2">
                  {reportStatusFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() =>
                        setReportStatusFilter(filter.id as ReportStageFilter)
                      }
                      className={`px-3 py-1 rounded-full text-[11px] ${
                        reportStatusFilter === filter.id
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredReportQueue.length === 0 ? (
                <p className="text-[13px] text-gray-500 text-right py-6">
                  موردی با فیلتر فعلی یافت نشد. فیلترها را تغییر دهید یا عبارت
                  جست‌وجو را حذف کنید.
                </p>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full text-right text-sm">
                    <thead className="text-[11px] text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="py-2 font-medium">UTN</th>
                        <th className="py-2 font-medium">عنوان</th>
                        <th className="py-2 font-medium">مسئول</th>
                        <th className="py-2 font-medium">مرحله</th>
                        <th className="py-2 font-medium">موعد</th>
                        <th className="py-2 font-medium">پیشرفت</th>
                        <th className="py-2 font-medium">پیوست</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] text-gray-700">
                      {filteredReportQueue.map((item) => {
                        const isSelected = focusedReportId === item.id;
                        return (
                          <tr
                            key={item.id}
                            className={`border-b border-gray-50 cursor-pointer ${
                              isSelected
                                ? "bg-blue-50/70"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => setFocusedReportId(item.id)}
                          >
                            <td className="py-3 font-mono text-xs text-gray-500">
                              {item.utn}
                            </td>
                            <td className="py-3">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {item.subject}
                                </span>
                                <span className="text-[11px] text-gray-500">
                                  کانال: {item.channel}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-xs text-gray-600">
                              {item.owner}
                            </td>
                            <td className="py-3">
                              <select
                                value={item.stage}
                                onChange={(e) =>
                                  handleReportStageChange(
                                    item.id,
                                    e.target.value as ReportStage
                                  )
                                }
                                className="w-full border border-gray-200 rounded-xl px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {reportStageOptions.map((stage) => (
                                  <option key={stage} value={stage}>
                                    {stage}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 text-xs text-gray-500">
                              {item.due}
                            </td>
                            <td className="py-3">
                              <div className="flex flex-col gap-1 items-end">
                                <span className="text-xs font-semibold text-gray-900">
                                  {item.completeness}٪
                                </span>
                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{
                                      width: `${item.completeness}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-xs text-gray-500">
                              {item.attachments} فایل ·{" "}
                              <span
                                className={`px-2 py-0.5 rounded-full border ${
                                  item.sensitivity === "محرمانه"
                                    ? "border-rose-200 text-rose-600 bg-rose-50"
                                    : "border-gray-200 text-gray-600 bg-white"
                                }`}
                              >
                                {item.sensitivity}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between flex-row-reverse">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">
                    جزئیات گزارش منتخب
                  </h4>
                  <p className="text-xs text-gray-500">
                    وضعیت هم‌رسانی و پیوست‌ها
                  </p>
                </div>
                {focusedReport && (
                  <span className="text-[11px] font-mono text-gray-500">
                    {focusedReport.utn}
                  </span>
                )}
              </div>

              {!focusedReport ? (
                <p className="text-[13px] text-gray-500 text-right">
                  از لیست گزارش‌ها موردی را انتخاب کنید تا جزئیات آن نمایش
                  داده شود.
                </p>
              ) : (
                <>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 space-y-2 text-right">
                    <div className="flex flex-row-reverse items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {focusedReport.subject}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          مسئول: {focusedReport.owner} · کانال:{" "}
                          {focusedReport.channel}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${reportStageClasses[focusedReport.stage]}`}
                      >
                        {focusedReport.stage}
                      </span>
                    </div>
                    <div className="flex flex-row-reverse items-center justify-between text-[11px] text-gray-500">
                      <span>موعد: {focusedReport.due}</span>
                      <span>
                        وضعیت انتشار:{" "}
                        {sharedReportIds.includes(focusedReport.id)
                          ? "ارسال شده"
                          : "منتظر ارسال"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3 text-center">
                    <div className="rounded-2xl border border-gray-100 px-3 py-2">
                      <p className="text-[11px] text-gray-500">درصد تکمیل</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {focusedReport.completeness}٪
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 px-3 py-2">
                      <p className="text-[11px] text-gray-500">پیوست‌ها</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {focusedReport.attachments} فایل
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 px-3 py-2">
                      <p className="text-[11px] text-gray-500">سطح محرمانگی</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {focusedReport.sensitivity}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row-reverse gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => toggleReportShare(focusedReport.id)}
                    >
                      {sharedReportIds.includes(focusedReport.id)
                        ? "ارسال مجدد به مدیران"
                        : "ارسال به مدیران"}
                    </Button>
                    <Button variant="secondary" size="sm">
                      دانلود نسخه PDF
                    </Button>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-gray-900 text-right">
                  الگوها و کانال‌های اشتراک
                </h5>
                {reportTemplateShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="rounded-2xl border border-gray-100 px-3 py-2 flex flex-row-reverse items-center justify-between"
                  >
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {shortcut.title}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {shortcut.detail}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${shortcut.badgeClass}`}
                    >
                      {shortcut.badge}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <h4 className="text-base font-semibold text-gray-900">
                    منابع کمکی گزارش
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    الگوها و کیت‌های آماده ارائه
                  </p>
                </div>
                <Button variant="secondary" size="sm">
                  مشاهده همه
                </Button>
              </div>
              <div className="space-y-3">
                {knowledgeBaseResources.map((resource) => {
                  const isPinned = pinnedResources.includes(resource.id);
                  return (
                    <div
                      key={resource.id}
                      className="rounded-2xl border border-gray-100 bg-white px-4 py-3 flex flex-row-reverse items-center justify-between gap-4"
                    >
                      <div className="text-right">
                        <div className="flex flex-row-reverse items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {resource.title}
                          </p>
                          {isPinned && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              سنجاق شده
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {resource.detail}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePin(resource.id)}
                        className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >
                        <Icon
                          name={isPinned ? "check" : "plus"}
                          size={16}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <h4 className="text-base font-semibold text-gray-900">
                    مسیرهای هم‌رسانی سریع
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    اتصال مستقیم به کانال‌های مدیریتی
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {reportChannelFilters
                  .filter((filter) => filter.id !== "all")
                  .map((filter) => (
                    <div
                      key={filter.id}
                      className="rounded-2xl border border-dashed border-gray-200 px-4 py-2 flex flex-row-reverse items-center justify-between"
                    >
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          کانال {filter.label}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {filter.id === "QA"
                            ? "ارسال نسخه کامل + پیوست لاگ"
                            : filter.id === "کارگاه"
                            ? "به‌روزرسانی‌های تصویری + چک‌لیست"
                            : "خلاصه مدیریتی و گزارش مقایسه‌ای"}
                        </p>
                      </div>
                      <Button variant="secondary" size="sm">
                        اشتراک
                      </Button>
                    </div>
                  ))}
              </div>
            </Card>
          </section>
        </div>
      ) : isCalendarPathTab ? (
        <TechnicianCalendarPathTab
          onOpenWorkflow={handleOpenWorkflowModal}
        />
      ) : isWorkbenchTab ? (
        <div className="space-y-8" dir="rtl" lang="fa">
          {selectedProject && (
            <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
              <GlassCard className="p-6 space-y-5 bg-white/95 border border-gray-100 shadow-sm">
                <div className="flex flex-row-reverse items-start justify-between gap-4">
                  <div className="text-right space-y-1">
                    <p className="text-xs text-gray-500">
                      اتاق پروژه آسیاصنعت کلاس · اتصال مستقیم با پلتفرم AsiaClass
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900">
                      فضای کاری نقشه + مدارک دیجیتال
                    </h3>
                    <p className="text-xs text-gray-500">{selectedProject.focus}</p>
                  </div>
                  <a
                    href="https://asiaclass.org/en/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] text-blue-700"
                  >
                    AsiaClass.org
                    <Icon name="arrowUpRight" size={12} />
                  </a>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr] items-start">
                  <div className="relative rounded-[28px] border border-gray-200 bg-slate-900 text-white p-5 overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                      }}
                    />
                    <div className="relative space-y-4">
                      <div className="flex flex-row-reverse items-center justify-between text-xs text-white/70">
                        <span className="px-2 py-0.5 rounded-full border border-white/30">
                          {selectedProject.utn}
                        </span>
                        <span>{selectedProject.port}</span>
                      </div>
                      <div className="rounded-2xl border border-white/20 bg-white/5 p-4 min-h-[160px] flex flex-col items-center justify-center text-center space-y-2">
                        <p className="text-sm font-semibold text-white">
                          {selectedProject.vessel}
                        </p>
                        <p className="text-xs text-white/70">{selectedProject.focus}</p>
                        <div className="flex flex-row-reverse gap-2 text-[10px] text-white/80">
                          <span className="px-2 py-0.5 rounded-full border border-white/30">
                            {selectedProject.risk}
                          </span>
                          <span className="px-2 py-0.5 rounded-full border border-white/30">
                            {selectedProject.capa}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-right">
                        {selectedProject.callouts.map((callout) => (
                          <div
                            key={callout.id}
                            className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2"
                          >
                            <p className="text-[10px] text-white/60">{callout.label}</p>
                            <p className="text-sm font-semibold">{callout.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 text-right">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2">
                        <p className="text-[11px] text-gray-500">مسئول پرونده</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedProject.owner}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2">
                        <p className="text-[11px] text-gray-500">موعد</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedProject.due}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-row-reverse items-center justify-between text-[11px] text-gray-500">
                        <span>پیشرفت پرونده</span>
                        <span className="font-semibold text-gray-900">
                          {selectedProject.progress}٪
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${selectedProject.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {selectedProject.features.map((feature) => {
                        const isActive = feature.id === selectedProjectFeatureId;
                        return (
                          <button
                            type="button"
                            key={`${selectedProject.id}-${feature.id}`}
                            onClick={() => handleSelectProjectFeature(feature.id)}
                            className={`text-right rounded-2xl border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              isActive
                                ? "border-blue-400 bg-blue-50"
                                : "border-dashed border-gray-200 bg-gray-50"
                            }`}
                            aria-pressed={isActive}
                          >
                            <div className="flex flex-row-reverse items-center justify-between text-[11px] text-gray-600">
                              <span className={isActive ? "text-blue-700" : "text-gray-600"}>
                                {feature.label}
                              </span>
                              {typeof feature.count === "number" && (
                                <span
                                  className={`font-mono text-sm ${
                                    isActive ? "text-blue-700" : "text-gray-900"
                                  }`}
                                >
                                  {feature.count}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-[10px] mt-1 ${
                                isActive ? "text-blue-500" : "text-gray-400"
                              }`}
                            >
                              {feature.helper}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {selectedProjectFeatureDetail && (
                      <div className="grid gap-3 lg:grid-cols-[1.2fr,0.8fr]">
                        <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 text-right space-y-3">
                          <p className="text-sm text-gray-700">
                            {selectedProjectFeatureDetail.summary}
                          </p>
                          {selectedFeatureChecklistMeta.total > 0 && (
                            <div className="space-y-1">
                              <div className="flex flex-row-reverse items-center justify-between text-[11px] text-gray-500">
                                <span>پیشرفت چک‌لیست</span>
                                <span className="font-semibold text-gray-900">
                                  {selectedFeatureChecklistMeta.completed}/
                                  {selectedFeatureChecklistMeta.total} ·
                                  {selectedFeatureChecklistMeta.percent}%
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500"
                                  style={{
                                    width: `${selectedFeatureChecklistMeta.percent}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                          <div className="grid gap-2 lg:grid-cols-2">
                            {selectedProjectFeatureDetail.highlights.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2"
                              >
                                <p className="text-[10px] text-gray-500">
                                  {item.label}
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {item.value}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2">
                            {selectedProjectFeatureDetail.checklist.map((item) => {
                              const isChecked = selectedFeatureChecklistState?.[item.id];
                              return (
                                <label
                                  key={item.id}
                                  className={`flex items-center justify-between rounded-2xl border px-3 py-2 gap-3 flex-row-reverse cursor-pointer ${
                                    isChecked
                                      ? "border-emerald-300 bg-emerald-50"
                                      : "border-gray-100 bg-white"
                                  }`}
                                >
                                  <div className="flex flex-col items-end">
                                    <span
                                      className={`font-medium ${
                                        isChecked
                                          ? "text-emerald-700"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {item.label}
                                    </span>
                                    {item.note && (
                                      <span className="text-[11px] text-gray-400">
                                        {item.note}
                                      </span>
                                    )}
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={!!isChecked}
                                    onChange={() => handleToggleFeatureChecklist(item.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                </label>
                              );
                            })}
                          </div>
                          <div className="flex flex-wrap gap-2 justify-end">
                            {selectedProjectFeatureDetail.actions.map((action) => (
                              <Button
                                key={action.id}
                                size="sm"
                                variant={action.intent ?? "primary"}
                                onClick={() => handleRunFeatureAction(action.label)}
                              >
                                <div className="flex flex-col">
                                  <span>{action.label}</span>
                                  {action.helper && (
                                    <span className="text-[10px] font-normal opacity-80">
                                      {action.helper}
                                    </span>
                                  )}
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 space-y-3 text-right">
                          <p className="text-xs text-gray-500">
                            خلاصه پیوست‌های امن و رخدادهای اخیر
                          </p>
                          <div className="space-y-2 text-[11px]">
                            {selectedProjectFeatureEvents.length > 0 ? (
                              selectedProjectFeatureEvents.map((event) => (
                                <div
                                  key={event.id}
                                  className="rounded-2xl border border-dashed border-gray-200 px-3 py-2 flex flex-row-reverse items-center justify-between"
                                >
                                  <div className="text-right">
                                    <p className="text-xs font-semibold text-gray-900">
                                      {event.title}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                      {event.detail}
                                    </p>
                                  </div>
                                  <span className="text-[10px] text-gray-400">
                                    {event.time}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-gray-400">
                                No events have been logged yet
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-row-reverse flex-wrap gap-2 text-[11px]">
                      <span
                        className={`px-3 py-1 rounded-full border ${
                          selectedProjectApprovals.stampRequested
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 bg-white text-gray-600"
                        }`}
                      >
                        مهر آسیاصنعت کلاس
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full border ${
                          selectedProjectApprovals.signatureRequested
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-600"
                        }`}
                      >
                        امضای الکترونیکی
                      </span>
                    </div>

                    <div className="flex flex-row-reverse gap-2 flex-wrap">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleProjectAction(selectedProject.id, "stamp")}
                      >
                        ثبت مهر دیجیتال آسیاکلاس
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleProjectAction(selectedProject.id, "signature")}
                      >
                        افزودن امضای فنی
                      </Button>
                    </div>
                    {projectActionNotice?.projectId === selectedProject.id && (
                      <p className="text-[11px] text-emerald-600">
                        {projectActionNotice?.message}
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>

              <Card className="p-5 space-y-4 bg-white/95 border border-gray-100">
                <div className="flex flex-row-reverse items-start justify-between gap-3">
                  <div className="text-right">
                    <h4 className="text-base font-semibold text-gray-900">
                      پروژه‌های فعال تکنسین
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      هر پروژه شامل نمای کلی، مدارک، بازرسی‌ها، گواهینامه‌ها، مهرها و CAPA است.
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-400">مهر + امضای دیجیتال</span>
                </div>

                <div className="space-y-3">
                  {projectWorkspaceProjects.map((project) => {
                    const approvals =
                      projectApprovals[project.id] ?? {
                        stampRequested: false,
                        signatureRequested: false,
                      };
                    const isActive = selectedProject.id === project.id;
                    const activeFeatureId = activeFeatureByProject[project.id];
                    const activeFeatureDetail =
                      (activeFeatureId
                        ? projectFeatureDetails[project.id]?.[activeFeatureId]
                        : undefined) ?? null;
                    const activeChecklist = activeFeatureDetail?.checklist ?? [];
                    const checklistState = activeFeatureId
                      ? featureChecklistState[project.id]?.[activeFeatureId]
                      : undefined;
                    const activeChecklistDone = activeChecklist.reduce(
                      (count, item) =>
                        count + (checklistState?.[item.id] ? 1 : 0),
                      0
                    );
                    const activeChecklistPercent = activeChecklist.length
                      ? Math.round((activeChecklistDone / activeChecklist.length) * 100)
                      : null;
                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => handleSelectProject(project.id)}
                        className={`w-full text-right rounded-2xl border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isActive
                            ? "border-blue-400 bg-blue-50/60 shadow-sm"
                            : "border-gray-100 bg-white hover:border-blue-200"
                        }`}
                      >
                        <div className="flex flex-row-reverse items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {project.title}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {project.location}
                            </p>
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gray-900 text-white">
                            {project.utn}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                          {project.features.map((feature) => (
                            <div
                              key={`${project.id}-${feature.id}`}
                              className={`rounded-xl border px-2 py-1 flex flex-col items-end ${
                                feature.id === activeFeatureId
                                  ? "border-blue-300 bg-blue-50"
                                  : "border-dashed border-gray-200 bg-gray-50/80"
                              }`}
                            >
                              <span className="text-gray-500">{feature.label}</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {typeof feature.count === "number" ? feature.count : "زنده"}
                              </span>
                            </div>
                          ))}
                        </div>
                        {activeFeatureDetail && activeChecklist.length > 0 && (
                          <div className="mt-3 space-y-1 text-[11px] text-gray-500">
                            <div className="flex flex-row-reverse items-center justify-between">
                              <span>
                                چک‌لیست {activeFeatureDetail.summary.replace(/\.$/, "")}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {activeChecklistDone}/{activeChecklist.length}
                                {typeof activeChecklistPercent === "number"
                                  ? ` · ${activeChecklistPercent}%`
                                  : ""}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isActive ? "bg-blue-500" : "bg-emerald-500/70"
                                }`}
                                style={{
                                  width: `${activeChecklistPercent ?? 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex flex-row-reverse items-center justify-between text-[11px] text-gray-500 mt-3">
                          <span>{project.due}</span>
                          <span className="flex items-center gap-1">
                            <span className={approvals.stampRequested ? "text-emerald-600" : "text-gray-500"}>
                              {approvals.stampRequested ? "مهر فعال" : "در انتظار مهر"}
                            </span>
                            <span className="text-gray-300">·</span>
                            <span className={approvals.signatureRequested ? "text-blue-600" : "text-gray-500"}>
                              {approvals.signatureRequested ? "امضا شد" : "بدون امضا"}
                            </span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-8" dir="rtl" lang="fa">
        {/* ردیف بالایی */}
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr_1fr]">
          {/* مرکز عملیات */}
          <GlassCard className="p-6 space-y-5 bg-white/90 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-row-reverse">
              <div className="flex flex-col items-end gap-2">
                <div className="inline-flex rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-[11px] text-gray-600">
                  به‌روزرسانی خودکار هر ۱۵ دقیقه
                </div>

                {/* 🔹 بازه زمانی + دکمه تقویم پرونده‌ها */}
                <div className="flex flex-row-reverse gap-2 items-center">
                  <div className="flex gap-1 flex-row-reverse">
                    <button
                      onClick={() => setTimeRange("today")}
                      className={`px-2 py-1 text-[11px] rounded-full ${
                        timeRange === "today"
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      امروز
                    </button>
                    <button
                      onClick={() => setTimeRange("7d")}
                      className={`px-2 py-1 text-[11px] rounded-full ${
                        timeRange === "7d"
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ۷ روز اخیر
                    </button>
                    <button
                      onClick={() => setTimeRange("30d")}
                      className={`px-2 py-1 text-[11px] rounded-full ${
                        timeRange === "30d"
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ۳۰ روز اخیر
                    </button>
                  </div>

                </div>
              </div>

              <div className="space-y-1 text-right">
                <p className="text-xs text-gray-500">
                  مرکز هماهنگی پرونده‌ها و تیم‌های میدانی
                </p>
                <h2 className="text-[22px] font-semibold text-gray-900">
                  دید لحظه‌ای روی وضعیت پرونده‌های حیاتی
                </h2>
                <p className="text-sm text-gray-500">
                  {snapshot?.subline ??
                    "خلاصه وضعیت این تب در حال آماده‌سازی است"}
                </p>
              </div>
            </div>

            {/* متریک‌ها */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {currentMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-right text-gray-900"
                >
                  <p className="text-xs text-gray-500">{metric.label}</p>
                  <p className="text-xl font-semibold mt-1">{metric.value}</p>
                  <p className="text-[11px] text-gray-500">{metric.helper}</p>
                </div>
              ))}
            </div>

            {/* پایین کارت */}
            <div className="flex items-center justify-between gap-4 flex-row-reverse">
              <div className="text-right">
                <p className="text-[11px] text-gray-500 mb-1">
                  شیفت فعال / اعضای حاضر
                </p>
                <div className="flex flex-row-reverse">
                  {mockAvatars.slice(0, 5).map((avatar: any, index: number) => (
                    <button
                      key={avatar.id || index}
                      type="button"
                      onClick={() => setActiveTechnician(avatar)}
                      className="relative -mr-2 w-8 h-8 rounded-full border-2 border-white shadow-sm bg-gray-200 flex items-center justify-center text-[11px] text-gray-700 overflow-hidden hover:ring-2 hover:ring-blue-400 hover:border-blue-400"
                    >
                      {avatar.imageUrl ? (
                        <img
                          src={avatar.imageUrl}
                          alt={avatar.name || "technician"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        avatar.initials ||
                        (avatar.name && avatar.name[0]) ||
                        "ت"
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  برای مشاهده خلاصه عملکرد، روی تصویر هر تکنسین کلیک کنید
                </p>
              </div>

              <div className="flex flex-row-reverse gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setNoteModalOpen(true)}
                >
                  ثبت یادداشت میدانی
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActionModalOpen(true)}
                >
                  ثبت اقدام اصلاحی
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* خلاصه KPI */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                خلاصه KPI واحد فنی
              </h3>
            </div>
            <div className="space-y-3">
              {quickStats.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-100 bg-white px-4 py-3 flex items-center justify-between"
                >
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {item.value}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      item.tone === "positive"
                        ? "text-emerald-600"
                        : "text-rose-500"
                    }`}
                  >
                    {item.change}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* ترکیب فعالیت تیم */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between flex-row-reverse">
              <span className="text-[11px] text-gray-400">
                {timeRange === "today"
                  ? "امروز"
                  : timeRange === "7d"
                  ? "۷ روز اخیر"
                  : "۳۰ روز اخیر"}
              </span>
              <h3 className="text-base font-semibold text-gray-900 text-right">
                ترکیب فعالیت تیم
              </h3>
            </div>

            <div className="grid md:grid-cols-[1.1fr,1.4fr] gap-4 items-center">
              <div className="flex flex-col items-center gap-2">
                <Donut data={currentDonut} size={150} centerLabel="۹۴" />
                <p className="text-[11px] text-gray-500 text-center">
                  توزیع انواع فعالیت‌های ثبت‌شده در بازه انتخاب‌شده
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <AreaSpark
                  data={currentSpark}
                  width={220}
                  height={80}
                  color="#0ea5e9"
                />
                <div className="flex items-center justify-between text-[11px] text-gray-500 flex-row-reverse">
                  <span>ابتدای دوره</span>
                  <span>اکنون</span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-gray-700 flex-row-reverse">
                    <span>بیشترین سهم فعالیت:</span>
                    <span className="font-semibold">
                      {topActivity.label} · {topActivity.value} ({topPercent}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-500">
                    {currentDonut.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between flex-row-reverse"
                      >
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.label}
                        </span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* مسیر پرونده‌ها */}
        <section>
          <Card className="p-5 space-y-5">
            <div className="flex items-start justify-between flex-row-reverse gap-4">
              <div className="text-right">
                <h3 className="text-lg font-semibold text-gray-900">
                  مسیر پرونده‌ها (Workflow Engine)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  مشاهده مرحله فعلی هر پرونده و ارتباط آن با تکنسین‌ها
                </p>
              </div>
              {/* فیلترها */}
              <div className="flex flex-row-reverse gap-2">
                <button
                  className={`px-3 py-1 rounded-full text-[11px] ${
                    workflowFilter === "mine"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setWorkflowFilter("mine")}
                >
                  پرونده‌های من
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-[11px] ${
                    workflowFilter === "pending"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setWorkflowFilter("pending")}
                >
                  در انتظار تحویل
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-[11px] ${
                    workflowFilter === "all"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setWorkflowFilter("all")}
                >
                  همه پرونده‌ها
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-start flex-row-reverse">
              {Object.entries(workflowStageCounts).map(([title, count]) => (
                <div
                  key={title}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-100 px-3 py-1 text-[11px]"
                >
                  <span className="font-medium text-gray-800">{title}</span>
                  <span className="rounded-full bg-gray-200 text-gray-700 w-5 h-5 flex items-center justify-center text-[10px]">
                    {count}
                  </span>
                </div>
              ))}
            </div>

            {/* سه ستون – تحویل / میدانی / دریافت */}
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {/* تحویل و بستن پرونده */}
              <div className="rounded-3xl bg-white border border-gray-100 shadow-sm flex flex-col min-h-[260px]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900">
                    تحویل و بستن پرونده
                  </h4>
                  <button
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                    onClick={() => handleOpenWorkflowModal("handover")}
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>
                <div className="flex-1 px-3 py-2 space-y-2">
                  {handoverCases.length === 0 && (
                    <p className="text-[11px] text-gray-400 text-center mt-6">
                      پرونده‌ای برای تحویل نیست
                    </p>
                  )}
                  {handoverCases.map((item) => {
                    const isSelected = selectedWorkflowIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border px-3 py-2 space-y-1 text-right cursor-pointer bg-white ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-50/40"
                            : "border-gray-100"
                        }`}
                        onClick={() => toggleWorkflowSelection(item.id)}
                      >
                        <div className="flex items-center justify-between flex-row-reverse">
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <button
                              type="button"
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSelected
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "bg-emerald-50 border-emerald-200 text-transparent"
                              }`}
                            >
                              <Icon name="check" size={10} />
                            </button>
                            <p className="text-xs font-medium text-gray-900">
                              {item.title}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 text-gray-600">
                            {item.utn}
                          </span>
                        </div>
                        <div className="flex items-center justify-between flex-row-reverse text-[10px] text-gray-500">
                          <span>تکنسین: {item.tech}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            آماده بستن
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* اجرای میدانی */}
              <div className="rounded-3xl bg-slate-900 text-white shadow-lg border border-slate-800 flex flex-col min-h-[280px] relative overflow-hidden">
                <div className="absolute inset-y-10 left-0 w-10 bg-gradient-to-l from-transparent to-slate-900/70 pointer-events-none" />
                <div className="absolute inset-y-10 right-0 w-10 bg-gradient-to-r from-transparent to-slate-900/70 pointer-events-none" />

                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/70">
                  <h4 className="text-sm font-semibold">اجرای میدانی</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/40">
                      هسته فعال امروز
                    </span>
                    <button
                      className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
                      onClick={() => handleOpenWorkflowModal("field")}
                    >
                      <Icon name="plus" size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 px-3 py-3 space-y-2">
                  {fieldCases.map((item) => {
                    const isSelected = selectedWorkflowIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl px-3 py-2 space-y-1 cursor-pointer border ${
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-400"
                            : "bg-slate-800/80 border-slate-700"
                        }`}
                        onClick={() => toggleWorkflowSelection(item.id)}
                      >
                        <div className="flex items-center justify-between flex-row-reverse">
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <button
                              type="button"
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSelected
                                  ? "bg-emerald-400 border-emerald-400 text-slate-900"
                                  : "bg-slate-900 border-slate-600 text-transparent"
                              }`}
                            >
                              <Icon name="check" size={10} />
                            </button>
                            <p className="text-xs font-semibold">
                              {item.title}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono bg-slate-900/70 rounded-full px-2 py-0.5 border border-slate-700">
                            {item.utn}
                          </span>
                        </div>
                        <div className="flex items-center justify-between flex-row-reverse text-[10px] text-slate-200/80">
                          <span>تکنسین: {item.tech}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 border border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {item.stage}
                          </span>
                        </div>
                        <div className="flex items-center justify-between flex-row-reverse text-[10px] text-slate-300/80">
                          <span className="opacity-80">SLA: {item.sla}</span>
                          <span className="opacity-60">
                            آخرین بروزرسانی · ۱۳ دقیقه قبل
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* دریافت و ارجاع */}
              <div className="rounded-3xl bg-white border border-gray-100 shadow-sm flex flex-col min-h-[260px]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900">
                    دریافت و ارجاع
                  </h4>
                  <button
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                    onClick={() => handleOpenWorkflowModal("receive")}
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>
                <div className="flex-1 px-3 py-2 space-y-2">
                  {receiveCases.length === 0 && (
                    <p className="text-[11px] text-gray-400 text-center mt-6">
                      موردی در این مرحله نیست
                    </p>
                  )}
                  {receiveCases.map((item) => {
                    const isSelected = selectedWorkflowIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border px-3 py-2 space-y-1 text-right cursor-pointer bg-white ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-50/40"
                            : "border-gray-100"
                        }`}
                        onClick={() => toggleWorkflowSelection(item.id)}
                      >
                        <div className="flex items-center justify-between flex-row-reverse">
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <button
                              type="button"
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSelected
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "bg-white border-gray-300 text-transparent"
                              }`}
                            >
                              <Icon name="check" size={10} />
                            </button>
                            <p className="text-xs font-medium text-gray-900">
                              {item.title}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 text-gray-600">
                            {item.utn}
                          </span>
                        </div>
                        <div className="flex items-center justify-between flex-row-reverse text-[10px] text-gray-500">
                          <span>تکنسین: {item.tech}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {item.sla}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* منابع و پشتیبانی */}
        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 space-y-4 lg:col-span-2">
            <div className="flex flex-row-reverse items-center justify-between">
              <div className="text-right">
                <h4 className="text-base font-semibold text-gray-900">
                  منابع پیشنهادی تیم
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  به‌روزرسانی شده توسط دفتر فنی
                </p>
              </div>
              <Button variant="secondary" size="sm">
                مشاهده آرشیو
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {knowledgeBaseResources.map((resource) => {
                const isPinned = pinnedResources.includes(resource.id);
                return (
                  <div
                    key={resource.id}
                    className="rounded-2xl border border-gray-100 bg-white/95 px-4 py-3 flex flex-row-reverse items-center justify-between gap-3"
                  >
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <p className="text-sm font-medium text-gray-900">
                          {resource.title}
                        </p>
                        {isPinned && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            سنجاق شده
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {resource.detail}
                      </p>
                    </div>
                    <div className="flex flex-row-reverse gap-1 text-gray-500">
                      <button
                        type="button"
                        onClick={() => togglePin(resource.id)}
                        className="w-8 h-8 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Icon name={isPinned ? "check" : "plus"} size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNoteDraft(
                            `${resource.title} - ${resource.detail}`
                          );
                          setNoteModalOpen(true);
                        }}
                        className="w-8 h-8 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Icon name="clipboard" size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 🔹 پشتیبانی و سرویس – نسخه کامل و عملیاتی */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-row-reverse items-center justify-between">
              <div className="text-right">
                <h4 className="text-base font-semibold text-gray-900">
                  پشتیبانی و سرویس
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  تیم موفقیت مشتری همیشه آماده است
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {supportShortcuts.map((shortcut) => {
                const isActive = activeSupportId === shortcut.id;
                return (
                  <button
                    key={shortcut.id}
                    type="button"
                    onClick={() => setActiveSupportId(shortcut.id)}
                    className={`w-full text-right rounded-2xl border px-4 py-3 flex items-center justify-between flex-row-reverse transition ${
                      isActive
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-100 bg-white/95 hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {shortcut.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {shortcut.detail}
                      </p>
                    </div>
                    <Icon
                      name="chevronDown"
                      size={16}
                      className={`transition-transform ${
                        isActive ? "-rotate-90" : "rotate-90"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </Card>
        </section>
        </div>
      )}

      {!isReportsTab && (
        <>
          {/* مدال‌ها */}

          {noteModalOpen && (
        <Modal
          title="ثبت یادداشت میدانی"
          onClose={() => setNoteModalOpen(false)}
        >
          <div className="space-y-3">
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              rows={4}
              placeholder="مثلاً: در بازدید امروز لرزش غیرعادی در محور سمت چپ مشاهده شد..."
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
            />
            <div className="flex justify-end gap-2 flex-row-reverse">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setNoteModalOpen(false)}
              >
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddNote}>
                ذخیره
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {actionModalOpen && (
        <Modal
          title="ثبت اقدام اصلاحی / پیشگیرانه"
          onClose={() => setActionModalOpen(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                توضیح اقدام
              </label>
              <input
                value={actionTitle}
                onChange={(event) => setActionTitle(event.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="مثلاً: هماهنگی با QA برای بازبینی مجدد"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                  مسئول
                </label>
                <input
                  value={actionOwner}
                  onChange={(event) => setActionOwner(event.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                  موعد
                </label>
                <div className="flex items-center gap-2 flex-row-reverse">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={actionHour}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || (+v >= 0 && +v <= 23)) {
                          setActionHour(v);
                        }
                      }}
                      className="w-14 border border-gray-200 rounded-xl px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ساعت"
                    />
                    <span className="text-gray-500 text-xs">:</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={actionMinute}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || (+v >= 0 && +v <= 59)) {
                          setActionMinute(v);
                        }
                      }}
                      className="w-14 border border-gray-200 rounded-xl px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="دقیقه"
                    />
                  </div>

                  <input
                    type="date"
                    value={actionDate}
                    onChange={(e) => setActionDate(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 flex-row-reverse">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActionModalOpen(false)}
              >
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveAction}>
                ذخیره و افزودن
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* مدال افزودن پرونده به مسیر با تقویم شمسی */}
      {workflowModalOpen && (
        <Modal
          title="افزودن پرونده به مسیر"
          onClose={() => setWorkflowModalOpen(false)}
        >
          <div className="space-y-4 text-right">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عنوان پرونده
              </label>
              <input
                value={workflowFormTitle}
                onChange={(e) => setWorkflowFormTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثلاً: بدنه / لرزش غیرعادی"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تکنسین مسئول
              </label>
              <select
                value={workflowFormTech}
                onChange={(e) => setWorkflowFormTech(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {technicianOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SLA / موعد
              </label>
              <div className="flex items-center gap-2 flex-row-reverse">
                <DatePicker
                  value={workflowFormDate}
                  onChange={(value) =>
                    setWorkflowFormDate(
                      value instanceof DateObject ? value : null
                    )
                  }
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  inputClass="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right bg-white"
                  placeholder="انتخاب تاریخ"
                />
                <input
                  type="time"
                  value={workflowFormTime}
                  onChange={(e) => setWorkflowFormTime(e.target.value)}
                  className="w-32 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 flex-row-reverse">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setWorkflowModalOpen(false)}
              >
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddWorkflow}>
                ذخیره و افزودن
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 🔹 مدال‌های اختصاصی پشتیبانی و سرویس */}

      {/* ثبت تیکت */}
      {activeSupportId === "ticket" && (
        <Modal title="ثبت تیکت جدید" onClose={handleCloseSupportModal}>
          <form className="space-y-4 text-right" onSubmit={handleSubmitTicket}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  UTN / شماره پرونده
                </label>
                <input
                  value={ticketUTN}
                  onChange={(e) => setTicketUTN(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثلاً UTN-2045"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  دسته‌بندی
                </label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>بدنه</option>
                  <option>ماشین‌آلات</option>
                  <option>الکتریک</option>
                  <option>سیستم عمومی</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                عنوان تیکت
              </label>
              <input
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثلاً: خطای مکرر در استارت ژنراتور شماره ۲"
              />
            </div>

            <div className="grid grid-cols-[1.5fr,1fr] gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  توضیحات
                </label>
                <textarea
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="شرح مختصر مشکل، شرایط وقوع، و اقداماتی که تاکنون انجام شده..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  اولویت
                </label>
                <div className="flex flex-row-reverse gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setTicketPriority("high")}
                    className={`flex-1 px-2 py-1.5 rounded-xl text-xs border ${
                      ticketPriority === "high"
                        ? "bg-red-50 border-red-400 text-red-700"
                        : "bg-white border-gray-200 text-gray-700"
                    }`}
                  >
                    بحرانی
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketPriority("medium")}
                    className={`flex-1 px-2 py-1.5 rounded-xl text-xs border ${
                      ticketPriority === "medium"
                        ? "bg-amber-50 border-amber-400 text-amber-700"
                        : "bg-white border-gray-200 text-gray-700"
                    }`}
                  >
                    عادی
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketPriority("low")}
                    className={`flex-1 px-2 py-1.5 rounded-xl text-xs border ${
                      ticketPriority === "low"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                        : "bg-white border-gray-200 text-gray-700"
                    }`}
                  >
                    کم‌اهمیت
                  </button>
                </div>

                <label className="block text-xs font-medium text-gray-700 mb-1">
                  فایل‌های ضمیمه
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleTicketFilesChange}
                  className="w-full text-xs"
                />
                {ticketFiles.length > 0 && (
                  <ul className="mt-2 space-y-1 max-h-20 overflow-auto text-xs text-gray-600 border border-dashed border-gray-200 rounded-lg p-2">
                    {ticketFiles.map((file) => (
                      <li key={file.name}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {ticketSuccess && (
              <p className="text-xs text-emerald-600 text-right">
                تیکت با موفقیت ثبت شد و برای واحد پشتیبانی ارسال گردید.
              </p>
            )}

            <div className="flex justify-end gap-2 flex-row-reverse mt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCloseSupportModal}
              >
                بستن
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={ticketSubmitting}
              >
                {ticketSubmitting ? "در حال ارسال..." : "ثبت تیکت"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* چت با مهندس آماده‌باش */}
      {activeSupportId === "chat" && (
        <Modal title="چت با مهندس آماده‌باش" onClose={handleCloseSupportModal}>
          <div className="flex flex-col h-[360px]" dir="rtl">
            <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.from === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                      msg.from === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        msg.from === "user" ? "text-blue-100" : "text-gray-400"
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="خیلی کوتاه مشکل را توضیح دهید و اگر لازم است کد UTN را هم بنویسید..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
              />
              <div className="flex justify-between items-center mt-2 flex-row-reverse">
                <div className="text-[10px] text-gray-400">
                  پاسخ‌های مهندس آماده‌باش در ساعات اداری حداکثر ۱۰ دقیقه طول
                  می‌کشد.
                </div>
                <div className="flex flex-row-reverse gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={handleCloseSupportModal}
                  >
                    بستن
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={handleSendChat}
                  >
                    ارسال پیام
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* رزرو جلسه هم‌آهنگی */}
      {activeSupportId === "meeting" && (
        <Modal title="رزرو جلسه هم‌آهنگی" onClose={handleCloseSupportModal}>
          <form className="space-y-4 text-right" onSubmit={handleSubmitMeeting}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  تاریخ جلسه (شمسی)
                </label>
                <DatePicker
                  value={meetingDate}
                  onChange={(value) =>
                    setMeetingDate(value instanceof DateObject ? value : null)
                  }
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  inputClass="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right bg-white"
                  placeholder="انتخاب تاریخ"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ساعت شروع
                </label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  مدت جلسه
                </label>
                <select
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="30">۳۰ دقیقه</option>
                  <option value="45">۴۵ دقیقه</option>
                  <option value="60">۶۰ دقیقه</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  نوع جلسه
                </label>
                <div className="flex flex-row-reverse gap-2">
                  <button
                    type="button"
                    onClick={() => setMeetingMode("online")}
                    className={`flex-1 px-2 py-1.5 rounded-xl text-xs border ${
                      meetingMode === "online"
                        ? "bg-blue-50 border-blue-400 text-blue-700"
                        : "bg-white border-gray-200 text-gray-700"
                    }`}
                  >
                    آنلاین (لینک)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingMode("onsite")}
                    className={`flex-1 px-2 py-1.5 rounded-xl text-xs border ${
                      meetingMode === "onsite"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                        : "bg-white border-gray-200 text-gray-700"
                    }`}
                  >
                    حضوری / سایت
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                موضوع جلسه
              </label>
              <input
                value={meetingTopic}
                onChange={(e) => setMeetingTopic(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثلاً: هماهنگی تیم بدنه و الکتریک روی پروژه UTN-2045"
              />
            </div>

            {meetingSuccess && (
              <p className="text-xs text-emerald-600">
                درخواست جلسه ثبت شد. زمان‌بندی نهایی از طریق ایمیل و داشبورد به
                شما اطلاع داده می‌شود.
              </p>
            )}

            <div className="flex justify-end gap-2 flex-row-reverse">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCloseSupportModal}
              >
                بستن
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!meetingDate || !meetingTime}
              >
                ثبت درخواست
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* اتاق داده ایمن */}
      {activeSupportId === "secure-room" && (
        <Modal title="اتاق داده ایمن" onClose={handleCloseSupportModal}>
          <div className="space-y-4 text-right">
            <p className="text-xs text-gray-600">
              فایل‌های فنی، نقشه‌ها و لاگ‌های حسّاس را از این بخش آپلود کنید.
              انتقال داده‌ها رمزنگاری شده است و فقط برای تیم کارشناسی قابل
              مشاهده خواهد بود.
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                انتخاب فایل‌ها
              </label>
              <input
                type="file"
                multiple
                onChange={handleSecureFilesChange}
                className="w-full text-xs"
              />
              {secureSelectedFiles.length > 0 && (
                <div className="mt-2 border border-dashed border-gray-200 rounded-lg p-2 max-h-24 overflow-auto">
                  <p className="text-[11px] text-gray-500 mb-1">
                    فایل‌های آماده آپلود:
                  </p>
                  <ul className="space-y-1 text-xs text-gray-700">
                    {secureSelectedFiles.map((file) => (
                      <li key={file.name}>
                        {file.name} · {formatFileSize(file.size)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 flex-row-reverse">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={handleCloseSupportModal}
              >
                بستن
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                disabled={secureSelectedFiles.length === 0 || secureUploading}
                onClick={handleUploadSecureFiles}
              >
                {secureUploading ? "در حال آپلود..." : "آپلود در اتاق ایمن"}
              </Button>
            </div>

            {secureUploadedFiles.length > 0 && (
              <div className="border border-gray-100 rounded-xl p-2 max-h-40 overflow-auto bg-gray-50">
                <p className="text-[11px] text-gray-500 mb-1">
                  فایل‌های آپلود شده اخیر:
                </p>
                <ul className="space-y-1 text-xs text-gray-700">
                  {secureUploadedFiles.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between flex-row-reverse"
                    >
                      <span className="truncate max-w-[60%]">{item.name}</span>
                      <span className="text-gray-400 text-[10px]">
                        {formatFileSize(item.size)} · {item.uploadedAt}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}

      {activeTechnician && (
        <Modal
          title={`خلاصه عملکرد تکنسین: ${
            activeTechnician.name || activeTechnician.fullName || "نامشخص"
          }`}
          onClose={() => setActiveTechnician(null)}
        >
          <div className="space-y-4 text-right text-sm text-gray-700">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-3 flex-row-reverse">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {activeTechnician.imageUrl ? (
                    <img
                      src={activeTechnician.imageUrl}
                      alt={activeTechnician.name || "technician"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-700">
                      {activeTechnician.initials ||
                        (activeTechnician.name && activeTechnician.name[0]) ||
                        "ت"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">
                    {activeTechnician.name ||
                      activeTechnician.fullName ||
                      "تکنسین"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activeTechnician.role || "کارشناس فنی میدانی"}
                  </p>
                </div>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                شیفت فعال
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500">
                پرونده‌های در حال اقدام
              </p>
              <ul className="space-y-1.5 text-sm">
                <li>
                  • UTN-2045 – بازرسی بدنه – مرحله: بازرسی میدانی – زمان
                  صرف‌شده: ۳ ساعت
                </li>
                <li>
                  • UTN-1980 – ماشین‌آلات – مرحله: تحلیل نتایج – زمان صرف‌شده: ۲
                  ساعت
                </li>
                <li>
                  • UTN-1766 – مدارک عمومی – مرحله: مستندسازی – زمان صرف‌شده: ۱
                  ساعت
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">
                تایم‌لاین کاری امروز
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex flex-row-reverse items-center justify-between">
                  <span>شروع شیفت</span>
                  <span className="text-gray-500">۰۸:۰۰</span>
                </div>
                <div className="flex flex-row-reverse items-center justify-between">
                  <span>بازرسی میدانی کشتی A</span>
                  <span className="text-gray-500">۰۹:۰۰ – ۱۱:۰۰</span>
                </div>
                <div className="flex flex-row-reverse items-center justify-between">
                  <span>ثبت گزارش و مستندسازی</span>
                  <span className="text-gray-500">۱۱:۳۰ – ۱۳:۰۰</span>
                </div>
                <div className="flex flex-row-reverse items-center justify-between">
                  <span>هماهنگی با QA و پاسخ به تیکت‌ها</span>
                  <span className="text-gray-500">۱۳:۳۰ – ۱۵:۰۰</span>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-blue-500 rounded-full" />
              </div>
              <p className="text-[11px] text-gray-500">
                حدود ۶۰٪ از برنامه امروز تکمیل شده است. اتصال به تایم‌شیت واقعی
                می‌تواند در این بخش انجام شود.
              </p>
            </div>
          </div>
        </Modal>
      )}
        </>
      )}
    </WorkspaceAppShell>
  );
}

function Modal({
  title,
  children,
  onClose,
  size = "md",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: "md" | "xl";
}) {
  const sizeClass = size === "xl" ? "max-w-5xl" : "max-w-lg";
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div
        className={`w-full ${sizeClass} bg-white rounded-2xl shadow-xl border border-gray-200`}
      >
        <div className="flex items-center justify-between p-4 border-b flex-row-reverse">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"
            onClick={onClose}
            aria-label="بستن"
          >
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function TechnicianDashboard() {
  return (
    <WorkspaceProvider>
      <TechnicianDashboardView />
    </WorkspaceProvider>
  );
}
