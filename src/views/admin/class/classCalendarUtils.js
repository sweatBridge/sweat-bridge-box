let eventGuid = 0
let todayStr = new Date().toISOString().replace(/T.*$/, '') // YYYY-MM-DD of today
function addDate(days) {
  let result = new Date();
  result.setDate(result.getDate() + days);
  return result.toISOString().replace(/T.*$/, '')
}
export const INITIAL_REGISTERD_WODS = [
  // {
  //   id: 'abc',
  //   title: 'WOD-1',
  //   start: addDate(1)
  // },
]
export const INITIAL_EVENTS = [
  // {
  //   id: createEventId(),
  //   title: todayStr + '12001300',
  //   extendedProps: {
  //     coach: '김대현',
  //     cap: 20,
  //   },
  //   start: todayStr + 'T12:00:00',
  //   end: todayStr + 'T13:00:00',
  // },
  // {
  //   id: createEventId(),
  //   title: todayStr + '14001500',
  //   start: todayStr + 'T14:00:00',
  //   end: todayStr + 'T15:00:00',
  // },
]

export function convertDateToKstString(date) {
  const dateUTC = date.toDate()
  const dateKST = new Date(dateUTC.getTime() + (9 * 60 * 60 * 1000))
  return dateKST.toISOString().replace(/T.*$/, '')
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
  }
}

export function extractDateAndTime(datetime) {
  const dt = new Date(datetime)

  // 연도, 월, 일을 추출하여 문자열로 변환
  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, '0') // 월은 0부터 시작하므로 +1 해줌
  const day = String(dt.getDate()).padStart(2, '0')

  // 시간을 추출하여 문자열로 변환
  const hours = String(dt.getHours()).padStart(2, '0')
  const minutes = String(dt.getMinutes()).padStart(2, '0')

  // 추출된 연도, 월, 일과 시간, 분을 조합하여 반환
  const date = `${year}${month}${day}`
  const time = `${hours}${minutes}`

  return {date, time}
}
