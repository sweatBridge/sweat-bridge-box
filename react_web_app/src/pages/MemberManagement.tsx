import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Users, UserPlus, CreditCard, Trash2, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Member, ToastMessageType } from '../types/member';
import { useMemberManagement } from '../hooks/useMemberManagement';
import MemberDeletionModal from '../components/modals/member/MemberDeletionModal';
import MembershipPlanModal from '../components/modals/membership/MembershipPlanModal';
import MemberManagementModal from '../components/modals/member/MemberManagementModal';
import WarningMembersModal from '../components/modals/member/WarningMembersModal';
import AddMemberModal from '../components/modals/member/AddMemberModal';
import ApplyRequestModal from '../components/modals/member/ApplyRequestModal';
import ToastMessage from '../components/ToastMessage';
import { getGenderText, filterMembers } from '../utils/memberUtils';
import { MembershipService } from '../services/membershipService';
import { usePageContext } from '../contexts/PageContext';
import { Gradients } from '../constants/gradients';
import { AppColors } from '../constants/colors';

const MemberManagement = () => {
  const { setPageInfo } = usePageContext();
  
  // Firebase 연동 훅
  const {
    members,
    loading,
    error,
    loadMembers,
    deleteMember,
    clearError
  } = useMemberManagement();

  // 상태 관리
  const [searchValue, setSearchValue] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberManagementModalVisible, setMemberManagementModalVisible] = useState(false);
  const [deletionModalVisible, setDeletionModalVisible] = useState(false);
  const [membershipPlanModalVisible, setMembershipPlanModalVisible] = useState(false);
  const [warningMembersModalVisible, setWarningMembersModalVisible] = useState(false);
  const [memberListModalVisible, setMemberListModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [applyRequestModalVisible, setApplyRequestModalVisible] = useState(false);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Toast message
  const [createToast, setCreateToast] = useState<((toast: ToastMessageType) => void) | null>(null);

  // 페이지 정보 설정
  useEffect(() => {
    setPageInfo({
      title: '회원 관리',
      subtitle: '회원 정보를 조회하고 관리하세요'
    });
  }, [setPageInfo]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // 에러 처리
  useEffect(() => {
    if (error && createToast) {
      createToast({
        type: 'danger',
        message: error
      });
      clearError();
    }
  }, [error, createToast, clearError]);

  // 검색된 회원 필터링
  const filteredMembers = filterMembers(members, searchValue);
  
  // 2단계 정렬: 1순위 - 상태 뱃지, 2순위 - 회원권 타입 뱃지
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    // 1순위: 상태 뱃지 (warning > active > inactive)
    const statusBadgeA = MembershipService.getMemberStatusBadge(a);
    const statusBadgeB = MembershipService.getMemberStatusBadge(b);
    
    const statusPriorityMap: { [key: string]: number } = {
      'warning': 1,
      'active': 2,
      'inactive': 3
    };
    
    const statusPriorityA = statusPriorityMap[statusBadgeA.colorClass] || 999;
    const statusPriorityB = statusPriorityMap[statusBadgeB.colorClass] || 999;
    
    // 1순위가 다르면 1순위로 정렬
    if (statusPriorityA !== statusPriorityB) {
      return statusPriorityA - statusPriorityB;
    }
    
    // 1순위가 같으면 2순위로 정렬: 회원권 타입 뱃지 (primary > hold > none)
    const membershipBadgesA = MembershipService.getMembershipStatusBadges(a);
    const membershipBadgesB = MembershipService.getMembershipStatusBadges(b);
    
    const membershipBadgeA = membershipBadgesA[0] || { colorClass: '' };
    const membershipBadgeB = membershipBadgesB[0] || { colorClass: '' };
    
    const membershipPriorityMap: { [key: string]: number } = {
      'primary': 1,
      'hold': 2,
      'none': 3
    };
    
    const membershipPriorityA = membershipPriorityMap[membershipBadgeA.colorClass] || 999;
    const membershipPriorityB = membershipPriorityMap[membershipBadgeB.colorClass] || 999;
    
    return membershipPriorityA - membershipPriorityB;
  });
  
  // 통계 계산 (페이지 로드 시 한 번만 계산)
  const { activeMembersCount, warningMembersCount, totalMembersCount, warningMembers } = useMemo(() => {
    let active = 0;
    let warning = 0;
    const warningList: Member[] = [];
    
    members.forEach(member => {
      const statusBadge = MembershipService.getMemberStatusBadge(member);
      
      if (statusBadge.status === '활성') {
        active++;
      } else if (statusBadge.status === '주의') {
        warning++;
        warningList.push(member);
      }
    });
    
    return {
      activeMembersCount: active,
      warningMembersCount: warning,
      totalMembersCount: active + warning,
      warningMembers: warningList
    };
  }, [members]);
  
  // 페이지네이션 계산
  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = sortedMembers.slice(startIndex, endIndex);
  
  // 검색어가 변경되면 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  // 회원 삭제
  const handleDeleteMember = useCallback((member: Member) => {
    setSelectedMember(member);
    setDeletionModalVisible(true);
  }, []);

  // 회원 삭제 실행
  const handleConfirmDelete = useCallback(async (email: string) => {
    try {
      await deleteMember(email);
      if (createToast) {
        createToast({
          type: 'success',
          message: '회원이 성공적으로 삭제되었습니다.'
        });
      }
    } catch (error) {
      console.error('Failed to delete member', error);
      if (createToast) {
        createToast({
          type: 'danger',
          message: '회원 삭제에 실패했습니다.'
        });
      }
    }
  }, [deleteMember, createToast]);

  // 회원권 관리
  const handleManageMembership = useCallback((member: Member) => {
    setSelectedMember(member);
    setMemberManagementModalVisible(true);
  }, []);

  // 회원 추가
  const handleAddMember = useCallback(() => {
    setAddMemberModalVisible(true);
  }, []);

  // 회원권 플랜 관리
  const handleManageMembershipPlans = useCallback(() => {
    setMembershipPlanModalVisible(true);
  }, []);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 이전 페이지
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 다음 페이지
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 회원 리스트 모달 열기 (신규 회원용)
  const handleOpenMemberList = (type: 'warning' | 'new') => {
    if (type === 'warning') {
      setWarningMembersModalVisible(true);
    } else {
      setMemberListModalVisible(true);
    }
  };

  // 주의 회원 모달에서 회원 클릭 시
  const handleWarningMemberClick = (member: Member) => {
    setWarningMembersModalVisible(false);
    setSelectedMember(member);
    setMemberManagementModalVisible(true);
  };

  // 임시 통계 데이터 (추후 실제 데이터로 대체)
  const newMembersCount = 5; // 신규 회원 (이번 달 등록)

  return (
    <div className="dashboard">
      {/* 액션 버튼들 */}
      <div className="actions-bar">
        <button className="btn btn-info" onClick={() => setApplyRequestModalVisible(true)}>
          <Users size={16} />
          승인 대기 목록
        </button>
        <button className="btn btn-primary" onClick={handleAddMember}>
          <UserPlus size={16} />
          회원추가
        </button>
        <button className="btn btn-secondary" onClick={handleManageMembershipPlans}>
          <CreditCard size={16} />
          회원권 관리
        </button>
      </div>

      {/* 통계 카드들 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">
            <Users size={20} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">총 회원</div>
            <div className="stat-card-value">{totalMembersCount}명</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon active">
            <Users size={20} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">활성 회원</div>
            <div className="stat-card-value">{activeMembersCount}명</div>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => handleOpenMemberList('warning')}>
          <div className="stat-card-icon warning">
            <Users size={20} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">주의 회원</div>
            <div className="stat-card-value">{warningMembersCount}명</div>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => handleOpenMemberList('new')}>
          <div className="stat-card-icon new">
            <UserPlus size={20} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">신규 회원</div>
            <div className="stat-card-value">{newMembersCount}명</div>
          </div>
        </div>
      </div>

      {/* 검색 및 테이블 카드 */}
      <div className="content-card">

        <div className="search-section">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="이름, 닉네임, 이메일로 검색..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* 회원 목록 카드 */}
      <div className="content-card" style={{ flex: 1 }}>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>회원 정보를 불러오는 중...</p>
          </div>
        ) : (
          <div className="members-table-container">
            <div className="members-table">
              <div className="table-header">
                <div className="table-cell">이름</div>
                <div className="table-cell">닉네임</div>
                <div className="table-cell">등록 타입</div>
                <div className="table-cell">만료 일자</div>
                <div className="table-cell">잔여 기간</div>
                <div className="table-cell">잔여 횟수</div>
                <div className="table-cell">성별</div>
                <div className="table-cell">관리</div>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="empty-state">
                  <Users size={48} className="empty-icon" />
                  <h3>회원이 없습니다</h3>
                  <p>{searchValue ? '검색 조건에 맞는 회원이 없습니다.' : '등록된 회원이 없습니다.'}</p>
                </div>
              ) : (
                currentMembers.map((member, index) => {
                  // 회원권 상태 뱃지 정보 가져오기 (기간권 > 횟수권 > 없음 > 홀딩)
                  const statusBadges = MembershipService.getMembershipStatusBadges(member);
                  // 회원 상태 뱃지 정보 가져오기 (주의 > 활성 > 비활성 )
                  const memberStatusBadge = MembershipService.getMemberStatusBadge(member);
                  
                  return (
                    <div key={member.email} className="table-row">
                      <div className="table-cell">
                        <div className="member-name-cell">
                          <div className="member-avatar">
                            <Users size={16} />
                          </div>
                          <span>{member.realName}</span>
                        </div>
                      </div>
                      <div className="table-cell">
                        <div className="nickname-with-badge">
                          <span>{member.nickName}</span>
                          <span className={`member-status-badge ${memberStatusBadge.colorClass}`}>
                            {memberStatusBadge.status}
                          </span>
                        </div>
                      </div>
                      <div className="table-cell">
                        <div className="membership-badges">
                          {statusBadges.map((badge, idx) => (
                            <span key={idx} className={`membership-badge ${badge.colorClass}`}>
                              {badge.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    <div className="table-cell">{member.membershipInfo.expiryDate}</div>
                    <div className="table-cell">
                      <span className={`remaining-days ${member.membershipInfo.remainingDays <= 7 ? 'warning' : ''}`}>
                        {member.membershipInfo.remainingDays}일
                      </span>
                    </div>
                    <div className="table-cell">{member.membershipInfo.remainingVisits}회</div>
                    <div className="table-cell">{getGenderText(member.gender)}</div>
                    <div className="table-cell">
                      <div className="action-buttons">
                        <button 
                          className="btn btn-sm btn-info"
                          onClick={() => handleManageMembership(member)}
                          title="회원권 관리"
                        >
                          <Settings size={14} />
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteMember(member)}
                          title="회원 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* 페이지네이션 */}
            {sortedMembers.length > 0 && totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  <span>
                    {startIndex + 1}-{Math.min(endIndex, sortedMembers.length)} / {sortedMembers.length}명
                  </span>
                </div>
                
                <div className="pagination-controls">
                  <button 
                    className="pagination-btn" 
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`page-number ${page === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    className="pagination-btn" 
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <MemberManagementModal
        visible={memberManagementModalVisible}
        member={selectedMember}
        onClose={() => setMemberManagementModalVisible(false)}
        onSuccess={(message) => {
          if (createToast) {
            createToast({
              type: 'success',
              message
            });
          }
        }}
        onError={(message) => {
          if (createToast) {
            createToast({
              type: 'danger',
              message
            });
          }
        }}
      />

      <MemberDeletionModal
        visible={deletionModalVisible}
        member={selectedMember}
        onClose={() => setDeletionModalVisible(false)}
        onDelete={handleConfirmDelete}
      />

      <MembershipPlanModal
        visible={membershipPlanModalVisible}
        onClose={() => setMembershipPlanModalVisible(false)}
        onSuccess={(message) => {
          if (createToast) {
            createToast({
              type: 'success',
              message
            });
          }
        }}
        onError={(message) => {
          if (createToast) {
            createToast({
              type: 'danger',
              message
            });
          }
        }}
      />

      {/* 주의 회원 모달 */}
      <WarningMembersModal
        visible={warningMembersModalVisible}
        members={warningMembers}
        onClose={() => setWarningMembersModalVisible(false)}
        onMemberClick={handleWarningMemberClick}
      />

      {/* 회원 추가 모달 */}
      <AddMemberModal
        visible={addMemberModalVisible}
        onClose={() => {
          setAddMemberModalVisible(false);
          loadMembers(); // 회원 목록 새로고침
        }}
        onSuccess={(message) => {
          if (createToast) {
            createToast({
              type: 'success',
              message
            });
          }
          loadMembers(); // 회원 목록 새로고침
        }}
        onError={(message) => {
          if (createToast) {
            createToast({
              type: 'danger',
              message
            });
          }
        }}
      />

      {/* 승인 대기 목록 모달 */}
      <ApplyRequestModal
        visible={applyRequestModalVisible}
        onClose={() => {
          setApplyRequestModalVisible(false);
          loadMembers(); // 회원 목록 새로고침
        }}
        onSuccess={(message) => {
          if (createToast) {
            createToast({
              type: 'success',
              message
            });
          }
          loadMembers(); // 회원 목록 새로고침
        }}
        onError={(message) => {
          if (createToast) {
            createToast({
              type: 'danger',
              message
            });
          }
        }}
      />

      {/* 신규 회원 리스트 모달 (임시) */}
      {memberListModalVisible && (
        <div className="modal-overlay" onClick={() => setMemberListModalVisible(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>신규 회원 목록</h3>
              <button className="modal-close" onClick={() => setMemberListModalVisible(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="text-muted">
                최근 등록된 신규 회원 목록입니다.
              </p>
              <div className="member-list-placeholder">
                <Users size={48} className="placeholder-icon" />
                <p>기능 준비 중입니다.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Messages */}
      <ToastMessage
        onCreateToast={(createToastFn: (toast: ToastMessageType) => void) => setCreateToast(() => createToastFn)}
      />

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.3s;
        }

        .stat-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }

        .stat-card.clickable {
          cursor: pointer;
        }

        .stat-card.clickable:active {
          transform: translateY(0);
        }

        .stat-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: ${Gradients.primary};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .stat-card-icon.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .stat-card-icon.warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .stat-card-icon.new {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }

        .stat-card-content {
          flex: 1;
        }

        .stat-card-label {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .stat-card-value {
          font-size: 20px;
          font-weight: 700;
          color: #374151;
        }

        .actions-bar {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-bottom: 20px;
        }

        .btn-primary {
          background: ${Gradients.primary};
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 500;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .btn-primary:hover {
          background: ${Gradients.primaryHover};
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }

          .btn-secondary {
            background: white;
            border: 2px solid ${AppColors.primary};
            color: ${AppColors.primary};
            font-size: 14px;
            font-weight: 500;
            padding: 10px 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-secondary:hover {
            background: ${AppColors.primary};
            color: white;
            transform: translateY(-1px);
          }

          .btn-info {
            background: white;
            border: 2px solid #3b82f6;
            color: #3b82f6;
            font-size: 14px;
            font-weight: 500;
            padding: 10px 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-info:hover {
            background: #3b82f6;
            color: white;
            transform: translateY(-1px);
          }

        .search-section {
          margin-bottom: 0;
        }

        .search-container {
          position: relative;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .search-input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .members-table-container {
          overflow-x: auto;
        }

        .members-table {
          width: 100%;
          min-width: 800px;
        }

        .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 80px 120px 80px;
          gap: 16px;
          padding: 16px;
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 80px 120px 80px;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          transition: all 0.2s;
        }

        .table-row:hover {
          background-color: #f9fafb;
        }

        .table-cell {
          display: flex;
          align-items: center;
          font-size: 14px;
          color: #374151;
        }

        .member-name-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .member-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: ${Gradients.primary};
          color: white;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .membership-badges {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .membership-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .membership-badge.primary {
          background-color: #dbeafe;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }

        .membership-badge.none {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border: 1px solid #fca5a5;
          color: #991b1b;
        }

        .membership-badge.hold {
          background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%) !important;
          border: 1px solid #fb923c !important;
          color: #7c2d12 !important;
        }

        .nickname-with-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .member-status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          border: none;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .member-status-badge.warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #fbbf24;
          color: #92400e;
        }

        .member-status-badge.active {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border: 1px solid #10b981;
          color: #065f46;
        }

        .member-status-badge.inactive {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border: 1px solid #9ca3af;
          color: #4b5563;
        }

        .remaining-days {
          font-weight: 600;
        }

        .remaining-days.warning {
          color: #dc2626;
          background-color: #fee2e2;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .action-buttons {
          display: flex;
          gap: 6px;
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
        }

        .btn-sm {
          padding: 6px 8px;
          font-size: 12px;
        }

        .btn-info {
          background-color: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .btn-info:hover {
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

        .btn-light {
          background-color: #f8fafc;
          border-color: #e2e8f0;
          color: #64748b;
        }

        .btn-light:hover {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .empty-icon {
          color: #9ca3af;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 18px;
        }

        .empty-state p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
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

        .loading-container p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .pagination-info {
          font-size: 14px;
          color: #6b7280;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid #d1d5db;
          background-color: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          color: #6b7280;
        }

        .pagination-btn:hover:not(:disabled) {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background-color: #f9fafb;
        }

        .page-numbers {
          display: flex;
          gap: 4px;
        }

        .page-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid #d1d5db;
          background-color: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
        }

        .page-number:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .page-number.active {
          background: ${Gradients.primary};
          border-color: ${AppColors.primary};
          color: white;
        }

        .page-number.active:hover {
          background: ${Gradients.primaryHover};
        }

        /* 모달 스타일 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          color: #9ca3af;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
        }

        .text-muted {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .member-list-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #9ca3af;
        }

        .placeholder-icon {
          margin-bottom: 16px;
        }

        .member-list-placeholder p {
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 14px 18px;
          }

          .stat-card-icon {
            width: 40px;
            height: 40px;
          }

          .stat-card-label {
            font-size: 12px;
          }

          .stat-card-value {
            font-size: 18px;
          }

          .actions-bar {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default MemberManagement; 