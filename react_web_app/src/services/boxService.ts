import { BoxRepository } from '../repositories/boxRepository';
import { BoxInfo, Coach } from '../types/box';
import { getCachedCoaches, hasFetchedCoachList, setCachedCoaches } from '../utils/coachStorage';

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
      const boxInfo = await BoxRepository.getBoxInfo(boxName);

      if (boxInfo) {
        setCachedCoaches(boxName, boxInfo.coaches || []);
      }

      return boxInfo;
    } catch (error) {
      console.error('Error getting box info:', error);
      throw new Error('박스 정보를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 코치 목록을 조회합니다.
   *
   * localStorage 캐시를 우선 사용하고, 캐시가 없을 때만 Firebase를 조회합니다.
   * 코치가 0명이어도 조회 완료 플래그를 저장해 반복 조회를 방지합니다.
   *
   * @param boxName 박스 이름
   * @returns 코치 목록
   */
  static async getCoaches(boxName: string): Promise<Coach[]> {
    const cachedCoaches = getCachedCoaches(boxName);
    if (cachedCoaches !== null) {
      return cachedCoaches;
    }

    if (hasFetchedCoachList(boxName)) {
      return [];
    }

    const boxInfo = await this.getBoxInfo(boxName);
    const coaches = boxInfo?.coaches || [];
    setCachedCoaches(boxName, coaches);
    return coaches;
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
      setCachedCoaches(boxInfo.boxName, boxInfo.coaches || []);
    } catch (error) {
      console.error('Error updating box info:', error);
      throw new Error('박스 정보 수정에 실패했습니다.');
    }
  }
}
