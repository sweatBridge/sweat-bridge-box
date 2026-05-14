import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Gradients } from '../constants/gradients';
import { AppColors } from '../constants/colors';
import { LockerService } from '../services/lockerService';
import { MemberService } from '../services/memberService';
import { RevenueService } from '../services/revenueService';
import {
  Locker as LockerItem,
  LockerState,
  LockerUpdatableState,
  LOCKER_STATE,
  isLockerState,
  coalesceLockerState,
  getLockerStateLabel,
  getLockerState
} from '../types/locker';
import type { Member } from '../types/member';
import { usePageContext } from '../contexts/PageContext';
import { generateMembershipKey } from '../utils/keyGenerator';
import AddLockerModal from '../components/modals/locker/AddLockerModal';
import LockerDetailsModal from '../components/modals/locker/LockerDetailsModal';
import DeleteLockerConfirmModal from '../components/modals/locker/DeleteLockerConfirmModal';
import ReleaseLockerConfirmModal from '../components/modals/locker/ReleaseLockerConfirmModal';
import UpdateLockerModal from '../components/modals/locker/UpdateLockerModal';
import LockerHistoryModal from '../components/modals/locker/LockerHistoryModal';
import AssignLockerModal from '../components/modals/locker/AssignLockerModal';
import ToastMessage from '../components/ToastMessage';
import type { ToastMessageType } from '../types/class';

type LockerBox = { number: number; users: string[]; state: LockerState };

// BOX_NAME은 localStorage에서 가져온다
const BOX_NAME = localStorage.getItem('boxName') || 'SWEAT';

const Locker: React.FC = () => {
  const { setPageInfo } = usePageContext();
  const [raw, setRaw] = useState<LockerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Toast message
  const [createToast, setCreateToast] = useState<((toast: ToastMessageType) => void) | null>(null);

  // 모달 상태
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // 선택된 락커 정보
  const [selectedNo, setSelectedNo] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<LockerState>(LOCKER_STATE.UNUSED);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  
  // 로딩 상태
  const [deleting, setDeleting] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // 히스토리 데이터
  const [historyData, setHistoryData] = useState<LockerItem[]>([]);

  const loadLockers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lockers = await LockerService.getLockers(BOX_NAME);
      setRaw(lockers);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPageInfo({
      title: '락커 관리',
      subtitle: '락커 현황을 확인하고 관리하세요'
    });
  }, [setPageInfo]);

  useEffect(() => {
    loadLockers();
  }, [loadLockers]);

  // group by locker number → one box per locker
  const boxes = useMemo<LockerBox[]>(() => {
    const map = new Map<number, LockerBox>();
    for (const l of raw) {
      const num = l.number;
      const name = (l.realName || '').trim();
      
      // realName이 있으면 'used' 상태로 판단
      let nextState: LockerState;
      if (name) {
        nextState = LOCKER_STATE.USED;
      } else if (l.state && isLockerState(l.state)) {
        nextState = l.state;
      } else {
        nextState = LOCKER_STATE.UNUSED;
      }

      // 날짜 비교를 통해 실제 상태 결정 (만료된 경우 UNUSED로 변경)
      const actualState = getLockerState(nextState, l);
      
      // 만료된 경우(원래 USED였지만 UNUSED로 변경된 경우) 회원 정보 비우기
      const isExpired = nextState === LOCKER_STATE.USED && actualState === LOCKER_STATE.UNUSED;
      const displayUsers = isExpired ? [] : (name ? [name] : []);

      if (!map.has(num)) {
        map.set(num, { number: num, users: displayUsers, state: actualState });
      } else {
        const cur = map.get(num)!;
        cur.state = coalesceLockerState(cur.state, actualState);
        if (name && !cur.users.includes(name)) cur.users.push(name);
      }
    }
    // deleted 상태인 락커는 화면에 표시하지 않음
    return Array.from(map.values())
      .filter(box => box.state !== LOCKER_STATE.DELETED)
      .sort((a, b) => a.number - b.number);
  }, [raw]);

  const onOpenAdd = () => {
    setShowAdd(true);
  };

  // 카드 클릭 → 편집 모달 열기 (기본값은 해당 번호의 첫 데이터로 프리필)
  const onOpenEdit = (number: number) => {
    const candidates = raw.filter(r => r.number === number);
    const firstWithName = candidates.find(c => (c.realName || '').trim().length > 0);
    const base = firstWithName ?? candidates[0]; // 없으면 첫 항목 참조(없을 수도 있음)

    // boxes에서 해당 락커의 상태 찾기
    const lockerBox = boxes.find(b => b.number === number);
    const lockerState = lockerBox?.state || LOCKER_STATE.UNUSED;
    
    // 만료된 경우(원래 USED였지만 UNUSED로 변경된 경우) 회원 정보 비우기
    const lockerData = raw.find(r => r.number === number);
    const originalState = lockerData?.realName?.trim() 
      ? LOCKER_STATE.USED 
      : (lockerData?.state && isLockerState(lockerData.state) ? lockerData.state : LOCKER_STATE.UNUSED);
    const isExpired = originalState === LOCKER_STATE.USED && lockerState === LOCKER_STATE.UNUSED;

    setSelectedNo(number);
    setSelectedState(lockerState);
    setEditName(isExpired ? '' : ((base?.realName || '').trim()));
    setEditPhone(isExpired ? '' : (base?.phone || ''));
    setEditStartDate(isExpired ? '' : (base?.startDate || ''));
    setEditEndDate(isExpired ? '' : (base?.endDate || ''));
    setShowEdit(true);
  };

  const onConfirmAdd = async (startNo: string, endNo: string) => {
    const startNumber = parseInt(startNo, 10);
    const endNumber = parseInt(endNo, 10);
    try {
      const { added, skipped } = await LockerService.addLockers(BOX_NAME, startNumber, endNumber);
      if (createToast) {
        createToast({
          type: 'success',
          message: `추가: ${added.length}개, 건너뜀(이미 존재): ${skipped.length}개`
        });
      }
      setShowAdd(false);
      await loadLockers();
    } catch (err: any) {
      if (createToast) {
        createToast({
          type: 'danger',
          message: err?.message ?? String(err)
        });
      }
      throw err; // re-throw to let modal handle loading state
    }
  };

  const onDeleteLocker = () => {
    setShowDeleteConfirm(true);
  };

  const onConfirmDelete = async () => {
    if (selectedNo === null) return;

    setDeleting(true);
    try {
      await LockerService.deleteLocker(BOX_NAME, selectedNo);
      if (createToast) {
        createToast({
          type: 'success',
          message: '락커가 삭제되었습니다.'
        });
      }
      setShowDeleteConfirm(false);
      setShowEdit(false);
      await loadLockers();
    } catch (err: any) {
      if (createToast) {
        createToast({
          type: 'danger',
          message: `삭제 실패: ${err?.message ?? String(err)}`
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  const onReleaseLocker = () => {
    setShowReleaseConfirm(true);
  };

  const onConfirmRelease = async (note: string, assignee: string) => {
    if (selectedNo === null) return;

    setReleasing(true);
    try {
      // 해당 락커에 배정된 회원의 정보를 찾기 위해 현재 데이터 확인
      const candidates = raw.filter(r => r.number === selectedNo);
      const currentLocker = candidates.find(c => (c.realName || '').trim().length > 0);

      await LockerService.releaseLocker(BOX_NAME, selectedNo, note, assignee);
      
      // 회원 문서의 lockerHistory에 releasedDate 기록
      if (currentLocker && selectedNo !== null) {
        try {
          const allMembers = await MemberService.getMembers(BOX_NAME);
          const member = allMembers.find(m => m.realName === currentLocker.realName);
          if (member && currentLocker.key) {
            await MemberService.unassignLockerFromMember(
              BOX_NAME,
              member.email,
              selectedNo,
              currentLocker.key
            );
          } else if (!currentLocker.key) {
            console.warn('락커에 key가 없어 히스토리를 업데이트할 수 없습니다.');
          }
        } catch (err) {
          console.error('회원 락커 해제 실패:', err);
          // 락커는 해지되었으므로 계속 진행
        }
      }
      
      if (createToast) {
        createToast({
          type: 'success',
          message: '락커가 해지되었습니다.'
        });
      }
      setShowReleaseConfirm(false);
      setShowEdit(false);
      await loadLockers();
    } catch (err: any) {
      if (createToast) {
        createToast({
          type: 'danger',
          message: `해지 실패: ${err?.message ?? String(err)}`
        });
      }
    } finally {
      setReleasing(false);
    }
  };

  const onOpenUpdateModal = () => {
    if (editName.trim()) {
      if (createToast) {
        createToast({
          type: 'warning',
          message: '회원을 먼저 해지하시기 바랍니다.'
        });
      }
      return;
    }
    setShowUpdateModal(true);
  };

  const onConfirmUpdate = async (state: LockerUpdatableState, note: string, assignee: string) => {
    if (selectedNo === null) return;

    setUpdating(true);
    try {
      await LockerService.updateLocker(BOX_NAME, selectedNo, state, note, assignee);
      if (createToast) {
        createToast({
          type: 'success',
          message: '락커가 수정되었습니다.'
        });
      }
      setShowUpdateModal(false);
      setShowEdit(false);
      await loadLockers();
    } catch (err: any) {
      if (createToast) {
        createToast({
          type: 'danger',
          message: `수정 실패: ${err?.message ?? String(err)}`
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  const onOpenHistory = async () => {
    if (selectedNo === null) return;

    try {
      // 해당 락커 번호의 모든 히스토리 가져오기
      const history = await LockerService.getLockerHistory(BOX_NAME, selectedNo);
      setHistoryData(history);
      setShowHistory(true);
    } catch (err: any) {
      if (createToast) {
        createToast({
          type: 'danger',
          message: `히스토리 조회 실패: ${err?.message ?? String(err)}`
        });
      }
    }
  };

  const onOpenAssignModal = () => {
    setShowAssignModal(true);
  };

  const onSearchMembers = async (searchText: string): Promise<Member[]> => {
    setSearching(true);
    try {
      const results = await MemberService.searchMembersByName(BOX_NAME, searchText);
      return results;
    } catch (err: any) {
      if (createToast) {
        createToast({
          type: 'danger',
          message: `검색 실패: ${err?.message ?? String(err)}`
        });
      }
      return [];
    } finally {
      setSearching(false);
    }
  };

  const onConfirmAssign = async (member: Member, startDate: string, endDate: string, price: string, paymentType: 'cash' | 'card') => {
    if (selectedNo === null) return;

    setAssigning(true);
    try {
      const phone = member.phone || '';
      
      // 동일한 키를 Locker와 Member에 저장하기 위해 미리 생성
      const lockerKey = generateMembershipKey();
      
      // 락커에 회원 배정
      await LockerService.assignLocker(
        BOX_NAME,
        selectedNo,
        member.email,
        member.realName,
        phone,
        startDate,
        endDate,
        lockerKey,
        price,
        paymentType
      );
      
      // 회원에게 락커 번호 추가 (동일한 키 사용)
      await MemberService.assignLockerToMember(
        BOX_NAME,
        member.email,
        selectedNo,
        startDate,
        endDate,
        lockerKey,
        price,
        paymentType
      );
      
      // 매출에 락커 매출 추가
      await RevenueService.addLockerRevenue(
        lockerKey,
        member.email,
        member.realName,
        price,
        paymentType
      );
      
      if (createToast) {
        createToast({
          type: 'success',
          message: '락커가 배정되었습니다.'
        });
      }
      setShowAssignModal(false);
      setShowEdit(false);
      await loadLockers();
    } catch (err: any) {
      if (createToast) {
        createToast({
          type: 'danger',
          message: `배정 실패: ${err?.message ?? String(err)}`
        });
      }
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="locker-page">
      <div className="content-card">
        <div className="card-header">
          <div className="header-left">
            <span>락커 현황</span>
          </div>
          <div className="header-actions">
            <button className="btn btn-white" onClick={onOpenAdd}>락커 일괄 추가</button>
          </div>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner" />
            <p>불러오는 중…</p>
          </div>
        )}

        {error && !loading && (
          <div className="error">오류: {error}</div>
        )}

        {!loading && !error && (
          <div className="locker-grid">
            {boxes.map(({ number, users, state }) => (
              <div
                key={number}
                className={`locker-card ${state}`}
                onClick={() => onOpenEdit(number)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenEdit(number)}
              >
                <div className="locker-number">#{number}</div>
                <div className="locker-users">
                  {users.length > 0 ? users.join(', ') : <span className="muted">—</span>}
                </div>
                <div className={`status-chip ${state}`}>
                  {(() => {
                    // 해당 락커의 데이터 찾기 (lockerService.getLockers에서 이미 마지막 원소만 반환)
                    const lockerData = raw.find(r => r.number === number);
                    return getLockerStateLabel(state, lockerData);
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 일괄 추가 모달 */}
      <AddLockerModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onConfirm={onConfirmAdd}
      />

      {/* 개별 편집 모달 */}
      {selectedNo !== null && (
        <LockerDetailsModal
          visible={showEdit}
          lockerNo={selectedNo}
          name={editName}
          phone={editPhone}
          startDate={editStartDate}
          endDate={editEndDate}
          onClose={() => setShowEdit(false)}
          onUpdate={onOpenUpdateModal}
          onAssign={onOpenAssignModal}
          onRelease={onReleaseLocker}
          onDelete={onDeleteLocker}
          onHistory={onOpenHistory}
          state={selectedState === LOCKER_STATE.DELETED ? LOCKER_STATE.UNUSED : selectedState}
          releasing={releasing}
          deleting={deleting}
        />
      )}

      {/* 삭제 확인 모달 */}
      {selectedNo !== null && (
        <DeleteLockerConfirmModal
          visible={showDeleteConfirm}
          lockerNo={selectedNo}
          deleting={deleting}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={onConfirmDelete}
        />
      )}

      {/* 회원 해지 확인 모달 */}
      {selectedNo !== null && (
        <ReleaseLockerConfirmModal
          visible={showReleaseConfirm}
          lockerNo={selectedNo}
          releasing={releasing}
          onClose={() => setShowReleaseConfirm(false)}
          onConfirm={onConfirmRelease}
          createToast={createToast ? (toast) => createToast(toast) : undefined}
        />
      )}

      {/* 락커 수정 모달 */}
      {selectedNo !== null && (
        <UpdateLockerModal
          visible={showUpdateModal}
          lockerNo={selectedNo}
          currentState={selectedState === LOCKER_STATE.NA ? LOCKER_STATE.NA : LOCKER_STATE.UNUSED}
          updating={updating}
          onClose={() => setShowUpdateModal(false)}
          onConfirm={onConfirmUpdate}
          createToast={createToast ? (toast) => createToast(toast) : undefined}
        />
      )}

      {/* 락커 히스토리 모달 */}
      {selectedNo !== null && (
        <LockerHistoryModal
          visible={showHistory}
          lockerNo={selectedNo}
          historyData={historyData}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* 락커 배정 모달 */}
      {selectedNo !== null && (
        <AssignLockerModal
          visible={showAssignModal}
          lockerNo={selectedNo}
          assigning={assigning}
          searching={searching}
          onClose={() => setShowAssignModal(false)}
          onConfirm={onConfirmAssign}
          onSearch={onSearchMembers}
          createToast={createToast || undefined}
        />
      )}

      {/* Toast Message */}
      <ToastMessage
        onCreateToast={(createToastFn) => setCreateToast(() => createToastFn)}
      />

      <style>{`
        .content-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          padding: 20px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: ${Gradients.primary};
          color: #fff;
          border-radius: 8px;
          margin: -20px -20px 20px -20px;
          font-weight: 600;
        }
        .header-left { display: flex; gap: 8px; align-items: center; }
        .header-actions { display: flex; gap: 8px; }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn:disabled { 
          opacity: 0.6; 
          cursor: not-allowed; 
        }
        .btn-white {
          background: #fff;
          color: #111827;
          border: 1px solid #e5e7eb;
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
        .btn-secondary {
          background-color: #ffffff;
          border-color: #d1d5db;
          color: #374151;
        }
        .btn-secondary:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }
        .btn-action {
          background: #ffffff;
          color: #374151;
          border-color: #d1d5db;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          flex: 1;
        }
        .btn-action:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }
        .btn-action:disabled {
          background: #e5e7eb;
          color: #9ca3af;
          border: 1px solid #d1d5db;
          cursor: not-allowed;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .loading, .error {
          padding: 32px 12px;
          text-align: center;
          color: #475569;
        }
        .spinner {
          width: 28px; height: 28px; margin: 0 auto 10px;
          border: 3px solid #e5e7eb; border-top: 3px solid #6366f1; border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .locker-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr); /* 기본: 2개 (모바일) */
          gap: 12px;
        }
        
        /* 타블렛: 4개 */
        @media (min-width: 768px) {
          .locker-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        /* 중간 데스크탑: 6개 */
        @media (min-width: 1024px) {
          .locker-grid {
            grid-template-columns: repeat(6, 1fr);
          }
        }
        
        /* 데스크탑: 8개 */
        @media (min-width: 1280px) {
          .locker-grid {
            grid-template-columns: repeat(8, 1fr);
          }
        }
        
        /* 큰 데스크탑: 10개 */
        @media (min-width: 1536px) {
          .locker-grid {
            grid-template-columns: repeat(10, 1fr);
          }
        }
        
        /* 초대형 화면: 12개 */
        @media (min-width: 1920px) {
          .locker-grid {
            grid-template-columns: repeat(12, 1fr);
          }
        }
        .locker-card {
          position: relative;
          border-radius: 10px;
          padding: 12px;
          border: 1px solid rgba(0,0,0,0.06);
          min-height: 90px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          transition: transform .05s ease, box-shadow .1s ease;
        }
        .locker-card:hover { box-shadow: 0 2px 6px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .locker-card.used   { background: ${AppColors.successSoft}; }   /* 사용 중: 연한 green */
        .locker-card.unused { background: ${AppColors.primarySoft}; }   /* 사용 가능: 연한 blue */
        .locker-card.na     { background: ${AppColors.errorSoft}; }     /* 고장/사용불가: 연한 red */
        .locker-card.deleted { background: ${AppColors.background}; }   /* 삭제됨: 연한 gray */
        .locker-number {
          font-weight: 800;
          font-size: 18px;
          color: #111827;
        }
        .locker-users {
          font-size: 13px;
          color: #374151;
          line-height: 1.3;
          flex: 1;
          word-break: break-all;
        }
        .muted { color: #94a3b8; }

        .status-chip {
          position: absolute;
          right: 8px;
          bottom: 8px;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 10px;
          font-weight: 600;
          background: rgba(255,255,255,0.7);
        }
        .status-chip.used   { color: #065f46; }
        .status-chip.unused { color: #075985; }
        .status-chip.na     { color: #991b1b; }
        .status-chip.deleted { color: #6b7280; }

        /* modal */
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
          max-width: 750px;
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

        .form-section {
          margin-bottom: 20px;
        }

        .form-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .form-row .form-group {
          flex: 1;
          margin-bottom: 0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .info-box {
          padding: 12px 16px;
          background-color: #e0f2fe;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          color: #0c4a6e;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
          background-color: #fafbfc;
        }

        .form-input:focus {
          outline: none;
          border-color: ${AppColors.primary};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          background-color: white;
        }

        .form-input:read-only {
          background-color: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
          border-color: #e5e7eb;
        }

        .form-input:read-only:focus {
          border-color: #e5e7eb;
          box-shadow: none;
          background-color: #f3f4f6;
        }

        .form-error { 
          color: #b91c1c; 
          font-size: 13px; 
          margin-top: 8px; 
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        /* 삭제 확인 모달 스타일 */
        .delete-confirm-modal {
          max-width: 500px;
        }

        .delete-message {
          text-align: center;
          padding: 12px 0;
        }

        .delete-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 20px;
        }

        .delete-info-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background-color: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 8px;
          color: #92400e;
          font-size: 14px;
          line-height: 1.5;
          text-align: left;
        }

        .delete-info-box svg {
          flex-shrink: 0;
          color: #f59e0b;
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

        .btn-danger:disabled {
          background-color: #fca5a5;
          border-color: #fca5a5;
        }

        /* 회원 해지 확인 모달 스타일 */
        .release-confirm-modal {
          max-width: 500px;
        }

        .release-message {
          text-align: center;
          padding: 12px 0;
        }

        .release-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        /* 락커 수정 모달 스타일 */
        .update-modal {
          max-width: 500px;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .form-input option:disabled {
          color: #9ca3af;
          background-color: #f3f4f6;
        }

        select.form-input {
          cursor: pointer;
        }

        select.form-input:disabled {
          cursor: not-allowed;
        }

        /* 락커 히스토리 모달 스타일 */
        .history-modal {
          max-width: 600px;
        }

        .empty-history {
          text-align: center;
          padding: 40px 20px;
          color: #9ca3af;
          font-size: 16px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .history-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background-color: #fafbfc;
          transition: all 0.2s;
        }

        .history-item:hover {
          background-color: #f3f4f6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .history-index {
          font-weight: 700;
          font-size: 14px;
          color: #6b7280;
        }

        .history-state-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .history-state-badge.used {
          background-color: #dcfce7;
          color: #065f46;
        }

        .history-state-badge.unused {
          background-color: #e0f2fe;
          color: #075985;
        }

        .history-state-badge.na {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .history-state-badge.deleted {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .history-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-row {
          display: flex;
          gap: 8px;
          font-size: 14px;
        }

        .history-label {
          font-weight: 600;
          color: #6b7280;
          min-width: 80px;
          flex-shrink: 0;
        }

        .history-value {
          color: #111827;
          word-break: break-word;
        }

        /* 락커 배정 모달 스타일 */
        .assign-modal {
          max-width: 500px;
        }

        .search-input-wrapper {
          display: flex;
          gap: 8px;
        }

        .search-input-wrapper .form-input {
          flex: 1;
        }

        .search-btn {
          padding: 12px 20px;
          white-space: nowrap;
        }

        .selected-member {
          margin-top: 12px;
          padding: 12px;
          background-color: #e0f2fe;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .member-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .member-detail {
          font-size: 13px;
          color: #64748b;
        }

        .clear-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #64748b;
          cursor: pointer;
          padding: 0 8px;
          line-height: 1;
          transition: color 0.2s;
        }

        .clear-btn:hover:not(:disabled) {
          color: #dc2626;
        }

        .clear-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .search-results {
          margin-top: 8px;
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
        }

        .search-result-item {
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .search-result-item:hover {
          background-color: #f9fafb;
        }

        .member-name {
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .member-phone {
          font-size: 13px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default Locker;

