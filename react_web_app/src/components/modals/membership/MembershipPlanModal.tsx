import React, { useState, useEffect } from 'react';
import { Gradients } from '../../../constants/gradients';
import { X, Plus, Trash2, CreditCard } from 'lucide-react';
import { MembershipPlan } from '../../../types/membership';
import { MembershipService } from '../../../services/membershipService';

interface MembershipPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const MembershipPlanModal = ({ visible, onClose, onSuccess, onError }: MembershipPlanModalProps) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    plan: '',
    membershipType: '',
    duration: 0,
    count: 0,
    price: 0
  });

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (visible) {
      loadMembershipPlans();
    }
  }, [visible]);

  const loadMembershipPlans = async () => {
    try {
      setLoading(true);
      const membershipPlans = await MembershipService.getMembershipPlans();
      setPlans(membershipPlans);
    } catch (error) {
      console.error('Failed to load membership plans:', error);
      if (onError) {
        onError('회원권 플랜을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      membershipType: type,
      duration: 0,
      count: 0
    }));
  };

  const validateForm = () => {
    if (!formData.plan.trim()) {
      if (onError) onError('플랜 이름을 입력하세요.');
      return false;
    }
    if (!formData.membershipType) {
      if (onError) onError('회원권 타입을 선택하세요.');
      return false;
    }
    if (formData.duration <= 0) {
      if (onError) onError('기간을 입력하세요.');
      return false;
    }
    if (formData.membershipType === 'countPass' && formData.count <= 0) {
      if (onError) onError('횟수를 입력하세요.');
      return false;
    }
    if (formData.price <= 0) {
      if (onError) onError('가격을 입력하세요.');
      return false;
    }
    return true;
  };

  const handleAddPlan = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const newPlan: MembershipPlan = {
        plan: formData.plan.trim(),
        type: formData.membershipType as 'periodPass' | 'countPass',
        count: formData.membershipType === 'countPass' ? formData.count : 0,
        duration: formData.duration,
        price: formData.price
      };

      await MembershipService.addMembershipPlan(newPlan);
      
      // 폼 초기화
      setFormData({
        plan: '',
        membershipType: '',
        duration: 0,
        count: 0,
        price: 0
      });

      // 목록 새로고침
      await loadMembershipPlans();
      
      if (onSuccess) {
        onSuccess('회원권 플랜이 추가되었습니다.');
      }
    } catch (error) {
      console.error('Failed to add membership plan:', error);
      if (onError) {
        onError('회원권 플랜 추가에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planName: string) => {
    if (!window.confirm(`"${planName}" 플랜을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      await MembershipService.deleteMembershipPlan(planName);
      await loadMembershipPlans();
      
      if (onSuccess) {
        onSuccess('회원권 플랜이 삭제되었습니다.');
      }
    } catch (error) {
      console.error('Failed to delete membership plan:', error);
      if (onError) {
        onError('회원권 플랜 삭제에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTypeText = (type: string) => {
    return type === 'countPass' ? '횟수권' : '기간권';
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <CreditCard size={20} />
            회원권 플랜
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* 플랜 추가 폼 */}
          <div className="plan-form-container">
            <div className="form-row">
              <div className="form-group">
                <label>플랜 이름</label>
                <input
                  type="text"
                  placeholder="[예시] (재등록) 6개월 기간권"
                  value={formData.plan}
                  onChange={(e) => handleInputChange('plan', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>회원권 타입</label>
                <select
                  value={formData.membershipType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="form-select"
                >
                  <option value="">등록 타입 선택</option>
                  <option value="periodPass">기간권</option>
                  <option value="countPass">횟수권</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>기간(월)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration || ''}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
              {formData.membershipType === 'countPass' && (
                <div className="form-group">
                  <label>횟수</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.count || ''}
                    onChange={(e) => handleInputChange('count', parseInt(e.target.value) || 0)}
                    className="form-input"
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>가격</label>
                <input
                  type="number"
                  min="0"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={handleAddPlan}
                disabled={loading}
              >
                <Plus size={16} />
                추가
              </button>
            </div>
          </div>

          {/* 플랜 목록 테이블 */}
          <div className="plans-table-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>로딩 중...</p>
              </div>
            ) : (
              <div className="plans-table">
                <div className="table-header">
                  <div className="table-cell">플랜 이름</div>
                  <div className="table-cell">회원권 타입</div>
                  <div className="table-cell">횟수</div>
                  <div className="table-cell">기간(월)</div>
                  <div className="table-cell">가격</div>
                  <div className="table-cell">삭제</div>
                </div>

                {plans.length === 0 ? (
                  <div className="empty-state">
                    <CreditCard size={48} className="empty-icon" />
                    <p>등록된 회원권 플랜이 없습니다.</p>
                  </div>
                ) : (
                  plans.map((plan, index) => (
                    <div key={index} className="table-row">
                      <div className="table-cell">{plan.plan}</div>
                      <div className="table-cell">
                        <span className="type-badge">{getTypeText(plan.type)}</span>
                      </div>
                      <div className="table-cell">{plan.count || '-'}</div>
                      <div className="table-cell">{plan.duration}</div>
                      <div className="table-cell">{plan.price.toLocaleString()}원</div>
                      <div className="table-cell">
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeletePlan(plan.plan)}
                          disabled={loading}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
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

          .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            background: ${Gradients.primary};
            color: white;
          }

          .modal-title {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .close-button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background-color 0.2s;
          }

          .close-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }

          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
          }

          .plan-form-container {
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            background-color: #f8fafc;
          }

          .form-row {
            display: flex;
            gap: 16px;
            margin-bottom: 16px;
          }

          .form-group {
            flex: 1;
          }

          .form-group label {
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
            color: #374151;
            font-size: 14px;
          }

          .form-input, .form-select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
          }

          .form-input:focus, .form-select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          .form-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 16px;
          }

          .plans-table-container {
            background: white;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
          }

          .plans-table {
            width: 100%;
          }

          .table-header {
            display: grid !important;
            grid-template-columns: 3fr 2fr 1fr 1fr 2fr 80px !important;
            gap: 16px;
            padding: 16px;
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            width: 100%;
          }

          .table-row {
            display: grid !important;
            grid-template-columns: 3fr 2fr 1fr 1fr 2fr 80px !important;
            gap: 16px;
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
            transition: background-color 0.2s;
            width: 100%;
          }

          .table-row:hover {
            background-color: #f9fafb;
          }

          .table-cell {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #374151;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            min-width: 0;
          }

          .table-cell:nth-child(1) { /* 플랜 이름 */
            justify-content: center;
          }

          .table-cell:nth-child(2) { /* 회원권 타입 */
            justify-content: center;
          }

          .table-cell:nth-child(3) { /* 횟수 */
            justify-content: center;
          }

          .table-cell:nth-child(4) { /* 기간(월) */
            justify-content: center;
          }

          .table-cell:nth-child(5) { /* 가격 */
            justify-content: center;
          }

          .table-cell:nth-child(6) { /* 삭제 */
            justify-content: center;
          }

          .type-badge {
            background-color: #dbeafe;
            color: #1e40af;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }

          .btn {
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

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-sm {
            padding: 6px 8px;
            font-size: 12px;
          }

          .btn-primary {
            background: ${Gradients.primary};
            border-color: #667eea;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: ${Gradients.primaryHover};
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }

          .btn-secondary {
            background-color: #f8fafc;
            border-color: #e2e8f0;
            color: #64748b;
          }

          .btn-secondary:hover {
            background-color: #f1f5f9;
            border-color: #cbd5e1;
          }

          .btn-danger {
            background-color: #dc2626;
            border-color: #dc2626;
            color: white;
          }

          .btn-danger:hover:not(:disabled) {
            background-color: #b91c1c;
            border-color: #b91c1c;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 20px 24px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }

          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
          }

          .loading-spinner {
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

          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            text-align: center;
          }

          .empty-icon {
            color: #9ca3af;
            margin-bottom: 16px;
          }

          .empty-state p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }
        `}</style>
      </div>
    </div>
  );
};

export default MembershipPlanModal; 