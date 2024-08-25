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

export function hashStrToFourChars(str) {
  // 간단한 해시 함수 (MurmurHash3)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      let chr = str.charCodeAt(i);
      hash = Math.imul(31, hash) + chr | 0;
  }

  // hash 값을 양수로 만들고, base36으로 변환하여 숫자+문자의 문자열로 변환
  let result = Math.abs(hash).toString(36);

  // 결과가 4자리보다 짧다면 0으로 패딩
  return result.padStart(4, '0').substring(0, 4);
}

export function generateWodDocKey(dateStr, title) {
  const date = new Date(dateStr);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  let hashedTitle = hashStrToFourChars(title);

  return `${year}${month}${day}${hashedTitle}`;
}