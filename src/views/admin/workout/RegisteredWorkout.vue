<template>
  <CRow>
    <CCol>
      <CCard>
<!--        <CCardHeader>-->
<!--          <strong>와드 수정(삭제)</strong>-->
<!--          <div class="float-end">-->
<!--            <CButton-->
<!--              color="dark" class="position-relative" size="sm"-->
<!--              @click="moveToRegisteredWodList"-->
<!--            >-->
<!--              목록-->
<!--            </CButton>-->
<!--          </div>-->
<!--        </CCardHeader>-->
        <CCardBody>
          <CRow>
            <CCol sm="7">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">WOD 타이틀</CInputGroupText>
                <CFormInput
                  id="basic-url"
                  aria-describedby="basic-addon3"
                  v-model="registeredWod.title"
                />
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow>
            <CCol sm="7">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">WOD 일자</CInputGroupText>
                <CButton style="display: flex; align-items: center;">
                  <CIcon name="cil-calendar" style="margin-right: 8px;"/>
                  <DatePicker v-model="registeredWod.date"/>
                </CButton>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow>
            <CCol sm="7">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">Workout 타입</CInputGroupText>
                <CFormSelect id="inputGroupSelect01" v-model="registeredWod.type" @change="handleTypeChange">
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
              <CFormCheck id="setType" label="세트 운동" v-model="registeredWod.isSet" :checked="registeredWod.isSet" v-if="!isCustomize" @change="handleSetTypeChange"/>
            </CCol>
            <CCol sm="3">
              <CInputGroup class="mb-3" v-if="registeredWod.isSet">
                <CInputGroupText id="basic-addon3">세트 수</CInputGroupText>
                <CFormInput type="number" id="setCount" aria-describedby="basic-addon3" v-model="registeredWod.set"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="registeredWod.type === 'ForTime'">
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3" v-model="registeredWod.round"/>
              </CInputGroup>
            </CCol>
            <CCol sm="4">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">시간 제한</CInputGroupText>
                <CButton>
                  <VueTimepicker format="mm:ss" v-model="timeCapForPicker"/>
                </CButton>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="registeredWod.type === 'AMRAP'">
            <CCol sm="3" />
            <CCol sm="4">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">시간 제한</CInputGroupText>
                <CButton>
                  <VueTimepicker format="mm:ss" v-model="timeCapForPicker"/>
                </CButton>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="registeredWod.type === 'EMOM'">
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3" v-model="registeredWod.round"/>
              </CInputGroup>
            </CCol>
            <CCol sm="4">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">시간 제한</CInputGroupText>
                <CButton>
                  <VueTimepicker format="mm:ss" v-model="timeCapForPicker"/>
                </CButton>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="registeredWod.type === 'Tabata'">
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3" v-model="registeredWod.round"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="!isCustomize">
            <CCard>
              <CCardHeader color="danger">
                Movements
                <div class="float-end">
                  <CButton
                    color="warning" class="position-relative" size="sm"
                    @click="addRest"
                  >
                    휴식 추가
                  </CButton>
                  <CButton
                    color="info" class="position-relative" size="sm"
                    @click="addMovement"
                  >
                    동작 추가
                  </CButton>
                </div>
              </CCardHeader>
              <CCardBody>
                <MovementCard
                  v-for="(movement, index) in registeredWod.movements"
                  :key="index"
                  :index="index"
                  pageType="registeredWod"
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
                v-model="registeredWod.customMovements"
              ></CFormTextarea>
            </CForm>
          </CRow>
          <CRow>
            <CForm>
              <CInputGroupText id="basic-addon3">설명</CInputGroupText>
              <CFormTextarea
                id="exampleFormControlTextarea1"
                rows="3"
                text="WOD 설명"
                v-model="registeredWod.description"
              ></CFormTextarea>
            </CForm>
          </CRow>
        </CCardBody>
        <CCardFooter>
          <div class="float-end">
            <CButton
              color="danger" class="position-relative" size="sm"
              @click="deleteWod"
            >
              삭제
            </CButton>
            <CButton
              color="success" class="position-relative" size="sm"
              @click="updateWod"
            >
              수정
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

export default defineComponent({
  components: {DatePicker, MovementCard, ToastMessage},
  setup(props, {emit}) {
    const router = useRouter()
    const store = useStore()
    const toastMessageRef = ref(null)
    const registeredWod = reactive(store.state.workout.registeredWod)
    const timeCapForPicker = computed({
      get() {
        const [mm, ss] = registeredWod.timeCap.split(':')
        return { mm, ss }
      },
      set(value) {
        const newTimeCap = `${value.mm}:${value.ss}`
        registeredWod.timeCap = newTimeCap
      }
    })

    const isCustomize = computed(() => registeredWod.type === 'Custom')

    const handleTypeChange = () => {
      registeredWod.round = 0
      registeredWod.timeCap = "00:00"
      registeredWod.customMovements = ""
    }

    const handleSetTypeChange = () => {
      registeredWod.set = 0
    }

    const addMovement = () => {
      registeredWod.movements.push({
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
          },
          {
            level: 'Scaled',
            customLevel: '',
            gender: 'None',
            requirement: "",
          }
        ],
        isDescription: false,
        description: "",
      })
    }
    const addRest = () => {
      registeredWod.movements.push({
        name: "Rest",
        measure: "",
        type: "Sec",
        levelSetting: [],
        description: "",
      })
    }

    const updateWod = () => {
      store.dispatch("updateWod")
        .then(() => {
          toastMessageRef.value.createToast(
            {
              title: '성공',
              content: '와드 수정 성공.',
              type: 'success'
            }
          )
          setTimeout(() => {
            location.reload()
            // router.push("/admin/registered-wod-list")
          }, 1000)
        })
        .catch((error) => {
          console.log(error)
          toastMessageRef.value.createToast(
            {
              title: '실패',
              content: '와드 수정 실패 error: ' + error.message,
              type: 'danger'
            }
          )
          setTimeout(() => {
            location.reload()
            // router.push("/admin/registered-wod-list")
          }, 1000)
        })
    }
    const deleteWod = () => {
      store.dispatch("deleteWod")
        .then(() => {
          toastMessageRef.value.createToast(
            {
              title: '성공',
              content: '와드 삭제 성공.',
              type: 'success'
            }
          )
          setTimeout(() => {
            location.reload()
            // router.push("/admin/registered-wod-list")
          }, 1000)
        })
        .catch((error) => {
          console.log(error)
          toastMessageRef.value.createToast(
            {
              title: '실패',
              content: '와드 삭제 실패 error: ' + error.message,
              type: 'danger'
            }
          )
          setTimeout(() => {
            location.reload()
            // router.push("/admin/registered-wod-list")
          }, 1000)
        })
    }
    const moveToRegisteredWodList = () => {
      router.push("/admin/registered-wod-list")
    }
    return {
      toastMessageRef,
      registeredWod,
      timeCapForPicker,
      isCustomize,
      handleTypeChange,
      handleSetTypeChange,
      addMovement,
      addRest,
      updateWod,
      deleteWod,
      moveToRegisteredWodList,
    }
  },
})
</script>

<style scoped lang="scss">

</style>
