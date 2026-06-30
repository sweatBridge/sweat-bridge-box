import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Search,
  Users,
} from 'lucide-react';
import { useAdminClassStatus } from '../../hooks/useAdminClassStatus';
import { AdminBoxClassStatus } from '../../types/adminClass';

type RegistrationFilter = 'all' | 'registered' | 'unregistered';

const pad = (value: number) => value.toString().padStart(2, '0');

const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromDateInputValue = (value: string) => new Date(`${value}T00:00:00`);

const formatDisplayDate = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(fromDateInputValue(value));

const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ElementType;
  tone?: 'primary' | 'success' | 'warning';
}) => (
  <div className="ds-stat">
    <div className="ds-stat__top">
      <div className={`ds-stat__icon${tone === 'primary' ? '' : ` ds-stat__icon--${tone}`}`}>
        <Icon />
      </div>
      <span className="ds-stat__label">{label}</span>
    </div>
    <div className="ds-stat__value">{value}</div>
    <span className="ds-stat__hint">{hint}</span>
  </div>
);

const BoxClassCard = ({ box }: { box: AdminBoxClassStatus }) => {
  const occupancy = box.totalCapacity > 0
    ? Math.round((box.reservedCount / box.totalCapacity) * 100)
    : 0;

  return (
    <details className="admin-class-box ds-card">
      <summary className="admin-class-box__summary">
        <div className="admin-class-box__identity">
          <span className="admin-class-box__icon"><Building2 /></span>
          <div>
            <strong>{box.boxName}</strong>
            <span>{box.classes.length}개 수업 등록</span>
          </div>
        </div>
        <div className="admin-class-box__summary-right">
          <span className="ds-badge ds-badge--neutral">정원 {box.totalCapacity}명</span>
          <span className="ds-badge ds-badge--success">예약 {box.reservedCount}명</span>
          <span className="admin-class-box__occupancy">{occupancy}%</span>
          <ChevronDown className="admin-class-box__chevron" />
        </div>
      </summary>

      <div className="admin-class-box__body">
        <table className="ds-table">
          <thead>
            <tr>
              <th>시간</th>
              <th>담당 코치</th>
              <th>예약 현황</th>
              <th>예약률</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {box.classes.map((classItem) => {
              const rate = classItem.capacity > 0
                ? Math.round((classItem.reservedCount / classItem.capacity) * 100)
                : 0;
              const full = classItem.capacity > 0 && classItem.reservedCount >= classItem.capacity;
              const warning = !full && rate >= 80;
              return (
                <tr key={classItem.id}>
                  <td>
                    <span className="admin-class-time">
                      {classItem.startTime}–{classItem.endTime}
                    </span>
                  </td>
                  <td>{classItem.coach}</td>
                  <td><strong>{classItem.reservedCount}</strong> / {classItem.capacity}명</td>
                  <td>
                    <div className="admin-class-rate">
                      <div className="ds-meter">
                        <div
                          className={`ds-meter__fill${full ? ' ds-meter__fill--error' : warning ? ' ds-meter__fill--warning' : ''}`}
                          style={{ width: `${Math.min(rate, 100)}%` }}
                        />
                      </div>
                      <span>{rate}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`ds-badge ${full ? 'ds-badge--error' : warning ? 'ds-badge--warning' : 'ds-badge--success'}`}>
                      {full ? '만석' : warning ? '마감 임박' : '예약 가능'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
};

const AdminClassStatus = () => {
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [registrationFilter, setRegistrationFilter] = useState<RegistrationFilter>('all');
  const { boxes, failedBoxNames, loading, error, loadDailyStatus } = useAdminClassStatus();

  useEffect(() => {
    void loadDailyStatus(fromDateInputValue(selectedDate));
  }, [loadDailyStatus, selectedDate]);

  const changeDate = (days: number) => {
    const next = fromDateInputValue(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(toDateInputValue(next));
  };

  const successfulBoxes = useMemo(() => {
    const failed = new Set(failedBoxNames);
    return boxes.filter((box) => !failed.has(box.boxName));
  }, [boxes, failedBoxNames]);

  const filteredBoxes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return successfulBoxes.filter((box) => !query || box.boxName.toLowerCase().includes(query));
  }, [successfulBoxes, searchQuery]);

  const registeredBoxes = filteredBoxes.filter((box) => box.classes.length > 0);
  const unregisteredBoxes = filteredBoxes.filter((box) => box.classes.length === 0);
  const allRegisteredBoxes = successfulBoxes.filter((box) => box.classes.length > 0);
  const totalClasses = successfulBoxes.reduce((sum, box) => sum + box.classes.length, 0);
  const totalReservations = successfulBoxes.reduce((sum, box) => sum + box.reservedCount, 0);

  return (
    <div className="ds-page">
      <div className="admin-class-toolbar ds-card ds-card--pad">
        <div className="admin-class-date-nav">
          <button className="ds-btn ds-btn--ghost ds-btn--sm" type="button" onClick={() => changeDate(-1)} aria-label="이전 날짜">
            <ChevronLeft />
          </button>
          <label className="admin-class-date-input">
            <CalendarDays />
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
          <button className="ds-btn ds-btn--ghost ds-btn--sm" type="button" onClick={() => changeDate(1)} aria-label="다음 날짜">
            <ChevronRight />
          </button>
          <button className="ds-btn ds-btn--subtle ds-btn--sm" type="button" onClick={() => setSelectedDate(toDateInputValue(new Date()))}>
            오늘
          </button>
          <strong className="admin-class-display-date">{formatDisplayDate(selectedDate)}</strong>
        </div>
        <button className="ds-btn ds-btn--ghost ds-btn--sm" type="button" onClick={() => void loadDailyStatus(fromDateInputValue(selectedDate))}>
          새로고침
        </button>
      </div>

      <div className="admin-class-stats">
        <StatCard label="전체 수업" value={totalClasses} hint="선택일에 등록된 수업" icon={CalendarDays} />
        <StatCard label="등록 박스" value={allRegisteredBoxes.length} hint={`조회 완료 ${successfulBoxes.length}개 박스`} icon={Building2} tone="success" />
        <StatCard label="미등록 박스" value={successfulBoxes.length - allRegisteredBoxes.length} hint="수업 일정 확인 필요" icon={AlertCircle} tone="warning" />
        <StatCard label="전체 예약" value={totalReservations} hint="선택일 예약 인원" icon={Users} />
      </div>

      <div className="admin-class-filter-row">
        <div className="admin-class-search">
          <Search />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="박스명 검색"
          />
        </div>
        <div className="admin-class-filter-buttons">
          {([
            ['all', '전체'],
            ['registered', '등록'],
            ['unregistered', '미등록'],
          ] as Array<[RegistrationFilter, string]>).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`ds-btn ds-btn--sm ${registrationFilter === value ? 'ds-btn--primary' : 'ds-btn--ghost'}`}
              onClick={() => setRegistrationFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {failedBoxNames.length > 0 && (
        <div className="admin-class-warning">
          <AlertCircle />
          <span>{failedBoxNames.join(', ')} 박스의 수업 정보를 불러오지 못했습니다.</span>
        </div>
      )}

      {loading ? (
        <div className="ds-card ds-empty">
          <div className="ds-spinner" />
          <span className="ds-empty__desc">박스별 수업 등록 현황을 불러오는 중...</span>
        </div>
      ) : error ? (
        <div className="ds-card ds-empty">
          <AlertCircle className="ds-empty__icon" />
          <strong className="ds-empty__title">조회 실패</strong>
          <span className="ds-empty__desc">{error}</span>
          <button className="ds-btn ds-btn--primary ds-btn--sm" type="button" onClick={() => void loadDailyStatus(fromDateInputValue(selectedDate))}>
            다시 시도
          </button>
        </div>
      ) : (
        <>
          {(registrationFilter === 'all' || registrationFilter === 'registered') && (
            <section className="admin-class-section">
              <div className="admin-class-section__title">
                <div>
                  <h2>수업 등록 박스</h2>
                  <p>박스를 펼치면 시간대별 예약 현황을 확인할 수 있습니다.</p>
                </div>
                <span className="ds-badge ds-badge--success">{registeredBoxes.length}개</span>
              </div>
              {registeredBoxes.length > 0 ? (
                <div className="admin-class-box-list">
                  {registeredBoxes.map((box) => <BoxClassCard key={box.boxName} box={box} />)}
                </div>
              ) : (
                <div className="ds-card ds-empty">
                  <Clock3 className="ds-empty__icon" />
                  <span className="ds-empty__desc">등록된 수업이 없습니다.</span>
                </div>
              )}
            </section>
          )}

          {(registrationFilter === 'all' || registrationFilter === 'unregistered') && (
            <section className="admin-class-section">
              <div className="admin-class-section__title">
                <div>
                  <h2>수업 미등록 박스</h2>
                  <p>선택한 날짜에 수업이 등록되지 않은 박스입니다.</p>
                </div>
                <span className="ds-badge ds-badge--warning">{unregisteredBoxes.length}개</span>
              </div>
              <div className="ds-card ds-card--pad admin-class-unregistered">
                {unregisteredBoxes.length > 0
                  ? unregisteredBoxes.map((box) => (
                    <span key={box.boxName} className="admin-class-unregistered__item">
                      <Building2 /> {box.boxName}
                    </span>
                  ))
                  : <span className="ds-empty__desc">미등록 박스가 없습니다.</span>
                }
              </div>
            </section>
          )}
        </>
      )}

      <style>{`
        .admin-class-toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); }
        .admin-class-date-nav { display: flex; align-items: center; gap: var(--space-2); }
        .admin-class-date-input { height: 34px; display: flex; align-items: center; gap: 7px; padding: 0 11px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface); color: var(--text-muted); }
        .admin-class-date-input svg { width: 16px; height: 16px; }
        .admin-class-date-input input { border: 0; outline: 0; color: var(--text); background: transparent; font: inherit; font-size: 13px; }
        .admin-class-display-date { margin-left: var(--space-2); color: var(--text-strong); font-size: 15px; }
        .admin-class-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
        .admin-class-filter-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
        .admin-class-search { flex: 1; max-width: 420px; height: 40px; display: flex; align-items: center; gap: 9px; padding: 0 13px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface); }
        .admin-class-search svg { width: 17px; height: 17px; color: var(--text-subtle); }
        .admin-class-search input { width: 100%; border: 0; outline: 0; background: transparent; color: var(--text); font: inherit; font-size: 14px; }
        .admin-class-filter-buttons { display: flex; gap: var(--space-2); }
        .admin-class-warning { display: flex; align-items: center; gap: var(--space-2); padding: 12px 14px; border: 1px solid #fde3b0; border-radius: var(--radius-md); background: var(--warning-bg); color: #9a6700; font-size: 13px; }
        .admin-class-warning svg { width: 17px; height: 17px; flex-shrink: 0; }
        .admin-class-section { display: flex; flex-direction: column; gap: var(--space-3); }
        .admin-class-section__title { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-3); }
        .admin-class-section__title h2 { margin: 0; color: var(--text-strong); font-size: 16px; }
        .admin-class-section__title p { margin: 4px 0 0; color: var(--text-muted); font-size: 13px; }
        .admin-class-box-list { display: flex; flex-direction: column; gap: var(--space-3); }
        .admin-class-box { overflow: hidden; }
        .admin-class-box__summary { min-height: 72px; padding: 0 var(--space-5); display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); cursor: pointer; list-style: none; }
        .admin-class-box__summary::-webkit-details-marker { display: none; }
        .admin-class-box__summary:hover { background: var(--surface-muted); }
        .admin-class-box__identity { display: flex; align-items: center; gap: var(--space-3); }
        .admin-class-box__icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); background: var(--color-primary-bg); color: var(--color-primary); }
        .admin-class-box__icon svg { width: 18px; height: 18px; }
        .admin-class-box__identity div { display: flex; flex-direction: column; gap: 3px; }
        .admin-class-box__identity strong { color: var(--text-strong); font-size: 15px; }
        .admin-class-box__identity span { color: var(--text-subtle); font-size: 12px; }
        .admin-class-box__summary-right { display: flex; align-items: center; gap: var(--space-2); }
        .admin-class-box__occupancy { min-width: 38px; color: var(--text); font-size: 13px; font-weight: 700; text-align: right; }
        .admin-class-box__chevron { width: 17px; height: 17px; color: var(--text-subtle); transition: transform var(--dur) var(--ease); }
        .admin-class-box[open] .admin-class-box__chevron { transform: rotate(180deg); }
        .admin-class-box__body { border-top: 1px solid var(--border); overflow-x: auto; }
        .admin-class-time { display: inline-flex; padding: 5px 9px; border-radius: var(--radius-sm); background: var(--color-primary-bg); color: var(--color-primary); font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
        .admin-class-rate { min-width: 150px; display: flex; align-items: center; gap: var(--space-2); }
        .admin-class-rate span { width: 34px; color: var(--text-muted); font-size: 12px; text-align: right; }
        .admin-class-unregistered { display: flex; flex-wrap: wrap; gap: var(--space-2); }
        .admin-class-unregistered__item { display: inline-flex; align-items: center; gap: 6px; padding: 8px 11px; border-radius: var(--radius-sm); background: var(--surface-muted); color: var(--text-muted); font-size: 13px; font-weight: 600; }
        .admin-class-unregistered__item svg { width: 15px; height: 15px; }
        @media (max-width: 1100px) {
          .admin-class-stats { grid-template-columns: repeat(2, 1fr); }
          .admin-class-toolbar, .admin-class-filter-row { align-items: flex-start; flex-direction: column; }
          .admin-class-search { width: 100%; max-width: none; }
        }
      `}</style>
    </div>
  );
};

export default AdminClassStatus;
