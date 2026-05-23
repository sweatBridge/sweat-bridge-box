import React from 'react';
import { Calendar } from 'lucide-react';
import { Gradients } from '../../../constants/gradients';
import type { Locker as LockerItem } from '../../../types/locker';
import { getLockerEventLabel } from '../../../types/locker';
import { formatPhoneNumber } from '../../../utils/phoneUtils';

interface LockerHistoryModalProps {
  visible: boolean;
  lockerNo: number;
  historyData: LockerItem[];
  onClose: () => void;
}

const LockerHistoryModal = ({
  visible,
  lockerNo,
  historyData,
  onClose
}: LockerHistoryModalProps) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Calendar size={20} className="header-icon" />
            <h3>락커 #{lockerNo} 히스토리</h3>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {historyData.length === 0 ? (
            <div className="empty-history">히스토리가 없습니다.</div>
          ) : (
            <div className="history-list">
              {[...historyData].reverse().map((item, index) => {
                // 배열을 역순으로 표시 (최신 → 오래된 순)
                const displayIndex = historyData.length - index;
                
                return (
                  <div key={index} className="history-item">
                    <div className="history-header">
                      <span className="history-index">
                        #{displayIndex} {item.createdAt ? (
                          <span style={{ fontWeight: 'normal' }}>[{item.createdAt.split(' ')[0]}]</span>
                        ) : ''}
                      </span>
                      <span className={`history-event-badge ${item.action ? `action-${item.action}` : 'unknown'}`}>
                        {getLockerEventLabel(item.action)}
                      </span>
                    </div>
                    
                    <div className="history-details">
                      {item.realName && (
                        <div className="history-row">
                          <span className="history-label">회원:</span>
                          <span className="history-value">{item.realName}</span>
                        </div>
                      )}
                      {item.phone && (
                        <div className="history-row">
                          <span className="history-label">전화번호:</span>
                          <span className="history-value">{formatPhoneNumber(item.phone)}</span>
                        </div>
                      )}
                      {item.startDate && (
                        <div className="history-row">
                          <span className="history-label">시작일:</span>
                          <span className="history-value">{item.startDate}</span>
                        </div>
                      )}
                      {item.endDate && (
                        <div className="history-row">
                          <span className="history-label">종료일:</span>
                          <span className="history-value">{item.endDate}</span>
                        </div>
                      )}
                      {item.note && (
                        <div className="history-row">
                          <span className="history-label">사유:</span>
                          <span className="history-value">{item.note}</span>
                        </div>
                      )}
                      {item.assignee && (
                        <div className="history-row">
                          <span className="history-label">담당자:</span>
                          <span className="history-value">{item.assignee}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>닫기</button>
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
          max-width: 600px;
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

        .empty-history {
          text-align: center;
          padding: 40px 20px;
          color: #9ca3af;
          font-size: 16px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .history-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background-color: #fafbfc;
          transition: all 0.2s;
        }

        .history-item:hover {
          background-color: #f3f4f6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .history-index {
          font-weight: 700;
          font-size: 14px;
          color: #6b7280;
        }

        .history-event-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .history-event-badge.action-assign {
          background-color: #dcfce7;
          color: #065f46;
        }

        .history-event-badge.action-release {
          background-color: #f3f4f6;
          color: #374151;
        }

        .history-event-badge.action-mark_broken {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .history-event-badge.action-restore {
          background-color: #e0f2fe;
          color: #075985;
        }

        .history-event-badge.action-delete {
          background-color: #1f2937;
          color: #f9fafb;
        }

        .history-event-badge.unknown {
          background-color: #f3f4f6;
          color: #9ca3af;
        }

        .history-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-row {
          display: flex;
          gap: 8px;
          font-size: 14px;
        }

        .history-label {
          font-weight: 600;
          color: #6b7280;
          min-width: 80px;
          flex-shrink: 0;
        }

        .history-value {
          color: #111827;
          word-break: break-word;
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
      `}</style>
    </div>
  );
};

export default LockerHistoryModal;
