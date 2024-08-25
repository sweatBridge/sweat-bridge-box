<template>
  <CRow>
    <CCol>
      <CCard>
        <CCardHeader>
          <strong>와드 등록</strong>
          <div class="float-end">
            <CButton
              color="dark" class="position-relative" size="sm"
              @click="moveToRegisteredWodList"
            >
              목록
            </CButton>
          </div>
        </CCardHeader>
        <CCardBody>
          <CRow>
            <CCol sm="7">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">타이틀</CInputGroupText>
                <CFormInput
                  id="basic-url"
                  aria-describedby="basic-addon3"
                  v-model="wodRegistration.title"
                />
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow>
            <CCol sm="7">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">일자</CInputGroupText>
                <CButton style="display: flex; align-items: center;">
                  <CIcon name="cil-calendar" style="margin-right: 8px;"/>
                  <DatePicker v-model="wodRegistration.date"/>
                </CButton>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow>
            <CCol sm="7">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">와드 타입</CInputGroupText>
                <CFormSelect id="inputGroupSelect01" v-model="wodRegistration.type" @change="handleTypeChange">
                  <option>타입 선택</option>
                  <option value="ForTime">ForTime</option>
                  <option value="AMRAP">AMRAP</option>
                  <option value="EMOM">EMOM</option>
                  <option value="Tabata">Tabata</option>
                  <option value="Custom">Custom</option>
                </CFormSelect>
              </CInputGroup>
            </CCol>
            <CCol sm="2">
              <div style="height: 8px;"></div>
              <CFormCheck id="setType" label="세트 운동" v-model="wodRegistration.isSet" :checked="wodRegistration.isSet" v-if="!isCustomize" @change="handleSetTypeChange"/>
            </CCol>
            <CCol sm="3">
              <CInputGroup class="mb-3" v-if="wodRegistration.isSet && !isCustomize">
                <CInputGroupText id="basic-addon3">세트 수</CInputGroupText>
                <CFormInput type="number" id="setCount" aria-describedby="basic-addon3" v-model="wodRegistration.set"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow>
            <CCol sm="8">
              <CRow v-if="wodRegistration.type === 'ForTime'">
                <CCol sm="3">
                  <CInputGroup class="mb-3">
                    <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                    <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3" v-model="wodRegistration.round"/>
                  </CInputGroup>
                </CCol>
                <CCol sm="6">
                  <CInputGroup class="mb-3">
                    <CInputGroupText id="basic-addon3">시간 제한</CInputGroupText>
                    <CButton size="sm">
                      <VueTimepicker format="mm:ss" v-model="timeCapForPicker"/>
                    </CButton>
                  </CInputGroup>
                </CCol>
              </CRow>
              <CRow v-if="wodRegistration.type === 'AMRAP'">
                <CCol sm="3" />
                <CCol sm="6">
                  <CInputGroup class="mb-3">
                    <CInputGroupText id="basic-addon3">시간 제한</CInputGroupText>
                    <CButton size="sm">
                      <VueTimepicker format="mm:ss" v-model="timeCapForPicker"/>
                    </CButton>
                  </CInputGroup>
                </CCol>
              </CRow>
              <CRow v-if="wodRegistration.type === 'EMOM'">
                <CCol sm="3">
                  <CInputGroup class="mb-3">
                    <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                    <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3" v-model="wodRegistration.round"/>
                  </CInputGroup>
                </CCol>
                <CCol sm="6">
                  <CInputGroup class="mb-3">
                    <CInputGroupText id="basic-addon3">시간 제한</CInputGroupText>
                    <CButton size="sm">
                      <VueTimepicker format="mm:ss" v-model="timeCapForPicker"/>
                    </CButton>
                  </CInputGroup>
                </CCol>
              </CRow>
              <CRow v-if="wodRegistration.type === 'Tabata'">
                <CCol sm="3">
                  <CInputGroup class="mb-3">
                    <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                    <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3" v-model="wodRegistration.round"/>
                  </CInputGroup>
                </CCol>
              </CRow>
            </CCol>
            <CCol sm="4">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">기록 타입</CInputGroupText>
                <CFormSelect id="inputGroupSelect01" v-model="wodRegistration.scoreType">
                  <option>타입 선택</option>
                  <option value="time">시간(분, 초)</option>
                  <option value="totalReps">카운트</option>
                  <option value="roundsPlusReps">라운드 & 카운트</option>
                  <option value="repsPerRound">라운드별 카운트</option>
                  <option value="completeFail">성공/실패</option>
                </CFormSelect>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="!isCustomize">
            <CCard>
              <CCardHeader color="danger">
                동작 구성
                <div class="float-end">
                  <CButton
                    class="position-relative rest-card" size="sm"
                    @click="addRest"
                  >
                    <strong>휴식 추가</strong>
                  </CButton>
                  <CButton
                    class="position-relative custom-button " size="sm"
                    @click="addMovement"
                  >
                    <strong>동작 추가</strong>
                  </CButton>
                </div>
              </CCardHeader>
              <CCardBody>
                <MovementCard
                  v-for="(movement, index) in wodRegistration.movements"
                  :key="index"
                  :index="index"
                  pageType="wodRegistration"
                />
              </CCardBody>
            </CCard>
          </CRow>
          <CRow v-if="isCustomize">
            <CForm>
              <CInputGroupText id="basic-addon3">WOD 커스텀</CInputGroupText>
              <CFormTextarea
                id="exampleFormControlTextarea1"
                rows="10"
                text="자유 형식으로 작성"
                v-model="wodRegistration.customMovements"
              ></CFormTextarea>
            </CForm>
          </CRow>
          <CRow>
            <CForm>
              <CInputGroupText id="basic-addon3">기타 설명</CInputGroupText>
              <CFormTextarea
                id="exampleFormControlTextarea1"
                rows="3"
                v-model="wodRegistration.description"
              ></CFormTextarea>
            </CForm>
          </CRow>
        </CCardBody>
        <CCardFooter>
          <div class="float-end">
            <CButton
              color="success" class="position-relative" size="sm"
              @click="saveWod"
              :disabled="isLoading"
            >
              저장
            </CButton>
          </div>
        </CCardFooter>
      </CCard>
    </CCol>
  </CRow>
  <toast-message ref="toastMessageRef" />
</template>

<script>
import { defineComponent, ref, watch, reactive, computed } from 'vue'
import { useStore } from "vuex"
import MovementCard from "@/views/admin/movement/MovementCard.vue"
import DatePicker from "vue3-datepicker"
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue"
import {useRouter} from "vue-router";
import { loadingMixin } from '@/mixins/loadingMixin'

export default defineComponent({
  components: {DatePicker, MovementCard, ToastMessage},
  setup(props, {emit}) {
    const router = useRouter()
    const store = useStore()
    const toastMessageRef = ref(null)
    const wodRegistration = reactive({
      title: store.state.workout.wodRegistration.title,
      date: store.state.workout.wodRegistration.date,
      type: store.state.workout.wodRegistration.type,
      isSet: store.state.workout.wodRegistration.isSet,
      set: store.state.workout.wodRegistration.set,
      round: store.state.workout.wodRegistration.round,
      timeCap: store.state.workout.wodRegistration.timeCap,
      movements: store.state.workout.wodRegistration.movements,
      customMovements: store.state.workout.wodRegistration.customMovements,
      description: store.state.workout.wodRegistration.description,
    })
    const timeCapForPicker = computed({
      get() {
        const [mm, ss] = wodRegistration.timeCap.split(':')
        return { mm, ss }
      },
      set(value) {
        const newTimeCap = `${value.mm}:${value.ss}`
        wodRegistration.timeCap = newTimeCap
      }
    })

    const isCustomize = computed(() => wodRegistration.type === 'Custom')

    const { isLoading, withLoading } = loadingMixin.setup();

    const watchMapping = {
      title: 'updateWodTitle',
      date: 'updateWodDate',
      type: 'updateWodType',
      scoreType: 'updateWodScoreType',
      isSet: 'updateWodIsSet',
      set: 'updateWodSet',
      round: 'updateWodRound',
      timeCap: 'updateWodTimeCap',
      customMovements: 'updateWodCustomMovements',
      description: 'updateWodDescription',
    }

    for (let key in watchMapping) {
      watch(() => wodRegistration[key], (newValue) => {
        store.commit(watchMapping[key], {
          target: 'wodRegistration',
          [key]: newValue
        })
      })
    }

    const handleTypeChange = () => {
      wodRegistration.round = 0
      wodRegistration.timeCap = "00:00"
      wodRegistration.customMovements = ""
    }

    const handleSetTypeChange = () => {
      wodRegistration.isSet = !wodRegistration.isSet
      wodRegistration.set = 0
    }

    const addMovement = () => {
      wodRegistration.movements.push({
        name: "",
        measure: "",
        type: "",
        isLevelSet: true,
        levelSetting: [
          {
            level: 'Rxd',
            customLevel: '',
            gender: 'M',
            requirement: "",
          },
          {
            level: 'Rxd',
            customLevel: '',
            gender: 'W',
            requirement: "",
          }
        ],
        isDescription: false,
        description: "",
      })
    }
    const addRest = () => {
      wodRegistration.movements.push({
        name: "Rest",
        measure: "",
        type: "Sec",
        levelSetting: [],
        description: "",
      })
    }

    const saveWod = () => {
      withLoading({ isLoading }, async () => {
        try {
          await store.dispatch('addWod');
          await toastMessageRef.value.createToast({
            title: '성공',
            content: '와드 등록 성공.',
            type: 'success'
          });
          setTimeout(() => {
            router.push("/admin/registered-wod-list");
          }, 500);
        } catch (error) {
          console.log(error);
          toastMessageRef.value.createToast(
            {
              title: '실패',
              content: `와드 등록 실패 : ${error.message}`,
              type: 'danger'
            }
          );
        }
      })
    }
    
    const moveToRegisteredWodList = () => {
      router.push("/admin/registered-wod-list")
    }
    return {
      toastMessageRef,
      wodRegistration,
      timeCapForPicker,
      isCustomize,
      isLoading,
      handleTypeChange,
      handleSetTypeChange,
      addMovement,
      addRest,
      saveWod,
      moveToRegisteredWodList,
    }
  },
})
</script>

<style scoped lang="scss">
.rest-card {
  background-color: rgba(247, 192, 59, 0.87);
  color: black;
}
.custom-button {
  background-color: rgba(140, 170, 230, 0.98);
  color: #000000;
}
</style>
