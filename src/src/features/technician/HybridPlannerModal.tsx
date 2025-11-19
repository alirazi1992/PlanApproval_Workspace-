import React, { useMemo, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

type PlannerStatus = "planned" | "in-progress" | "done";

type PlannerRow = {
  id: string;
  utn: string;
  title: string;
  technician: string;
  date: DateObject | null;
  time: string;
  status: PlannerStatus;
};

const technicianOptions = [
  "سارا رحیمی",
  "محمد رضوی",
  "مهدی سلیمانی",
  "فاطمه کریمی",
];

const initialRows: PlannerRow[] = [
  {
    id: "pl-2045",
    utn: "UTN-2045",
    title: "بدنه / لرزش غیرعادی",
    technician: "سارا رحیمی",
    date: null,
    time: "",
    status: "planned",
  },
  {
    id: "pl-1980",
    utn: "UTN-1980",
    title: "ماشین‌آلات / نشت روغن",
    technician: "محمد رضوی",
    date: null,
    time: "",
    status: "planned",
  },
  {
    id: "pl-2101",
    utn: "UTN-2101",
    title: "الکتریک / قطع مقطعی",
    technician: "مهدی سلیمانی",
    date: null,
    time: "",
    status: "planned",
  },
];

interface HybridPlannerModalProps {
  open: boolean;
  onClose: () => void;
}

export const HybridPlannerModal: React.FC<HybridPlannerModalProps> = ({
  open,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState<DateObject | null>(
    new DateObject({ calendar: persian, locale: persian_fa })
  );
  const [rows, setRows] = useState<PlannerRow[]>(initialRows);

  if (!open) return null;

  const datesWithTasks = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => {
      if (r.date) s.add(r.date.format("YYYY/MM/DD"));
    });
    return s;
  }, [rows]);

  const handleUpdateRow = (id: string, patch: Partial<PlannerRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleAddRow = () => {
    const newRow: PlannerRow = {
      id: `pl-${Date.now()}`,
      utn: "UTN-" + (1500 + Math.floor(Math.random() * 800)).toString(),
      title: "عنوان جدید برنامه‌ریزی...",
      technician: technicianOptions[0],
      date: selectedDate,
      time: "",
      status: "planned",
    };
    setRows((prev) => [newRow, ...prev]);
  };

  const filteredRows = useMemo(() => {
    if (!selectedDate) return rows;
    const key = selectedDate.format("YYYY/MM/DD");
    return rows.filter((r) => r.date && r.date.format("YYYY/MM/DD") === key);
  }, [rows, selectedDate]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-gray-200">
        {/* header */}
        <div className="flex items-center justify-between p-4 border-b flex-row-reverse">
          <div className="text-right">
            <h3 className="text-base font-bold text-gray-900">
              مسیر ترکیبی پرونده‌ها و میدانی
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              هم‌زمان شکل تقویم و بورد برنامه‌ریزی (سبک Monday.com) برای هماهنگی
              شیفت‌ها و بازدیدهای میدانی.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"
            aria-label="بستن"
          >
            ×
          </button>
        </div>

        {/* body */}
        <div className="p-4 space-y-4" dir="rtl" lang="fa">
          {/* calendar + controls */}
          <div className="grid gap-4 md:grid-cols-[0.9fr,1.6fr] items-start">
            {/* calendar column */}
            <div className="space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3">
                <p className="text-xs font-medium text-gray-700 mb-2 text-right">
                  شکل تقویم کاری تکنسین‌ها
                </p>
                <DatePicker
                  value={selectedDate}
                  onChange={(value) =>
                    setSelectedDate(value instanceof DateObject ? value : null)
                  }
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  numberOfMonths={1}
                  mapDays={({ date }: any) => {
                    const formatted = date.format("YYYY/MM/DD");
                    if (datesWithTasks.has(formatted)) {
                      return {
                        className:
                          "bg-blue-100 text-blue-700 rounded-full font-semibold",
                      };
                    }
                    return {};
                  }}
                  className="custom-calendar w-full"
                  style={{
                    width: "100%",
                  }}
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-3 space-y-2 text-xs text-gray-600">
                <div className="flex flex-row-reverse flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    انجام شده
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    در حال انجام
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    برنامه‌ریزی شده
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  روزهایی که روی تقویم هایلایت شده‌اند، حداقل یک بازدید یا کار
                  ثبت‌شده دارند. با کلیک روی هر روز، فقط همان ردیف‌ها در جدول
                  نمایش داده می‌شوند.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRow}
                className="w-full rounded-2xl border border-dashed border-gray-300 py-2 text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + افزودن ردیف جدید برای این روز
              </button>
            </div>

            {/* board column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    برنامه‌ریزی بازدیدها / کارهای میدانی
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {selectedDate
                      ? `برنامه‌ی روز ${selectedDate.format("YYYY/MM/DD")}`
                      : "برنامه‌ی کلی (تمام روزها)"}
                  </p>
                </div>
              </div>

              <div className="overflow-auto rounded-2xl border border-gray-200">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr className="text-right">
                      <th className="px-3 py-2 font-medium">UTN</th>
                      <th className="px-3 py-2 font-medium">
                        شرح پرونده / کار
                      </th>
                      <th className="px-3 py-2 font-medium">تکنسین مسئول</th>
                      <th className="px-3 py-2 font-medium">تاریخ (شمسی)</th>
                      <th className="px-3 py-2 font-medium">ساعت</th>
                      <th className="px-3 py-2 font-medium">وضعیت</th>
                      <th className="px-3 py-2 font-medium">یادداشت کوتاه</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-gray-100 hover:bg-gray-50/60"
                      >
                        <td className="px-3 py-2 font-mono text-gray-700">
                          {row.utn}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="w-full border border-transparent rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 bg-transparent text-gray-800"
                            value={row.title}
                            onChange={(e) =>
                              handleUpdateRow(row.id, {
                                title: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={row.technician}
                            onChange={(e) =>
                              handleUpdateRow(row.id, {
                                technician: e.target.value,
                              })
                            }
                          >
                            {technicianOptions.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <DatePicker
                            value={row.date}
                            onChange={(value) =>
                              handleUpdateRow(row.id, {
                                date:
                                  value instanceof DateObject
                                    ? value
                                    : row.date,
                              })
                            }
                            calendar={persian}
                            locale={persian_fa}
                            calendarPosition="bottom-right"
                            inputClass="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-right bg-white"
                            placeholder="انتخاب تاریخ"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="time"
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={row.time}
                            onChange={(e) =>
                              handleUpdateRow(row.id, { time: e.target.value })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className={`w-full border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 ${
                              row.status === "done"
                                ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                                : row.status === "in-progress"
                                ? "bg-blue-50 border-blue-400 text-blue-700"
                                : "bg-gray-50 border-gray-300 text-gray-700"
                            }`}
                            value={row.status}
                            onChange={(e) =>
                              handleUpdateRow(row.id, {
                                status: e.target.value as PlannerStatus,
                              })
                            }
                          >
                            <option value="planned">برنامه‌ریزی شده</option>
                            <option value="in-progress">در حال انجام</option>
                            <option value="done">انجام شده</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-gray-400">
                          {row.date
                            ? row.date.format("YYYY/MM/DD")
                            : "بدون تاریخ ثبت‌شده"}
                        </td>
                      </tr>
                    ))}

                    {filteredRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-8 text-center text-gray-400 text-xs"
                        >
                          برای این روز، هنوز برنامه‌ای ثبت نشده است. از دکمه
                          &quot;افزودن ردیف جدید برای این روز&quot; استفاده
                          کنید.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-gray-500">
                💡 در نسخه متصل به بک‌اند می‌توان این بورد را به تیکتینگ،
                تایم‌شیت و تقویم تیمی وصل کرد تا همه چیز به‌صورت خودکار همگام
                شود.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
