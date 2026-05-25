import React from 'react';
import { X, UserCheck, User, Trash2 } from 'lucide-react';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';

interface ReservedMembersModalProps {
  visible: boolean;
  onClose: () => void;
  reservedMembers: string[];
  onDeleteMember: (email: string) => void;
}

const ReservedMembersModal = ({
  visible,
  onClose,
  reservedMembers,
  onDeleteMember
}: ReservedMembersModalProps) => {
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

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <UserCheck size={20} className="header-icon" />
            <h3>예약 인원</h3>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="member-count">
            총 <strong>{reservedMembers.length}명</strong>
          </div>

          {reservedMembers.length > 0 ? (
            <div className="members-list">
              {parseReservedMembers(reservedMembers).map((member, index) => (
                <div key={index} className="member-row">
                  <div className="member-avatar">
                    <UserCheck size={16} />
                  </div>
                  <div className="member-info">
                    <div className="member-name">{member.realName}</div>
                    <div className="member-details">
                      <span className="member-nickname">@{member.nickName}</span>
                      <span className="member-divider">•</span>
                      <span className="member-email">{member.email}</span>
                    </div>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => onDeleteMember(member.email)}
                    title="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-members">
              <User size={48} className="no-members-icon" />
              <p>예약된 회원이 없습니다.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            닫기
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
          z-index: 1002;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: modalSlideIn 0.2s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: ${Gradients.primary};
          border-bottom: none;
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.15);
          flex-shrink: 0;
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
          cursor: pointer;
          color: white;
          opacity: 0.8;
          padding: 4px;
          width: 32px;
          height: 32px;
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
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .member-count {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .member-count strong {
          color: ${AppColors.primary};
          font-size: 16px;
        }

        .members-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .member-row {
          display: flex;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          transition: all 0.2s ease;
          position: relative;
        }

        .member-row:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }

        .member-row:hover .btn-delete {
          opacity: 1;
        }

        .member-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: ${Gradients.primary};
          color: white;
          border-radius: 50%;
          margin-right: 16px;
          flex-shrink: 0;
        }

        .member-info {
          flex: 1;
          min-width: 0;
        }

        .member-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .member-details {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .member-nickname {
          color: #64748b;
          font-weight: 500;
        }

        .member-divider {
          color: #cbd5e1;
        }

        .member-email {
          color: #94a3b8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-delete {
          background: #ef4444;
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          flex-shrink: 0;
          margin-left: 12px;
        }

        .btn-delete:hover {
          background: #dc2626;
          transform: scale(1.05);
        }

        .no-members {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
        }

        .no-members-icon {
          color: #94a3b8;
          margin-bottom: 16px;
        }

        .no-members p {
          color: #64748b;
          font-style: italic;
          text-align: center;
          margin: 0;
          font-size: 15px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
          flex-shrink: 0;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          border: 1px solid;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
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

export default ReservedMembersModal;
