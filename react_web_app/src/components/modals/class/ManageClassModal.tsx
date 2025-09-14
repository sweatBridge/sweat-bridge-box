import React, { useState, useEffect } from 'react';
import { ManageClassModalProps, UpdateClassResult, DeleteClassResult } from '../../../types/class';
import { formatDateTime } from '../../../utils/classCalendarUtils';

const ManageClassModal: React.FC<ManageClassModalProps> = ({ 
  visible, 
  event, 
  onClose, 
  onUpdate, 
  onDelete 
}) => {
  const [coach, setCoach] = useState('');
  const [cap, setCap] = useState(12);
  const [showReservedMembers, setShowReservedMembers] = useState(false);

  useEffect(() => {
    if (event && visible) {
      setCoach(event.extendedProps.coach || '');
      setCap(event.extendedProps.cap || 12);
    }
  }, [event, visible]);

  const handleUpdate = () => {
    const result: UpdateClassResult = {
      coach,
      cap
    };
    onUpdate(result);
  };

  const handleDelete = () => {
    if (window.confirm('정말로 이 수업을 삭제하시겠습니까?')) {
      const result: DeleteClassResult = {
        confirmed: true
      };
      onDelete(result);
    }
  };

  const handleClose = () => {
    setShowReservedMembers(false);
    onClose();
  };

  if (!visible || !event) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>수업 관리</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="class-info">
            <div className="info-row">
              <strong>수업명:</strong> {event.title}
            </div>
            <div className="info-row">
              <strong>시간:</strong> {formatDateTime(event.start)} ~ {formatDateTime(event.end)}
            </div>
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

          <div className="reserved-section">
            <div className="reserved-header">
              <span>예약된 회원 ({event.extendedProps.reserved.length}명)</span>
              <button 
                className="btn btn-outline"
                onClick={() => setShowReservedMembers(!showReservedMembers)}
              >
                {showReservedMembers ? '숨기기' : '보기'}
              </button>
            </div>
            
            {showReservedMembers && (
              <div className="reserved-list">
                {event.extendedProps.reserved.length > 0 ? (
                  <ul>
                    {event.extendedProps.reserved.map((member, index) => (
                      <li key={index} className="reserved-member">
                        {member}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-members">예약된 회원이 없습니다.</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-danger" onClick={handleDelete}>
            삭제
          </button>
          <div className="button-group">
            <button className="btn btn-secondary" onClick={handleClose}>
              취소
            </button>
            <button className="btn btn-primary" onClick={handleUpdate}>
              수정
            </button>
          </div>
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

        .class-info {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .info-row {
          margin-bottom: 8px;
        }

        .info-row:last-child {
          margin-bottom: 0;
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

        .reserved-section {
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
          margin-top: 20px;
        }

        .reserved-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .reserved-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .reserved-member {
          padding: 8px 12px;
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          margin-bottom: 6px;
        }

        .reserved-member:last-child {
          margin-bottom: 0;
        }

        .no-members {
          color: #6b7280;
          font-style: italic;
          text-align: center;
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 4px;
          margin: 0;
        }

        .modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .button-group {
          display: flex;
          gap: 12px;
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

        .btn-danger {
          background-color: #dc2626;
          border-color: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background-color: #b91c1c;
          border-color: #b91c1c;
        }

        .btn-outline {
          background-color: transparent;
          border-color: #d1d5db;
          color: #374151;
          font-size: 12px;
          padding: 4px 8px;
        }

        .btn-outline:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default ManageClassModal; 