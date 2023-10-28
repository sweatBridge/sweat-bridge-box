export function selectWodEventColor(date) {
  const today = new Date();
  const selectedDate = date.toDate();

  today.setHours(0, 0, 0, 0);

  console.log(today)
  console.log(selectedDate)

  if (selectedDate < today) {
    return '#607d8b'; // 오늘보다 이전
  } else {
    return 'rgba(141,227,121,0.99)'; // 오늘 또는 미래
  }
}
