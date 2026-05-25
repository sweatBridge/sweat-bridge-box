import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Gradients } from '../../../constants/gradients';
import { X, Users, Check, XCircle } from 'lucide-react';
import { MemberService } from '../../../services/memberService';
import { formatPhoneNumber } from '../../../utils/phoneUtils';

interface ApplyRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface Applicant {
  name: string;
  email: string;
  phone: string;
  boxName: string;
  birth?: string;
}

const ApplyRequestModal = ({ visible, onClose, onSuccess, onError }: ApplyRequestModalProps) => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(false);
  const boxName = localStorage.getItem('boxName') || '';

  const loadApplicants = useCallback(async () => {
    try {
      setLoading(true);
      const result = await MemberService.fetchApplicants(boxName);
      setApplicants(result);
    } catch (error) {
      console.error('Failed to load applicants:', error);
      if (onError) {
        onError('신청자 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [boxName, onError]);

  useEffect(() => {
    if (visible) {
      loadApplicants();
    }
  }, [visible, loadApplicants]);

  const approveApplicant = async (applicant: Applicant) => {
    try {
      setLoading(true);
      await MemberService.approveApplicant(applicant.email, applicant.boxName);

      // 성공 시 로컬에서만 제거 — 서버 재조회 불필요.
      setApplicants((prev) => prev.filter((a) => a.email !== applicant.email));

      if (onSuccess) {
        onSuccess('회원이 승인되었습니다.');
      }
    } catch (error) {
      console.error('Failed to approve applicant:', error);
      if (onError) {
        onError('회원 승인에 실패했습니다: ' + (error instanceof Error ? error.message : error));
      }
      // 실패 시에만 서버 상태로 재동기화
      await loadApplicants();
    } finally {
      setLoading(false);
    }
  };

  const rejectApplicant = async (applicant: Applicant) => {
    if (!window.confirm(`${applicant.name} 님의 신청을 거절하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      await MemberService.rejectApplicant(applicant.email, applicant.boxName);

      setApplicants((prev) => prev.filter((a) => a.email !== applicant.email));

      if (onSuccess) {
        onSuccess('신청이 거절되었습니다.');
      }
    } catch (error) {
      console.error('Failed to reject applicant:', error);
      if (onError) {
        onError('신청 거절에 실패했습니다: ' + (error instanceof Error ? error.message : error));
      }
      await loadApplicants();
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content apply-request-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Users size={20} />
            승인 대기 목록
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>로딩 중...</p>
            </div>
          ) : applicants.length === 0 ? (
            <div className="empty-state">
              <Users size={48} className="empty-icon" />
              <p>승인 대기 중인 신청이 없습니다.</p>
            </div>
          ) : (
            <div className="applicants-table">
              <div className="table-header">
                <div className="table-cell">이름</div>
                <div className="table-cell">이메일</div>
                <div className="table-cell">전화번호</div>
                <div className="table-cell">승인여부</div>
              </div>

              {applicants.map((applicant, index) => (
                <div key={index} className="table-row">
                  <div className="table-cell">{applicant.name}</div>
                  <div className="table-cell">{applicant.email}</div>
                  <div className="table-cell">{formatPhoneNumber(applicant.phone)}</div>
                  <div className="table-cell actions-cell">
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => approveApplicant(applicant)}
                      disabled={loading}
                      title="승인"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => rejectApplicant(applicant)}
                      disabled={loading}
                      title="거절"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            닫기
          </button>
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
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .apply-request-modal {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .apply-request-modal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            background: ${Gradients.primary};
            color: white;
          }

          .apply-request-modal .modal-title {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .apply-request-modal .close-button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background-color 0.2s;
          }

          .apply-request-modal .close-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }

          .apply-request-modal .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            width: 100%;
            box-sizing: border-box;
          }

          .apply-request-modal .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
          }

          .apply-request-modal .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #f3f4f6;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .apply-request-modal .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
          }

          .apply-request-modal .empty-icon {
            color: #9ca3af;
            margin-bottom: 16px;
          }

          .apply-request-modal .empty-state p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }

          .apply-request-modal .applicants-table {
            background: white;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
          }

          .apply-request-modal .table-header {
            display: grid !important;
            grid-template-columns: 2fr 3fr 2fr 100px !important;
            gap: 16px;
            padding: 16px;
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            width: 100%;
          }

          .apply-request-modal .table-row {
            display: grid !important;
            grid-template-columns: 2fr 3fr 2fr 100px !important;
            gap: 16px;
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
            transition: background-color 0.2s;
            width: 100%;
          }

          .apply-request-modal .table-row:hover {
            background-color: #f9fafb;
          }

          .apply-request-modal .table-row:last-child {
            border-bottom: none;
          }

          .apply-request-modal .table-cell {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #374151;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            min-width: 0;
          }

          .apply-request-modal .actions-cell {
            display: flex;
            gap: 8px;
            justify-content: center;
          }

          .apply-request-modal .btn {
            padding: 8px 16px;
            border-radius: 6px;
            border: 1px solid;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
          }

          .apply-request-modal .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .apply-request-modal .btn-sm {
            padding: 6px 10px;
            font-size: 12px;
          }

          .apply-request-modal .btn-success {
            background-color: #10b981;
            border-color: #10b981;
            color: white;
          }

          .apply-request-modal .btn-success:hover:not(:disabled) {
            background-color: #059669;
            border-color: #059669;
          }

          .apply-request-modal .btn-danger {
            background-color: #dc2626;
            border-color: #dc2626;
            color: white;
          }

          .apply-request-modal .btn-danger:hover:not(:disabled) {
            background-color: #b91c1c;
            border-color: #b91c1c;
          }

          .apply-request-modal .btn-secondary {
            background-color: #f8fafc;
            border-color: #e2e8f0;
            color: #64748b;
          }

          .apply-request-modal .btn-secondary:hover {
            background-color: #f1f5f9;
            border-color: #cbd5e1;
          }

          .apply-request-modal .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 20px 24px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
};

export default ApplyRequestModal;
