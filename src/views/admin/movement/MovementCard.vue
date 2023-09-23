<template>
  <CCard>
    <CCardBody class="custom-card-border">
      <CRow>
        <CCol sm="4">
          <CInputGroup class="mb-3">
            <CInputGroupText id="basic-addon3">동작 이름</CInputGroupText>
            <CFormInput
              id="basic-url"
              aria-describedby="basic-addon3"
            />
          </CInputGroup>
        </CCol>
      </CRow>
      <CRow>
        <CCol sm="8">
          <CInputGroup class="mb-3">
            <CInputGroupText id="basic-addon3">결과(Reps)</CInputGroupText>
            <CFormInput
              id="basic-url"
              aria-describedby="basic-addon3"
            />
            <CInputGroupText id="basic-addon3">타입</CInputGroupText>
            <CFormInput
              id="basic-url"
              aria-describedby="basic-addon3"
            />
          </CInputGroup>
        </CCol>
        <CCol sm="2">
          <div style="height: 8px;"></div>
          <CFormCheck id="levelOption" label="난이도 설정" v-model="isLevelSet"/>
        </CCol>
      </CRow>
      <CRow>
        <CCard v-if="isLevelSet">
          <CCardHeader>
            난이도 설정
            <div class="float-end">
              <CButton
                color="info" class="position-relative" size="sm"
                @click="addLevel"
              >
                난이도 추가
              </CButton>
            </div>
          </CCardHeader>
          <CCardBody>
            <EasyDataTable
              :buttons-pagination="false"
              :headers="headers"
              :items="items"
              show-index
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
                <CFormSelect id="inputGroupSelect01" v-model="items[index-1].level">
                  <option>난이도</option>
                  <option value="Rxd">Rxd</option>
                  <option value="Scaled">Scaled</option>
                  <option value="Custom">Custom Level...</option>
                </CFormSelect>
                <CFormInput
                  v-if="items[index-1].level === 'Custom'"
                  v-model="items[index-1].customLevel"
                ></CFormInput>
              </template>
              <template #item-gender="{ index }">
                <CFormSelect id="inputGroupSelect01" v-model="items[index-1].gender">
                  <option>성별</option>
                  <option value="M">M</option>
                  <option value="W">W</option>
                  <option value="None">None</option>
                </CFormSelect>
              </template>
              <template #item-requirement="{ index }">
                <CFormInput v-model="items[index-1].requirement"></CFormInput>
              </template>
            </EasyDataTable>
          </CCardBody>
        </CCard>
      </CRow>
    </CCardBody>
  </CCard>

</template>

<script>
import { defineComponent, ref, reactive } from 'vue'
export default defineComponent({
  setup(props, {emit}) {
    const headers = [
      { text: "기능", value: "operation"},
      { text: "난이도", value: "level"},
      { text: "성별", value: "gender"},
      { text: "조건", value: "requirement"}
    ]
    const items = reactive([
      {
        level: 'Rxd',
        customLevel: "",
        gender: "",
        requirement: ""
      }
    ])
    const isLevelSet = ref(false)
    const testButton = () => {
      console.log(items)
    }
    const addLevel = () => {
      items.push({
        level: "",
        customLevel: "",
        gender: "",
        requirement: ""
      })
    }

    const removeLevel = (index) => {
      items.splice(index, 1);
    };

    return {
      headers,
      items,
      isLevelSet,
      addLevel,
      removeLevel,
      testButton,
    }
  }
})
</script>

<style scoped>
.custom-card-border {
  border-color: var(--cui-danger);
  /*background-color: var(--cui-cyan);*/
}
.blue-background {
  background-color: var(--cui-blue);
  --cui-body-color: #ff0000;
}
</style>
