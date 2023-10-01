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
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 3600 * 24))
}

export function convertGenderToKorean(gender) {
  switch(gender) {
    case 'M':
      return '남'
    case 'W':
      return '여'
    default:
      return '알 수 없음'
  }
}
