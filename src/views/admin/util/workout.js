export function selectWodEventColor(date) {
  const today = new Date();
  const selectedDate = date.toDate();

  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return 'rgba(53,69,120,0.89)'; // 오늘보다 이전
  } else {
    return 'rgba(105,143,241,0.99)'; // 오늘 또는 미래
  }
}
