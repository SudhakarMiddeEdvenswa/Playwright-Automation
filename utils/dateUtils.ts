import dayjs from "dayjs";

export function getToday(format: string = "YYYY-MM-DD"): string {
  return dayjs().format(format);
}

export function getFutureDate(
  days: number,
  format: string = "YYYY-MM-DD"
): string {
  return dayjs().add(days, "day").format(format);
}

export function getPastDate(
  days: number,
  format: string = "YYYY-MM-DD"
): string {
  return dayjs().subtract(days, "day").format(format);
}

export function convertDateFormat(
  date: Date,
  givenFormat: string,
  expectedFormat: string
): string {
  return dayjs(date, givenFormat).format(expectedFormat);
}

export function getDesiredDate(
  time: string,
  countInDays: number,
  format: string
): string {
  if (time == "Past" || time == "past") {
    return dayjs().subtract(countInDays, "day").format(format);
  } else if (time == "Future" || time == "future") {
    return dayjs().add(countInDays, "day").format(format);
  }
  return dayjs().format(format);
}

export function isDateBefore(date1: string, date2: string): boolean {
  return dayjs(date1).isBefore(dayjs(date2));
}

export function isDateAfter(date1: string, date2: string): boolean {
  return dayjs(date1).isAfter(dayjs(date2));
}

export function isDateEqual(date1: string, date2: string): boolean {
  return dayjs(date1).isSame(dayjs(date2));
}
