<template>
  <CCard>
    <CCardBody :class="movmentCardClass">
      <CRow>
        <CCol sm="6">
          <CInputGroup class="mb-3">
            <CInputGroupText id="basic-addon3">동작 이름</CInputGroupText>
            <CFormInput
              id="basic-url"
              aria-describedby="basic-addon3"
              v-model="movement.name"
            />
          </CInputGroup>
        </CCol>
        <CCol sm="5"></CCol>
        <CCol sm="1">
          <div class="float-end">
            <CButton
              color="danger"
              size="sm"
              @click="removeMovement"
            >
              <CIcon name="cil-ban" />
            </CButton>
          </div>
        </CCol>
      </CRow>
      <CRow>
        <CCol sm="8">
          <CInputGroup class="mb-3">
            <CInputGroupText id="basic-addon3">측정(Reps)</CInputGroupText>
            <CFormInput
              id="basic-url"
              aria-describedby="basic-addon3"
              v-model="movement.measure"
            />
            <CInputGroupText id="basic-addon3">타입</CInputGroupText>
            <CFormSelect id="inputGroupSelect01" v-model="movement.type">
              <option>타입 선택</option>
              <option value="Count">Count</option>
              <option value="Reps">Reps</option>
              <option value="Cal">Cal</option>
              <option value="Sec">Sec</option>
              <option value="Min">Min</option>
            </CFormSelect>
          </CInputGroup>
        </CCol>
        <CCol sm="2">
          <div style="height: 8px;"></div>
          <CFormCheck id="levelOption" label="난이도 설정" v-if="movement.name !== 'Rest'" :checked="movement.isLevelSet" v-model="movement.isLevelSet" @change="handleLevelSetChange"/>
        </CCol>
      </CRow>
      <CRow>
        <CCard v-if="movement.isLevelSet">
          <CCardHeader>
            <div class="float-end">
              <CButton
                class="position-relative header-button" size="sm"
                @click="addLevel"
              >
                <strong>난이도 추가</strong>
              </CButton>
            </div>
          </CCardHeader>
          <CCardBody>
            <EasyDataTable
              :buttons-pagination="false"
              :headers="headers"
              :items="movement.levelSetting"
              show-index
              body-text-direction="center"
              header-text-direction="center"
            >
              <template #item-operation="{ index }">
                <CButton
                  color="danger"
                  size="sm"
                  @click="removeLevel(index - 1)"
                >
                  <CIcon name="cil-ban" />
                </CButton>
              </template>
              <template #item-level="{ index }">
                <CFormSelect id="inputGroupSelect01" v-model="movement.levelSetting[index-1].level">
                  <option>난이도</option>
                  <option value="Rxd">Rxd</option>
                  <option value="Scaled">Scaled</option>
                  <option value="Custom">Custom Level</option>
                </CFormSelect>
                <CFormInput
                  v-if="movement.levelSetting[index-1].level === 'Custom'"
                  v-model="movement.levelSetting[index-1].customLevel"
                ></CFormInput>
              </template>
              <template #item-gender="{ index }">
                <CFormSelect id="inputGroupSelect01" v-model="movement.levelSetting[index-1].gender">
                  <option>성별</option>
                  <option value="M">M</option>
                  <option value="W">W</option>
                  <option value="None">None</option>
                </CFormSelect>
              </template>
              <template #item-requirement="{ index }">
                <CFormInput v-model="movement.levelSetting[index-1].requirement"></CFormInput>
              </template>
            </EasyDataTable>
          </CCardBody>
        </CCard>
      </CRow>
      <CRow>
        <CCol sm="2">
          <div style="height: 8px;"></div>
          <CFormCheck id="descriptOption" label="설명 추가" :checked="movement.isDescription" v-model="movement.isDescription" @change="handleDescriptionChange" />
        </CCol>
        <CCol sm="10">
          <CFormInput
            v-if="movement.isDescription"
            v-model="movement.description"
          />
        </CCol>
      </CRow>
    </CCardBody>
  </CCard>

</template>

<script>
import { defineComponent, ref, reactive, computed, watch } from 'vue'
import { useStore } from "vuex"
import workout from "@/store/modules/workout";

export default defineComponent({
  props: {
    index: {
      type: Number,
      required: true
    },
    pageType: {
      type: String,
      required: true
    }
  },
  setup(props, {emit}) {
    const store = useStore()
    const movement = computed(() => {
      if (!store.state || !store.state.workout) return null

      if (props.pageType === 'wodRegistration' && store.state.workout.wodRegistration) {
        return store.state.workout.wodRegistration.movements[props.index]
      } else if (props.pageType === 'registeredWod' && store.state.workout.registeredWod) {
        return store.state.workout.registeredWod.movements[props.index]
      }

      console.warn(`Invalid pageType: ${props.pageType}`)
      return null
    })

    const headers = [
      { text: "기능", value: "operation"},
      { text: "난이도", value: "level"},
      { text: "성별", value: "gender"},
      { text: "조건", value: "requirement"}
    ]
    const handleLevelSetChange = () => {
      movement.value.levelSetting = []
    }
    const handleDescriptionChange = () => {
      movement.value.description = ""
    }
    const addLevel = () => {
      movement.value.levelSetting.push({
        level: "",
        customLevel: "",
        gender: "",
        requirement: ""
      })
    }

    const removeLevel = (index) => {
      movement.value.levelSetting.splice(index, 1)
    }

    const movmentCardClass = computed(() => {
      if (movement.value.name === 'Rest') {
        return 'rest-card'
      }
      return 'movement-card'
    })

    const removeMovement = () => {
      store.commit("removeMovement", {
        target: props.pageType,
        index: props.index
      })
    }

    return {
      movement,
      headers,
      movmentCardClass,
      handleLevelSetChange,
      handleDescriptionChange,
      addLevel,
      removeLevel,
      removeMovement,
    }
  }
})
</script>

<style scoped>
.movement-card {
  /*border-color: var(--cui-danger);*/
  background-color: rgb(95, 118, 201);
  color: rgb(255, 255, 255)
}
.rest-card {
  background-color: rgba(244, 204, 107, 0.87);
  color: black;
}
.blue-background {
  background-color: var(--cui-blue);
  --cui-body-color: #ff0000;
}
.header-button {
  /*border-color: var(--cui-danger);*/
  background-color: rgba(140, 170, 230, 0.98);
  color: rgb(0, 0, 0)
}
</style>
