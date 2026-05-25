import { useEffect, useState } from 'react';
import { BoxService } from '../services/boxService';
import { getCachedCoachNames } from '../utils/coachStorage';

export const useCoachOptions = (enabled: boolean = true) => {
  const [coachOptions, setCoachOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const boxName = localStorage.getItem('boxName') || 'SWEAT';
    const cachedCoachNames = getCachedCoachNames(boxName);

    if (cachedCoachNames.length > 0) {
      setCoachOptions(cachedCoachNames);
      return;
    }

    let cancelled = false;

    const loadCoachOptions = async () => {
      try {
        const coaches = await BoxService.getCoaches(boxName);
        if (!cancelled) {
          setCoachOptions(
            coaches
              .map((coach) => coach.name.trim())
              .filter((name, index, arr) => Boolean(name) && arr.indexOf(name) === index)
          );
        }
      } catch (error) {
        console.error('Failed to load coach options:', error);
        if (!cancelled) {
          setCoachOptions([]);
        }
      }
    };

    loadCoachOptions();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return coachOptions;
};
