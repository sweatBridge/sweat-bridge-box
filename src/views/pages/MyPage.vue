<template>
  <CContainer>
    <CCard>
      <CCardHeader class="main-card-header">
        <strong>마이페이지</strong>
      </CCardHeader>
      <CCardBody class="p-4">
        <CForm>
          <h3>{{boxInfo.boxName}}</h3>
<!--          <p class="text-medium-emphasis"> "<strong>{{ account.boxName }}</strong>" 정보 기입</p>-->
          <CInputGroup class="mb-3">
            <CInputGroupText>박스명</CInputGroupText>
            <CFormInput placeholder="박스명" :value="boxInfo.boxName" readonly/>
          </CInputGroup>
          <CInputGroup class="mb-3">
            <CInputGroupText>@</CInputGroupText>
            <CFormInput placeholder="이메일" autocomplete="email" :value="boxInfo.email" readonly/>
          </CInputGroup>
          <CInputGroup class="mb-3">
            <CInputGroupText>대표 코치</CInputGroupText>
            <CFormInput placeholder="이름" v-model="boxInfo.representative"/>
          </CInputGroup>
          <CInputGroup class="mb-3">
            <CInputGroupText>연락처</CInputGroupText>
            <CFormInput placeholder="'-'를 제외하고 숫자만 입력" v-model="boxInfo.phone"/>
          </CInputGroup>
          <CCard>
            <CCardHeader class="footer-button">
              <strong>주소</strong>
              <div class="float-end">
                <CButton
                  class="position-relative main-card-header" size="sm"
                  @click="openPostcode"
                > 검색 </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              <CFormInput placeholder="우편번호" :value="boxInfo.address.zoneCode" readonly/>
              <CFormInput placeholder="도로명 주소" :value="boxInfo.address.roadAddress" readonly/>
              <CFormInput placeholder="상세 주소" v-model="boxInfo.address.detailAddress"/>
            </CCardBody>
          </CCard>
          <CCard>
            <CCardHeader class="footer-button">
              코치진

            </CCardHeader>
            <CCardBody>
              <CRow>
                <CInputGroup class="mb-3">
                  <CInputGroupText id="basic-addon3">이름</CInputGroupText>
                  <CFormInput id="basic-url" aria-describedby="basic-addon3" v-model="coachRealName"/>
                  <CInputGroupText id="basic-addon3">연락처</CInputGroupText>
                  <CFormInput id="basic-url" aria-describedby="basic-addon3" v-model="coachPhone"/>
                  <CInputGroupText id="basic-addon3">이메일</CInputGroupText>
                  <CFormInput id="basic-url" aria-describedby="basic-addon3" v-model="coachEmail"/>
                  <div class="float-end">
                    <CButton
                      class="position-relative main-card-header" size="md"
                      @click="addCoach"
                    > 추가 </CButton>
                  </div>
                </CInputGroup>
              </CRow>
              <EasyDataTable
                :headers="headers"
                :items="boxInfo.coaches"
                table-class-name="customize-table"
                body-text-direction="center"
                header-text-direction="center"
                buttons-pagination
                :rows-per-page="5"
              >
                <template #item-name="{ name }">
                  {{name}}
                </template>
                <template #item-phone="{ phone }">
                  {{phone}}
                </template>
                <template #item-email="{ email }">
                  {{email}}
                </template>
              </EasyDataTable>
            </CCardBody>
          </CCard>
          <CFormFloating>
            <CFormTextarea
              id="floatingTextarea"
              floatingLabel="박스 소개"
              placeholder="소개 문구"
              style="height: 100px"
              v-model="boxInfo.description"
            ></CFormTextarea>
          </CFormFloating>
        </CForm>
      </CCardBody>
      <CCardFooter class="main-card-header">
        <div class="float-end">
          <CButton
            class="position-relative footer-button" size="md" @click="handleModify">
            <strong>수정</strong>
          </CButton>
        </div>
      </CCardFooter>
    </CCard>
  </CContainer>
  <toast-message ref="toastMessageRef" />
</template>

<script>
import {useStore} from "vuex"
import {computed, onMounted, ref, watch} from "vue"
import {getPhoneMask} from "@/views/admin/util/account"
import {useRouter} from "vue-router"
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue"

export default {
  name: "MyPage",
  components: {
    ToastMessage
  },
  methods: {getPhoneMask},
  setup(props, { emit }) {
    const router = useRouter()
    const store = useStore()

    onMounted(() => {
      store.dispatch('getBox')
    })

    const boxInfo = computed(() => {
      return store.state.account.box
    })

    const headers = [
      { text: "이름", value: "name" },
      { text: "연락처", value: "phone" },
      { text: "이메일", value: "email" },
    ]

    const account = computed(() => store.state.account.registration)
    const coachRealName = ref("")
    const coachPhone = ref("")
    const coachEmail = ref("")
    const toastMessageRef = ref(null)

    watch(coachPhone, (newPhone, oldPhone) => {
      const maskedPhone = getPhoneMask(newPhone)
      coachPhone.value = maskedPhone
    })

    watch(boxInfo.value.phone, (newPhone, oldPhone) => {
      const maskedPhone = getPhoneMask(newPhone)
      boxInfo.value.phone = maskedPhone
    })

    const openPostcode = () => {
      new window.daum.Postcode({
        oncomplete: function(data) {
          boxInfo.value.address.zoneCode = data.zonecode
          boxInfo.value.address.roadAddress = data.roadAddress
        }
      }).open()
    }

    const addCoach = () => {
      const coach = {
        name: coachRealName.value,
        phone: coachPhone.value,
        email: coachEmail.value
      }
      boxInfo.value.coaches.push(coach)
      coachRealName.value = ""
      coachPhone.value = ""
      coachEmail.value = ""
    }

    const handleModify = () => {
      store.commit("SET_BOX", boxInfo.value)
      modify()
    }

    const modify = async () => {
      try {
        await store.dispatch("createBox");
        toastMessageRef.value.createToast({
          title: '성공',
          content: 'Box 정보 수정 성공',
          type: 'success'
        });
        setTimeout(() => {
          location.reload()
        }, 1000)
      } catch (error) {
        console.error(error);
        toastMessageRef.value.createToast({
          title: '실패',
          content: 'Box 정보 실패 error: ' + error.message,
          type: 'danger'
        });
      }
    }

    return {
      account,
      boxInfo,
      coachRealName,
      coachPhone,
      coachEmail,
      toastMessageRef,
      headers,
      openPostcode,
      handleModify,
      addCoach
    }
  }
}
</script>

<style scoped>
.main-card-header {
  background-color: rgb(70, 100, 200);
  color: #ffffff;
}
.footer-button {
  background-color: #ffffff;
  color: rgb(70, 100, 200)
}
</style>
