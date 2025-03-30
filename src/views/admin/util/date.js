// dateStr sample : "2023-10-26"
export function extractDateInKorean(dateStr) {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}월 ${day}일`
}

export function formatDateTime(isoString) {
  const date = new Date(isoString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
}

export function datetimeToSimpleStr(date) {
  // Firebase Timestamp 객체에서 seconds를 밀리초로 변환하여 Date 생성
  const datetime = new Date(date.seconds * 1000);  // seconds를 밀리초로 변환

  const year = datetime.getFullYear();
  const month = String(datetime.getMonth() + 1).padStart(2, '0');
  const day = String(datetime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`
}