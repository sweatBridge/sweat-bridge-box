export function calculateAge(birthDate) {
  const today = new Date()
  const birth = new Date(birthDate)

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  // 오늘의 월/일이 생일의 월/일보다 이전일 경우 나이에서 1을 뺌
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

export function calculateRemainingDays(expiryDate) {
  if (expiryDate == 'None') {
    return 'None'
  }

  const expiryDateStr = convertTimestampToString(expiryDate)

  const today = new Date()
  const expiry = new Date(expiryDateStr)
  const diff = expiry.getTime() - today.getTime()

  if (diff <= 0) {
    return 0
  }

  return Math.ceil(diff / (1000 * 3600 * 24))
}

export function convertTimestampToString(timestamp) {
  if (timestamp && timestamp.seconds) {
    const date = new Date(timestamp.seconds * 1000)
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    return formattedDate
  } else {
    return 'None'
  }
}

export function convertRemainingVisits(type, remainingVisits) {
  if (type === 'periodPass') {
    return '무제한'
  } else if (type === 'countPass') {
    return remainingVisits
  } else {
    return 'None'
  }
}

export function convertGenderToKorean(gender) {
  switch(gender) {
    case 'M':
      return '남'
    case 'F':
      return '여'
    default:
      return 'None'
  }
}

export function getTypeKor(type, remainDays) {
  if (remainDays == 0) {
    return '만료'
  }
  switch(type) {
    case 'periodPass':
      return '기간권'
    case 'countPass':
      return '횟수권'
    default:
      return '미등록'
  }
}

export function findMemberById(members, id) {
  for (let i = 0; i < members.length; i++) {
    if (members[i].email === id) {
        return members[i]; // 일치하는 원소를 찾으면 반환
    }
}
return undefined;
}

export function initializeMember(member) {
  let expiryDate = member.remain.expired;
  let remainDays = calculateRemainingDays(expiryDate);
  member.remain.days = remainDays;
  return member;
}

export function removeDaysFromMember(member) {
  if (member.remain && member.remain.days !== undefined) {
    delete member.remain.days;
}
return member;
}