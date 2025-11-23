import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useRevenueManagement } from '../hooks/useRevenueManagement';
import { DailyRevenue } from '../types/revenue';
import { usePageContext } from '../contexts/PageContext';
import { Gradients } from '../constants/gradients';
import { AppColors } from '../constants/colors';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const RevenueManagement = () => {
  const { setPageInfo } = usePageContext();
  
  // 매출 관리 훅
  const {
    monthlyRevenue,
    stats,
    loading,
    error,
    loadMonthlyRevenue,
    loadInitialData,
    clearError
  } = useRevenueManagement();

  // 상태 관리
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // 페이지 정보 설정
  useEffect(() => {
    setPageInfo({
      title: '매출 관리',
      subtitle: '크로스핏 박스 매출을 확인하고 관리하세요'
    });
  }, [setPageInfo]);

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    const now = new Date();
    loadInitialData(now.getFullYear(), now.getMonth() + 1);
  }, [loadInitialData]);

  // 월 변경 시 데이터 로드
  useEffect(() => {
    loadMonthlyRevenue(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
  }, [currentMonth, loadMonthlyRevenue]);

  // 에러 처리
  useEffect(() => {
    if (error) {
      console.error('Revenue error:', error);
      // TODO: Toast 메시지 표시
      clearError();
    }
  }, [error, clearError]);

  // 선택된 날짜의 매출 데이터 가져오기
  const getSelectedDayRevenue = useCallback((): DailyRevenue | null => {
    if (!monthlyRevenue) return null;
    
    // 로컬 시간 기준으로 날짜 문자열 생성
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return monthlyRevenue.dailyData.find(day => day.date === dateStr) || null;
  }, [monthlyRevenue, selectedDate]);

  // 캘린더 날짜 클릭 핸들러
  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  // 캘린더 월 변경 핸들러
  const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate) {
      setCurrentMonth(activeStartDate);
    }
  };

  // 캘린더 타일 내용 커스터마이징
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && monthlyRevenue) {
      // 로컬 시간 기준으로 날짜 문자열 생성
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayRevenue = monthlyRevenue.dailyData.find(day => day.date === dateStr);
      
      if (dayRevenue && (dayRevenue.cashRevenue > 0 || dayRevenue.cardRevenue > 0)) {
        return (
          <div className="calendar-tile-content">
            {/* 날짜는 react-calendar가 자동으로 위에 표시 */}
            {dayRevenue.cashRevenue > 0 && (
              <div className="revenue-line cash-revenue">
                {dayRevenue.cashRevenue.toLocaleString()}원
              </div>
            )}
            {dayRevenue.cardRevenue > 0 && (
              <div className="revenue-line card-revenue">
                {dayRevenue.cardRevenue.toLocaleString()}원
              </div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  // // 엑셀 다운로드 핸들러 (TODO: 구현 필요)
  // const handleExcelDownload = useCallback(() => {
  //   // TODO: 엑셀 다운로드 기능 구현
  //   console.log('TODO: Excel download functionality');
  // }, []);

  const selectedDayRevenue = getSelectedDayRevenue();

  // 초기 로딩 중일 때 전체 로딩 화면 표시
  if (loading && !monthlyRevenue) {
    return (
      <div className="dashboard">
        <div className="initial-loading-container">
          <div className="loading-spinner large"></div>
          <h3>매출 데이터를 불러오는 중입니다...</h3>
          <p>잠시만 기다려주세요</p>
        </div>
        <style>{`
          .initial-loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            text-align: center;
          }

          .loading-spinner.large {
            width: 48px;
            height: 48px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid ${AppColors.primary};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 24px;
          }

          .initial-loading-container h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
            color: #374151;
          }

          .initial-loading-container p {
            margin: 0;
            font-size: 14px;
            color: #6b7280;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* 통계 카드들 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">올해 매출</div>
            <div className="stat-card-value">{(stats.totalRevenue / 10000).toLocaleString()}만원</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">
            <CalendarIcon size={24} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">이번 달 매출</div>
            <div className="stat-card-value">{(stats.thisMonthRevenue / 10000).toLocaleString()}만원</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">오늘 매출</div>
            <div className="stat-card-value">{(stats.todayRevenue / 10000).toLocaleString()}만원</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">월평균 매출</div>
            <div className="stat-card-value">{(stats.averageDailyRevenue / 10000).toLocaleString()}만원</div>
          </div>
        </div>
      </div>

      {/* 엑셀 다운로드 버튼 */}
      {/* <div className="actions-bar">
        <button className="btn btn-primary" onClick={handleExcelDownload}>
          <Download size={16} />
          엑셀 다운로드
        </button>
      </div> */}

      {/* 캘린더와 상세 정보 */}
      <div className="revenue-content">
        {/* 캘린더 섹션 */}
        <div className="content-card calendar-section">
          <div className="calendar-header">
            <h3>매출 캘린더</h3>
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-color cash"></div>
                <span>현금 매출</span>
              </div>
              <div className="legend-item">
                <div className="legend-color card"></div>
                <span>카드 매출</span>
              </div>
            </div>
          </div>
          
          <div className="calendar-container" style={{ position: 'relative' }}>
            {loading && monthlyRevenue && (
              <div className="calendar-loading-overlay">
                <div className="loading-spinner"></div>
              </div>
            )}
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              onActiveStartDateChange={handleActiveStartDateChange}
              tileContent={tileContent}
              locale="ko-KR"
              formatDay={(locale, date) => date.getDate().toString()}
              showNeighboringMonth={false}
              next2Label={null}
              prev2Label={null}
              nextLabel={<ChevronRight size={16} />}
              prevLabel={<ChevronLeft size={16} />}
            />
          </div>
        </div>

        {/* 상세 정보 섹션 */}
        <div className="content-card details-section">
          <div className="details-header">
            <CalendarIcon size={20} />
            <h3>{selectedDate.toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</h3>
          </div>

          {selectedDayRevenue ? (
            <div className="revenue-details-content">
              <div className="revenue-summary">
                <div className="summary-item total">
                  <div className="summary-label">총 매출</div>
                  <div className="summary-value">
                    {selectedDayRevenue.totalRevenue.toLocaleString()}원
                  </div>
                </div>
              </div>

              <div className="revenue-breakdown">
                <div className="breakdown-item">
                  <div className="breakdown-header">
                    <div className="breakdown-color membership"></div>
                    <span className="breakdown-label">회원권 매출</span>
                  </div>
                  <div className="breakdown-content">
                    <div className="breakdown-amount">
                      {selectedDayRevenue.membershipRevenue.toLocaleString()}원
                    </div>
                    <div className="breakdown-count">
                      {selectedDayRevenue.membershipCount}건
                    </div>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-header">
                    <div className="breakdown-color other"></div>
                    <span className="breakdown-label">기타 매출</span>
                  </div>
                  <div className="breakdown-content">
                    <div className="breakdown-amount">
                      {selectedDayRevenue.otherRevenue.toLocaleString()}원
                    </div>
                    <div className="breakdown-count">
                      {selectedDayRevenue.otherCount}건
                    </div>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-header">
                    <div className="breakdown-color cash"></div>
                    <span className="breakdown-label">현금 매출</span>
                  </div>
                  <div className="breakdown-content">
                    <div className="breakdown-amount">
                      {selectedDayRevenue.cashRevenue.toLocaleString()}원
                    </div>
                    <div className="breakdown-count">
                      {selectedDayRevenue.cashCount}건
                    </div>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-header">
                    <div className="breakdown-color card"></div>
                    <span className="breakdown-label">카드 매출</span>
                  </div>
                  <div className="breakdown-content">
                    <div className="breakdown-amount">
                      {selectedDayRevenue.cardRevenue.toLocaleString()}원
                    </div>
                    <div className="breakdown-count">
                      {selectedDayRevenue.cardCount}건
                    </div>
                  </div>
                </div>
              </div>

              <div className="revenue-chart">
                <div className="chart-title">매출 구성 비율</div>
                <div className="chart-bar">
                  <div 
                    className="chart-segment membership"
                    style={{ 
                      width: `${(selectedDayRevenue.membershipRevenue / selectedDayRevenue.totalRevenue) * 100}%` 
                    }}
                  ></div>
                  <div 
                    className="chart-segment other"
                    style={{ 
                      width: `${(selectedDayRevenue.otherRevenue / selectedDayRevenue.totalRevenue) * 100}%` 
                    }}
                  ></div>
                </div>
                
                <div className="chart-title">결제수단 비율</div>
                <div className="chart-bar">
                  <div 
                    className="chart-segment cash"
                    style={{ 
                      width: `${(selectedDayRevenue.cashRevenue / selectedDayRevenue.totalRevenue) * 100}%` 
                    }}
                  ></div>
                  <div 
                    className="chart-segment card"
                    style={{ 
                      width: `${(selectedDayRevenue.cardRevenue / selectedDayRevenue.totalRevenue) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-revenue">
              <TrendingUp size={48} className="no-revenue-icon" />
              <h4>매출 데이터가 없습니다</h4>
              <p>선택한 날짜에 등록된 매출이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s;
        }

        .stat-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }

        .stat-card-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: ${Gradients.primary};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .stat-card-content {
          flex: 1;
        }

        .stat-card-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .stat-card-value {
          font-size: 24px;
          font-weight: 700;
          color: #374151;
        }

        .actions-bar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
        }

        .btn-primary {
          background: ${Gradients.primary};
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 500;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .btn-primary:hover {
          background: ${Gradients.primaryHover};
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }

        .revenue-content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 20px;
          height: calc(100vh - 280px);
        }

        .calendar-section {
          display: flex;
          flex-direction: column;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .calendar-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }

        .calendar-legend {
          display: flex;
          gap: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-color.cash {
          background: #3b82f6; /* 파란색 */
        }

        .legend-color.card {
          background: #10b981; /* 녹색 */
        }

        .calendar-container {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .calendar-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          border-radius: 8px;
        }

        /* React Calendar 커스터마이징 */
        .react-calendar {
          width: 100% !important;
          max-width: none !important;
          background: white;
          border: none !important;
          font-family: inherit;
        }

        .react-calendar__navigation {
          display: flex;
          height: 44px;
          margin-bottom: 1em;
        }

        .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .react-calendar__navigation button:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .react-calendar__navigation button:disabled {
          background-color: #f9fafb;
          color: #9ca3af;
        }

        .react-calendar__navigation__label {
          font-weight: 600;
          font-size: 16px;
        }

        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 12px;
          color: #6b7280;
        }

        .react-calendar__month-view__weekdays__weekday {
          padding: 0.5em;
        }

        .react-calendar__month-view__days__day {
          position: relative;
          height: 80px;
          border: 1px solid #f3f4f6;
          background: white;
          transition: all 0.2s;
        }

        .react-calendar__tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 4px 2px;
        }

        .react-calendar__month-view__days__day abbr {
          position: relative;
          z-index: 2;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .react-calendar__month-view__days__day:hover {
          background-color: #f8fafc;
          border-color: #e2e8f0;
        }

        .react-calendar__month-view__days__day--neighboringMonth {
          color: #d1d5db;
          background-color: #f9fafb;
        }

        .react-calendar__tile--active {
          background: ${Gradients.primary} !important;
          color: white !important;
          border-color: ${AppColors.primary} !important;
        }

        .react-calendar__tile--active:hover {
          background: ${Gradients.primaryHover} !important;
        }

        .calendar-tile-content {
          position: absolute;
          top: 24px;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 2px;
          padding: 0 2px;
          pointer-events: none;
          z-index: 1;
        }

        .revenue-line {
          font-size: 10px;
          font-weight: 700;
          line-height: 1.3;
          text-align: center;
          flex-shrink: 0;
        }

        .revenue-line.cash-revenue {
          color: #3b82f6; /* 파란색 */
        }

        .revenue-line.card-revenue {
          color: #10b981; /* 녹색 */
        }

        .details-section {
          display: flex;
          flex-direction: column;
        }

        .details-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .details-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }

        .revenue-details-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .revenue-summary {
          background: ${Gradients.primary};
          color: white;
          padding: 20px;
          border-radius: 8px;
        }

        .summary-item {
          text-align: center;
        }

        .summary-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 8px;
        }

        .summary-value {
          font-size: 24px;
          font-weight: 700;
        }

        .revenue-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid transparent;
        }

        .breakdown-item:nth-child(1) {
          border-left-color: #3b82f6; /* 회원권 매출 */
        }

        .breakdown-item:nth-child(2) {
          border-left-color: #10b981; /* 기타 매출 */
        }

        .breakdown-item:nth-child(3) {
          border-left-color: #f59e0b; /* 현금 매출 */
        }

        .breakdown-item:nth-child(4) {
          border-left-color: #8b5cf6; /* 카드 매출 */
        }

        .breakdown-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .breakdown-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .breakdown-color.membership {
          background: #3b82f6;
        }

        .breakdown-color.other {
          background: #10b981;
        }

        .breakdown-color.cash {
          background: #f59e0b;
        }

        .breakdown-color.card {
          background: #8b5cf6;
        }

        .breakdown-label {
          font-weight: 500;
          color: #374151;
        }

        .breakdown-content {
          text-align: right;
        }

        .breakdown-amount {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .breakdown-count {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        .revenue-chart {
          margin-top: auto;
        }

        .chart-bar {
          display: flex;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          background: #f3f4f6;
        }

        .chart-segment.membership {
          background: #3b82f6;
        }

        .chart-segment.other {
          background: #10b981;
        }

        .chart-segment.cash {
          background: #f59e0b;
        }

        .chart-segment.card {
          background: #8b5cf6;
        }

        .chart-title {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 8px;
          margin-top: 16px;
        }

        .chart-title:first-child {
          margin-top: 0;
        }

        .no-revenue {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          text-align: center;
          color: #6b7280;
        }

        .no-revenue-icon {
          margin-bottom: 16px;
          color: #9ca3af;
        }

        .no-revenue h4 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 16px;
        }

        .no-revenue p {
          margin: 0;
          font-size: 14px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid ${AppColors.primary};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-container p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .revenue-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .details-section {
            order: -1;
          }
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 20px;
          }

          .stat-card-icon {
            width: 48px;
            height: 48px;
          }

          .stat-card-value {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default RevenueManagement; 