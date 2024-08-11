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
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - today.getTime()
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

export function getTypeKor(type, ) {
  switch(type) {
    case 'periodPass':
      return '기간권'
    case 'countPass':
      return '횟수권'
    default:
      return '미등록'
  }
}
