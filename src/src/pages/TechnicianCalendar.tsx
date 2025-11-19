import React, { useEffect, useMemo, useState } from "react";
import { WorkspaceAppShell } from "../components/layout/WorkspaceAppShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Input } from "../components/ui/Input";

export type TechnicianEventStatus =
  | "scheduled"
  | "in-progress"
  | "done"
  | "cancelled";

export type TechnicianEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  technicians: string[];
  team?: string;
  location?: string;
  joinLink?: string;
  description?: string;
  status: TechnicianEventStatus;
};

type ViewMode = "month" | "week";

type FiltersState = {
  status: TechnicianEventStatus[];
  team?: string;
  technician?: string;
  search: string;
};

type ModalState = {
  open: boolean;
  mode: "create" | "edit";
  eventId?: string;
  slotStart?: Date;
  slotEnd?: Date;
};

const techniciansDirectory = [
  "Joseph Gordon",
  "Ari Tan",
  "Karen Samuels",
  "Luca Pereira",
  "Jasper Estrada",
  "Nora Ahmed",
];

const teams = [
  "Electrical team",
  "Hull inspection team",
  "Engine room team",
];

const statusStyles: Record<
  TechnicianEventStatus,
  { badge: string; block: string; borderColor: string }
> = {
  scheduled: {
    badge: "bg-gray-100 text-gray-700 border border-gray-200",
    block: "bg-gray-900/80 text-white",
    borderColor: "border-gray-300",
  },
  "in-progress": {
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
    block: "bg-blue-600/80 text-white",
    borderColor: "border-blue-400",
  },
  done: {
    badge: "bg-green-100 text-green-700 border border-green-200",
    block: "bg-green-600/80 text-white",
    borderColor: "border-green-400",
  },
  cancelled: {
    badge: "bg-red-50 text-red-700 border border-red-200",
    block: "bg-white text-red-600 border border-red-400",
    borderColor: "border-red-400",
  },
};

const statusOptions: { value: TechnicianEventStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in-progress", label: "In-progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const initialEvents: TechnicianEvent[] = [
  {
    id: "evt-1",
    title: "Discovery Call: Joseph Gordon",
    start: new Date("2024-05-26T09:00:00"),
    end: new Date("2024-05-26T10:00:00"),
    technicians: ["Joseph Gordon", "Ari Tan"],
    team: "Electrical team",
    location: "Dry dock control room",
    joinLink: "https://zoom.us/j/123456789",
    description: "Brief the technicians before deploying to the Azura hull.",
    status: "scheduled",
  },
  {
    id: "evt-2",
    title: "Hull ultrasound sweep",
    start: new Date("2024-05-27T13:00:00"),
    end: new Date("2024-05-27T15:30:00"),
    technicians: ["Jasper Estrada", "Nora Ahmed"],
    team: "Hull inspection team",
    location: "Pier 4 - MV Blue Current",
    joinLink: "https://meet.asia-class/internal",
    description: "Full exterior sweep following dry-dock ballast repairs.",
    status: "in-progress",
  },
  {
    id: "evt-3",
    title: "Generator recalibration",
    start: new Date("2024-05-28T08:00:00"),
    end: new Date("2024-05-28T11:00:00"),
    technicians: ["Ari Tan", "Luca Pereira"],
    team: "Electrical team",
    location: "Engine room A",
    description: "Calibrate fuel sensors prior to cargo loading.",
    status: "done",
  },
  {
    id: "evt-4",
    title: "CO2 suppression drill",
    start: new Date("2024-05-29T16:00:00"),
    end: new Date("2024-05-29T17:30:00"),
    technicians: ["Karen Samuels"],
    team: "Engine room team",
    location: "Simulation Bay",
    description: "Refresher for new hire watch keepers.",
    status: "scheduled",
  },
  {
    id: "evt-5",
    title: "Emergency pump retrofit",
    start: new Date("2024-05-30T10:30:00"),
    end: new Date("2024-05-30T13:30:00"),
    technicians: ["Joseph Gordon", "Nora Ahmed"],
    team: "Engine room team",
    location: "Harbor West - Tug 9",
    description: "Swap faulty impellers discovered overnight.",
    status: "in-progress",
  },
  {
    id: "evt-6",
    title: "Thermal imaging walk-through",
    start: new Date("2024-05-31T18:00:00"),
    end: new Date("2024-05-31T19:30:00"),
    technicians: ["Jasper Estrada"],
    team: "Hull inspection team",
    location: "Bulkhead deck B",
    description: "Focus on starboard gaskets.",
    status: "cancelled",
  },
];

const hoursRange = { start: 7, end: 20 };

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, amount: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

const addMonths = (date: Date, amount: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return result;
};

const startOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day; // Sunday start
  return addDays(d, -diff);
};

const endOfWeek = (date: Date) => addDays(startOfWeek(date), 6);

const formatWeekRange = (date: Date) => {
  const start = startOfWeek(date);
  const end = endOfWeek(date);
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `Week of ${formatter.format(start)} – ${formatter.format(end)}`;
};

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const formatTimeLabel = (date: Date) =>
  date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const buildMonthMatrix = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(firstDay);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// Sidebar menu and team selectors -------------------------------------------------
const Sidebar: React.FC<{
  activeMenuItem: string;
  onMenuChange: (value: string) => void;
  activeTeam?: string;
  onSelectTeam: (team?: string) => void;
}> = ({ activeMenuItem, onMenuChange, activeTeam, onSelectTeam }) => {
  const menuItems = ["Bookings", "Availability", "Teams", "Apps", "Workflows"];
  return (
    <aside className="bg-white border border-gray-200 rounded-3xl p-5 flex flex-col justify-between min-w-[260px] max-w-[280px] transition-all duration-300 lg:sticky lg:top-6">
      <div>
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            Asia Class
          </p>
          <h2 className="text-2xl font-semibold text-gray-900">
            Technician Calendar
          </h2>
        </div>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const active = activeMenuItem === item;
            return (
              <button
                key={item}
                className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  active
                    ? "bg-gray-900 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => onMenuChange(item)}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    active ? "bg-amber-400" : "bg-gray-300"
                  }`}
                />
                {item}
              </button>
            );
          })}
        </nav>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Teams
        </p>
        <div className="space-y-2">
          <button
            className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition ${
              !activeTeam
                ? "bg-gray-900 text-white border-gray-900"
                : "text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
            onClick={() => onSelectTeam(undefined)}
          >
            All teams
          </button>
          {teams.map((team) => {
            const active = activeTeam === team;
            return (
              <button
                key={team}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition ${
                  active
                    ? "bg-amber-50 border-amber-400 text-amber-800"
                    : "border-gray-200 text-gray-700 hover:border-gray-400"
                }`}
                onClick={() => onSelectTeam(team)}
              >
                {team}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

// Filter bar ---------------------------------------------------------------------
const FilterBar: React.FC<{
  filters: FiltersState;
  onToggleStatus: (status: TechnicianEventStatus) => void;
  onTeamChange: (team?: string) => void;
  onTechnicianChange: (technician?: string) => void;
}> = ({ filters, onToggleStatus, onTeamChange, onTechnicianChange }) => {
  return (
    <Card className="p-4 flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2 flex-wrap">
        {statusOptions.map((status) => {
          const active = filters.status.includes(status.value);
          return (
            <button
              key={status.value}
              onClick={() => onToggleStatus(status.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                active
                  ? statusStyles[status.value].badge
                  : "border border-gray-200 text-gray-500 hover:text-gray-700"
              }`}
            >
              {status.label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 items-center ml-auto flex-wrap">
        <div className="flex flex-col text-sm">
          <label className="text-xs text-gray-500">Team</label>
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900"
            value={filters.team ?? ""}
            onChange={(e) =>
              onTeamChange(e.target.value ? e.target.value : undefined)
            }
          >
            <option value="">All teams</option>
            {teams.map((team) => (
              <option key={team}>{team}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col text-sm">
          <label className="text-xs text-gray-500">Technician</label>
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900"
            value={filters.technician ?? ""}
            onChange={(e) =>
              onTechnicianChange(
                e.target.value ? e.target.value : undefined
              )
            }
          >
            <option value="">All technicians</option>
            {techniciansDirectory.map((tech) => (
              <option key={tech}>{tech}</option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
};

// Month view ---------------------------------------------------------------------
interface MonthViewProps {
  referenceDate: Date;
  events: TechnicianEvent[];
  onDayClick: (day: Date) => void;
  onEventClick: (id: string) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  referenceDate,
  events,
  onDayClick,
  onEventClick,
}) => {
  const days = useMemo(() => buildMonthMatrix(referenceDate), [referenceDate]);
  const eventsMap = useMemo(() => {
    const map: Record<string, TechnicianEvent[]> = {};
    events.forEach((event) => {
      const key = formatDateKey(event.start);
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [events]);
  const todayKey = formatDateKey(new Date());
  const currentMonth = referenceDate.getMonth();

  return (
    <div className="grid grid-cols-7 gap-3">
      {days.map((day) => {
        const key = formatDateKey(day);
        const isToday = key === todayKey;
        const isCurrentMonth = day.getMonth() === currentMonth;
        const dayEvents = eventsMap[key] ?? [];
        return (
          <div
            key={key + day.getDate()}
            className={`rounded-2xl border p-3 flex flex-col h-40 transition ${
              isCurrentMonth ? "bg-white" : "bg-gray-50 opacity-70"
            } ${isToday ? "border-amber-400" : "border-gray-200"}`}
          >
            <button
              className="flex items-center justify-between text-xs font-medium text-gray-600"
              onClick={() => onDayClick(day)}
            >
              <span>{day.toLocaleDateString("en-US", { day: "numeric" })}</span>
              {isToday && (
                <span className="text-[10px] text-amber-500 font-semibold">
                  Today
                </span>
              )}
            </button>
            <div className="mt-2 space-y-2 overflow-auto">
              {dayEvents.map((event) => (
                <button
                  key={event.id}
                  className={`w-full text-left text-[11px] px-2 py-1 rounded-xl transition group ${
                    statusStyles[event.status].block
                  }`}
                  onClick={() => onEventClick(event.id)}
                >
                  <p className="font-semibold truncate">{event.title}</p>
                  <p className="text-[10px] opacity-80">
                    {`${formatTimeLabel(event.start)} – ${formatTimeLabel(
                      event.end
                    )}`}
                  </p>
                  <div className="absolute z-10 hidden group-hover:block bg-white text-gray-700 text-xs shadow-lg rounded-xl p-2 mt-1">
                    <p className="font-semibold">{event.title}</p>
                    <p>{event.location ?? "No location"}</p>
                    <p>{event.team ?? "No team"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Week view ----------------------------------------------------------------------
interface WeekViewProps {
  referenceDate: Date;
  events: TechnicianEvent[];
  onSlotClick: (slotStart: Date, slotEnd: Date) => void;
  onEventClick: (id: string) => void;
}

const WeekView: React.FC<WeekViewProps> = ({
  referenceDate,
  events,
  onSlotClick,
  onEventClick,
}) => {
  const weekStart = startOfWeek(referenceDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const hours = Array.from(
    { length: hoursRange.end - hoursRange.start },
    (_, index) => hoursRange.start + index
  );

  const eventsByDay = useMemo(() => {
    const map: Record<string, TechnicianEvent[]> = {};
    days.forEach((day) => {
      const key = formatDateKey(day);
      map[key] = [];
    });
    events.forEach((event) => {
      const key = formatDateKey(event.start);
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [days, events]);

  const totalMinutes = (hoursRange.end - hoursRange.start) * 60;

  const getPosition = (event: TechnicianEvent) => {
    const startMinutes =
      event.start.getHours() * 60 + event.start.getMinutes() -
      hoursRange.start * 60;
    const duration =
      (event.end.getTime() - event.start.getTime()) / (1000 * 60);
    const top = Math.max(0, (startMinutes / totalMinutes) * 100);
    const height = Math.max(8, (duration / totalMinutes) * 100);
    return { top: `${top}%`, height: `${height}%` };
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-8">
          <div />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="text-sm font-semibold text-gray-600 text-center pb-2"
            >
              {day.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-8 border-t border-gray-200">
          <div className="border-r border-gray-200">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-24 text-xs text-gray-500 flex items-start justify-end pr-3 border-b border-gray-100"
              >
                {hour}:00
              </div>
            ))}
          </div>
          {days.map((day) => {
            const key = formatDateKey(day);
            const dayEvents = eventsByDay[key] ?? [];
            return (
              <div key={key} className="relative border-r border-gray-100">
                {hours.map((hour) => {
                  const slotStart = new Date(day);
                  slotStart.setHours(hour, 0, 0, 0);
                  const slotEnd = new Date(slotStart);
                  slotEnd.setHours(hour + 1, 0, 0, 0);
                  return (
                    <button
                      key={`${key}-${hour}`}
                      className="block h-24 w-full border-b border-gray-100 hover:bg-gray-50"
                      onClick={() => onSlotClick(slotStart, slotEnd)}
                    />
                  );
                })}
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    className={`absolute left-2 right-2 rounded-2xl px-3 py-2 text-left text-xs shadow-md overflow-hidden group ${
                      statusStyles[event.status].block
                    } ${statusStyles[event.status].borderColor}`}
                    style={getPosition(event)}
                    onClick={() => onEventClick(event.id)}
                  >
                    <p className="font-semibold text-sm truncate">
                      {event.title}
                    </p>
                    <p className="opacity-80 text-[11px]">
                      {formatTimeLabel(event.start)} – {formatTimeLabel(event.end)}
                    </p>
                    <div className="absolute left-full top-0 ml-2 hidden group-hover:flex flex-col bg-white text-gray-700 text-xs rounded-xl shadow-lg p-2 min-w-[180px]">
                      <span className="font-semibold">{event.title}</span>
                      <span>{event.location ?? "No location"}</span>
                      <span>{event.team ?? "No team"}</span>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Event modal --------------------------------------------------------------------
interface EventModalProps {
  state: ModalState;
  event?: TechnicianEvent;
  onClose: () => void;
  onCreate: (event: Omit<TechnicianEvent, "id">) => void;
  onUpdate: (id: string, event: Omit<TechnicianEvent, "id">) => void;
  onDelete: (id: string) => void;
}

const EventModal: React.FC<EventModalProps> = ({
  state,
  event,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const baseStart = state.slotStart ?? event?.start ?? new Date();
  const baseEnd = state.slotEnd ?? event?.end ?? addHours(baseStart, 1);

  const [title, setTitle] = useState(event?.title ?? "");
  const [start, setStart] = useState(baseStart);
  const [end, setEnd] = useState(baseEnd);
  const [selectedTeam, setSelectedTeam] = useState(event?.team ?? teams[0]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>(
    event?.technicians ?? []
  );
  const [location, setLocation] = useState(event?.location ?? "");
  const [joinLink, setJoinLink] = useState(event?.joinLink ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [status, setStatus] = useState<TechnicianEventStatus>(
    event?.status ?? "scheduled"
  );

  useEffect(() => {
    setTitle(event?.title ?? "");
    setStart(state.slotStart ?? event?.start ?? new Date());
    setEnd(state.slotEnd ?? event?.end ?? addHours(state.slotStart ?? event?.start ?? new Date(), 1));
    setSelectedTeam(event?.team ?? teams[0]);
    setSelectedTechnicians(event?.technicians ?? []);
    setLocation(event?.location ?? "");
    setJoinLink(event?.joinLink ?? "");
    setDescription(event?.description ?? "");
    setStatus(event?.status ?? "scheduled");
  }, [event, state.slotStart, state.slotEnd]);

  if (!state.open) return null;

  const toggleTechnician = (name: string) => {
    setSelectedTechnicians((prev) =>
      prev.includes(name) ? prev.filter((tech) => tech !== name) : [...prev, name]
    );
  };

  const updateDate = (type: "start" | "end", value: string, part: "date" | "time") => {
    const setter = type === "start" ? setStart : setEnd;
    const current = type === "start" ? start : end;
    const updated = new Date(current);
    if (part === "date") {
      const [year, month, day] = value.split("-").map(Number);
      updated.setFullYear(year, month - 1, day);
    } else {
      const [hour, minute] = value.split(":").map(Number);
      updated.setHours(hour, minute);
    }
    setter(updated);
  };

  const handleSubmit = () => {
    const payload: Omit<TechnicianEvent, "id"> = {
      title,
      start,
      end,
      technicians: selectedTechnicians,
      team: selectedTeam,
      location,
      joinLink,
      description,
      status,
    };
    if (state.mode === "edit" && event) {
      onUpdate(event.id, payload);
    } else {
      onCreate(payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (event && window.confirm("Delete this event?")) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">
              {state.mode === "create" ? "Create booking" : "Edit booking"}
            </p>
            <h3 className="text-2xl font-semibold text-gray-900">
              {state.mode === "create" ? "New technician event" : title || event?.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {state.mode === "edit" && (
              <button
                className="text-sm text-red-500 hover:text-red-700"
                onClick={handleDelete}
                aria-label="Delete event"
              >
                Delete
              </button>
            )}
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Discovery Call: Joseph Gordon"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Start date</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-xl px-3 py-2"
              value={start.toISOString().slice(0, 10)}
              onChange={(e) => updateDate("start", e.target.value, "date")}
            />
            <input
              type="time"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 mt-2"
              value={start.toISOString().slice(11, 16)}
              onChange={(e) => updateDate("start", e.target.value, "time")}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">End date</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-xl px-3 py-2"
              value={end.toISOString().slice(0, 10)}
              onChange={(e) => updateDate("end", e.target.value, "date")}
            />
            <input
              type="time"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 mt-2"
              value={end.toISOString().slice(11, 16)}
              onChange={(e) => updateDate("end", e.target.value, "time")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Team</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2"
              value={selectedTeam ?? ""}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              {teams.map((team) => (
                <option key={team}>{team}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Status</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as TechnicianEventStatus)
              }
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Guests / Technicians</p>
          <div className="flex flex-wrap gap-2">
            {techniciansDirectory.map((tech) => {
              const active = selectedTechnicians.includes(tech);
              return (
                <button
                  key={tech}
                  onClick={() => toggleTechnician(tech)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition ${
                    active
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {tech}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3">
            {selectedTechnicians.map((tech) => (
              <span
                key={tech}
                className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs"
              >
                {getInitials(tech)}
              </span>
            ))}
            {selectedTechnicians.length === 0 && (
              <span className="text-xs text-gray-400">
                No technicians selected
              </span>
            )}
          </div>
        </div>

        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location not yet added"
        />

        <div>
          <Input
            label="Call Out There"
            value={joinLink}
            onChange={(e) => setJoinLink(e.target.value)}
            placeholder="Join with Zoom"
          />
          {joinLink && (
            <a
              href={joinLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 underline mt-1 inline-block"
            >
              Open call link
            </a>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500">Description</label>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-2 mt-1"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add mission details, safety notes, or attachments"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title}>
            {state.mode === "create" ? "Create" : "Save"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const addHours = (date: Date, hours: number) => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

// Main page ----------------------------------------------------------------------
export function TechnicianCalendar() {
  const [events, setEvents] = useState<TechnicianEvent[]>(initialEvents);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<FiltersState>({
    status: statusOptions.map((option) => option.value),
    team: undefined,
    technician: undefined,
    search: "",
  });
  const [activeMenuItem, setActiveMenuItem] = useState("Bookings");
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    mode: "create",
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalState((prev) => ({ ...prev, open: false }));
      }
    };
    if (modalState.open) {
      window.addEventListener("keydown", handler);
    }
    return () => window.removeEventListener("keydown", handler);
  }, [modalState.open]);

  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      if (!filters.status.includes(event.status)) return false;
      if (filters.team && event.team !== filters.team) return false;
      if (
        filters.technician &&
        !event.technicians.includes(filters.technician)
      )
        return false;
      if (filters.search.trim()) {
        const target = `${event.title} ${event.location ?? ""} ${event.team ?? ""} ${event.technicians.join(",")}`.toLowerCase();
        if (!target.includes(filters.search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [events, filters]);

  const weekEvents = useMemo(() => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    return visibleEvents.filter(
      (event) => event.start >= start && event.start <= addDays(end, 1)
    );
  }, [selectedDate, visibleEvents]);

  const monthEvents = useMemo(() => {
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const end = addMonths(start, 1);
    return visibleEvents.filter(
      (event) => event.start >= start && event.start < end
    );
  }, [selectedDate, visibleEvents]);

  const openCreateModal = (slotStart?: Date, slotEnd?: Date) => {
    setModalState({ open: true, mode: "create", slotStart, slotEnd });
  };

  const openEditModal = (eventId: string) => {
    setModalState({ open: true, mode: "edit", eventId });
  };

  const closeModal = () => setModalState((prev) => ({ ...prev, open: false }));

  const selectedEvent = modalState.eventId
    ? events.find((event) => event.id === modalState.eventId)
    : undefined;

  const handleCreateEvent = (newEvent: Omit<TechnicianEvent, "id">) => {
    setEvents((prev) => [
      ...prev,
      {
        ...newEvent,
        id: `evt-${Date.now()}`,
      },
    ]);
  };

  const handleUpdateEvent = (id: string, updated: Omit<TechnicianEvent, "id">) => {
    setEvents((prev) => prev.map((event) => (event.id === id ? { ...updated, id } : event)));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const handleNavigate = (direction: "prev" | "next") => {
    setSelectedDate((prev) =>
      viewMode === "month"
        ? addMonths(prev, direction === "next" ? 1 : -1)
        : addDays(prev, direction === "next" ? 7 : -7)
    );
  };

  const handleToday = () => setSelectedDate(new Date());

  const handleSearch = (value: string) =>
    setFilters((prev) => ({ ...prev, search: value }));

  const handleMenuSelect = (item: string) => setActiveMenuItem(item);

  const handleTeamSelect = (team?: string) =>
    setFilters((prev) => ({ ...prev, team }));

  const createDefaultEvent = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    openCreateModal(now, addHours(now, 1));
  };

  const currentSectionLabel = `Current section: ${filters.team ?? activeMenuItem}`;

  return (
    <WorkspaceAppShell>
      <div className="flex flex-col lg:flex-row gap-6">
        <Sidebar
          activeMenuItem={activeMenuItem}
          onMenuChange={handleMenuSelect}
          activeTeam={filters.team}
          onSelectTeam={handleTeamSelect}
        />
        <div className="flex-1 space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div>
                <p className="text-xs text-gray-500">Technician Command Center</p>
                <h1 className="text-3xl font-semibold text-gray-900">
                  {viewMode === "month"
                    ? formatMonthLabel(selectedDate)
                    : formatWeekRange(selectedDate)}
                </h1>
                <p className="text-xs text-gray-500">{currentSectionLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleNavigate("prev")}>
                  ◀
                </Button>
                <Button variant="secondary" size="sm" onClick={handleToday}>
                  Today
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleNavigate("next")}>
                  ▶
                </Button>
                <div className="inline-flex bg-gray-100 rounded-full p-1">
                  {["month", "week"].map((mode) => (
                    <button
                      key={mode}
                      className={`px-4 py-1 text-sm font-medium rounded-full transition ${
                        viewMode === mode
                          ? "bg-white shadow text-gray-900"
                          : "text-gray-500"
                      }`}
                      onClick={() => setViewMode(mode as ViewMode)}
                    >
                      {mode === "month" ? "Month" : "Week"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Card className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Icon name="search" className="text-gray-400" size={18} />
                <input
                  className="flex-1 border border-gray-200 rounded-2xl px-4 py-2 text-sm"
                  placeholder="Search tickets, events, notes"
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <Button onClick={createDefaultEvent}>
                <Icon name="plus" className="mr-2" />
                Create New
              </Button>
              <button
                className="relative p-2 rounded-full border border-gray-200 text-gray-500 hover:text-gray-900"
                onClick={() => {
                  setShowNotifications((prev) => !prev);
                  setShowSettingsPanel(false);
                }}
              >
                <Icon name="bell" />
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 text-sm text-gray-600">
                    <p className="font-semibold text-gray-900 mb-1">
                      Notifications
                    </p>
                    <p>Next audit readiness check is due in 2 days.</p>
                  </div>
                )}
              </button>
              <button
                className="relative p-2 rounded-full border border-gray-200 text-gray-500 hover:text-gray-900"
                onClick={() => {
                  setShowSettingsPanel((prev) => !prev);
                  setShowNotifications(false);
                }}
              >
                <Icon name="settings" />
                {showSettingsPanel && (
                  <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 text-sm text-gray-600">
                    <p className="font-semibold text-gray-900 mb-1">Quick settings</p>
                    <p>Working hours: 07:00 – 20:00</p>
                  </div>
                )}
              </button>
            </Card>
          </div>

          <FilterBar
            filters={filters}
            onToggleStatus={(status) =>
              setFilters((prev) => ({
                ...prev,
                status: prev.status.includes(status)
                  ? prev.status.filter((item) => item !== status)
                  : [...prev.status, status],
              }))
            }
            onTeamChange={(team) => setFilters((prev) => ({ ...prev, team }))}
            onTechnicianChange={(technician) =>
              setFilters((prev) => ({ ...prev, technician }))
            }
          />

          <Card className="p-4">
            {viewMode === "month" ? (
              <MonthView
                referenceDate={selectedDate}
                events={monthEvents}
                onDayClick={(day) => {
                  setSelectedDate(day);
                  const defaultStart = new Date(day);
                  defaultStart.setHours(9, 0, 0, 0);
                  openCreateModal(defaultStart, addHours(defaultStart, 1));
                }}
                onEventClick={openEditModal}
              />
            ) : (
              <WeekView
                referenceDate={selectedDate}
                events={weekEvents}
                onSlotClick={(slotStart, slotEnd) => {
                  setSelectedDate(slotStart);
                  openCreateModal(slotStart, slotEnd);
                }}
                onEventClick={openEditModal}
              />
            )}
          </Card>
        </div>
      </div>

      <EventModal
        state={modalState}
        event={selectedEvent}
        onClose={closeModal}
        onCreate={handleCreateEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
      />
    </WorkspaceAppShell>
  );
}

export default TechnicianCalendar;
