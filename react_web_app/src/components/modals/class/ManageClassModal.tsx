import React, { useState, useEffect } from 'react';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';
import { Calendar, Clock, User, Users, Settings, UserCheck } from 'lucide-react';
import { ManageClassModalProps, UpdateClassResult, DeleteClassResult } from '../../../types/class';
import { formatDateTime } from '../../../utils/classCalendarUtils';

const ManageClassModal = ({ 
  visible, 
  event, 
  onClose, 
  onUpdate, 
  onDelete 
}: ManageClassModalProps) => {
  const [coach, setCoach] = useState('');
  const [cap, setCap] = useState(10);
  const [showReservedMembers, setShowReservedMembers] = useState(false);

  // 예약된 회원 데이터 파싱 함수
  const parseReservedMembers = (reservedList: string[]) => {
    return reservedList.map(memberString => {
      const [email, realName, nickName] = memberString.split(',');
      return {
        email: email?.trim() || '',
        realName: realName?.trim() || '',
        nickName: nickName?.trim() || ''
      };
    });
  };

  // 파싱된 회원 데이터를 다시 문자열로 변환하는 함수
  const stringifyReservedMembers = (parsedMembers: { email: string; realName: string; nickName: string }[]) => {
    return parsedMembers.map(member => `${member.email},${member.realName},${member.nickName}`);
  };

  useEffect(() => {
    if (event && visible) {
      setCoach(event.extendedProps.coach || '');
      setCap(event.extendedProps.cap || 12);
    }
  }, [event, visible]);

  const handleUpdate = () => {
    // 현재 예약된 회원들을 파싱한 후 다시 문자열로 변환
    const parsedMembers = parseReservedMembers(event?.extendedProps?.reserved || []);
    const reservedStringList = stringifyReservedMembers(parsedMembers);
    
    const result: UpdateClassResult = {
      coach,
      cap,
      reserved: reservedStringList
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
          <div className="header-title">
            <Settings size={20} className="header-icon" />
            <h3>수업 관리</h3>
          </div>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="class-info">
            <div className="info-row">
              <div className="info-icon">
                <Calendar size={18} />
              </div>
              <div className="info-content">
                <span className="info-label">수업명</span>
                <span className="info-value">{event.title}</span>
              </div>
            </div>
            <div className="info-row">
              <div className="info-icon">
                <Clock size={18} />
              </div>
              <div className="info-content">
                <span className="info-label">시간</span>
                <span className="info-value">{formatDateTime(event.start)} ~ {formatDateTime(event.end)}</span>
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label>
              <User size={16} className="form-label-icon" />
              코치
            </label>
            <input
              type="text"
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
              placeholder="코치명을 입력하세요"
            />
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
                  <div className="members-grid">
                    {parseReservedMembers(event.extendedProps.reserved).map((member, index) => (
                      <div key={index} className="reserved-member-card">
                        <div className="member-avatar">
                          <UserCheck size={16} />
                        </div>
                        <div className="member-info">
                          <div className="member-name">{member.realName}</div>
                          <div className="member-nickname">@{member.nickName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-members">
                    <User size={24} className="no-members-icon" />
                    <p>예약된 회원이 없습니다.</p>
                  </div>
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

        .class-info {
          background: linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%);
          border: 1px solid #e1e7ef;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .info-row {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          padding: 12px;
          background-color: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .info-row:hover {
          background-color: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .info-icon {
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

        .info-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .info-label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .form-group {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          gap: 12px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
          min-width: 80px;
          flex-shrink: 0;
        }

        .form-label-icon {
          margin-right: 6px;
          color: ${AppColors.primary};
        }

        .form-group input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: ${AppColors.primary};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }

        .reserved-member-card {
          display: flex;
          align-items: center;
          padding: 12px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .reserved-member-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }

        .member-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: ${Gradients.primary};
          color: white;
          border-radius: 50%;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .member-info {
          flex: 1;
          min-width: 0;
        }

        .member-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .member-nickname {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .no-members {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          margin: 12px 0 0 0;
        }

        .no-members-icon {
          color: #94a3b8;
          margin-bottom: 8px;
        }

        .no-members p {
          color: #64748b;
          font-style: italic;
          text-align: center;
          margin: 0;
          font-size: 14px;
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
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
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