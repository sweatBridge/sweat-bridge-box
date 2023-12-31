<template>
  <div class="bg-light min-vh-100 d-flex flex-row align-items-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol :md="9" :lg="7" :xl="6">
          <CCard class="mx-4">
            <CCardBody class="p-4">
              <CForm>
                <h1>등록</h1>
                <p class="text-medium-emphasis"> "<strong>{{ account.boxName }}</strong>" 정보 기입</p>
                <CInputGroup class="mb-3">
                  <CInputGroupText>박스명</CInputGroupText>
                  <CFormInput placeholder="박스명" :value="account.boxName" readonly/>
                </CInputGroup>
                <CInputGroup class="mb-3">
                  <CInputGroupText>@</CInputGroupText>
                  <CFormInput placeholder="이메일" autocomplete="email" :value="account.email" readonly/>
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
                    <CFormInput placeholder="우편번호" :value="address.zoneCode" readonly/>
                    <CFormInput placeholder="도로명 주소" :value="address.roadAddress" readonly/>
                    <CFormInput placeholder="상세 주소" v-model="address.detailAddress"/>
                  </CCardBody>
                </CCard>
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
      <toast-message ref="toastMessageRef" />
    </CContainer>
  </div>
</template>

<script>
import {useStore} from "vuex"
import {computed, ref, watch} from "vue"
import {getPhoneMask} from "@/views/admin/util/account"
import {useRouter} from "vue-router"
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue"

export default {
  name: "RegisterBox",
  components: {
    ToastMessage
  },
  methods: {getPhoneMask},
  setup(props, { emit }) {
    const router = useRouter()
    const store = useStore()

    const account = computed(() => store.state.account.registration)
    const phone = ref("")
    const representative = ref("")
    const address = ref({
      zoneCode: '',
      roadAddress: '',
      detailAddress: '',
    })
    const description = ref("")

    const toastMessageRef = ref(null)

    watch(phone, (newPhone, oldPhone) => {
      const maskedPhone = getPhoneMask(newPhone)
      phone.value = maskedPhone
    })

    const openPostcode = () => {
      new window.daum.Postcode({
        oncomplete: function(data) {
          address.value.zoneCode = data.zonecode
          address.value.roadAddress = data.roadAddress
        }
      }).open()
    }
    const register = async () => {
      try {
        await store.dispatch("signUp");
        toastMessageRef.value.createToast({
          title: '성공',
          content: '계정 생성 성공',
          type: 'success'
        });
        await registerBox();
      } catch (error) {
        console.error(error);
        toastMessageRef.value.createToast({
          title: '실패',
          content: '계정 생성 실패 error: ' + error.message,
          type: 'danger'
        });
      }
    };

    const registerBox = async () => {
      try {
        await setBox();
        await store.dispatch('createBox');
        await registerUser();
      } catch (error) {
        console.error(error);
        toastMessageRef.value.createToast({
          title: '실패',
          content: 'Box 등록 실패 error: ' + error.message,
          type: 'danger'
        });
      }
    };

    const registerUser = async () => {
      try {
        await setUser();
        await store.dispatch('createUser');
        toastMessageRef.value.createToast({
          title: '성공',
          content: 'User 등록 성공',
          type: 'success'
        });
        setTimeout(() => {
          router.push("/pages/login");
        }, 1000)
      } catch (error) {
        console.error(error);
        toastMessageRef.value.createToast({
          title: '실패',
          content: 'User 등록 실패 error: ' + error.message,
          type: 'danger'
        });
      }
    };


    const setBox = () => {
      const box = {
        boxName : account.value.boxName,
        email: account.value.email,
        representative: representative.value,
        phone: phone.value,
        address: {
          zoneCode: address.value.zoneCode,
          roadAddress: address.value.roadAddress,
          detailAddress: address.value.detailAddress,
        },
        description: description.value,
        coaches: [{
          name: representative.value,
          phone: phone.value,
          email: account.value.email,
        }],
      }
      store.commit("SET_BOX", box)
    }

    const setUser = () => {
      const user = {
        boxName: account.value.boxName,
        email: account.value.email,
        realName: representative.value,
        nickName: account.value.boxName + "_COACH",
        phone: phone.value,
        role: 'COACH'
      }
      store.commit("SET_USER", user)
    }

    return {
      account,
      representative,
      phone,
      address,
      description,
      toastMessageRef,
      openPostcode,
      register
    }
  }
}
</script>

<style scoped>

</style>
