<template>
  <div class="bg-light min-vh-100 d-flex flex-row align-items-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol :md="9" :lg="7" :xl="6">
          <CCard class="mx-4">
            <CCardBody class="p-4">
              <CForm>
                <h1>회원가입</h1>
                <p class="text-medium-emphasis">관리자 계정 등록</p>
                <CInputGroup class="mb-3">
                  <CInputGroupText>@</CInputGroupText>
                  <CFormInput placeholder="아이디{이메일}" autocomplete="email" v-model="id"/>
                </CInputGroup>
                <CInputGroup class="mb-3">
                  <CInputGroupText>
                    <CIcon icon="cil-lock-locked" />
                  </CInputGroupText>
                  <CFormInput
                    type="password"
                    placeholder="비밀번호"
                    autocomplete="new-password"
                    v-model="password"
                  />
                </CInputGroup>
                <CInputGroup class="mb-4">
                  <CInputGroupText>
                    <CIcon icon="cil-lock-locked" />
                  </CInputGroupText>
                  <CFormInput
                    type="password"
                    placeholder="비밀번호 확인"
                    autocomplete="new-password"
                    :valid="!isPasswordMismatch"
                    :invalid="isPasswordMismatch"
                    v-model="confirmPassword"
                  />
                </CInputGroup>
                <CInputGroup class="mb-3">
                  <CInputGroupText>
                    <CIcon icon="cil-user" />
                  </CInputGroupText>
                  <CFormInput placeholder="박스 이름" autocomplete="username" v-model="name" />
                </CInputGroup>
                <div class="d-grid">
                  <CFormCheck label="이용약관 및 개인정보취급방침에 동의합니다." v-model="isTermsAgreed"/>
                </div>
                <div class="d-grid">
                  <CButton color="warning" @click="handleNextClick" :disabled="!isValidationPassed">다음</CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  </div>
</template>

<script>
import {useRouter} from "vue-router"
import {computed, ref} from "vue";
import {useStore} from "vuex";

export default {
  name: 'RegisterAccount',
  setup() {
    const router = useRouter()
    const store = useStore()

    const id = ref("")
    const password = ref("")
    const confirmPassword = ref("")
    const name = ref("")
    const isTermsAgreed = ref(false)
    const isPasswordMismatch = computed(() => {
      return password.value === "" || password.value !== confirmPassword.value
    })
    const isValidationPassed = computed(() => {
      return isTermsAgreed.value && !isPasswordMismatch.value
    })
    const handleNextClick = () => {
      const account = {
        id: id.value,
        password: password.value,
        name: name.value,
      }

      store.commit("SET_ACCOUNT", account)
      router.push('/pages/register/box')
    }
    return {
      id,
      password,
      confirmPassword,
      name,
      isTermsAgreed,
      isPasswordMismatch,
      isValidationPassed,
      handleNextClick
    }
  }
}
</script>
