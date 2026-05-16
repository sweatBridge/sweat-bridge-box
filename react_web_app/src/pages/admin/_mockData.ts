import { BoxInfo } from '../../types/box';
import { UserRole, BoxStatus } from '../../types/auth';

export interface AdminUserSummary {
  uid: string;
  email: string;
  realName: string;
  nickName: string;
  phone: string;
  role: UserRole;
  boxName: string;
  status?: BoxStatus;
  createdAt: string;
}

export const MOCK_USERS: AdminUserSummary[] = [
  {
    uid: 'uid-001',
    email: 'minjun@sweat.kr',
    realName: '김민준',
    nickName: 'MJ',
    phone: '010-1234-5678',
    role: 'operator',
    boxName: 'SWEAT_GANGNAM',
    status: 'APPROVED',
    createdAt: '2024-03-01',
  },
  {
    uid: 'uid-002',
    email: 'jihyeon@iron.co',
    realName: '박지현',
    nickName: 'Jihyeon',
    phone: '010-9876-5432',
    role: 'coach',
    boxName: 'IRON_SEOUL',
    status: 'APPROVED',
    createdAt: '2024-05-15',
  },
  {
    uid: 'uid-003',
    email: 'coach2@iron.co',
    realName: '이서윤',
    nickName: 'Seoyun',
    phone: '010-5555-4444',
    role: 'coach',
    boxName: 'IRON_SEOUL',
    status: 'APPROVED',
    createdAt: '2024-05-20',
  },
  {
    uid: 'uid-004',
    email: 'doyun@flowfit.kr',
    realName: '최도윤',
    nickName: 'Doyun',
    phone: '010-2233-4455',
    role: 'operator',
    boxName: 'FLOW_SINCHON',
    status: 'APPROVED',
    createdAt: '2024-07-10',
  },
  {
    uid: 'uid-005',
    email: 'yerin@peakbox.kr',
    realName: '정예린',
    nickName: 'Yerin',
    phone: '010-7766-8899',
    role: 'operator',
    boxName: 'PEAK_SEOCHO',
    status: 'APPROVED',
    createdAt: '2024-09-20',
  },
  {
    uid: 'uid-006',
    email: 'coach2@peakbox.kr',
    realName: '김태양',
    nickName: 'Taeyang',
    phone: '010-3344-5566',
    role: 'coach',
    boxName: 'PEAK_SEOCHO',
    status: 'APPROVED',
    createdAt: '2024-10-01',
  },
  {
    uid: 'uid-007',
    email: 'coach3@peakbox.kr',
    realName: '오지훈',
    nickName: 'Jihun',
    phone: '010-6677-8899',
    role: 'coach',
    boxName: 'PEAK_SEOCHO',
    status: 'PENDING',
    createdAt: '2025-01-10',
  },
  {
    uid: 'uid-008',
    email: 'seungwoo@edgefit.kr',
    realName: '한승우',
    nickName: 'SW',
    phone: '010-1122-3344',
    role: 'operator',
    boxName: 'EDGE_YONGSAN',
    status: 'APPROVED',
    createdAt: '2025-01-05',
  },
  {
    uid: 'uid-009',
    email: 'superadmin@sweatbridge.io',
    realName: '관리자',
    nickName: 'admin',
    phone: '010-0000-0001',
    role: 'admin',
    boxName: '',
    status: 'APPROVED',
    createdAt: '2024-01-01',
  },
  {
    uid: 'uid-010',
    email: 'newcoach@iron.co',
    realName: '유재현',
    nickName: 'Jaehyun',
    phone: '010-8899-1122',
    role: 'coach',
    boxName: 'IRON_SEOUL',
    status: 'PENDING',
    createdAt: '2025-04-20',
  },
];

export interface AdminBoxSummary extends BoxInfo {
  memberCount: number;
}

export const MOCK_BOXES: AdminBoxSummary[] = [
  {
    boxName: 'SWEAT_GANGNAM',
    email: 'gangnam@sweat.kr',
    representative: '김민준',
    phone: '010-1234-5678',
    address: { zoneCode: '06123', roadAddress: '서울시 강남구 테헤란로 152', detailAddress: '2층' },
    description: '강남 대표 크로스핏 박스',
    coaches: [{ name: '김민준', phone: '010-1234-5678', email: 'gangnam@sweat.kr' }],
    status: 'active',
    createdAt: '2024-03-01',
    onboardedAt: '2024-03-01',
    memberCount: 87,
  },
  {
    boxName: 'IRON_SEOUL',
    email: 'ironseoul@iron.co',
    representative: '박지현',
    phone: '010-9876-5432',
    address: { zoneCode: '04012', roadAddress: '서울시 마포구 홍익로 15', detailAddress: '지하 1층' },
    description: '홍대 아이언 박스',
    coaches: [
      { name: '박지현', phone: '010-9876-5432', email: 'ironseoul@iron.co' },
      { name: '이서윤', phone: '010-5555-4444', email: 'coach2@iron.co' },
    ],
    status: 'active',
    createdAt: '2024-05-15',
    onboardedAt: '2024-05-15',
    memberCount: 62,
  },
  {
    boxName: 'FLOW_SINCHON',
    email: 'flow@flowfit.kr',
    representative: '최도윤',
    phone: '010-2233-4455',
    address: { zoneCode: '03722', roadAddress: '서울시 서대문구 신촌로 55', detailAddress: '3층' },
    description: '신촌 플로우 피트니스',
    coaches: [{ name: '최도윤', phone: '010-2233-4455', email: 'flow@flowfit.kr' }],
    status: 'suspended',
    createdAt: '2024-07-10',
    onboardedAt: '2024-07-10',
    memberCount: 31,
  },
  {
    boxName: 'PEAK_SEOCHO',
    email: 'peak@peakbox.kr',
    representative: '정예린',
    phone: '010-7766-8899',
    address: { zoneCode: '06590', roadAddress: '서울시 서초구 반포대로 101', detailAddress: '5층' },
    description: '서초 피크 크로스핏',
    coaches: [
      { name: '정예린', phone: '010-7766-8899', email: 'peak@peakbox.kr' },
      { name: '김태양', phone: '010-3344-5566', email: 'coach2@peakbox.kr' },
      { name: '오지훈', phone: '010-6677-8899', email: 'coach3@peakbox.kr' },
    ],
    status: 'active',
    createdAt: '2024-09-20',
    onboardedAt: '2024-09-20',
    memberCount: 114,
  },
  {
    boxName: 'EDGE_YONGSAN',
    email: 'edge@edgefit.kr',
    representative: '한승우',
    phone: '010-1122-3344',
    address: { zoneCode: '04376', roadAddress: '서울시 용산구 이태원로 78', detailAddress: '2층' },
    description: '이태원 엣지 박스',
    coaches: [{ name: '한승우', phone: '010-1122-3344', email: 'edge@edgefit.kr' }],
    status: 'active',
    createdAt: '2025-01-05',
    onboardedAt: '2025-01-05',
    memberCount: 45,
  },
];
