<template>
  <CModal :visible="modalStatus" @close="() => {modalStatus = false}">
    <CModalHeader>
      <CModalTitle>회원 상세 정보</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CRow>
        <CInputGroup class="mb-3">
          <CInputGroupText id="basic-addon3">이름</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" v-model="member.realName" readonly/>
          <CInputGroupText id="basic-addon3">닉네임</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" v-model="member.nickName" readonly/>
        </CInputGroup>
      </CRow>
      <CRow>
        <CInputGroup class="mb-3">
          <CInputGroupText id="basic-addon3">성별</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" :value="getGender(member.gender)" readonly/>
          <CInputGroupText id="basic-addon3">나이</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" :value="getAge(member.birthDate)" readonly/>
        </CInputGroup>
      </CRow>
      <CRow>
        <CInputGroup class="mb-3">
          <CInputGroupText id="basic-addon3">키</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" v-model="member.height" readonly/>
          <CInputGroupText id="basic-addon3">무게</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" v-model="member.weight" readonly/>
        </CInputGroup>
      </CRow>
      <CRow>
        <CInputGroup class="mb-3">
          <CInputGroupText id="basic-addon3">전화번호</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" v-model="member.phone" readonly/>
        </CInputGroup>
      </CRow>
      <CRow>
        <CInputGroup class="mb-3">
          <CInputGroupText id="basic-addon3">목적</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" v-model="member.purpose" readonly/>
        </CInputGroup>
      </CRow>
      <CRow>
        <CInputGroup class="mb-3">
          <CInputGroupText id="basic-addon3">등록 타입</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" :value="getType(member.remain.type, member.remain.days)" readonly/>
          <CInputGroupText id="basic-addon3">만료 일자</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" :value="getExpiryDateStr(member.remain.expired)" readonly/>
        </CInputGroup>
      </CRow>
      <CRow>
        <CInputGroup class="mb-3">
          <CInputGroupText id="basic-addon3">잔여 기간(일)</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" :value="member.remain.days" readonly/>
          <CInputGroupText id="basic-addon3">잔여 횟수(회)</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" :value="getRemainingVisits(member.remain.type, member.remain.count)" readonly/>
        </CInputGroup>
      </CRow>
    </CModalBody>
  </CModal>

</template>

<script>
import {ref} from "vue"
import {
  calculateAge,
  convertGenderToKorean,
  calculateRemainingDays,
  convertRemainingVisits,
  convertTimestampToString,
  getTypeKor
} from "@/views/admin/util/member"

export default {
  name: "MemberDetailsModal",
  components: {},
  setup(props, {emit}) {
    const modalStatus = ref(false)
    const member = ref()
    const showModal = (user) => {
      member.value = user
      modalStatus.value = true
    }

    const getAge = (birthDate) => {
      return calculateAge(birthDate)
    }

    const getGender = (gender) => {
      return convertGenderToKorean(gender)
    }

    const getType = (type, days) => {
      return getTypeKor(type, days)
    }

    const getExpiryDateStr = (timestamp) => {
      return convertTimestampToString(timestamp)
    }

    const getRemainingDays = (expiryDate) => {
      return calculateRemainingDays(expiryDate)
    }

    const getRemainingVisits = (type, remainingVisits) => {
      return convertRemainingVisits(type, remainingVisits)
    }

    return {
      modalStatus,
      member,
      showModal,
      getAge,
      getGender,
      getType,
      getExpiryDateStr,
      getRemainingDays,
      getRemainingVisits
    }
  },
}
</script>

<style scoped>

</style>
