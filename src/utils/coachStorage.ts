import { Coach } from '../types/box';

const getCoachStorageKey = (boxName: string) => `box:${boxName}:coaches`;
const getCoachFetchedFlagKey = (boxName: string) => `box:${boxName}:coachesFetched`;

const isStorageAvailable = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getCachedCoaches = (boxName: string): Coach[] | null => {
  if (!isStorageAvailable()) return null;

  const raw = localStorage.getItem(getCoachStorageKey(boxName));
  if (raw === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse cached coaches:', error);
    return null;
  }
};

export const setCachedCoaches = (boxName: string, coaches: Coach[]): void => {
  if (!isStorageAvailable()) return;

  localStorage.setItem(getCoachStorageKey(boxName), JSON.stringify(coaches));
  localStorage.setItem(getCoachFetchedFlagKey(boxName), 'true');
};

export const hasFetchedCoachList = (boxName: string): boolean => {
  if (!isStorageAvailable()) return false;
  return localStorage.getItem(getCoachFetchedFlagKey(boxName)) === 'true';
};

export const clearCachedCoaches = (boxName: string): void => {
  if (!isStorageAvailable()) return;

  localStorage.removeItem(getCoachStorageKey(boxName));
  localStorage.removeItem(getCoachFetchedFlagKey(boxName));
};

export const getCachedCoachNames = (boxName: string): string[] => {
  const coaches = getCachedCoaches(boxName);
  if (!coaches) return [];

  return coaches
    .map((coach) => coach?.name?.trim() ?? '')
    .filter((name, index, arr) => Boolean(name) && arr.indexOf(name) === index);
};
