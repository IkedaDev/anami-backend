export function santiagoToUtc(dateStr: string, timeStr: string): Date {
  const utcDate = new Date(`${dateStr}T${timeStr}:00.000Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(utcDate);
  
  const map = new Map(parts.map(p => [p.type, p.value]));
  const year = parseInt(map.get("year")!);
  const month = parseInt(map.get("month")!) - 1;
  const day = parseInt(map.get("day")!);
  const hour = parseInt(map.get("hour")!);
  const minute = parseInt(map.get("minute")!);
  const second = parseInt(map.get("second")!);
  
  const localTimeInSantiago = Date.UTC(year, month, day, hour, minute, second);
  const diff = utcDate.getTime() - localTimeInSantiago;
  
  return new Date(utcDate.getTime() + diff);
}

export function getSantiagoStartOfDay(dateStr: string): Date {
  return santiagoToUtc(dateStr, "00:00");
}

export function getSantiagoEndOfDay(dateStr: string): Date {
  const midnight = santiagoToUtc(dateStr, "23:59");
  return new Date(midnight.getTime() + 59 * 1000 + 999);
}

export function getSantiagoTodayDateStr(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const map = new Map(parts.map(p => [p.type, p.value]));
  const year = map.get("year")!;
  const month = map.get("month")!.padStart(2, "0");
  const day = map.get("day")!.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
