let eventGuid = 0
let todayStr = new Date().toISOString().replace(/T.*$/, '') // YYYY-MM-DD of today

export const INITIAL_EVENTS = [
  {
    id: createEventId(),
    title: 'All-day event',
    start: todayStr,
  },
  {
    id: createEventId(),
    title: 'Timed event',
    start: todayStr + 'T12:00:00',
  },
]

export function createEventId() {
  return String(eventGuid++)
}

export function extractDateTimeFromDocKey(docKey) {
  const year = docKey.substr(0, 4);
  const month = docKey.substr(4, 2);
  const day = docKey.substr(6, 2);
  const startHour = docKey.substr(8, 2);
  const startMin = docKey.substr(10, 2);
  const endHour = docKey.substr(12, 2);
  const endMin = docKey.substr(14, 2);

  return {
    year,
    month,
    day,
    startHour,
    startMin,
    endHour,
    endMin
  };
}
