<template>
  <CHeader position="sticky" class="mb-4">
    <CContainer fluid>
      <!-- <CHeaderToggler class="ps-1" @click="$store.commit('toggleSidebar')">
        <CIcon icon="cil-menu" size="lg" />
      </CHeaderToggler> -->
      <!-- <CHeaderBrand class="mx-auto d-lg-none" to="/">
        <CIcon :icon="logo" height="48" alt="Logo" />
      </CHeaderBrand> -->
      <CHeaderNav class="d-none d-md-flex me-auto">
        <CNavItem>
          <CNavLink href="#/admin/registered-wod-list">
            <CIcon class="mx-2" icon="cil-list"/>
            와드
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink href="#/admin/member">
            <CIcon class="mx-2" icon="cil-user"/>
            회원
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink href="#/admin/reservation">
            <CIcon class="mx-2" icon="cil-calendar"/>
            수업
          </CNavLink>
        </CNavItem>
      </CHeaderNav>
      <CHeaderNav>
        <!-- <CNavItem>
          <CNavLink href="#/admin/registered-wod-list">
            <CIcon class="mx-2" icon="cil-bell" size="lg" />
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink href="#/admin/registered-wod-list">
            <CIcon class="mx-2" icon="cil-list" size="lg" />
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink href="#/admin/registered-wod-list">
            <CIcon class="mx-2" icon="cil-envelope-open" size="lg" />
          </CNavLink>
        </CNavItem> -->
        <CNavItem>
          <CInputGroupText id="basic-addon3">{{boxName}}</CInputGroupText>
        </CNavItem>
        <AppHeaderDropdownAccnt />
        <CNavItem>
          <CNavLink href="#/admin/my-page">
            <CIcon class="mx-2" icon="cil-settings"/>
            관리자 설정
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink @click="handleLogOutClick">
            <CIcon class="mx-2" icon="cil-lock-locked"/>
            로그아웃
          </CNavLink>
        </CNavItem>
      </CHeaderNav>
    </CContainer>
    <CHeaderDivider />
    <CContainer fluid>
      <AppBreadcrumb />
    </CContainer>
  </CHeader>
  <toast-message ref="toastMessageRef" />
</template>

<script>
import AppBreadcrumb from './AppBreadcrumb'
import AppHeaderDropdownAccnt from './AppHeaderDropdownAccnt'
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue";
import { logo } from '@/assets/brand/logo'
import {useStore} from "vuex";
import {computed, ref} from "vue";
import router from '@/router';
export default {
  name: 'AppHeader',
  components: {
    AppBreadcrumb,
    AppHeaderDropdownAccnt,
    ToastMessage
  },
  setup() {
    const store = useStore()
    const toastMessageRef = ref(null)
    const boxName = ref(localStorage.getItem('boxName') || '')
    const handleLogOutClick = () => {
      try {
        store.dispatch('logout')
        toastMessageRef.value.createToast({
          title: '성공',
          content: '로그아웃 성공',
          type: 'success'
        });
        store.commit('SET_BOX_STATE_EMPTY')
        setTimeout(() => {
          router.push("/pages/login")
        }, 1000)
      } catch (error) {
        console.log('로그아웃 실패 : ' + error.meessage)
        toastMessageRef.value.createToast({
          title: '실패',
          content: '로그아웃 실패',
          type: 'danger'
        })
      }
    }
    return {
      logo,
      // boxName: computed(() => store.state.account.boxState.boxName),
      boxName,
      toastMessageRef,
      handleLogOutClick,
    }
  },
}
</script>
