import { useEffect, useState } from 'react';
import { IMatch } from 'interfaces';

export const useMatchMinute = (match: IMatch) => {
  const [matchMinute, setMatchMinute] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const startTime = new Date(match.matchDate);
      const currentTime = new Date();
      const elapsedMilliseconds = currentTime.getTime() - startTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMilliseconds / 60000);
      const halfTime = 45;
      const extraTime = 15;
      let adjustedMatchMinute = elapsedMinutes;

      if (elapsedMinutes >= halfTime) {
        adjustedMatchMinute += extraTime;
      }

      setMatchMinute(adjustedMatchMinute);
    }, 1000);

    return () => clearInterval(interval);
  }, [match]);

  return matchMinute;
};
