export type ConfigValue = string | number | Date | DayjsImpl;
export type DayUnit = "millisecond" | "second" | "minute" | "hour" | "day" | "month" | "year";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(value: number, length = 2) {
  return value.toString().padStart(length, "0");
}

class DayjsImpl {
  private dateValue: Date;

  constructor(value?: ConfigValue) {
    if (value instanceof DayjsImpl) {
      this.dateValue = new Date(value.valueOf());
    } else if (value instanceof Date) {
      this.dateValue = new Date(value.getTime());
    } else if (typeof value === "string" || typeof value === "number") {
      this.dateValue = new Date(value);
    } else {
      this.dateValue = new Date();
    }
  }

  private clone() {
    return new DayjsImpl(this.dateValue);
  }

  calendar(_calendar?: string) {
    return this.clone();
  }

  hour(value?: number) {
    if (value === undefined) {
      return this.dateValue.getHours();
    }
    const next = this.clone();
    next.dateValue.setHours(value);
    return next;
  }

  minute(value?: number) {
    if (value === undefined) {
      return this.dateValue.getMinutes();
    }
    const next = this.clone();
    next.dateValue.setMinutes(value);
    return next;
  }

  add(amount: number, unit: DayUnit) {
    return this.manipulate(amount, unit);
  }

  subtract(amount: number, unit: DayUnit) {
    return this.manipulate(-amount, unit);
  }

  private manipulate(amount: number, unit: DayUnit) {
    const next = this.clone();
    switch (unit) {
      case "year":
        next.dateValue.setFullYear(next.dateValue.getFullYear() + amount);
        break;
      case "month":
        next.dateValue.setMonth(next.dateValue.getMonth() + amount);
        break;
      case "day":
        next.dateValue.setDate(next.dateValue.getDate() + amount);
        break;
      case "hour":
        next.dateValue.setHours(next.dateValue.getHours() + amount);
        break;
      case "minute":
        next.dateValue.setMinutes(next.dateValue.getMinutes() + amount);
        break;
      case "second":
        next.dateValue.setSeconds(next.dateValue.getSeconds() + amount);
        break;
      case "millisecond":
        next.dateValue.setMilliseconds(next.dateValue.getMilliseconds() + amount);
        break;
      default:
        break;
    }
    return next;
  }

  toDate() {
    return new Date(this.dateValue.getTime());
  }

  toISOString() {
    return this.dateValue.toISOString();
  }

  format(pattern: string) {
    const year = this.dateValue.getFullYear();
    const month = this.dateValue.getMonth();
    const day = this.dateValue.getDate();
    const hour = this.dateValue.getHours();
    const minute = this.dateValue.getMinutes();

    let output = pattern;
    output = output.replace(/MMMM/g, MONTH_NAMES[month]);
    output = output.replace(/YYYY/g, year.toString());
    output = output.replace(/MM/g, pad(month + 1));
    output = output.replace(/DD/g, pad(day));
    output = output.replace(/HH/g, pad(hour));
    output = output.replace(/mm/g, pad(minute));
    output = output.replace(/D/g, day.toString());
    return output;
  }

  startOf(unit: DayUnit) {
    const next = this.clone();
    if (unit === "day") {
      next.dateValue.setHours(0, 0, 0, 0);
    } else if (unit === "month") {
      next.dateValue.setDate(1);
      next.dateValue.setHours(0, 0, 0, 0);
    } else if (unit === "year") {
      next.dateValue.setMonth(0, 1);
      next.dateValue.setHours(0, 0, 0, 0);
    }
    return next;
  }

  endOf(unit: DayUnit) {
    const next = this.clone();
    if (unit === "day") {
      next.dateValue.setHours(23, 59, 59, 999);
    } else if (unit === "month") {
      next.dateValue.setMonth(next.dateValue.getMonth() + 1, 0);
      next.dateValue.setHours(23, 59, 59, 999);
    } else if (unit === "year") {
      next.dateValue.setMonth(11, 31);
      next.dateValue.setHours(23, 59, 59, 999);
    }
    return next;
  }

  day() {
    return this.dateValue.getDay();
  }

  month() {
    return this.dateValue.getMonth();
  }

  valueOf() {
    return this.dateValue.valueOf();
  }

  isBefore(other: DayjsImpl) {
    return this.valueOf() < other.valueOf();
  }

  isSame(other: DayjsImpl, unit?: DayUnit) {
    if (!unit) {
      return this.valueOf() === other.valueOf();
    }
    return this.startOf(unit).valueOf() === other.startOf(unit).valueOf();
  }

  isBetween(
    start: DayjsImpl,
    end: DayjsImpl,
    _unit?: DayUnit,
    inclusivity = "()"
  ) {
    const value = this.valueOf();
    let s = start.valueOf();
    let e = end.valueOf();
    if (s > e) {
      [s, e] = [e, s];
    }
    const leftInclusive = inclusivity[0] === "[";
    const rightInclusive = inclusivity[inclusivity.length - 1] === "]";
    const leftOk = leftInclusive ? value >= s : value > s;
    const rightOk = rightInclusive ? value <= e : value < e;
    return leftOk && rightOk;
  }
}

export type Dayjs = DayjsImpl;

export interface DayjsPlugin {
  (option: unknown, DayjsClass: typeof DayjsImpl, factory: DayjsFactory): void;
}

export interface DayjsFactory {
  (value?: ConfigValue): DayjsImpl;
  extend: (plugin?: DayjsPlugin) => void;
  locale: (name?: string) => string;
}

const localeState = { current: "en" };

const dayjs = ((value?: ConfigValue) => new DayjsImpl(value)) as DayjsFactory;

dayjs.extend = (plugin?: DayjsPlugin) => {
  if (typeof plugin === "function") {
    plugin(null, DayjsImpl, dayjs);
  }
};

dayjs.locale = (name?: string) => {
  if (typeof name === "string") {
    localeState.current = name;
  }
  return localeState.current;
};

export default dayjs;
