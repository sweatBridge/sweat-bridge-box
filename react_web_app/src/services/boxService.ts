import { BoxRepository } from '../repositories/boxRepository';
import { BoxInfo } from '../types/box';

export class BoxService {
  /**
   * 박스 정보를 조회합니다.
   *
   * @param boxName 박스 이름
   * @returns 박스 정보 또는 `null`
   * @throws 조회 중 오류가 발생하면 에러를 던집니다.
   */
  static async getBoxInfo(boxName: string): Promise<BoxInfo | null> {
    try {
      return BoxRepository.getBoxInfo(boxName);
    } catch (error) {
      console.error('Error getting box info:', error);
      throw new Error('박스 정보를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 박스 정보를 저장합니다.
   *
   * @param boxInfo 저장할 박스 정보
   * @throws 저장 중 오류가 발생하면 에러를 던집니다.
   */
  static async updateBoxInfo(boxInfo: BoxInfo): Promise<void> {
    try {
      await BoxRepository.saveBoxInfo(boxInfo);
    } catch (error) {
      console.error('Error updating box info:', error);
      throw new Error('박스 정보 수정에 실패했습니다.');
    }
  }
}
