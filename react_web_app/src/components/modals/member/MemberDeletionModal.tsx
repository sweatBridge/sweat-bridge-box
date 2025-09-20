import React from 'react';
import { AlertTriangle, User } from 'lucide-react';
import { MemberDeletionModalProps } from '../../../types/member';

const MemberDeletionModal = ({ visible, member, onClose, onDelete }: MemberDeletionModalProps) => {
  if (!visible || !member) return null;

  const handleDelete = () => {
    onDelete(member.email);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content deletion-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header danger-header">
          <div className="header-title">
            <AlertTriangle size={20} className="header-icon" />
            <h3>회원 삭제</h3>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="warning-content">
            <div className="warning-icon">
              <AlertTriangle size={48} />
            </div>
            
            <div className="warning-text">
              <h4>정말로 이 회원을 삭제하시겠습니까?</h4>
              <p>이 작업은 되돌릴 수 없습니다.</p>
            </div>
          </div>
          
          <div className="member-info-card">
            <div className="member-avatar">
              <User size={24} />
            </div>
            <div className="member-details">
              <div className="member-name">{member.realName}</div>
              <div className="member-email">{member.email}</div>
              <div className="member-membership">
                회원권: {member.membershipInfo.type}
              </div>
            </div>
          </div>
          
          <div className="warning-note">
            <p>
              <strong>주의:</strong> 회원을 삭제하면 관련된 모든 데이터(회원권 정보, 예약 기록 등)가 
              함께 삭제됩니다. 이 작업은 복구할 수 없습니다.
            </p>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            삭제
          </button>
        </div>
      </div>

      <style>{`
        .deletion-modal {
          max-width: 500px;
          width: 95%;
        }

        .danger-header {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        }

        .warning-content {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 1px solid #fecaca;
          border-radius: 12px;
        }

        .warning-icon {
          color: #dc2626;
          flex-shrink: 0;
        }

        .warning-text h4 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #991b1b;
        }

        .warning-text p {
          margin: 0;
          color: #7f1d1d;
          font-size: 14px;
        }

        .member-info-card {
          display: flex;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .member-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          margin-right: 16px;
          flex-shrink: 0;
        }

        .member-details {
          flex: 1;
        }

        .member-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .member-email {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .member-membership {
          font-size: 12px;
          color: #9ca3af;
          background-color: #f3f4f6;
          padding: 2px 8px;
          border-radius: 12px;
          display: inline-block;
        }

        .warning-note {
          padding: 16px;
          background-color: #fffbeb;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
        }

        .warning-note p {
          margin: 0;
          font-size: 13px;
          color: #92400e;
          line-height: 1.5;
        }

        .warning-note strong {
          color: #d97706;
        }

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
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          box-shadow: 0 2px 10px rgba(220, 38, 38, 0.15);
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

        .btn-danger {
          background-color: #dc2626;
          border-color: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background-color: #b91c1c;
          border-color: #b91c1c;
        }
      `}</style>
    </div>
  );
};

export default MemberDeletionModal; 