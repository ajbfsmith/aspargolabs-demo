/** Convert a local date+time in an IANA timezone to a UTC ISO string. */
export function zonedDateTimeToUtcIso(
  date: string,
  time: string,
  timeZone: string,
): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const desiredDate = date;
  const desiredTime = time.length === 5 ? time : time.padStart(5, "0");

  for (let offsetHours = -14; offsetHours <= 14; offsetHours++) {
    const candidate = utcGuess - offsetHours * 60 * 60 * 1000;
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(candidate))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    const localDate = `${parts.year}-${parts.month}-${parts.day}`;
    const localHour =
      parts.hour === "24" ? "00" : parts.hour.padStart(2, "0");
    const localTime = `${localHour}:${parts.minute}`;

    if (localDate === desiredDate && localTime === desiredTime) {
      return new Date(candidate).toISOString();
    }
  }

  return new Date(utcGuess).toISOString();
}
