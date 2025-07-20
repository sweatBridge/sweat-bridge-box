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
  if (expiryDate == '-') {
    return '-'
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
    return '-'
  }
}

export function convertRemainingVisits(type, remainingVisits) {
  if (type === 'periodPass') {
    return '무제한'
  } else if (type === 'countPass') {
    return remainingVisits
  } else {
    return '-'
  }
}

export function convertGenderToKorean(gender) {
  switch(gender) {
    case 'M':
      return '남'
    case 'F':
      return '여'
    default:
      return '-'
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
      return '-'
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

export function getCurrentMemberships(memberships) {
  return memberships.filter(membership => {
    // startDate와 endDate가 유효한지 확인
    const startDate = membership.startDate && membership.startDate.seconds ? new Date(membership.startDate.seconds * 1000) : null
    const endDate = membership.endDate && membership.endDate.seconds ? new Date(membership.endDate.seconds * 1000) : null
    
    // startDate나 endDate가 유효하지 않으면 필터에서 제외
    if (!startDate || !endDate) {
      console.warn('유효하지 않은 날짜 데이터:', membership)
      return false
    }
  
    const today = new Date()
    return today >= startDate && today <= endDate
  })
}

export function getMembershipInfo(membership) {
  if (!membership) {
    return {
      type: '-',
      expiryDate: '-',
      remainingDays: '-',
      remainingVisits: '-'
    }
  }

  // 등록 타입
  let type = '미등록'
  if (membership.type) {
    switch(membership.type) {
      case 'periodPass':
        type = '기간권'
        break
      case 'countPass':
        type = '횟수권'
        break
    }
  }

  // 만료 일자
  const expiryDate = membership.endDate ? convertTimestampToString(membership.endDate) : '-'

  // 잔여 기간
  let remainingDays = '-'
  if (membership.endDate) {
    const today = new Date()
    const endDate = new Date(membership.endDate.seconds * 1000)
    const diff = endDate.getTime() - today.getTime()
    if (diff > 0) {
      const days = Math.ceil(diff / (1000 * 3600 * 24))
      remainingDays = `${days}일`
    } else {
      remainingDays = '0일'
    }
  }

  // 잔여 횟수
  let remainingVisits = '-'
  if (membership.type === 'periodPass') {
    remainingVisits = '무제한'
  } else if (membership.type === 'countPass' && membership.count) {
    remainingVisits = membership.count
  }

  return {
    type,
    expiryDate,
    remainingDays,
    remainingVisits
  }
}