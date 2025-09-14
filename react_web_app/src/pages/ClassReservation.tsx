import React, { useRef, useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
// FullCalendar CSS는 패키지에서 자동으로 로드됩니다
import { DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import { ClassEvent, SaveClassResult, UpdateClassResult, DeleteClassResult, ToastMessageType } from '../types/class';
import { useClassManagement } from '../hooks/useClassManagement';
import SaveClassModal from '../components/modals/class/SaveClassModal';
import ManageClassModal from '../components/modals/class/ManageClassModal';
import ToastMessage from '../components/ToastMessage';

const ClassReservation: React.FC = () => {
  const calendarRef = useRef<FullCalendar>(null);
  
  // Firebase 연동 훅
  const {
    classes,
    loading,
    error,
    loadMonthlyClasses,
    createClass,
    updateClass,
    deleteClass,
    createRecurringClasses,
    clearError
  } = useClassManagement();
  
  // Modal states
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [selectInfo, setSelectInfo] = useState<any>(null);
  
  // Toast message
  const [createToast, setCreateToast] = useState<((toast: ToastMessageType) => void) | null>(null);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadMonthlyClasses();
  }, [loadMonthlyClasses]);

  // 에러 처리
  useEffect(() => {
    if (error && createToast) {
      createToast({
        type: 'danger',
        message: error
      });
      clearError();
    }
  }, [error, createToast, clearError]);

  const calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,dayGridMonth',
    },
    views: {
      dayGridMonth: {
        // titleFormat을 제거하고 datesSet에서 처리
      },
      timeGridWeek: {
        // titleFormat을 제거하고 datesSet에서 처리
      },
    },
    buttonText: {
      today: '오늘',
      month: '월(Month)',
      week: '주(Week)',
    },
    // 시간 범위 설정: 오전 6시부터 오후 11시까지만 표시 (12AM-6AM 숨김)
    slotMinTime: '06:00:00',
    slotMaxTime: '23:00:00',
    // 30분 간격으로 표시
    slotDuration: '00:30:00',
    // 1시간마다 시간 라벨 표시
    slotLabelInterval: '01:00:00',
    dayHeaderContent: (arg: any) => {
      const dayNamesShort = ['일', "월", "화", "수", "목", "금", "토"];
      const date = new Date(arg.date);
      
      // Monthly view
      if (date.getFullYear() === 1970) {
        return dayNamesShort[arg.date.getDay()];
      }
      
      // Weekly view
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}(${dayNamesShort[arg.date.getDay()]})`;
      return dateStr;
    },
    initialView: 'timeGridWeek',
    events: classes,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    select: handleDateSelect,
    eventClick: handleEventClick,
    eventsSet: handleEvents,
    height: 'auto',
    datesSet: handleDatesSet,
  };

  function handleDatesSet(info: any) {
    // 제목 형식을 변경
    setTimeout(() => {
      const titleEl = document.querySelector('.fc-toolbar-title');
      if (titleEl && info.view) {
        const start = new Date(info.start);
        const end = new Date(info.end);
        
        // 기존 내용을 완전히 지우고 새로운 제목 설정
        titleEl.innerHTML = '';
        
        let customTitle = '';
        if (info.view.type === 'dayGridMonth') {
          // 월 보기: 2025.09
          const year = start.getFullYear();
          const month = String(start.getMonth() + 1).padStart(2, '0');
          customTitle = `${year}.${month}`;
        } else if (info.view.type === 'timeGridWeek') {
          // 주 보기: 2025.09.07 - 2025.09.13
          const endDate = new Date(end);
          endDate.setDate(endDate.getDate() - 1); // FullCalendar는 종료일을 다음날로 설정하므로
          
          const formatDate = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}.${month}.${day}`;
          };
          
          customTitle = `${formatDate(start)} - ${formatDate(endDate)}`;
        }
        
        // 새로운 제목을 span 요소로 추가
        const titleSpan = document.createElement('span');
        titleSpan.textContent = customTitle;
        titleSpan.style.fontSize = '1.5rem';
        titleSpan.style.fontWeight = '600';
        titleEl.appendChild(titleSpan);
      }
    }, 10); // 약간 더 긴 딜레이로 확실히 DOM이 업데이트된 후 실행
  }

  function handleDateSelect(selectInfo: DateSelectArg) {
    loadSaveModal(selectInfo);
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const event: ClassEvent = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      extendedProps: {
        coach: clickInfo.event.extendedProps.coach || '',
        cap: clickInfo.event.extendedProps.cap || 0,
        reserved: clickInfo.event.extendedProps.reserved || [],
      }
    };
    loadManageModal(event);
  }

  function handleEvents(events: EventApi[]) {
    // setCurrentEvents(events);
  }

  function loadSaveModal(selectInfo: DateSelectArg) {
    let start = new Date(selectInfo.startStr);
    let end = new Date(selectInfo.endStr);

    // If time is not included (monthly calendar), add default time
    if (start.getHours() === 0 && end.getHours() === 0) {
      start.setHours(9);
      end = new Date(start);
      end.setHours(10);
    }

    // Convert back to ISO strings
    const adjustedSelectInfo = {
      ...selectInfo,
      startStr: start.toISOString(),
      endStr: end.toISOString(),
    };

    setSelectInfo(adjustedSelectInfo);
    setSaveModalVisible(true);
  }

  function loadManageModal(event: ClassEvent) {
    setSelectedEvent(event);
    setManageModalVisible(true);
  }

  const saveClass = useCallback(async (result: SaveClassResult) => {
    try {
      if (!selectInfo) return;

      const selectedDate = new Date(selectInfo.start);

      if (result.applyToFourWeeks) {
        // 4주간 반복 생성
        await createRecurringClasses(selectedDate, result);
        if (createToast) {
          createToast({
            type: 'success',
            message: '4주간 수업 등록 성공'
          });
        }
      } else {
        // 단일 수업 생성
        await createClass(selectedDate, result);
        if (createToast) {
          createToast({
            type: 'success',
            message: '수업 등록 성공'
          });
        }
      }
    } catch (error) {
      console.error('Failed to save class', error);
      if (createToast) {
        createToast({
          type: 'danger',
          message: '수업 등록 실패'
        });
      }
    }
  }, [createToast, selectInfo, createClass, createRecurringClasses]);

  const handleSaveModalResult = useCallback(async (modalResult: SaveClassResult) => {
    if (modalResult.applyToFourWeeks) {
      // 4주간 적용 로직
      for (let i = 0; i < 4; i++) {
        await saveClass(modalResult);
      }
    } else {
      await saveClass(modalResult);
    }
    setSaveModalVisible(false);
  }, [saveClass]);

  const handleUpdateClass = useCallback(async (result: UpdateClassResult) => {
    try {
      if (!selectedEvent) return;
      
      await updateClass(selectedEvent.id, result);
      
      if (createToast) {
        createToast({
          type: 'success',
          message: '수업 정보 변경 성공'
        });
      }
    } catch (error) {
      console.error('Failed to update class', error);
      if (createToast) {
        createToast({
          type: 'danger',
          message: '수업 정보 변경 실패'
        });
      }
    }
    
    setManageModalVisible(false);
  }, [selectedEvent, updateClass, createToast]);

  const handleDeleteClass = useCallback(async (result: DeleteClassResult) => {
    try {
      if (!selectedEvent || !result.confirmed) return;
      
      await deleteClass(selectedEvent.id);
      
      if (createToast) {
        createToast({
          type: 'success',
          message: '수업 삭제 성공'
        });
      }
    } catch (error) {
      console.error('Failed to delete class', error);
      if (createToast) {
        createToast({
          type: 'danger',
          message: '수업 삭제 실패'
        });
      }
    }
    
    setManageModalVisible(false);
  }, [selectedEvent, deleteClass, createToast]);

  return (
    <div className="dashboard">
      {/* 페이지 제목 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '24px' }}>
        <h1 className="dashboard-title" style={{ margin: 0 }}>수업 관리</h1>
        <p className="dashboard-subtitle" style={{ margin: 0 }}>수업 일정을 등록하고 관리하세요</p>
      </div>
      
      {/* 캘린더 카드 */}
      <div className="content-card" style={{ marginTop: '24px', flex: 1 }}>
        <div
          style={{
            height: 'calc(85vh - 160px)',
            minHeight: '600px',
          }}
        >
          <FullCalendar
            ref={calendarRef}
            {...calendarOptions}
          />
        </div>
      </div>

      {/* Modals */}
      <SaveClassModal
        visible={saveModalVisible}
        selectInfo={selectInfo}
        onClose={() => setSaveModalVisible(false)}
        onSave={handleSaveModalResult}
      />

      <ManageClassModal
        visible={manageModalVisible}
        event={selectedEvent}
        onClose={() => setManageModalVisible(false)}
        onUpdate={handleUpdateClass}
        onDelete={handleDeleteClass}
      />

      {/* Toast Messages */}
      <ToastMessage
        onCreateToast={(createToastFn: (toast: ToastMessageType) => void) => setCreateToast(() => createToastFn)}
      />
    </div>
  );
};

export default ClassReservation; 