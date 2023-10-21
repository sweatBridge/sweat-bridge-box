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
    </CContainer>
  </div>
</template>

<script>
import {useRouter} from "vue-router"

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const handleLoginClick = () => {
      // TODO : authentication & login
      router.push("/admin/Wod")
    }
    const handleSignInClick = () => {
      router.push("/pages/register/account")
    }

    return {
      handleLoginClick,
      handleSignInClick
    }
  }
}
</script>
