import { createStore } from 'vuex'
import classManagement from "@/store/modules/classManagement"

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
  },
})
