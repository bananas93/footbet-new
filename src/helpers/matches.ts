import { IGames } from 'interfaces';
import { translate } from 'i18n';

export const normalizeKnockoutRoundName = (knockoutRounds: number, thirdPlaceMatch: boolean) => {
  let knockoutRoundNames = [
    translate('helpers.matches.round16'),
    translate('helpers.matches.round8'),
    translate('helpers.matches.round4'),
    translate('helpers.matches.round2'),
    translate('helpers.matches.final'),
  ];
  if (thirdPlaceMatch) {
    knockoutRoundNames = [
      translate('helpers.matches.round16alt'),
      translate('helpers.matches.round8'),
      translate('helpers.matches.round4'),
      translate('helpers.matches.round2'),
      translate('helpers.matches.thirdPlace'),
      translate('helpers.matches.final'),
    ];
  }
  return knockoutRoundNames.slice(-knockoutRounds);
};

export const sliceMatches = (matches: IGames[], groupMatchNumber: number) => {
  const groupMatches = matches.slice(0, groupMatchNumber);
  const knockoutMatches = matches.slice(groupMatchNumber);
  return { groupMatches, knockoutMatches };
};

export const getLeagueLabel = (leagueIndex?: number) => {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  if (!leagueIndex || leagueIndex < 1) {
    return 'A';
  }

  return labels[leagueIndex - 1] || String(leagueIndex);
};

export const playNotification = () => {
  const audio = new Audio('/notification.mp3');
  audio.play();
};
