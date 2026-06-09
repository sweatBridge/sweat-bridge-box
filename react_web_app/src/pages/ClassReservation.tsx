import { useRef, useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
// FullCalendar CSS는 패키지에서 자동으로 로드됩니다
import { DateSelectArg, EventClickArg, EventApi, DatesSetArg } from '@fullcalendar/core';
import { ClassEvent, SaveClassResult, UpdateClassResult, DeleteClassResult, ToastMessageType } from '../types/class';
import { useClassManagement } from '../hooks/useClassManagement';
import { ClassAlreadyExistsError } from '../repositories/classRepository';
import SaveClassModal from '../components/modals/class/SaveClassModal';
import ManageClassModal from '../components/modals/class/ManageClassModal';
import ToastMessage from '../components/ToastMessage';
import { usePageContext } from '../contexts/PageContext';
import { AppColors } from '../constants/colors';

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

  // 초기 뷰의 날짜 범위 계산 및 datesSet 핸들러
  const handleDatesSet = useCallback((info: DatesSetArg) => {
    const start = new Date(info.start);
    const end = new Date(info.end);
    
    // 주간 뷰: info.end는 다음날이므로 1일 빼기
    // 월간 뷰: info.end는 다음달 1일이므로 그대로 사용
    if (info.view.type === 'timeGridWeek') {
      end.setDate(end.getDate() - 1);
    }
    
    loadMonthlyClasses(start, end);
  }, [loadMonthlyClasses]);

  // 컴포넌트 마운트 시 초기 날짜 범위 계산
  useEffect(() => {
    // 캘린더가 마운트된 후 현재 뷰의 날짜 범위를 가져와서 로드
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      const start = new Date(view.activeStart);
      const end = new Date(view.activeEnd);
      
      if (view.type === 'timeGridWeek') {
        end.setDate(end.getDate() - 1);
      }
      
      loadMonthlyClasses(start, end);
    }
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
      left: 'prev,next',
      center: 'title',
      right: 'timeGridWeek,dayGridMonth',
    },
    views: {
      dayGridMonth: {
        eventTimeFormat: {
          hour: 'numeric' as const,
          minute: '2-digit' as const,
          hour12: true,
          meridiem: 'short' as const,
        },
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
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    select: handleDateSelect,
    eventClick: handleEventClick,
    eventsSet: handleEvents,
    datesSet: handleDatesSet,
    height: 'auto',
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
    const isAllDay = selectInfo.allDay || false;

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
      allDay: isAllDay,
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
        // 4주간 반복 생성 — 주별 결과를 모아서 사용자에게 요약 전달
        const summary = await createRecurringClasses(selectedDate, result);
        if (!createToast) return;

        const { created, skippedWeeks, failedWeeks } = summary;
        if (created.length === 0 && (skippedWeeks.length > 0 || failedWeeks.length > 0)) {
          // 한 주도 등록 못 함
          createToast({
            type: 'danger',
            message: skippedWeeks.length > 0
              ? '모든 주의 같은 시간대에 이미 수업이 등록되어 있습니다.'
              : '4주간 수업 등록에 실패했습니다.'
          });
        } else if (skippedWeeks.length === 0 && failedWeeks.length === 0) {
          createToast({ type: 'success', message: '4주간 수업 등록 성공' });
        } else {
          // 부분 성공
          const parts = [`${created.length}주 등록 성공`];
          if (skippedWeeks.length > 0) {
            parts.push(`${skippedWeeks.join(', ')}주차는 이미 등록된 수업이라 건너뜀`);
          }
          if (failedWeeks.length > 0) {
            parts.push(`${failedWeeks.join(', ')}주차 실패`);
          }
          createToast({ type: 'warning', message: parts.join(' · ') });
        }
      } else {
        // 단일 수업 생성
        await createClass(selectedDate, result);
        if (createToast) {
          createToast({ type: 'success', message: '수업 등록 성공' });
        }
      }
    } catch (error) {
      console.error('Failed to save class', error);
      if (!createToast) return;
      if (error instanceof ClassAlreadyExistsError) {
        createToast({
          type: 'warning',
          message: '같은 시간대에 이미 등록된 수업이 있습니다. 수업 수정으로 변경해 주세요.'
        });
      } else {
        createToast({ type: 'danger', message: '수업 등록 실패' });
      }
    }
  }, [createToast, selectInfo, createClass, createRecurringClasses]);

  const handleSaveModalResult = useCallback(async (modalResult: SaveClassResult) => {
    // 코치 필드 검증
    if (!modalResult.coach || modalResult.coach.trim() === '') {
      if (createToast) {
        createToast({
          type: 'warning',
          message: '코치를 입력해주세요.'
        });
      }
      return;
    }
    
    // saveClass 내부에서 applyToFourWeeks 분기를 처리한다.
    // (createRecurringClasses가 이미 4주치 docKey를 만들어 호출한다.)
    await saveClass(modalResult);
    setSaveModalVisible(false);
  }, [saveClass, createToast]);

  const handleUpdateClass = useCallback(async (result: UpdateClassResult) => {
    try {
      if (!selectedEvent) return;
      
      // 코치 필드 검증
      if (!result.coach || result.coach.trim() === '') {
        if (createToast) {
          createToast({
            type: 'warning',
            message: '코치를 입력해주세요.'
          });
        }
        return;
      }
      
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
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      const start = new Date(view.activeStart);
      const end = new Date(view.activeEnd);
      
      if (view.type === 'timeGridWeek') {
        end.setDate(end.getDate() - 1);
      }
      
      loadMonthlyClasses(start, end);
    }
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

      {/* 수업 요약 + 캘린더 (단일 카드) */}
      <div className="content-card" style={{ flex: 1 }}>
        <div className="card-header">
          <div className="header-left">
            <span>전체 수업: {classes.length}개</span>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline" onClick={handleRefresh}>
              새로고침
            </button>
            <button className="btn btn-outline" onClick={handleShowStats}>
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
        onError={(message) => {
          if (createToast) {
            createToast({
              type: 'warning',
              message
            });
          }
        }}
      />

      <ManageClassModal
        visible={manageModalVisible}
        event={selectedEvent}
        onClose={() => setManageModalVisible(false)}
        onUpdate={handleUpdateClass}
        onDelete={handleDeleteClass}
        onError={(message) => {
          if (createToast) {
            createToast({
              type: 'warning',
              message
            });
          }
        }}
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
          padding: 14px 18px;
          background: #ffffff;
          color: #0f172a;
          border-bottom: 1px solid #e2e8f0;
          border-radius: 12px 12px 0 0;
          margin: -20px -20px 16px -20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #0f172a;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .btn-outline {
          background: #ffffff;
          border: 1px solid #dbe2ea;
          color: #334155;
          font-size: 13px;
          padding: 6px 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .btn-outline:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .calendar-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .info-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }

        .calendar-container {
          height: calc(85vh - 230px);
          min-height: 620px;
          max-height: 820px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: auto;
          position: relative;
        }

        .fc {
          height: auto !important;
          min-height: 100%;
        }

        .fc .fc-toolbar {
          background: #ffffff;
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 0 !important;
        }

        .fc .fc-toolbar-title {
          font-size: 15px !important;
          font-weight: 600 !important;
          color: #0f172a !important;
          letter-spacing: -0.01em;
        }

        .fc .fc-button-primary {
          background: #ffffff !important;
          color: #475569 !important;
          border: 1px solid #dbe2ea !important;
          border-radius: 8px !important;
          padding: 5px 10px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          box-shadow: none !important;
        }

        .fc .fc-button-primary:hover {
          background-color: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }

        .fc .fc-button-primary:focus {
          box-shadow: none !important;
        }

        .fc .fc-button-primary:disabled {
          opacity: 0.45 !important;
          background-color: #f8fafc !important;
          color: #94a3b8 !important;
          border-color: #e2e8f0 !important;
        }

        .fc .fc-button-primary.fc-button-active {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }

        .fc .fc-today-button {
          color: ${AppColors.primary} !important;
        }

        .fc .fc-button-group .fc-button:not(:last-child) {
          margin-right: 4px !important;
        }

        .fc .fc-toolbar-chunk:last-child {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fc .fc-scrollgrid,
        .fc .fc-theme-standard td,
        .fc .fc-theme-standard th {
          border-color: #e5e7eb !important;
        }

        .fc .fc-col-header-cell {
          background: #f8fafc !important;
        }

        .fc .fc-col-header-cell-cushion {
          color: #64748b !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          text-decoration: none !important;
          padding: 7px 2px !important;
        }

        .fc .fc-timegrid-axis-cushion,
        .fc .fc-timegrid-slot-label-cushion {
          color: #94a3b8 !important;
          font-size: 11px !important;
        }

        .fc .fc-event {
          background: #eff6ff !important;
          color: #1e3a8a !important;
          border: 1px solid #bfdbfe !important;
          border-left: 4px solid ${AppColors.primary} !important;
          border-radius: 10px !important;
          padding: 6px 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08) !important;
        }

        .fc .fc-event:hover {
          background: #dbeafe !important;
          border-color: #93c5fd !important;
        }

        .fc .fc-event-time {
          color: ${AppColors.primary} !important;
          font-size: 11px !important;
          font-weight: 700 !important;
        }

        .fc .fc-event-title {
          color: #1e3a8a !important;
          font-size: 13px !important;
          font-weight: 600 !important;
        }

        /* timeGrid 이벤트가 칸 너비와 정확히 맞도록 좌우 inset 제거 */
        .fc .fc-timegrid-col-events {
          margin: 0 !important;
        }

        .fc .fc-timegrid-event-harness {
          left: 4px !important;
          right: 4px !important;
          margin: 0 !important;
        }

        .fc .fc-daygrid-day:hover,
        .fc .fc-timegrid-slot:hover {
          background-color: #f8fafc !important;
        }

        .fc .fc-day-today {
          background-color: #f8fbff !important;
        }

        .fc .fc-highlight {
          background-color: rgba(59, 130, 246, 0.11) !important;
        }

        /* 월 뷰를 revenue 캘린더 톤으로 맞춤 */
        .fc .fc-daygrid-day {
          background: #ffffff !important;
          border-color: #f1f5f9 !important;
        }

        .fc .fc-daygrid-day-frame {
          min-height: 96px !important;
          padding: 6px 6px 2px !important;
        }

        .fc .fc-daygrid-day-top {
          justify-content: center !important;
          padding-top: 2px !important;
        }

        .fc .fc-daygrid-day-number {
          color: #111827 !important;
          font-size: 16px !important;
          font-weight: 500 !important;
          text-decoration: none !important;
          padding: 2px 8px !important;
          border-radius: 8px !important;
          line-height: 1.2 !important;
        }

        .fc .fc-daygrid-day.fc-day-sun .fc-daygrid-day-number {
          color: #b91c1c !important;
        }

        .fc .fc-daygrid-day.fc-day-sat .fc-daygrid-day-number {
          color: #b91c1c !important;
        }

        .fc .fc-daygrid-day.fc-day-other .fc-daygrid-day-number {
          color: #cbd5e1 !important;
        }

        .fc .fc-daygrid-day.fc-day-today {
          background: #eef2ff !important;
        }

        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background: transparent !important;
          color: #1f2937 !important;
        }

        .fc .fc-col-header-cell.fc-day-sun .fc-col-header-cell-cushion,
        .fc .fc-col-header-cell.fc-day-sat .fc-col-header-cell-cushion {
          color: #6b7280 !important;
        }

        .fc .fc-daygrid-event {
          margin: 2px 4px !important;
        }

        .calendar-container::-webkit-scrollbar {
          width: 8px;
        }

        .calendar-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .calendar-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }

        .calendar-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .fc .fc-scroller {
          overflow: visible !important;
        }

        .fc .fc-timegrid-body {
          min-height: auto !important;
        }

        .fc .fc-timegrid-slot,
        .fc .fc-timegrid-slot-minor,
        .fc .fc-timegrid-slot-label {
          height: 24px !important;
          min-height: 24px !important;
          vertical-align: middle !important;
        }
      `}</style>
    </div>
  );
};

export default ClassReservation; 