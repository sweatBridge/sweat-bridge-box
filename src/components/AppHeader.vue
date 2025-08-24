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
        <!-- <CNavItem>
          <CAvatar :src="sbLogo" size="md" />
        </CNavItem> -->
        <CNavItem class="image-container">
          <img :src="sbLogo" alt="Logo" />
        </CNavItem>
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
        <CNavItem>
          <CNavLink href="#/admin/monetary">
            <CIcon class="mx-2" icon="cil-money"/>
            회계
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
        <CNavItem style="margin-left: 20px;">
          <CAvatar :src="avatar" size="md" />
        </CNavItem>
        <!-- <AppHeaderDropdownAccnt /> -->
        <CNavItem>
          <CNavLink href="#/admin/my-page">
            <CIcon class="mx-2" icon="cil-settings"/>
            관리자 설정
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink @click="handleLogout">
            <CIcon class="mx-2" icon="cil-lock-locked"/>
            로그아웃
          </CNavLink>
        </CNavItem>
      </CHeaderNav>
    </CContainer>
    <!-- <CHeaderDivider /> -->
    <!-- <CContainer fluid>
      <AppBreadcrumb />
    </CContainer> -->
  </CHeader>
  <toast-message ref="toastMessageRef" />
  <logout-modal ref="logoutModalRef"></logout-modal>
</template>

<script>
import avatar from '@/assets/images/avatars/CFBD_logo.jpg'
import sbLogo from '@/assets/images/avatars/sb_icon.jpg'
// import AppBreadcrumb from './AppBreadcrumb'
// import AppHeaderDropdownAccnt from './AppHeaderDropdownAccnt'
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue";
import { logo } from '@/assets/brand/logo'
import {useStore} from "vuex";
import {computed, ref} from "vue";
import LogoutModal from '@/views/admin/common/modal/LogoutModal.vue';
export default {
  name: 'AppHeader',
  components: {
    // AppBreadcrumb,
    // AppHeaderDropdownAccnt,
    ToastMessage,
    LogoutModal
  },
  setup() {
    const store = useStore()
    const toastMessageRef = ref(null)
    const boxName = ref(localStorage.getItem('boxName') || '')
    const logoutModalRef = ref(null);

    const handleLogout = () => {
      logoutModalRef.value.showModal();
    }

    return {
      logo,
      // boxName: computed(() => store.state.account.boxState.boxName),
      boxName,
      avatar: avatar,
      sbLogo: sbLogo,
      toastMessageRef,
      logoutModalRef,
      handleLogout,
    }
  },
}
</script>

<style scoped>
.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px; /* 원하는 너비 설정 */
  height: 40px; /* 원하는 높이 설정 */
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 이미지 크기를 조정하는 방식: cover, contain 등 사용 가능 */
}
</style>
