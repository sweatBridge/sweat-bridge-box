<template>
  <div class="bg-light min-vh-100 d-flex flex-row align-items-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol :md="8">
          <CCardGroup>
            <CCard class="p-4">
              <CCardBody>
                <CForm>
                  <h1>로그인</h1>
                  <p class="text-medium-emphasis">관리자 계정으로 로그인</p>
                  <CInputGroup class="mb-3">
                    <CInputGroupText>
                      <CIcon icon="cil-user" />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="아이디"
                      autocomplete="username"
                      v-model="email"
                    />
                  </CInputGroup>
                  <CInputGroup class="mb-4">
                    <CInputGroupText>
                      <CIcon icon="cil-lock-locked" />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="비밀번호"
                      autocomplete="current-password"
                      v-model="password"
                    />
                  </CInputGroup>
                  <CRow>
                    <CButton color="primary" class="px-1" @click="handleLoginClick"> 로그인 </CButton>
                  </CRow>
                  <CRow>
                    <CCol :xs="4"></CCol>
                    <CCol :xs="4" class="text-right">
                      <CButton color="link" class="px-0">
                        아이디 찾기
                      </CButton>
                    </CCol>
                    <CCol :xs="4" class="text-right">
                      <CButton color="link" class="px-0">
                        비밀번호 찾기
                      </CButton>
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>
            <CCard class="text-white bg-primary py-5" style="width: 44%">
              <CCardBody class="text-center">
                <div>
                  <h2>회원가입</h2>
                  <br><br>
                  <p>
                    박스를 등록하세요.
                  </p>
                </div>
              </CCardBody>
              <CCardFooter class="text-center">
                <CButton color="light" variant="outline" class="mt-3" @click="handleSignInClick">
                  등록
                </CButton>
              </CCardFooter>
            </CCard>
          </CCardGroup>
        </CCol>
      </CRow>
      <toast-message ref="toastMessageRef" />
    </CContainer>
  </div>
</template>

<script>
import {useRouter} from "vue-router"
import {ref} from "vue";
import {useStore} from "vuex";
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue"

export default {
  name: 'Login',
  components: {
    ToastMessage
  },
  setup() {
    const router = useRouter()
    const store = useStore()

    const email = ref("")
    const password = ref("")
    const toastMessageRef = ref(null)
    const handleLoginClick = async () => {
      try {
        await store.dispatch('login', {email: email.value, password: password.value});
        toastMessageRef.value.createToast({
          title: '성공',
          content: '로그인 성공',
          type: 'success'
        });
        await store.dispatch('setBoxState', {email: email.value})
        setTimeout(() => {
          router.push("/admin/registered-wod-list")
        }, 1000)
      } catch (error) {
        console.error(error);
        toastMessageRef.value.createToast({
          title: '실패',
          content: 'User 등록 실패 error: ' + error.message,
          type: 'danger'
        });
      }
/*
      store.dispatch('login', {email: email.value, password: password.value})
        .then(() => {
          toastMessageRef.value.createToast({
            title: '성공',
            content: '로그인 성공',
            type: 'success'
          });
          store.dispatch('setBoxState', {email: email.value})
          setTimeout(() => {
            router.push("/admin/registered-wod-list")
          }, 10000)
        }).catch(error => {
        console.error(error);
        toastMessageRef.value.createToast({
          title: '실패',
          content: 'User 등록 실패 error: ' + error.message,
          type: 'danger'
        });
      })
 */

    }
    const handleSignInClick = () => {
      router.push("/pages/register/account")
    }

    return {
      email,
      password,
      toastMessageRef,
      handleLoginClick,
      handleSignInClick
    }
  }
}
</script>
