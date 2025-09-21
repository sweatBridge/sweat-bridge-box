import { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, Calendar, Users, Clock, CreditCard, Plus, Trash2 } from 'lucide-react';
import { MemberManagementModalProps, MembershipPlan, UserMembership, AddMembershipData } from '../../../types/membership';
import { getGenderText, formatPhoneNumber } from '../../../utils/memberUtils';
import { MembershipService } from '../../../services/membershipService';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';

const MemberManagementModal = ({ 
  visible, 
  member, 
  onClose, 
  onSuccess, 
  onError 
}: MemberManagementModalProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'membership'>('details');
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([]);
  const [currentMemberships, setCurrentMemberships] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(false);

  // 회원권 추가 폼 상태
  const [formData, setFormData] = useState<AddMembershipData>({
    selectedPlanName: '',
    membershipType: 'periodPass',
    duration: 1,
    count: '0',
    price: '0',
    assignee: '',
    startDate: new Date()
  });

  const loadData = useCallback(async () => {
    if (!member?.email) return;

    setLoading(true);
    try {
      // 회원권 플랜과 사용자 회원권 병렬 로드
      const [plans, memberships] = await Promise.all([
        MembershipService.getMembershipPlans(),
        MembershipService.getUserMemberships(member.email)
      ]);

      setMembershipPlans(plans);
      setUserMemberships(memberships);
      setCurrentMemberships(MembershipService.getCurrentMemberships(memberships));
    } catch (error) {
      console.error('Failed to load data:', error);
      if (onError) {
        onError('데이터를 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [member, onError]);

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (visible && member) {
      loadData();
    }
  }, [visible, member, loadData]);

  const handlePlanChange = useCallback((planName: string) => {
    setFormData(prev => ({ ...prev, selectedPlanName: planName }));

    if (planName === 'custom') {
      setFormData(prev => ({
        ...prev,
        membershipType: 'periodPass',
        count: '0',
        duration: 1,
        price: '0'
      }));
      return;
    }

    const selectedPlan = membershipPlans.find(plan => plan.plan === planName);
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        membershipType: selectedPlan.type,
        count: selectedPlan.count,
        duration: selectedPlan.duration,
        price: selectedPlan.price
      }));
    }
  }, [membershipPlans]);

  const handleTypeChange = useCallback((type: 'periodPass' | 'countPass') => {
    setFormData(prev => ({
      ...prev,
      membershipType: type,
      duration: 1,
      count: '0'
    }));
  }, []);

  const handleAddMembership = useCallback(async () => {
    if (!formData.selectedPlanName || !formData.assignee || !formData.duration || !formData.price) {
      if (onError) {
        onError('입력하지 않은 정보가 있는지 확인해 주세요.');
      }
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + formData.duration);

    const now = new Date();
    const newMembership: UserMembership = {
      plan: formData.selectedPlanName,
      type: formData.membershipType,
      count: formData.count,
      price: formData.price,
      assignee: formData.assignee,
      startDate: startDate,
      endDate: endDate,
      holdStartDate: null,
      holdEndDate: null,
      createdAt: now,
      updatedAt: now,
    };

    try {
      setLoading(true);
      await MembershipService.addUserMembership(member.email, newMembership);
      
      if (onSuccess) {
        onSuccess('회원권이 성공적으로 추가되었습니다.');
      }

      // 폼 초기화 및 데이터 새로고침
      setFormData({
        selectedPlanName: '',
        membershipType: 'periodPass',
        duration: 1,
        count: '0',
        price: '0',
        assignee: '',
        startDate: new Date()
      });
      
      await loadData();
    } catch (error: any) {
      if (onError) {
        onError(error.message || '회원권 추가에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [formData, member, onSuccess, onError, loadData]);

  const handleDeleteMembership = useCallback(async (index: number) => {
    if (!window.confirm('정말로 이 회원권을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await MembershipService.removeUserMembership(member.email, index);
      
      if (onSuccess) {
        onSuccess('회원권이 성공적으로 삭제되었습니다.');
      }
      
      await loadData();
    } catch (error: any) {
      if (onError) {
        onError(error.message || '회원권 삭제에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [member, onSuccess, onError, loadData]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  if (!visible || !member) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content member-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <User size={20} className="header-icon" />
            <h3>{member.realName} 회원 관리</h3>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <User size={16} />
            상세 정보
          </button>
          <button 
            className={`tab-button ${activeTab === 'membership' ? 'active' : ''}`}
            onClick={() => setActiveTab('membership')}
          >
            <CreditCard size={16} />
            회원권 관리
          </button>
        </div>
        
        <div className="modal-body">
          {activeTab === 'details' && (
            <div className="details-content">
              {/* 기본 정보 섹션 */}
              <div className="info-section">
                <h4 className="section-title">기본 정보</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">
                      <User size={16} />
                    </div>
                    <div className="info-content">
                      <span className="info-label">이름</span>
                      <span className="info-value">{member.realName}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-icon">
                      <User size={16} />
                    </div>
                    <div className="info-content">
                      <span className="info-label">닉네임</span>
                      <span className="info-value">{member.nickName}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-icon">
                      <Mail size={16} />
                    </div>
                    <div className="info-content">
                      <span className="info-label">이메일</span>
                      <span className="info-value">{member.email}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-icon">
                      <Phone size={16} />
                    </div>
                    <div className="info-content">
                      <span className="info-label">전화번호</span>
                      <span className="info-value">{formatPhoneNumber(member.phoneNumber)}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-icon">
                      <Users size={16} />
                    </div>
                    <div className="info-content">
                      <span className="info-label">성별</span>
                      <span className="info-value">{getGenderText(member.gender)}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-icon">
                      <Calendar size={16} />
                    </div>
                    <div className="info-content">
                      <span className="info-label">생년월일</span>
                      <span className="info-value">{member.birthDate || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 현재 회원권 정보 */}
              <div className="info-section">
                <h4 className="section-title">현재 회원권 정보</h4>
                {currentMemberships.length === 0 ? (
                  <div className="no-membership">
                    <CreditCard size={48} className="no-membership-icon" />
                    <p>현재 유효한 회원권이 없습니다.</p>
                  </div>
                ) : currentMemberships.length > 1 ? (
                  <div className="multiple-memberships">
                    <p>현재 유효한 회원권이 {currentMemberships.length}개 있습니다.</p>
                  </div>
                ) : (
                  <div className="membership-card">
                    <div className="membership-header">
                      <CreditCard size={20} />
                      <span className="membership-type">
                        {currentMemberships[0].type === "countPass" ? "횟수권" : "기간권"}
                      </span>
                    </div>
                    
                    <div className="membership-details">
                      <div className="membership-item">
                        <Calendar size={16} />
                        <div>
                          <span className="membership-label">시작일</span>
                          <span className="membership-value">{formatDate(currentMemberships[0].startDate)}</span>
                        </div>
                      </div>
                      
                      <div className="membership-item">
                        <Clock size={16} />
                        <div>
                          <span className="membership-label">종료일</span>
                          <span className="membership-value">{formatDate(currentMemberships[0].endDate)}</span>
                        </div>
                      </div>
                      
                      <div className="membership-item">
                        <CreditCard size={16} />
                        <div>
                          <span className="membership-label">가격</span>
                          <span className="membership-value">{currentMemberships[0].price}원</span>
                        </div>
                      </div>
                      
                      <div className="membership-item">
                        <User size={16} />
                        <div>
                          <span className="membership-label">담당자</span>
                          <span className="membership-value">{currentMemberships[0].assignee}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'membership' && (
            <div className="membership-content">
              {loading && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                  <p>처리 중...</p>
                </div>
              )}

              {/* 회원권 추가 폼 */}
              <div className="membership-form">
                <h4 className="section-title">회원권 추가</h4>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>회원권 플랜</label>
                    <select
                      value={formData.selectedPlanName}
                      onChange={(e) => handlePlanChange(e.target.value)}
                      className="form-select"
                    >
                      <option value="">플랜 선택</option>
                      {membershipPlans.map((plan) => (
                        <option key={plan.plan} value={plan.plan}>
                          {plan.plan}
                        </option>
                      ))}
                      <option value="custom">커스텀 플랜</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>담당자</label>
                    <input
                      type="text"
                      value={formData.assignee}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
                      className="form-input"
                      placeholder="담당자 이름"
                    />
                  </div>

                  <div className="form-group">
                    <label>회원권 타입</label>
                    <select
                      value={formData.membershipType}
                      onChange={(e) => handleTypeChange(e.target.value as 'periodPass' | 'countPass')}
                      className="form-select"
                    >
                      <option value="periodPass">기간권</option>
                      <option value="countPass">횟수권</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>기간(월)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                      className="form-input"
                      min="1"
                    />
                  </div>

                  {formData.membershipType === 'countPass' && (
                    <div className="form-group">
                      <label>횟수</label>
                      <input
                        type="text"
                        value={formData.count}
                        onChange={(e) => setFormData(prev => ({ ...prev, count: e.target.value }))}
                        className="form-input"
                        placeholder="횟수"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>가격</label>
                    <input
                      type="text"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="form-input"
                      placeholder="가격"
                    />
                  </div>

                  <div className="form-group">
                    <label>시작일</label>
                    <input
                      type="date"
                      value={formData.startDate.toISOString().split('T')[0]}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    onClick={handleAddMembership}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    <Plus size={16} />
                    회원권 추가
                  </button>
                </div>
              </div>

              {/* 회원권 목록 */}
              <div className="membership-list">
                <h4 className="section-title">회원권 목록</h4>
                
                {userMemberships.length === 0 ? (
                  <div className="empty-memberships">
                    <CreditCard size={48} className="empty-icon" />
                    <p>등록된 회원권이 없습니다.</p>
                  </div>
                ) : (
                  <div className="memberships-table">
                    <div className="table-header">
                      <div className="table-cell">시작일</div>
                      <div className="table-cell">종료일</div>
                      <div className="table-cell">타입</div>
                      <div className="table-cell">가격</div>
                      <div className="table-cell">플랜</div>
                      <div className="table-cell">담당자</div>
                      <div className="table-cell">삭제</div>
                    </div>
                    
                    {userMemberships.map((membership, index) => (
                      <div key={index} className="table-row">
                        <div className="table-cell">{formatDate(membership.startDate)}</div>
                        <div className="table-cell">{formatDate(membership.endDate)}</div>
                        <div className="table-cell">
                          <span className="membership-badge">
                            {membership.type === "countPass" ? "횟수권" : "기간권"}
                          </span>
                        </div>
                        <div className="table-cell">{membership.price}원</div>
                        <div className="table-cell">{membership.plan}</div>
                        <div className="table-cell">{membership.assignee}</div>
                        <div className="table-cell">
                          <button
                            onClick={() => handleDeleteMembership(index)}
                            disabled={loading}
                            className="btn btn-sm btn-danger"
                            title="회원권 삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
        .member-management-modal {
          max-width: 900px;
          width: 95%;
          max-height: 90vh;
        }

        .tab-navigation {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background-color: #f8fafc;
        }

        .tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }

        .tab-button:hover {
          background-color: #f3f4f6;
          color: #374151;
        }

        .tab-button.active {
          background-color: white;
          color: ${AppColors.primary};
          border-bottom: 2px solid ${AppColors.primary};
        }

        .details-content,
        .membership-content {
          position: relative;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid ${AppColors.primary};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .info-section,
        .membership-form,
        .membership-list {
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .info-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .info-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .info-icon {
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
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .no-membership,
        .empty-memberships {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
        }

        .no-membership-icon,
        .empty-icon {
          color: #9ca3af;
          margin-bottom: 16px;
        }

        .no-membership p,
        .empty-memberships p {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }

        .multiple-memberships {
          text-align: center;
          padding: 20px;
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          color: #92400e;
        }

        .membership-card {
          background: ${Gradients.primary};
          border-radius: 12px;
          padding: 20px;
          color: white;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
        }

        .membership-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .membership-type {
          font-size: 18px;
          font-weight: 700;
        }

        .membership-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .membership-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .membership-item div {
          display: flex;
          flex-direction: column;
        }

        .membership-label {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 2px;
        }

        .membership-value {
          font-size: 14px;
          font-weight: 600;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-input,
        .form-select {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: ${AppColors.primary};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .memberships-table {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .table-header {
          display: grid !important;
          grid-template-columns: 2fr 2fr 1fr 1fr 2fr 1fr 80px !important;
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
          grid-template-columns: 2fr 2fr 1fr 1fr 2fr 1fr 80px !important;
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

        .table-cell:nth-child(1) { /* 시작일 */
          justify-content: center;
        }

        .table-cell:nth-child(2) { /* 종료일 */
          justify-content: center;
        }

        .table-cell:nth-child(3) { /* 타입 */
          justify-content: center;
        }

        .table-cell:nth-child(4) { /* 가격 */
          justify-content: center;
        }

        .table-cell:nth-child(5) { /* 플랜 */
          justify-content: center;
        }

        .table-cell:nth-child(6) { /* 담당자 */
          justify-content: center;
        }

        .table-cell:nth-child(7) { /* 삭제 */
          justify-content: center;
        }

        .membership-badge {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
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
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.15);
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
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #1d4ed8;
          border-color: #1d4ed8;
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

        .btn-danger:hover:not(:disabled) {
          background-color: #b91c1c;
          border-color: #b91c1c;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .member-management-modal {
            width: 95%;
            max-width: none;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .table-cell {
            padding: 8px 0;
          }
        }
      `}</style>
    </div>
  );
};

export default MemberManagementModal; 