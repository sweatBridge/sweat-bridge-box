import { useRef, useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
// FullCalendar CSS는 패키지에서 자동으로 로드됩니다
import { DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import { Calendar, BarChart3, RefreshCw } from 'lucide-react';
import { ClassEvent, SaveClassResult, UpdateClassResult, DeleteClassResult, ToastMessageType } from '../types/class';
import { useClassManagement } from '../hooks/useClassManagement';
import SaveClassModal from '../components/modals/class/SaveClassModal';
import ManageClassModal from '../components/modals/class/ManageClassModal';
import ToastMessage from '../components/ToastMessage';
import { usePageContext } from '../contexts/PageContext';
import { Gradients } from '../constants/gradients';

const ClassReservation = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const { setPageInfo } = usePageContext();
  
  // Firebase 연동 훅
  const {
    classes,
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

  // 페이지 정보 설정
  useEffect(() => {
    setPageInfo({
      title: '수업 관리',
      subtitle: '수업 일정을 등록하고 관리하세요'
    });
  }, [setPageInfo]);

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
    // datesSet: handleDatesSet,
  };

  // function handleDatesSet(info: any) {
  //   // 제목 형식을 변경
  //   setTimeout(() => {
  //     const titleEl = document.querySelector('.fc-toolbar-title');
  //     if (titleEl && info.view) {
  //       const start = new Date(info.start);
  //       const end = new Date(info.end);
        
  //       // 기존 내용을 완전히 지우고 새로운 제목 설정
  //       titleEl.innerHTML = '';
        
  //       let customTitle = '';
  //       if (info.view.type === 'dayGridMonth') {
  //         // 월 보기: 2025.09
  //         const year = start.getFullYear();
  //         const month = String(start.getMonth() + 1).padStart(2, '0');
  //         customTitle = `${year}.${month}`;
  //       } else if (info.view.type === 'timeGridWeek') {
  //         // 주 보기: 2025.09.07 - 2025.09.13
  //         const endDate = new Date(end);
  //         endDate.setDate(endDate.getDate() - 1); // FullCalendar는 종료일을 다음날로 설정하므로
          
  //         const formatDate = (d: Date) => {
  //           const year = d.getFullYear();
  //           const month = String(d.getMonth() + 1).padStart(2, '0');
  //           const day = String(d.getDate()).padStart(2, '0');
  //           return `${year}.${month}.${day}`;
  //         };
          
  //         customTitle = `${formatDate(start)} - ${formatDate(endDate)}`;
  //       }
        
  //       // 새로운 제목을 span 요소로 추가
  //       const titleSpan = document.createElement('span');
  //       titleSpan.textContent = customTitle;
  //       titleSpan.style.fontSize = '1.5rem';
  //       titleSpan.style.fontWeight = '600';
  //       titleEl.appendChild(titleSpan);
  //     }
  //   }, 10); // 약간 더 긴 딜레이로 확실히 DOM이 업데이트된 후 실행
  // }

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

  // 새로고침 핸들러
  const handleRefresh = useCallback(() => {
    loadMonthlyClasses();
    if (createToast) {
      createToast({
        type: 'info',
        message: '수업 일정을 새로고침했습니다.'
      });
    }
  }, [loadMonthlyClasses, createToast]);

  // 통계 핸들러 (임시)
  const handleShowStats = useCallback(() => {
    if (createToast) {
      createToast({
        type: 'info',
        message: '수업 통계 기능은 준비 중입니다.'
      });
    }
  }, [createToast]);

  return (
    <div className="dashboard">

      {/* 컨트롤 카드 */}
      <div className="content-card">
        <div className="card-header">
          <div className="header-left">
            <Calendar size={20} />
            <span>전체 수업: {classes.length}개</span>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline" onClick={handleRefresh}>
              <RefreshCw size={16} />
              새로고침
            </button>
            <button className="btn btn-outline" onClick={handleShowStats}>
              <BarChart3 size={16} />
              통계
            </button>
          </div>
        </div>

        <div className="calendar-info">
          <div className="info-item">
            <span className="info-label">이번 달 수업:</span>
            <span className="info-value">{classes.length}개</span>
          </div>
          <div className="info-item">
            <span className="info-label">총 예약:</span>
            <span className="info-value">
              {classes.reduce((total, c) => total + c.extendedProps.reserved.length, 0)}명
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">총 정원:</span>
            <span className="info-value">
              {classes.reduce((total, c) => total + c.extendedProps.cap, 0)}명
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">평균 예약률:</span>
            <span className="info-value">
              {classes.length > 0 
                ? Math.round((classes.reduce((total, c) => total + c.extendedProps.reserved.length, 0) / 
                   classes.reduce((total, c) => total + c.extendedProps.cap, 0)) * 100) || 0
                : 0}%
            </span>
          </div>
        </div>
      </div>
      
      {/* 캘린더 카드 */}
      <div className="content-card" style={{ flex: 1 }}>
        <div className="calendar-container">
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

      <style>{`
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: ${Gradients.primary};
          color: white;
          border-radius: 8px 8px 0 0;
          margin: -20px -20px 20px -20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .btn-outline {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 14px;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-1px);
        }

        .calendar-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .info-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .info-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .calendar-container {
          height: calc(85vh - 240px);
          min-height: 600px;
          max-height: 800px;
          background: white;
          border-radius: 8px;
          overflow: auto;
          position: relative;
        }

        /* FullCalendar 스타일 커스터마이징 */
        .fc {
          height: auto !important;
          min-height: 100%;
        }

        .fc .fc-toolbar {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 0 !important;
        }

        .fc .fc-toolbar-title {
          font-size: 18px !important;
          font-weight: 600 !important;
          color: #1f2937 !important;
        }

        .fc .fc-button-primary {
          background: ${Gradients.primary} !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 6px 12px !important;
          font-weight: 500 !important;
          transition: all 0.2s !important;
        }

        .fc .fc-button-primary:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
        }

        .fc .fc-button-primary:disabled {
          opacity: 0.5 !important;
          transform: none !important;
          box-shadow: none !important;
        }

        .fc .fc-event {
          background: ${Gradients.primary} !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 2px 6px !important;
          font-weight: 500 !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.2s !important;
        }

        .fc .fc-event:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
        }

        .fc .fc-daygrid-day:hover {
          background-color: rgba(102, 126, 234, 0.05) !important;
        }

        .fc .fc-day-today {
          background-color: rgba(102, 126, 234, 0.1) !important;
        }

        .fc .fc-timegrid-slot:hover {
          background-color: rgba(102, 126, 234, 0.05) !important;
        }

        .fc .fc-highlight {
          background-color: rgba(102, 126, 234, 0.2) !important;
        }

        /* 스크롤바 스타일링 */
        .calendar-container::-webkit-scrollbar {
          width: 8px;
        }

        .calendar-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .calendar-container::-webkit-scrollbar-thumb {
          background: ${Gradients.primary};
          border-radius: 4px;
        }

        .calendar-container::-webkit-scrollbar-thumb:hover {
          background: ${Gradients.primaryHover};
        }

        /* 달력 내부 스크롤 영역 조정 */
        .fc .fc-scroller {
          overflow: visible !important;
        }

        .fc .fc-timegrid-body {
          min-height: auto !important;
        }

        /* 시간 슬롯 높이 조정 */
        .fc .fc-timegrid-slot {
          height: 5px !important;
          min-height: 5px !important;
        }

        .fc .fc-timegrid-slot-minor {
          height: 5px !important;
          min-height: 5px !important;
        }

        .fc .fc-timegrid-slot-label {
          height: 5px !important;
          vertical-align: middle !important;
        }
      `}</style>
    </div>
  );
};

export default ClassReservation; 