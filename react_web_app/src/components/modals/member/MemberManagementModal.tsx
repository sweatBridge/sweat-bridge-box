import { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, Calendar, Users, Clock, CreditCard, Plus, Trash2, Pause, DollarSign } from 'lucide-react';
import { MemberManagementModalProps, MembershipPlan, UserMembership, AddMembershipData } from '../../../types/membership';
import { getGenderText, formatPhoneNumber } from '../../../utils/memberUtils';
import { generateMembershipKey } from '../../../utils/keyGenerator';
import { MembershipService } from '../../../services/membershipService';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';
import HoldMembershipModal from '../membership/HoldMembershipModal';
import DeleteMembershipConfirmModal from '../membership/DeleteMembershipConfirmModal';
import RefundMembershipModal from '../membership/RefundMembershipModal';

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
  const [holdModalVisible, setHoldModalVisible] = useState(false);
  const [selectedMembershipIndex, setSelectedMembershipIndex] = useState<number>(0);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [membershipToDelete, setMembershipToDelete] = useState<{ index: number; plan: string; price: string } | null>(null);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [membershipToRefund, setMembershipToRefund] = useState<{ index: number; plan: string; price: string } | null>(null);

  // 회원권 추가 폼 상태
  const [formData, setFormData] = useState<AddMembershipData>({
    selectedPlanName: '',
    membershipType: 'periodPass',
    duration: 1,
    count: '0',
    price: '0',
    paymentType: 'cash',
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
    
    // duration이 숫자인지 확인하고 변환
    const duration = typeof formData.duration === 'string' ? parseInt(formData.duration) : formData.duration;
    
    // 더 안전한 날짜 계산 방법
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + duration,
      startDate.getDate()
    );

    const now = new Date();
    const boxName = localStorage.getItem('boxName') || 'SWEAT';
    const totalCount = parseInt(formData.count) || 0;
    
    // 새로운 회원권 구조
    const newMembership: UserMembership = {
      key: generateMembershipKey(),
      plan: formData.selectedPlanName,
      type: formData.membershipType,
      
      purchase: {
        price: parseInt(formData.price) || 0,
        paid: parseInt(formData.price) || 0,
        paymentType: formData.paymentType,
        at: now
      },
      
      quota: {
        total: totalCount,
        used: 0,
        remaining: totalCount
      },
      
      period: {
        startDate: startDate,
        endDate: endDate,
        originalEndDate: endDate
      },
      
      holds: [],
      
      refund: {
        isRefunded: false,
        at: null,
        refundAmount: 0,
        reason: null
      },
      
      adjustments: [],
      
      createdAt: now,
      updatedAt: now,
      assignee: formData.assignee,
      
      deleted: false,
      deletedAt: null,
      
      boxName: boxName
    };

    try {
      setLoading(true);
      await MembershipService.addUserMembership(member.email, newMembership, member.realName);
      
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
        paymentType: 'cash',
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

  const handleOpenDeleteModal = useCallback((index: number) => {
    const membership = userMemberships[index];
    const displayInfo = getMembershipDisplayInfo(membership);
    
    setMembershipToDelete({
      index,
      plan: displayInfo.plan,
      price: displayInfo.price
    });
    setDeleteModalVisible(true);
  }, [userMemberships]);

  const handleConfirmDelete = useCallback(async () => {
    if (!membershipToDelete) return;

    try {
      setLoading(true);
      await MembershipService.removeUserMembership(member.email, membershipToDelete.index);
      
      if (onSuccess) {
        onSuccess('회원권이 성공적으로 삭제되었습니다.');
      }
      
      setDeleteModalVisible(false);
      setMembershipToDelete(null);
      await loadData();
    } catch (error: any) {
      if (onError) {
        onError(error.message || '회원권 삭제에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [member, membershipToDelete, onSuccess, onError, loadData]);

  const handleOpenRefundModal = useCallback((index: number) => {
    const membership = userMemberships[index];
    const displayInfo = getMembershipDisplayInfo(membership);
    
    setMembershipToRefund({
      index,
      plan: displayInfo.plan,
      price: displayInfo.price
    });
    setRefundModalVisible(true);
  }, [userMemberships]);

  const handleConfirmRefund = useCallback(async (refundAmount: string, reason: string) => {
    if (!membershipToRefund) return;

    try {
      setLoading(true);
      // TODO: 환불 로직 구현
      // await MembershipService.refundUserMembership(member.email, membershipToRefund.index, refundAmount, reason);
      
      console.log('환불 처리:', {
        email: member.email,
        index: membershipToRefund.index,
        refundAmount,
        reason
      });
      
      if (onSuccess) {
        onSuccess('회원권이 성공적으로 환불되었습니다.');
      }
      
      setRefundModalVisible(false);
      setMembershipToRefund(null);
      await loadData();
    } catch (error: any) {
      if (onError) {
        onError(error.message || '회원권 환불에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [member, membershipToRefund, onSuccess, onError, loadData]);

  const handleOpenHoldModal = useCallback(() => {
    if (currentMemberships.length === 0) {
      if (onError) {
        onError('홀딩할 회원권이 없습니다.');
      }
      return;
    }

    // 현재 회원권의 인덱스 찾기
    const currentMembership = currentMemberships[0];
    const index = userMemberships.findIndex(m => m.key === (currentMembership as any).key);
    
    if (index === -1) {
      if (onError) {
        onError('회원권을 찾을 수 없습니다.');
      }
      return;
    }

    setSelectedMembershipIndex(index);
    setHoldModalVisible(true);
  }, [currentMemberships, userMemberships, onError]);

  const handleConfirmHold = useCallback(async (
    holdStartDate: Date,
    holdEndDate: Date,
    reason: string,
    assignee: string
  ) => {
    try {
      setLoading(true);
      
      await MembershipService.addHold(
        member.email,
        selectedMembershipIndex,
        holdStartDate,
        holdEndDate,
        reason,
        assignee
      );
      
      if (onSuccess) {
        onSuccess('홀딩이 성공적으로 적용되었습니다.');
      }
      
      setHoldModalVisible(false);
      await loadData();
    } catch (error: any) {
      if (onError) {
        onError(error.message || '홀딩 적용에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [member, selectedMembershipIndex, onSuccess, onError, loadData]);

  const handleReleaseHold = useCallback(async () => {
    if (!window.confirm('홀딩을 해제하시겠습니까?\n홀딩 종료일이 오늘 전날로 변경되며, 회원권 만료일이 재계산됩니다.')) {
      return;
    }

    try {
      setLoading(true);
      
      // 현재 회원권의 인덱스 찾기
      if (currentMemberships.length === 0) {
        throw new Error('현재 활성화된 회원권이 없습니다.');
      }

      const currentMembership = currentMemberships[0];
      const index = userMemberships.findIndex(m => m.key === (currentMembership as any).key);
      
      if (index === -1) {
        throw new Error('회원권을 찾을 수 없습니다.');
      }

      await MembershipService.releaseHold(member.email, index);
      
      if (onSuccess) {
        onSuccess('홀딩이 성공적으로 해제되었습니다.');
      }
      
      await loadData();
    } catch (error: any) {
      if (onError) {
        onError(error.message || '홀딩 해제에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [member, currentMemberships, userMemberships, onSuccess, onError, loadData]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  // 회원권 정보 추출 헬퍼 (레거시 및 새 구조 지원)
  const getMembershipDisplayInfo = (membership: any) => {
    // 새 구조
    if (membership.period && membership.purchase) {
      return {
        startDate: membership.period.startDate,
        endDate: membership.period.endDate,
        type: membership.type,
        price: membership.purchase.price.toString(),
        plan: membership.plan,
        assignee: membership.assignee
      };
    }
    
    // 레거시 구조
    return {
      startDate: membership.startDate,
      endDate: membership.endDate,
      type: membership.type,
      price: membership.price,
      plan: membership.plan,
      assignee: membership.assignee
    };
  };

  // 현재 활성화된 홀딩 찾기
  const getCurrentHold = (membership: any) => {
    if (!membership.holds || membership.holds.length === 0) {
      return null;
    }

    const now = new Date();
    return membership.holds.find((hold: any) => {
      const holdStartDate = new Date(hold.startDate);
      const holdEndDate = new Date(hold.endDate);
      return now >= holdStartDate && now <= holdEndDate;
    });
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
                      <span className="info-value">{formatPhoneNumber(member.phone)}</span>
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
                  (() => {
                    const displayInfo = getMembershipDisplayInfo(currentMemberships[0]);
                    return (
                      <div className="membership-card">
                        <div className="membership-header">
                          <div className="membership-header-left">
                            <CreditCard size={20} />
                            <span className="membership-type">
                              {displayInfo.type === "countPass" ? "횟수권" : "기간권"}
                            </span>
                          </div>
                          <button 
                            className="btn btn-hold"
                            onClick={handleOpenHoldModal}
                            disabled={loading}
                          >
                            <Pause size={16} />
                            홀딩
                          </button>
                        </div>
                        
                        <div className="membership-details">
                          <div className="membership-item">
                            <Calendar size={16} />
                            <div>
                              <span className="membership-label">시작일</span>
                              <span className="membership-value">{formatDate(displayInfo.startDate)}</span>
                            </div>
                          </div>
                          
                          <div className="membership-item">
                            <Clock size={16} />
                            <div>
                              <span className="membership-label">종료일</span>
                              <span className="membership-value">{formatDate(displayInfo.endDate)}</span>
                            </div>
                          </div>
                          
                          <div className="membership-item">
                            <CreditCard size={16} />
                            <div>
                              <span className="membership-label">가격</span>
                              <span className="membership-value">{displayInfo.price}원</span>
                            </div>
                          </div>
                          
                          <div className="membership-item">
                            <User size={16} />
                            <div>
                              <span className="membership-label">담당자</span>
                              <span className="membership-value">{displayInfo.assignee}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* 현재 홀딩 중인 경우에만 표시 */}
                {currentMemberships.length > 0 && (() => {
                  console.log(currentMemberships[0]);
                  const currentHold = getCurrentHold(currentMemberships[0]);
                  console.log(currentHold);
                  if (!currentHold) return null;
                  
                  return (
                    <div className="hold-history-section">
                      <h5 className="subsection-title">홀딩</h5>
                      <div className="hold-history-item">
                        <div className="hold-history-details">
                          <div className="hold-detail-row">
                            <span className="hold-label">기간:</span>
                            <span className="hold-value">
                              {formatDate(currentHold.startDate)} ~ {formatDate(currentHold.endDate)} ({currentHold.days}일)
                            </span>
                          </div>
                          <div className="hold-detail-row">
                            <span className="hold-label">사유:</span>
                            <span className="hold-value">{currentHold.reason}</span>
                          </div>
                          <div className="hold-detail-row">
                            <span className="hold-label">담당자:</span>
                            <span className="hold-value">{currentHold.assignee}</span>
                          </div>
                        </div>
                        <div className="hold-history-actions">
                          <button 
                            className="btn-release-hold"
                            onClick={handleReleaseHold}
                            disabled={loading}
                          >
                            해제
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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

                  <div className="form-row">
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
                  </div>

                  <div className="form-group">
                    <label>결제수단</label>
                    <select
                      value={formData.paymentType || 'cash'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value as 'cash' | 'card' }))}
                      className="form-input"
                    >
                      <option value="cash">현금</option>
                      <option value="card">카드</option>
                    </select>
                  </div>

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
                      <div className="table-cell">환불</div>
                      <div className="table-cell">삭제</div>
                    </div>
                    
                    {userMemberships.map((membership, index) => {
                      const displayInfo = getMembershipDisplayInfo(membership);
                      return (
                        <div key={index} className="table-row">
                          <div className="table-cell">{formatDate(displayInfo.startDate)}</div>
                          <div className="table-cell">{formatDate(displayInfo.endDate)}</div>
                          <div className="table-cell">
                            <span className="membership-badge">
                              {displayInfo.type === "countPass" ? "횟수권" : "기간권"}
                            </span>
                          </div>
                          <div className="table-cell">{displayInfo.price}원</div>
                          <div className="table-cell">{displayInfo.plan}</div>
                          <div className="table-cell">{displayInfo.assignee}</div>
                          <div className="table-cell">
                            <button
                              onClick={() => handleOpenRefundModal(index)}
                              disabled={loading}
                              className="btn btn-sm btn-refund"
                              title="회원권 환불"
                            >
                              <DollarSign size={14} />
                            </button>
                          </div>
                          <div className="table-cell">
                            <button
                              onClick={() => handleOpenDeleteModal(index)}
                              disabled={loading}
                              className="btn btn-sm btn-danger"
                              title="회원권 삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
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

      {/* 홀딩 모달 */}
      <HoldMembershipModal
        visible={holdModalVisible}
        membershipIndex={selectedMembershipIndex}
        memberEmail={member?.email || ''}
        onClose={() => setHoldModalVisible(false)}
        onConfirm={handleConfirmHold}
        loading={loading}
      />

      {/* 회원권 삭제 확인 모달 */}
      <DeleteMembershipConfirmModal
        visible={deleteModalVisible}
        membershipPlan={membershipToDelete?.plan || ''}
        membershipPrice={membershipToDelete?.price || '0'}
        onClose={() => {
          setDeleteModalVisible(false);
          setMembershipToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />

      {/* 회원권 환불 모달 */}
      <RefundMembershipModal
        visible={refundModalVisible}
        membershipPlan={membershipToRefund?.plan || ''}
        membershipPrice={membershipToRefund?.price || '0'}
        onClose={() => {
          setRefundModalVisible(false);
          setMembershipToRefund(null);
        }}
        onConfirm={handleConfirmRefund}
        loading={loading}
      />

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
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .membership-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
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

        .btn-hold {
          background-color: rgba(255, 255, 255, 0.9);
          border-color: rgba(255, 255, 255, 0.9);
          color: ${AppColors.primary};
          font-weight: 600;
          padding: 6px 12px;
          font-size: 13px;
        }

        .btn-hold:hover:not(:disabled) {
          background-color: white;
          border-color: white;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .hold-history-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }

        .subsection-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hold-history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hold-history-item {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .hold-history-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #92400e;
          font-weight: 600;
          font-size: 13px;
        }

        .hold-index {
          font-size: 12px;
        }

        .hold-history-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-right: 16px;
        }

        .hold-history-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 80px;
        }

        .btn-release-hold {
          padding: 8px 20px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
        }

        .btn-release-hold:hover:not(:disabled) {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
          transform: translateY(-1px);
        }

        .btn-release-hold:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(239, 68, 68, 0.2);
        }

        .btn-release-hold:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
        }

        .hold-detail-row {
          display: flex;
          gap: 8px;
          font-size: 13px;
        }

        .hold-label {
          font-weight: 600;
          color: #92400e;
          min-width: 60px;
        }

        .hold-value {
          color: #78350f;
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
          grid-template-columns: 2fr 2fr 1fr 1fr 2fr 1fr 80px 80px !important;
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
          grid-template-columns: 2fr 2fr 1fr 1fr 2fr 1fr 80px 80px !important;
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

        .table-cell:nth-child(7) { /* 환불 */
          justify-content: center;
        }

        .table-cell:nth-child(8) { /* 삭제 */
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

        .btn-refund {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-color: #2563eb;
          color: white;
        }

        .btn-refund:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          border-color: #1d4ed8;
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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-row .form-group {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
};

export default MemberManagementModal; 