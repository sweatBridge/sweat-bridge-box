import { AdminBoxRepository, ClassRepository } from '../../repositories';
import { AdminClassService } from '../../services/adminClassService';

jest.mock('../../repositories', () => ({
  AdminBoxRepository: {
    listAllBoxes: jest.fn(),
  },
  ClassRepository: {
    getClassesInRange: jest.fn(),
  },
}));

describe('AdminClassService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('박스별 수업과 예약 현황을 집계한다', async () => {
    (AdminBoxRepository.listAllBoxes as jest.Mock).mockResolvedValue([
      {
        boxName: 'ALPHA', email: '', representative: '', phone: '',
        address: { zoneCode: '', roadAddress: '', detailAddress: '' },
        description: '', coaches: [], status: 'active',
      },
      {
        boxName: 'BETA', email: '', representative: '', phone: '',
        address: { zoneCode: '', roadAddress: '', detailAddress: '' },
        description: '', coaches: [], status: 'active',
      },
    ]);
    (ClassRepository.getClassesInRange as jest.Mock).mockImplementation((boxName: string) => {
      if (boxName === 'BETA') return Promise.resolve([]);
      return Promise.resolve([
        {
          docKey: '2026062710001100',
          data: { coach: '김코치', cap: 12, reserved: ['a', 'b'] },
        },
        {
          docKey: '2026062709001000',
          data: { coach: '박코치', cap: 10, reserved: ['c'] },
        },
      ]);
    });

    const result = await AdminClassService.getDailyStatus(new Date('2026-06-27T12:00:00+09:00'));

    expect(result.failedBoxNames).toEqual([]);
    expect(result.boxes[0]).toEqual(expect.objectContaining({
      boxName: 'ALPHA',
      totalCapacity: 22,
      reservedCount: 3,
      classes: [
        expect.objectContaining({ startTime: '09:00', endTime: '10:00' }),
        expect.objectContaining({ startTime: '10:00', endTime: '11:00' }),
      ],
    }));
    expect(result.boxes[1]).toEqual(expect.objectContaining({ boxName: 'BETA', classes: [] }));
  });

  it('개별 박스 조회 실패를 분리하고 나머지 결과를 반환한다', async () => {
    (AdminBoxRepository.listAllBoxes as jest.Mock).mockResolvedValue([
      {
        boxName: 'FAILED', email: '', representative: '', phone: '',
        address: { zoneCode: '', roadAddress: '', detailAddress: '' },
        description: '', coaches: [],
      },
    ]);
    (ClassRepository.getClassesInRange as jest.Mock).mockRejectedValue(new Error('network'));

    const result = await AdminClassService.getDailyStatus(new Date('2026-06-27T12:00:00+09:00'));

    expect(result.failedBoxNames).toEqual(['FAILED']);
    expect(result.boxes[0]).toEqual(expect.objectContaining({ boxName: 'FAILED', classes: [] }));
  });
});
