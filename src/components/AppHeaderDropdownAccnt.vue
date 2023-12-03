<template>
<!--  <CDropdown variant="nav-item">-->
  <CDropdown>
    <CDropdownToggle placement="bottom-end" class="py-0" :caret="false">
      <CAvatar :src="avatar" size="md" />
    </CDropdownToggle>
    <CDropdownMenu class="pt-0">
<!--      <CDropdownHeader component="h6" class="bg-light fw-semibold py-2">-->
<!--        Account-->
<!--      </CDropdownHeader>-->
<!--      <CDropdownItem>-->
<!--        <CIcon icon="cil-bell" /> Updates-->
<!--        <CBadge color="info" class="ms-auto">{{ itemsCount }}</CBadge>-->
<!--      </CDropdownItem>-->
<!--      <CDropdownItem>-->
<!--        <CIcon icon="cil-envelope-open" /> Messages-->
<!--        <CBadge color="success" class="ms-auto">{{ itemsCount }}</CBadge>-->
<!--      </CDropdownItem>-->
<!--      <CDropdownItem>-->
<!--        <CIcon icon="cil-task" /> Tasks-->
<!--        <CBadge color="danger" class="ms-auto">{{ itemsCount }}</CBadge>-->
<!--      </CDropdownItem>-->
<!--      <CDropdownItem>-->
<!--        <CIcon icon="cil-comment-square" /> Comments-->
<!--        <CBadge color="warning" class="ms-auto">{{ itemsCount }}</CBadge>-->
<!--      </CDropdownItem>-->
      <CDropdownHeader component="h6" class="bg-light fw-semibold py-2">
        설정
      </CDropdownHeader>
      <CDropdownItem @click="handleProfileClick"> <CIcon icon="cil-user" /> 마이페이지 </CDropdownItem>
<!--      <CDropdownItem> <CIcon icon="cil-settings" /> Settings </CDropdownItem>-->
<!--      <CDropdownItem>-->
<!--        <CIcon icon="cil-dollar" /> Payments-->
<!--        <CBadge color="secondary" class="ms-auto">{{ itemsCount }}</CBadge>-->
<!--      </CDropdownItem>-->
<!--      <CDropdownItem>-->
<!--        <CIcon icon="cil-file" /> Projects-->
<!--        <CBadge color="primary" class="ms-auto">{{ itemsCount }}</CBadge>-->
<!--      </CDropdownItem>-->
      <CDropdownDivider />
<!--      <CDropdownItem>-->
<!--        <CIcon icon="cil-shield-alt" /> Lock Account-->
<!--      </CDropdownItem>-->
      <CDropdownItem @click="handleLogOutClick"> <CIcon icon="cil-lock-locked" /> 로그아웃 </CDropdownItem>
    </CDropdownMenu>
  </CDropdown>
  <toast-message ref="toastMessageRef" />
</template>

<script>
import avatar from '@/assets/images/avatars/CFBD_logo.jpg'
import {useStore} from "vuex";
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue";
import {ref} from "vue";
import router from "@/router";
export default {
  name: 'AppHeaderDropdownAccnt',
  components: {
    ToastMessage
  },
  setup() {
    const store = useStore()
    const toastMessageRef = ref(null)
    const handleProfileClick = () => {
      router.push("/admin/my-page")
    }
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
        console.log(error)
        toastMessageRef.value.createToast({
          title: '실패',
          content: '로그아웃 실패 error: ' + error.message,
          type: 'danger'
        })
      }

    }
    return {
      toastMessageRef,
      handleProfileClick,
      handleLogOutClick,
      avatar: avatar,
      itemsCount: 42,
    }
  },
}
</script>
