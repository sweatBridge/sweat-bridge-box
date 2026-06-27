import { serverRead, serverWrite } from '../../data/apiClient';
import { AdminUserRepository } from '../../repositories/adminUserRepository';
import { HybridAdminUserRepository } from '../../repositories/hybrid/hybridAdminUserRepository';
import { ServerUserRepository } from '../../repositories/server/serverUserRepository';

jest.mock('../../data/apiClient', () => ({
  serverRead: jest.fn(),
  serverWrite: jest.fn(),
}));
jest.mock('../../repositories/adminUserRepository');
jest.mock('../../repositories/server/serverUserRepository');

const mockedServerRead = serverRead as jest.MockedFunction<typeof serverRead>;
const mockedServerWrite = serverWrite as jest.MockedFunction<typeof serverWrite>;

describe('HybridAdminUserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('서버 사용자 응답을 어드민 목록 형식으로 변환한다', async () => {
    (ServerUserRepository.listUsers as jest.Mock).mockResolvedValue([
      {
        email: 'member@example.com',
        real_name: '홍길동',
        nick_name: '길동',
        phone: '01012341234',
        gender: 'M',
        birth: '1990-01-01',
        box_name: 'SWEAT',
        role: 'MEMBER',
        status: 'APPROVED',
        created_at: '2026-04-10T01:00:00Z',
      },
    ]);
    mockedServerRead.mockImplementation(async (fetcher) => fetcher());

    const users = await HybridAdminUserRepository.listAllUsers();

    expect(users).toEqual([
      {
        uid: 'member@example.com',
        email: 'member@example.com',
        realName: '홍길동',
        nickName: '길동',
        phone: '01012341234',
        role: 'member',
        boxName: 'SWEAT',
        status: 'APPROVED',
        createdAt: '2026-04-10',
      },
    ]);
    expect(AdminUserRepository.listAllUsers).not.toHaveBeenCalled();
  });

  it('서버 조회 결과가 없으면 Firestore 목록으로 fallback한다', async () => {
    const firebaseUsers = [{ email: 'fallback@example.com' }];
    mockedServerRead.mockResolvedValue(null);
    (AdminUserRepository.listAllUsers as jest.Mock).mockResolvedValue(firebaseUsers);

    const users = await HybridAdminUserRepository.listAllUsers();

    expect(users).toBe(firebaseUsers);
    expect(AdminUserRepository.listAllUsers).toHaveBeenCalledTimes(1);
  });

  it('역할 변경은 Firestore 저장 후 서버 동기화를 요청한다', async () => {
    (AdminUserRepository.updateUserRole as jest.Mock).mockResolvedValue(undefined);
    mockedServerWrite.mockImplementation((writer) => { void writer(); });
    (ServerUserRepository.updateUser as jest.Mock).mockResolvedValue({});

    await HybridAdminUserRepository.updateUserRole('operator@example.com', 'admin');

    expect(AdminUserRepository.updateUserRole).toHaveBeenCalledWith('operator@example.com', 'admin');
    expect(ServerUserRepository.updateUser).toHaveBeenCalledWith(
      'operator@example.com',
      { role: 'admin' }
    );
  });
});
