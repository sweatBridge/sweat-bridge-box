import { createStore } from 'vuex'
import classManagement from "@/store/modules/classManagement"
import workout from "@/store/modules/workout"
import member from "@/store/modules/member"

export default createStore({
  state: {
    sidebarVisible: true,
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
  },
})
