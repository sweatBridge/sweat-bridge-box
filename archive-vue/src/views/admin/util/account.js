export function getPhoneMask(val) {
  let res = getMask(val)
  // 서버 전송 값에는 '-' 를 제외하고 숫자만 저장
  // return res.replace(/[^0-9]/g, '')
  return res
}

export function getMask(phoneNumber) {
  if (!phoneNumber) return phoneNumber
  phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

  let res = ''
  if (phoneNumber.length < 3) {
    res = phoneNumber
  } else {
    if (phoneNumber.substr(0, 2) == '02') {
      if (phoneNumber.length <= 5) {
        res = phoneNumber.substr(0, 2) + '-' + phoneNumber.substr(2, 3)
      } else if (phoneNumber.length > 5 && phoneNumber.length <= 9) {
        res =
          phoneNumber.substr(0, 2) +
          '-' +
          phoneNumber.substr(2, 3) +
          '-' +
          phoneNumber.substr(5)
      } else if (phoneNumber.length > 9) {
        res =
          phoneNumber.substr(0, 2) +
          '-' +
          phoneNumber.substr(2, 4) +
          '-' +
          phoneNumber.substr(6)
      }
    } else {
      if (phoneNumber.length < 8) {
        res = phoneNumber
      } else if (phoneNumber.length == 8) {
        res = phoneNumber.substr(0, 4) + '-' + phoneNumber.substr(4)
      } else if (phoneNumber.length == 9) {
        res =
          phoneNumber.substr(0, 3) +
          '-' +
          phoneNumber.substr(3, 3) +
          '-' +
          phoneNumber.substr(6)
      } else if (phoneNumber.length == 10) {
        res =
          phoneNumber.substr(0, 3) +
          '-' +
          phoneNumber.substr(3, 3) +
          '-' +
          phoneNumber.substr(6)
      } else if (phoneNumber.length > 10) {
        res =
          phoneNumber.substr(0, 3) +
          '-' +
          phoneNumber.substr(3, 4) +
          '-' +
          phoneNumber.substr(7)
      }
    }
  }

  return res
}
