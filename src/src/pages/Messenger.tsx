import React, {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppShell } from "../components/layout/AppShell";
import { Icon } from "../components/ui/Icon";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils/cn";

interface ChatAttachment {
  id: string;
  type: "image" | "file";
  label: string;
  meta?: string;
  preview?: string;
}

interface ChatMessage {
  id: string;
  author: "executive" | "technician";
  content: string;
  time: string;
  attachments?: ChatAttachment[];
}

interface ChatThread {
  id: string;
  name: string;
  role: string;
  avatar: string;
  presence: "online" | "away" | "offline";
  snippet: string;
  time: string;
  unread?: number;
  typing?: boolean;
  tag?: string;
  channel: "direct" | "team";
  squad: string;
  messages: ChatMessage[];
}

const initialThreads: ChatThread[] = [
  {
    id: "andrew",
    name: "کاپیتان نوری",
    role: "مدیر ارشد عملیات · مرکز آسیاکلاس",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=200&h=200&q=80",
    presence: "online",
    snippet: "گزارش نهایی بازرسی بدنه را قبل از جلسه هیئت‌مدیره نیاز داریم.",
    time: "۰۹:۴۸",
    unread: 2,
    typing: false,
    tag: "Plan Approval",
    channel: "direct",
    squad: "واحد عملیات و بازرسی",
    messages: [
      {
        id: "m-1",
        author: "executive",
        content:
          "سلام، گزارش جمع‌بندی بدنه کشتی MT Aurora را قبل از اتصال هیئت‌مدیره لازم داریم.",
        time: "۰۹:۳۲",
      },
      {
        id: "m-2",
        author: "technician",
        content:
          "تمام نقاط بحرانی طبق استاندارد Asia Classification Society مستند شده. فقط بخش تریم عقب نیاز به توضیح تکمیلی دارد.",
        time: "۰۹:۳۵",
      },
      {
        id: "m-3",
        author: "technician",
        content:
          "بعد از این شیفت، یک راند مرور سریع روی چک‌لیست‌ها بگذاریم؛ همه‌چیز را مرور می‌کنم.",
        time: "۰۹:۳۶",
      },
      {
        id: "m-4",
        author: "executive",
        content:
          "عالیه. آخرین عکس میدانی از اسکله شهید رجایی را هم اینجا پیوست می‌کنی؟",
        time: "۰۹:۴۲",
        attachments: [
          {
            id: "att-1",
            type: "image",
            label: "اسکله ۴ · روز بازرسی بدنه",
            meta: "ثبت‌شده ۰۸:۱۰ · تیم بازرسی بدنه",
            preview:
              "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
          },
        ],
      },
      {
        id: "m-5",
        author: "technician",
        content:
          "در حال آپلود هستم. نسخه دارای مهر تأیید کلاس را هم اضافه می‌کنم.",
        time: "۰۹:۴۵",
      },
    ],
  },
  {
    id: "dwight",
    name: "مهندس شریفی",
    role: "تکنسین ارشد · تیم بازرسی بدنه",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&w=200&h=200&q=80",
    presence: "away",
    snippet: "در حال کالیبره‌کردن سنسورهای ضخامت‌سنجی هستم…",
    time: "۰۹:۱۰",
    channel: "direct",
    squad: "Hull Diagnostics",
    messages: [],
  },
  {
    id: "ops-room",
    name: "اتاق وضعیت عملیات",
    role: "کانال وضعیت ناوگان",
    avatar:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80",
    presence: "online",
    snippet: "استندآپ عملیات در ۱۲ دقیقه دیگر شروع می‌شود.",
    time: "۰۸:۵۵",
    tag: "روزانه",
    channel: "team",
    squad: "مرکز عملیات ناوگان",
    messages: [],
  },
  {
    id: "supply",
    name: "تدارکات و قطعات",
    role: "کانال تدارکات فنی",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=200&h=200&q=80",
    presence: "online",
    snippet: "مانیفست قطعات یدکی در درایو مشترک آپلود شد.",
    time: "دیروز",
    channel: "team",
    squad: "واحد پشتیبانی فنی",
    messages: [],
  },
  {
    id: "executive-bridge",
    name: "پل مدیریت",
    role: "به‌روزرسانی‌های راهبردی",
    avatar:
      "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=200&h=200&q=80",
    presence: "offline",
    snippet: "تأییدیه‌های هیئت‌مدیره برای پروژه‌های جدید جمعه می‌رسد.",
    time: "دیروز",
    channel: "team",
    squad: "ستاد مرکزی AsiaClass",
    messages: [],
  },
];

const pinnedMedia = [
  {
    id: "media-1",
    title: "گزارش تصویری بازرسی بدنه",
    meta: "ارسال‌شده توسط مهندس شریفی · ۲ ساعت پیش",
    preview:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "media-2",
    title: "بریفینگ ایمنی عرشه",
    meta: "ارسال‌شده توسط تیم عملیات · یک روز پیش",
    preview:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80",
  },
];

const sharedFiles = [
  {
    id: "file-1",
    name: "Plan Approval – Final Report.pdf",
    size: "۲.۱ مگابایت",
    owner: "کاپیتان نوری",
    time: "۱ ساعت پیش",
  },
  {
    id: "file-2",
    name: "Checklist – Hull Survey.xlsx",
    size: "۸۶۰ کیلوبایت",
    owner: "مهندس شریفی",
    time: "دیروز",
  },
  {
    id: "file-3",
    name: "Guidelines – ASC Class Rules.docx",
    size: "۵۴۰ کیلوبایت",
    owner: "واحد فنی",
    time: "دوشنبه",
  },
];

const focusBlocks = [
  {
    id: "focus-1",
    title: "استندآپ عملیات ناوگان",
    description: "مرور وضعیت کشتی‌های تحت کلاس AsiaClass",
    time: "۱۰:۳۰",
  },
  {
    id: "focus-2",
    title: "حلقه مدیریت فنی",
    description: "مرور پرونده‌های Plan Approval و Survey",
    time: "۱۳:۱۵",
  },
];

const fallbackAvatar =
  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=facearea&w=200&h=200&q=80";

const emojiPalette = [
  "😀",
  "😁",
  "😂",
  "😊",
  "😍",
  "🤔",
  "😎",
  "🙌",
  "🚢",
  "⚓️",
  "📡",
  "🛠️",
];

type NavTab = "chats" | "ops" | "workspace";
type PillFilter = "all" | "exec" | "tech" | "team";

export function Messenger() {
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [activeNav, setActiveNav] = useState<NavTab>("chats");
  const [selectedChatId, setSelectedChatId] = useState(
    initialThreads[0]?.id ?? ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [composerValue, setComposerValue] = useState("");
  const [messageNotice, setMessageNotice] = useState<string | null>(null);
  const [activePill, setActivePill] = useState<PillFilter>("all");
  const [rightPanelTab, setRightPanelTab] = useState<
    "media" | "files" | "notes"
  >("media");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<
    { type: "audio" | "video"; startedAt: number } | null
  >(null);
  const [callDuration, setCallDuration] = useState("00:00");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedChat =
    threads.find((thread) => thread.id === selectedChatId) ?? threads[0];

  const showNotice = (text: string) => {
    setMessageNotice(text);
    // simple auto-clear
    setTimeout(() => {
      setMessageNotice((prev) => (prev === text ? null : prev));
    }, 3500);
  };

  useEffect(() => {
    if (!activeCall) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - activeCall.startedAt) / 1000);
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const seconds = String(elapsed % 60).padStart(2, "0");
      setCallDuration(`${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall]);

  const handleCallStart = (type: "audio" | "video") => {
    setActiveCall({ type, startedAt: Date.now() });
    setCallDuration("00:00");
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    showNotice(
      type === "audio"
        ? "در حال برقراری تماس صوتی ایمن با تیم مربوطه هستید."
        : "جلسه ویدئویی رمزگذاری‌شده آغاز شد."
    );
  };

  const handleEndCall = () => {
    if (!activeCall) return;
    showNotice(
      activeCall.type === "audio"
        ? "تماس صوتی پایان یافت."
        : "جلسه ویدئویی خاتمه یافت."
    );
    setActiveCall(null);
    setCallDuration("00:00");
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setComposerValue((prev) => `${prev}${emoji}`);
    setIsEmojiPickerOpen(false);
  };

  const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    event.currentTarget.src = fallbackAvatar;
    event.currentTarget.onerror = null;
  };

  // search
  const searchedThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter((thread) =>
      [thread.name, thread.role, thread.snippet]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [threads, searchQuery]);

  // filters
  const filteredChats = useMemo(() => {
    let list = searchedThreads;

    if (activeNav === "chats") {
      list = list.filter((t) => t.channel === "direct");
    } else if (activeNav === "ops") {
      list = list.filter((t) => t.channel === "team");
    }

    if (activePill === "exec") {
      list = list.filter(
        (t) => t.role.includes("مدیر") || t.tag === "Plan Approval"
      );
    } else if (activePill === "tech") {
      list = list.filter((t) => t.role.includes("تکنسین"));
    } else if (activePill === "team") {
      list = list.filter((t) => t.channel === "team");
    }

    return list;
  }, [searchedThreads, activeNav, activePill]);

  const handleComposerSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!composerValue.trim()) {
      showNotice("قبل از ارسال، یک به‌روزرسانی کوتاه برای مدیریت بنویسید.");
      return;
    }

    const newMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      author: "technician",
      content: composerValue.trim(),
      time: "اکنون",
    };

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === selectedChatId
          ? {
              ...thread,
              messages: [...thread.messages, newMessage],
              snippet: composerValue.trim(),
              time: "اکنون",
              unread: undefined,
            }
          : thread
      )
    );

    setComposerValue("");
    setIsEmojiPickerOpen(false);
    showNotice("پیام از طریق مسیر امن داخلی AsiaClass ارسال شد.");
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChat) return;

    const attachment: ChatAttachment = {
      id: `att-${Date.now()}`,
      type: "file",
      label: file.name,
      meta: `${Math.round(file.size / 1024)} KB · پیوست‌شده همین الان`,
    };

    const newMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      author: "technician",
      content: "فایل پیوست‌شده برای بررسی:",
      time: "اکنون",
      attachments: [attachment],
    };

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === selectedChat.id
          ? {
              ...thread,
              messages: [...thread.messages, newMessage],
              snippet: `فایل جدید: ${file.name}`,
              time: "اکنون",
            }
          : thread
      )
    );

    setIsEmojiPickerOpen(false);
    showNotice("فایل برای تیم مربوطه ارسال و در آرشیو داخلی ثبت شد.");
    event.target.value = "";
  };

  const chatActions: Array<{
    icon: string;
    label: string;
    type?: "audio" | "video";
  }> = [
    { icon: "phone", label: "تماس صوتی", type: "audio" },
    { icon: "video", label: "جلسه ویدئویی", type: "video" },
    { icon: "bookmark", label: "پین‌کردن کانال" },
    { icon: "dots", label: "گزینه‌های بیشتر" },
  ];

  return (
    <AppShell fullWidth>
      {/* Full-page canvas */}
      <div
        className="min-h-[calc(100vh-80px)] bg-slate-50 px-3 lg:px-6 py-4"
        dir="rtl"
      >
        {/* header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              پیام‌رسان داخلی Asia Classification Society
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              ASC Infinity Link
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() =>
                showNotice("دعوت همکار جدید در نسخه بعدی فعال می‌شود.")
              }
            >
              <Icon name="users" size={16} className="text-slate-500" />
              دعوت همکار جدید
            </Button>
            <Button
              className="rounded-2xl bg-slate-900 px-4 text-white hover:bg-slate-800"
              onClick={() =>
                showNotice("هادل عملیات در تقویم مرکز عملیات ثبت شد.")
              }
            >
              <Icon name="spark" size={16} className="text-white" />
              شروع هادل عملیات
            </Button>
          </div>
        </div>

        {/* main grid – 100% width */}
        <div className="grid min-h-[calc(100vh-150px)] w-full grid-cols-12 gap-3 lg:gap-4 xl:gap-5">
          {/* LEFT: brand + nav + focus */}
          <section className="col-span-12 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm lg:col-span-3 xl:col-span-2">
            <div className="border-b border-slate-100 p-4 pb-5">
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-4 text-white">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=120&h=120&q=80"
                    alt="ASC Ops Lead"
                    className="h-10 w-10 rounded-2xl border border-white/30 object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  <div>
                    <p className="text-[11px] text-white/70">
                      AsiaClass Fleet Ops Center
                    </p>
                    <p className="text-sm font-semibold">مرکز عملیات ناوگان</p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-white/80">
                  خط مستقیم بین مدیریت، Plan Approval و تیم‌های Survey. وضعیت
                  ناوگان تحت کلاس در لحظه قابل مشاهده است.
                </p>
                <Button
                  variant="secondary"
                  className="mt-3 w-full rounded-2xl border border-white/40 bg-white text-xs font-medium text-slate-900 hover:bg-white/90"
                  onClick={() =>
                    showNotice("لینک نصب اپ AsiaClass به‌زودی اضافه می‌شود.")
                  }
                >
                  نصب اپ پیام‌رسان AsiaClass
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                {(["chats", "ops", "workspace"] as NavTab[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setActiveNav(item)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                      activeNav === item
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span>
                      {item === "chats"
                        ? "گفت‌وگوهای مستقیم"
                        : item === "ops"
                        ? "کانال‌های عملیات"
                        : "فضای کاری و تمرکز"}
                    </span>
                    <Icon
                      name={
                        item === "chats"
                          ? "messageCircle"
                          : item === "ops"
                          ? "layers"
                          : "spark"
                      }
                      size={17}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                بلوک‌های تمرکز امروز
              </p>
              <div className="mt-2 space-y-2">
                {focusBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5"
                  >
                    <p className="text-xs font-semibold text-slate-900">
                      {block.title}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {block.description}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-slate-800">
                      {block.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* MIDDLE LEFT: thread list */}
          <section className="col-span-12 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm md:col-span-4 xl:col-span-3">
            <div className="border-b border-slate-100 p-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Icon
                    name="search"
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="جستجوی همکار، کانال یا واحد…"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pr-9 pl-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300"
                  />
                </div>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  onClick={() =>
                    showNotice("فیلترهای پیشرفته گفتگو در حال توسعه است.")
                  }
                >
                  <Icon name="menu" size={18} />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-end gap-1.5">
                {[
                  { id: "all", label: "همه" },
                  { id: "exec", label: "مدیران" },
                  { id: "tech", label: "تکنسین‌ها" },
                  { id: "team", label: "کانال‌ها" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setActivePill(pill.id as PillFilter)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-medium transition",
                      activePill === pill.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {filteredChats.length === 0 && (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center text-xs text-slate-500">
                  گفت‌وگویی با این فیلتر پیدا نشد. فیلترها را تغییر دهید یا نام
                  واحد دیگری را جستجو کنید.
                </div>
              )}

              <div className="space-y-2.5">
                {filteredChats.map((thread) => {
                  const isActive = thread.id === selectedChat?.id;
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedChatId(thread.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-right transition-all",
                        isActive
                          ? "border-sky-400 bg-sky-50 shadow-sm"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <div className="relative">
                        <img
                          src={thread.avatar}
                          alt={thread.name}
                          className="h-11 w-11 rounded-2xl object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={handleImageError}
                        />
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border border-white",
                            thread.presence === "online"
                              ? "bg-emerald-400"
                              : thread.presence === "away"
                              ? "bg-amber-400"
                              : "bg-slate-400"
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-900">
                          <span className="truncate">{thread.name}</span>
                          <span className="text-[11px] text-slate-500">
                            {thread.time}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                          {thread.snippet}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="truncate">{thread.squad}</span>
                          {thread.tag && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                              {thread.tag}
                            </span>
                          )}
                        </div>
                      </div>
                      {thread.unread && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                          {thread.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* MIDDLE: main chat */}
          <section className="col-span-12 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md md:col-span-5 xl:col-span-5">
            {/* chat header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedChat?.avatar}
                  alt={selectedChat?.name}
                  className="h-12 w-12 rounded-2xl object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span>{selectedChat?.name}</span>
                    {selectedChat?.presence === "online" && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        آنلاین
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{selectedChat?.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {chatActions.map((btn) => {
                  const isActive = Boolean(
                    btn.type && activeCall?.type === btn.type
                  );
                  return (
                    <button
                      key={btn.icon}
                      type="button"
                      aria-label={btn.label}
                      aria-pressed={isActive}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition",
                        isActive &&
                          "border-slate-900 bg-slate-100 text-slate-900"
                      )}
                      onClick={() => {
                        if (btn.type) {
                          if (isActive) {
                            handleEndCall();
                          } else {
                            handleCallStart(btn.type);
                          }
                        } else {
                          showNotice(`${btn.label} به‌زودی فعال می‌شود.`);
                        }
                      }}
                    >
                      <Icon name={btn.icon as any} size={17} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* meta chips */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-700">
                {selectedChat?.channel === "direct"
                  ? "گفت‌وگوی مدیر / تکنسین"
                  : "کانال عملیات ناوگان"}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                مسیر امن داخلی AsiaClass
              </span>
              {selectedChat?.typing && <span>در حال نوشتن…</span>}
            </div>

            {activeCall && (
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-xs text-slate-600">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-900">
                      {activeCall.type === "audio"
                        ? "تماس صوتی ایمن فعال است"
                        : "جلسه ویدئویی ایمن فعال است"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {isMuted ? "میکروفن بی‌صداست" : "میکروفن فعال است"}
                      {activeCall.type === "video" && (
                        <>
                          {" · "}
                          {isCameraOff
                            ? "دوربین خاموش است"
                            : "دوربین روشن است"}
                        </>
                      )}
                      {isScreenSharing && " · اشتراک‌گذاری صفحه فعال"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-900">
                    {callDuration}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 rounded-2xl border px-3 py-1.5",
                      isMuted
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white text-slate-700"
                    )}
                    onClick={() => setIsMuted((prev) => !prev)}
                  >
                    <Icon name={isMuted ? "micOff" : "mic"} size={15} />
                    {isMuted ? "فعال‌سازی صدا" : "بی‌صدا کردن"}
                  </button>
                  {activeCall.type === "video" && (
                    <button
                      type="button"
                      className={cn(
                        "flex items-center gap-1 rounded-2xl border px-3 py-1.5",
                        isCameraOff
                          ? "border-amber-400 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-white text-slate-700"
                      )}
                      onClick={() => setIsCameraOff((prev) => !prev)}
                    >
                      <Icon name={isCameraOff ? "videoOff" : "video"} size={15} />
                      {isCameraOff ? "روشن کردن دوربین" : "خاموش کردن دوربین"}
                    </button>
                  )}
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 rounded-2xl border px-3 py-1.5",
                      isScreenSharing
                        ? "border-sky-400 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-700"
                    )}
                    onClick={() => setIsScreenSharing((prev) => !prev)}
                  >
                    <Icon name="share" size={15} />
                    {isScreenSharing ? "پایان اشتراک‌گذاری" : "اشتراک‌گذاری صفحه"}
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-2xl bg-rose-600 px-3 py-1.5 text-white"
                    onClick={handleEndCall}
                  >
                    <Icon name="phone" size={15} />
                    پایان تماس
                  </button>
                </div>
              </div>
            )}

            {/* messages */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {selectedChat?.messages.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <div className="space-y-2 text-center text-xs text-slate-500">
                    <Icon
                      name="messageCircle"
                      size={26}
                      className="mx-auto text-slate-300"
                    />
                    <p>هنوز پیامی در این کانال ثبت نشده است.</p>
                    <p className="text-[11px]">
                      اولین پیام را ارسال کنید تا گفت‌وگوی عملیات آغاز شود.
                    </p>
                  </div>
                </div>
              )}

              {selectedChat?.messages.map((message) => {
                const isExecutive = message.author === "executive";
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      isExecutive ? "justify-start" : "justify-end"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-3xl px-4 py-3 text-xs shadow-sm",
                        isExecutive
                          ? "bg-slate-50 text-slate-900"
                          : "bg-slate-900 text-white"
                      )}
                    >
                      <p className="leading-relaxed">{message.content}</p>

                      {message.attachments && (
                        <div className="mt-3 space-y-2">
                          {message.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className={cn(
                                "overflow-hidden rounded-2xl border",
                                isExecutive
                                  ? "border-slate-200 bg-white"
                                  : "border-white/20 bg-slate-800/40"
                              )}
                            >
                              {attachment.type === "image" &&
                              attachment.preview ? (
                                <img
                                  src={attachment.preview}
                                  alt={attachment.label}
                                  className="h-44 w-full object-cover"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  onError={handleImageError}
                                />
                              ) : (
                                <div className="flex items-center gap-3 px-4 py-3">
                                  <Icon
                                    name="file"
                                    size={17}
                                    className={cn(
                                      isExecutive
                                        ? "text-slate-500"
                                        : "text-white/80"
                                    )}
                                  />
                                  <div>
                                    <p className="text-xs font-semibold">
                                      {attachment.label}
                                    </p>
                                    {attachment.meta && (
                                      <p className="text-[10px] opacity-70">
                                        {attachment.meta}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="mt-2 text-[10px] opacity-70">
                        {message.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* composer */}
            <form
              onSubmit={handleComposerSubmit}
              className="space-y-1.5 border-t border-slate-100 px-5 py-3"
            >
              <div className="relative flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-700"
                  onClick={handleAttachClick}
                >
                  <Icon name="paperclip" size={18} />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </button>
                <input
                  type="text"
                  value={composerValue}
                  onChange={(event) => {
                    setComposerValue(event.target.value);
                    setMessageNotice(null);
                  }}
                  placeholder="یک به‌روزرسانی کوتاه درباره وضعیت کشتی یا پرونده بنویسید…"
                  className="flex-1 bg-transparent text-right text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  className={cn(
                    "text-slate-500 transition hover:text-slate-700",
                    isEmojiPickerOpen && "text-slate-900"
                  )}
                  aria-expanded={isEmojiPickerOpen}
                  onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                >
                  <Icon name="smile" size={18} />
                </button>
                {isEmojiPickerOpen && (
                  <div className="absolute bottom-14 left-3 z-20 grid w-48 grid-cols-6 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {emojiPalette.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="text-base"
                        onClick={() => handleEmojiSelect(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  ارسال
                  <Icon name="send" size={15} />
                </button>
              </div>
              {messageNotice && (
                <p className="text-right text-[10px] text-slate-500">
                  {messageNotice}
                </p>
              )}
            </form>
          </section>

          {/* RIGHT: info / media / files */}
          <section className="col-span-12 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm md:col-span-3 xl:col-span-2">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                پروفایل کانال
              </p>
              <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>واحد / تیم</span>
                  <span className="font-semibold text-slate-900">
                    {selectedChat?.squad}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>نوع کانال</span>
                  <span className="font-semibold text-slate-900">
                    {selectedChat?.channel === "direct" ? "مستقیم" : "گروهی"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>وضعیت</span>
                  <span
                    className={cn(
                      "font-semibold",
                      selectedChat?.presence === "online"
                        ? "text-emerald-600"
                        : "text-slate-600"
                    )}
                  >
                    {selectedChat?.presence === "online"
                      ? "آنلاین"
                      : "در حال تمرکز"}
                  </span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-2xl border-slate-200 bg-slate-50 text-[11px] text-slate-700"
                  onClick={() => handleCallStart("audio")}
                >
                  <Icon name="phone" size={14} />
                  تماس
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-2xl border-slate-200 bg-slate-50 text-[11px] text-slate-700"
                  onClick={() => handleCallStart("video")}
                >
                  <Icon name="video" size={14} />
                  جلسه
                </Button>
              </div>
            </div>

            {/* right tabs */}
            <div className="flex items-center gap-1 border-b border-slate-100 px-4 py-2 text-[11px]">
              <button
                type="button"
                onClick={() => setRightPanelTab("media")}
                className={cn(
                  "rounded-full px-3 py-1",
                  rightPanelTab === "media"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                رسانه‌ها
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab("files")}
                className={cn(
                  "rounded-full px-3 py-1",
                  rightPanelTab === "files"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                فایل‌ها
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab("notes")}
                className={cn(
                  "rounded-full px-3 py-1",
                  rightPanelTab === "notes"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                یادداشت‌های مدیریت
              </button>
            </div>

            {/* right content */}
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
              {rightPanelTab === "media" && (
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      رسانه‌های پین‌شده
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[11px] text-slate-500"
                      onClick={() =>
                        showNotice("نمایش آرشیو کامل رسانه‌ها (دمو).")
                      }
                    >
                      مشاهده همه
                    </Button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2.5">
                    {pinnedMedia.map((media) => (
                      <button
                        key={media.id}
                        type="button"
                        className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60 text-right hover:border-slate-300"
                        onClick={() =>
                          showNotice(`باز کردن «${media.title}» (دمو).`)
                        }
                      >
                        <img
                          src={media.preview}
                          alt={media.title}
                          className="h-20 w-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={handleImageError}
                        />
                        <div className="px-2.5 py-2">
                          <p className="line-clamp-2 text-[11px] font-semibold text-slate-900">
                            {media.title}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {media.meta}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {rightPanelTab === "files" && (
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      فایل‌های به‌اشتراک‌گذاشته‌شده
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[11px] text-slate-500"
                      onClick={() =>
                        showNotice("مرتب‌سازی و فیلتر فایل‌ها (دمو).")
                      }
                    >
                      سامان‌دهی
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {sharedFiles.map((file) => (
                      <button
                        key={file.id}
                        type="button"
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-right hover:border-slate-300"
                        onClick={() =>
                          showNotice(`باز کردن «${file.name}» (دمو).`)
                        }
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white">
                          <Icon
                            name="file"
                            size={17}
                            className="text-slate-500"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {file.name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {file.size} · {file.time}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {rightPanelTab === "notes" && (
                <div className="space-y-2.5 rounded-3xl border border-slate-200 bg-slate-50/80 p-3.5">
                  <p className="text-xs font-semibold text-slate-900">
                    اولویت‌های مدیریت AsiaClass
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    این بخش برای هم‌راستاسازی بین مدیریت، Plan Approval و
                    تیم‌های Survey استفاده می‌شود. نکات کلیدی هر جلسه را در
                    اینجا ثبت کنید تا همه اعضای تیم در یک صفحه باشند.
                  </p>
                  <Button
                    className="w-full rounded-2xl bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white hover:bg-slate-800"
                    onClick={() =>
                      showNotice("خروجی PDF یادداشت‌های مدیریت (دمو).")
                    }
                  >
                    خروجی گرفتن از یادداشت‌های هم‌راستاسازی
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
