import { createStore } from 'vuex'
import classManagement from "@/store/modules/classManagement"
import workout from "@/store/modules/workout"
import member from "@/store/modules/member"
import account from "@/store/modules/account";
import record from "@/store/modules/record";

export default createStore({
  state: {
    sidebarVisible: false,
    sidebarUnfoldable: true,
  },
  mutations: {
    toggleSidebar(state) {
      state.sidebarVisible = !state.sidebarVisible
    },
    toggleUnfoldable(state) {
      state.sidebarUnfoldable = !state.sidebarUnfoldable
    },
    updateSidebarVisible(state, payload) {
      state.sidebarVisible = payload.value
    },
  },
  actions: {},
  modules: {
    classManagement,
    workout,
    member,
    account,
    record,
  },
})
