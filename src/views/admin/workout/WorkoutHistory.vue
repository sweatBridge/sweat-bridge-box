<template>
  <CRow>
    <CCol>
      <CCard>
        <CCardHeader>와드 달력</CCardHeader>
        <CCardBody>
          <VCalendar class="wod-calendar" expanded borderless dark :attributes="attributes" >
          </VCalendar>
        </CCardBody>
      </CCard>
    </CCol>
    <CCol>
      <CRow>
        <CCol sm="12">
          <CCard>
            <CCardHeader>
              <strong>오늘의 와드</strong>
            </CCardHeader>
            <CCardBody>
              For Time<br><br>
              3 Rounds<br><br>
              15 Wall Ball(20/14)<br>
              15 Deadlift(185/125)<br>
              15 Box Jump Over(24/20)<br>

            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm="12">
          <CCard>
            <CCardHeader>
              <strong>회원 기록 </strong>(26명)
            </CCardHeader>
            <CCardBody>
             <member-record :records="records" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm="12">
          <CCard>
            <CCardHeader>
              <strong>회원 피드백</strong>
            </CCardHeader>
            <CCardBody>
              <member-feedback :feedbacks="feedbacks" />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CCol>
  </CRow>
</template>

<script setup>
import { ref } from 'vue'
import MemberFeedback from "@/views/admin/workout/MemberFeedback.vue";
import MemberRecord from "@/views/admin/workout/MemberRecord.vue";

const attributes = ref([
  {
    // Object
    content: {
      color: 'purple',
      style: {
        fontStyle: 'italic',
      },
    },
    dates: [
      new Date(2023, 8, 3),
      new Date(2023, 9, 9),
      new Date(2023, 7, 13),
    ],
  },
])
const feedbacks = ref([
  {
    name: "김대현",
    feedback: "오늘 와드는 초보자가 따라가기에 너무 어려웠어요. 다음에 자세히 설명해주세요"
  },
  {
    name: "김재인",
    feedback: "데드리프트 때 어떤 무게를 들어야할지 모르겠어요"
  },
  {
    name: "박솔희",
    feedback: "8:30 수업에 사람이 너무 많아요"
  }
])

const records = ref([
  {
    name: "김대현",
    level: "RXD",
    record: "06:54"
  }
])
</script>

<style>
.wod-calendar .vc-weekday-1, .wod-calendar .vc-weekday-7 {
  color: #d00f42
}
</style>
