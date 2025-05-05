import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Vue3EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';

import CoreuiVue from '@coreui/vue'
import CIcon from '@coreui/icons-vue'
import { iconsSet as icons } from '@/assets/icons'
import DocsExample from '@/components/DocsExample'
import { setupCalendar, Calendar, DatePicker } from 'v-calendar'
import 'v-calendar/style.css'

import VueTimepicker from 'vue3-timepicker'
import 'vue3-timepicker/dist/VueTimepicker.css'
import { useCookies } from 'vue3-cookies';

// Vue 기능 플래그 설정
window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;

const app = createApp(App);
app.use(store);
app.use(router);
app.use(CoreuiVue);
app.use(setupCalendar, {});
app.use(useCookies);
app.provide('icons', icons);
app.component('CIcon', CIcon);
app.component('DocsExample', DocsExample);
app.component('EasyDataTable', Vue3EasyDataTable);
app.component('VCalendar', Calendar);
app.component('VDatePicker', DatePicker);
app.component('VueTimepicker', VueTimepicker);

app.mount('#app');
