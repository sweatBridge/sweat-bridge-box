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

export function validateWod(wod) {
  // 제목 검증
  if (!wod.title || wod.title.trim() === '') {
    return { valid: false, error: 'WOD 제목이 필요합니다.' };
  }

  // 날짜 검증
  if (!wod.date || isNaN(Date.parse(wod.date))) {
    return { valid: false, error: '유효한 날짜가 필요합니다.' };
  }

  // 타입 검증
  if (!wod.type || wod.type.trim() === '') {
    return { valid: false, error: 'WOD 타입이 필요합니다.' };
  }

  // 점수 타입 검증
  if (!wod.scoreType || wod.scoreType.trim() === '') {
    return { valid: false, error: '점수 타입이 필요합니다.' };
  }

  // 시간 제한 검증 (형식: MM:SS)
  const timeCapPattern = /^[0-5][0-9]:[0-5][0-9]$/;
  if (!timeCapPattern.test(wod.timeCap)) {
    return { valid: false, error: '유효한 시간 제한 (MM:SS) 형식이 필요합니다.' };
  }

  // 운동 목록 검증
  if (!Array.isArray(wod.movements) || wod.movements.length === 0) {
    return { valid: false, error: '최소 하나의 운동이 필요합니다.' };
  }

  for (const movement of wod.movements) {
    // 운동 이름 검증
    if (!movement.name || movement.name.trim() === '') {
      return { valid: false, error: '운동 이름이 필요합니다.' };
    }

    // 운동 측정 단위 검증
    if (!movement.measure || movement.measure.trim() === '') {
      return { valid: false, error: '운동 측정 단위가 필요합니다.' };
    }

    // 운동 타입 검증
    if (!movement.type || movement.type.trim() === '') {
      return { valid: false, error: '운동 타입이 필요합니다.' };
    }

    // 레벨 설정 검증
    if (!Array.isArray(movement.levelSetting) || movement.levelSetting.length === 0) {
      return { valid: false, error: '최소 하나의 레벨 설정이 필요합니다.' };
    }

    for (const level of movement.levelSetting) {
      if (!level.level || level.level.trim() === '') {
        return { valid: false, error: '레벨 이름이 필요합니다.' };
      }

      if (!['M', 'W', 'None'].includes(level.gender)) {
        return { valid: false, error: '유효한 성별 (M 또는 W)이 필요합니다.' };
      }

      if (!level.requirement || level.requirement.trim() === '') {
        return { valid: false, error: '레벨 요구사항이 필요합니다.' };
      }
    }
  }

  // 모든 검증을 통과하면 valid: true 반환
  return { valid: true };
}
