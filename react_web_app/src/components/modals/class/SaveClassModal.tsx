import React, { useState, useEffect } from 'react';
import { SaveClassModalProps, SaveClassResult } from '../../../types/class';
import { formatDateTime } from '../../../utils/classCalendarUtils';

const SaveClassModal = ({ 
  visible, 
  onClose, 
  onSave,
  selectInfo 
}: SaveClassModalProps) => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [coach, setCoach] = useState('');
  const [cap, setCap] = useState(12);
  const [applyToFourWeeks, setApplyToFourWeeks] = useState(false);

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
    setCap(12);
    setApplyToFourWeeks(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>수업 등록</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          {selectInfo && (
            <div className="selected-date">
              <strong>선택된 날짜:</strong> {formatDateTime(selectInfo.startStr)}
            </div>
          )}
          
          <div className="form-group">
            <label>시작 시간</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>종료 시간</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>코치</label>
            <input
              type="text"
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
              placeholder="코치명을 입력하세요"
            />
          </div>
          
          <div className="form-group">
            <label>정원</label>
            <input
              type="number"
              value={cap}
              onChange={(e) => setCap(Number(e.target.value))}
              min="1"
              max="30"
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={applyToFourWeeks}
                onChange={(e) => setApplyToFourWeeks(e.target.checked)}
              />
              4주간 동일하게 적용
            </label>
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
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-button:hover {
          background-color: #f3f4f6;
          color: #374151;
        }

        .modal-body {
          padding: 20px;
        }

        .selected-date {
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 20px;
          color: #0369a1;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          margin-bottom: 0 !important;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
          margin-bottom: 0;
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
          background-color: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2563eb;
          border-color: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default SaveClassModal; 