<template>
  <div class="bg-light min-vh-100 d-flex flex-row align-items-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol :md="9" :lg="7" :xl="6">
          <CCard class="mx-4">
            <CCardBody class="p-4">
              <CForm>
                <h1>등록</h1>
                <p class="text-medium-emphasis"> "<strong>{{ account.name }}</strong>" 정보 기입</p>
                <CInputGroup class="mb-3">
                  <CInputGroupText>박스명</CInputGroupText>
                  <CFormInput placeholder="박스명" :value="account.name" readonly/>
                </CInputGroup>
                <CInputGroup class="mb-3">
                  <CInputGroupText>@</CInputGroupText>
                  <CFormInput placeholder="이메일" autocomplete="email" :value="account.id" readonly/>
                </CInputGroup>
                <CInputGroup class="mb-3">
                  <CInputGroupText>대표 코치</CInputGroupText>
                  <CFormInput placeholder="이름" v-model="representative"/>
                </CInputGroup>
                <CInputGroup class="mb-3">
                  <CInputGroupText>연락처</CInputGroupText>
                  <CFormInput placeholder="'-'를 제외하고 숫자만 입력" v-model="phone"/>
                </CInputGroup>
                <CCard>
                  <CCardHeader>
                    주소
                    <div class="float-end">
                      <CButton
                        color="dark" class="position-relative" size="sm"
                        @click="openPostcode"
                      > 검색 </CButton>
                    </div>
                  </CCardHeader>
                  <CCardBody>
                    <CFormInput placeholder="우편번호" :value="zoneCode" readonly/>
                    <CFormInput placeholder="도로명 주소" :value="roadAddress" readonly/>
                    <CFormInput placeholder="상세 주소" v-model="detailAddress"/>
                  </CCardBody>
                </CCard>
<!--                <CInputGroup class="mb-3">-->
<!--                  <CInputGroupText>주소</CInputGroupText>-->
<!--                  <CForm>-->
<!--                    <CFormInput placeholder="우편번호" :value="zoneCode" readonly/>-->
<!--                    <CFormInput placeholder="도로명 주소" :value="roadAddress" readonly/>-->
<!--                    <CFormInput placeholder="상세 주소" v-model="detailAddress"/>-->
<!--                  </CForm>-->
<!--                  <CButton color="dark" @click="openPostcode">주소 검색</CButton>-->
<!--                </CInputGroup>-->
                <CFormFloating>
                  <CFormTextarea
                    id="floatingTextarea"
                    floatingLabel="박스 소개"
                    placeholder="소개 문구"
                    style="height: 100px"
                    v-model="description"
                  ></CFormTextarea>
                </CFormFloating>
              </CForm>
            </CCardBody>
            <CCardFooter>
              <div class="d-grid">
                <CButton color="success" @click="register">등록</CButton>
              </div>
            </CCardFooter>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  </div>
</template>

<script>
import {useStore} from "vuex"
import {computed, ref, watch} from "vue"
import {getPhoneMask} from "@/views/admin/util/account";
import {useRouter} from "vue-router";

export default {
  name: "RegisterBox",
  methods: {getPhoneMask},
  setup(props, { emit }) {
    const router = useRouter()
    const store = useStore()

    const account = computed(() => store.state.account.registration)
    const phone = ref("")
    const representative = ref("")
    const zoneCode = ref("")
    const roadAddress = ref("")
    const detailAddress = ref("")
    const description = ref("")

    watch(phone, (newPhone, oldPhone) => {
      // 예: 입력된 값에 대한 변환
      const maskedPhone = getPhoneMask(newPhone)
      phone.value = maskedPhone
    })

    const openPostcode = () => {
      new window.daum.Postcode({
        oncomplete: function(data) {
          zoneCode.value = data.zonecode
          roadAddress.value = data.roadAddress
        }
      }).open()
    }
    const register = () => {
      const box = {
        name : account.value.name,
        email: account.value.id,
        representative: representative.value,
        phone: phone.value,
        zoneCode: zoneCode.value,
        roadAddress: roadAddress.value,
        detailAddress: detailAddress.value,
        description: description.value,
      }
      store.commit("SET_BOX", box)
      //TODO : authentication 로그인 성공 후 액션 등록(firestore 연동)
      //registration은 authentication
      //box는 firestore 등록(box 하위에 name 등록 class, member, wod 컬렉션 생성)
      router.push("/pages/register/login")
    }

    return {
      account,
      representative,
      phone,
      zoneCode,
      roadAddress,
      detailAddress,
      description,
      openPostcode,
      register
    }
  }
}
</script>

<style scoped>

</style>
