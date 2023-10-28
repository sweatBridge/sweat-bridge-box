// dateStr sample : "2023-10-26"
export function extractDateInKorean(dateStr) {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}월 ${day}일`
}
