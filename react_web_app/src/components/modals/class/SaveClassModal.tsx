import React, { useState, useEffect } from 'react';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';
import { Calendar, Clock, User, Users, Plus } from 'lucide-react';
import { SaveClassModalProps, SaveClassResult } from '../../../types/class';
import { ClassService } from '../../../services/classService';
import { useCoachOptions } from '../../../hooks/useCoachOptions';

const SaveClassModal = ({ 
  visible, 
  onClose, 
  onSave,
  onError,
  selectInfo 
}: SaveClassModalProps) => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [coach, setCoach] = useState('');
  const [cap, setCap] = useState(10);
  const [applyToFourWeeks, setApplyToFourWeeks] = useState(false);
  const coachOptions = useCoachOptions(visible);

  useEffect(() => {
    if (selectInfo && visible) {
      const start = new Date(selectInfo.start);
      const end = new Date(selectInfo.end);
      
      const startHours = start.getHours().toString().padStart(2, '0');
      const startMinutes = start.getMinutes().toString().padStart(2, '0');
      const endHours = end.getHours().toString().padStart(2, '0');
      const endMinutes = end.getMinutes().toString().padStart(2, '0');
      
      setStartTime(`${startHours}:${startMinutes}`);
      setEndTime(`${endHours}:${endMinutes}`);
    }
  }, [selectInfo, visible]);

  const handleSave = () => {
    // 코치 필드 검증
    if (!coach || coach.trim() === '') {
      if (onError) {
        onError('코치를 입력해주세요.');
      }
      return;
    }
    
    // 시작 시간이 종료 시간보다 앞서 있는지 검증
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    if (startTotalMinutes >= endTotalMinutes) {
      if (onError) {
        onError('시작 시간은 종료 시간보다 앞서야 합니다.');
      }
      return;
    }
    
    // 정원이 1 이상인지 검증
    if (cap < 1) {
      if (onError) {
        onError('정원은 1명 이상이어야 합니다.');
      }
      return;
    }
    
    const result: SaveClassResult = {
      startTime,
      endTime,
      coach,
      cap,
      applyToFourWeeks
    };
    onSave(result);
  };

  const handleClose = () => {
    // 모달을 닫을 때 상태 초기화
    setStartTime('09:00');
    setEndTime('10:00');
    setCoach('');
    setCap(10);
    setApplyToFourWeeks(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Plus size={20} className="header-icon" />
            <h3>수업 등록</h3>
          </div>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          {selectInfo && (() => {
            // all-day 선택인지 확인
            const isAllDay = selectInfo.allDay || false;
            
            // 날짜만 표시하는 함수
            const formatDateOnly = (dateTimeString: string) => {
              const date = new Date(dateTimeString);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}.${month}.${day}`;
            };
            
            return (
              <div className="selected-date-card">
                <div className="date-icon">
                  <Calendar size={18} />
                </div>
                <div className="date-info">
                  <span className="date-label">선택된 날짜</span>
                  <span className="date-value">
                    {isAllDay ? formatDateOnly(selectInfo.startStr) : ClassService.formatDateTime(selectInfo.startStr)}
                  </span>
                </div>
              </div>
            );
          })()}
          
          <div className="form-section">
            <div className="form-group">
              <label>
                <Clock size={16} className="form-label-icon" />
                시작 시간
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>
                <Clock size={16} className="form-label-icon" />
                종료 시간
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>
                <User size={16} className="form-label-icon" />
                코치
              </label>
              <select
                value={coach}
                onChange={(e) => setCoach(e.target.value)}
                className="form-input"
              >
                <option value="" disabled>
                  {coachOptions.length > 0 ? '코치 선택' : '등록된 코치 없음'}
                </option>
                {coachOptions.map((coachName) => (
                  <option key={coachName} value={coachName}>
                    {coachName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>
                <Users size={16} className="form-label-icon" />
                정원
              </label>
              <input
                type="number"
                value={cap}
                onChange={(e) => setCap(Number(e.target.value))}
                min="1"
                max="30"
                className="form-input"
              />
            </div>
            
            <div className="checkbox-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={applyToFourWeeks}
                  onChange={(e) => setApplyToFourWeeks(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">4주간 동일하게 적용</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: ${Gradients.primary};
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.15);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon {
          color: white;
          opacity: 0.9;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: white;
          opacity: 0.8;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
          opacity: 1;
          transform: scale(1.1);
        }

        .modal-body {
          padding: 20px;
        }

        .selected-date-card {
          display: flex;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 12px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .date-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background-color: ${AppColors.primary};
          color: white;
          border-radius: 8px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .date-info {
          display: flex;
          flex-direction: column;
        }

        .date-label {
          font-size: 12px;
          font-weight: 500;
          color: #0369a1;
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .date-value {
          font-size: 14px;
          font-weight: 600;
          color: #0c4a6e;
        }

        .form-section {
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .form-label-icon {
          margin-right: 6px;
          color: ${AppColors.primary};
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
          background-color: #fafbfc;
        }

        .form-input:focus {
          outline: none;
          border-color: ${AppColors.primary};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          background-color: white;
        }

        .checkbox-section {
          margin-top: 24px;
          padding: 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          margin: 0;
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          margin-right: 12px;
          accent-color: ${AppColors.primary};
        }

        .checkbox-text {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-secondary {
          background-color: #ffffff;
          border-color: #d1d5db;
          color: #374151;
        }

        .btn-secondary:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .btn-primary {
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
          color: white;
        }

        .btn-primary:hover {
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
        }
      `}</style>
    </div>
  );
};

export default SaveClassModal; 
