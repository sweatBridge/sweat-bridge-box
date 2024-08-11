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
          <CFormInput id="basic-url" aria-describedby="basic-addon3" :value="getType(member.remain.type)" readonly/>
          <CInputGroupText id="basic-addon3">만료 일자</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" :value="getExpiryDateStr(member.remain.expired)" readonly/>
        </CInputGroup>
      </CRow>
      <CRow>
        <CInputGroup class="mb-3">
          <CInputGroupText id="basic-addon3">잔여일 수</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" :value="getRemainingDays(member.remain.expired)" readonly/>
          <CInputGroupText id="basic-addon3">잔여일 수</CInputGroupText>
          <CFormInput id="basic-url" aria-describedby="basic-addon3" :value="getRemainingVisits(member.type, member.remain.count)" readonly/>
        </CInputGroup>
      </CRow>
    </CModalBody>
  </CModal>

</template>

<script>
import {ref, computed} from "vue"
import {useStore} from "vuex"
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
  props: {
    index: {
      type: Number,
      required: true
    }
  },
  setup(props, {emit}) {
    const store = useStore()
    const modalStatus = ref(false)
    const member = computed(() => store.state.member.members[props.index - 1])
    const showModal = () => {
      modalStatus.value = true
    }

    const getAge = (birthDate) => {
      return calculateAge(birthDate)
    }

    const getGender = (gender) => {
      return convertGenderToKorean(gender)
    }

    const getType = (type) => {
      return getTypeKor(type)
    }

    const getExpiryDateStr = (timestamp) => {
      return convertTimestampToString(timestamp)
    }

    const getRemainingDays = (expiryDate) => {
      const expiryDateStr = convertTimestampToString(expiryDate)
      return calculateRemainingDays(expiryDateStr)
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
