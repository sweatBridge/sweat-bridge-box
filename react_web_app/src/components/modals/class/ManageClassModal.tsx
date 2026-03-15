import React, { useState, useEffect } from 'react';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';
import { Calendar, Clock, User, Users, Settings, UserPlus, Eye } from 'lucide-react';
import { ManageClassModalProps, UpdateClassResult, DeleteClassResult } from '../../../types/class';
import { formatDateTime } from '../../../utils/classCalendarUtils';
import { useAuth } from '../../../contexts/AuthContext';
import AddReserveMemberModal from './AddReserveMemberModal';
import ReservedMembersModal from './ReservedMembersModal';

const ManageClassModal = ({
  visible,
  event,
  onClose,
  onUpdate,
  onDelete,
  onError
}: ManageClassModalProps) => {
  const { user } = useAuth();
  const [coach, setCoach] = useState('');
  const [cap, setCap] = useState(10);
  const [reservedMembersModalVisible, setReservedMembersModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [reservedList, setReservedList] = useState<string[]>([]);

  useEffect(() => {
    if (event && visible) {
      setCoach(event.extendedProps.coach || '');
      setCap(event.extendedProps.cap ?? 10);
      setReservedList(event.extendedProps.reserved || []);
    }
  }, [event, visible]);

  const handleAddMember = (member: { email: string; realName: string; nickName: string; phone: string }) => {
    // 회원 추가: "email,realName,nickName" 형식
    const memberString = `${member.email},${member.realName},${member.nickName}`;
    const updatedReserved = [...reservedList, memberString];
    setReservedList(updatedReserved);
    setAddMemberModalVisible(false);

    // 즉시 업데이트
    const result: UpdateClassResult = {
      coach,
      cap,
      reserved: updatedReserved
    };
    onUpdate(result);
  };

  const handleDeleteMember = (email: string) => {
    if (!window.confirm('이 회원을 예약 목록에서 삭제하시겠습니까?')) {
      return;
    }

    // reserved 배열에서 해당 이메일을 포함하는 항목 제거
    const updatedReserved = reservedList.filter(memberString => !memberString.includes(email));
    setReservedList(updatedReserved);

    // 즉시 업데이트
    const result: UpdateClassResult = {
      coach,
      cap,
      reserved: updatedReserved
    };
    onUpdate(result);
  };

  const handleUpdate = () => {
    // 코치 필드 검증
    if (!coach || coach.trim() === '') {
      if (onError) {
        onError('코치를 입력해주세요.');
      }
      return;
    }

    const result: UpdateClassResult = {
      coach,
      cap,
      reserved: reservedList
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
              <div className="reserved-info">
                <span>예약된 회원 ({reservedList.length}명)</span>
                <button
                  className="btn btn-view"
                  onClick={() => setReservedMembersModalVisible(true)}
                >
                  <Eye size={16} />
                  보기
                </button>
              </div>
              <button
                className="btn btn-add"
                onClick={() => setAddMemberModalVisible(true)}
              >
                <UserPlus size={16} />
                직접 추가하기
              </button>
            </div>
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

      {/* 회원 추가 모달 */}
      <AddReserveMemberModal
        visible={addMemberModalVisible}
        onClose={() => setAddMemberModalVisible(false)}
        onAddMember={handleAddMember}
        reservedMembers={reservedList}
        boxName={user?.boxName || ''}
      />

      {/* 예약 인원 모달 */}
      <ReservedMembersModal
        visible={reservedMembersModalVisible}
        onClose={() => setReservedMembersModalVisible(false)}
        reservedMembers={reservedList}
        onDeleteMember={handleDeleteMember}
      />

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
          padding: 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .reserved-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .reserved-info > span {
          font-weight: 500;
          color: #374151;
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
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
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

        .btn-view {
          background-color: transparent;
          border-color: #d1d5db;
          color: #374151;
          font-size: 13px;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-view:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .btn-add {
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
          color: white;
          font-size: 14px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-add:hover {
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
      `}</style>
    </div>
  );
};

export default ManageClassModal; 