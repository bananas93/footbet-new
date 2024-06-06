import { IGames } from 'interfaces';

export const normalizeKnockoutRoundName = (knockoutRounds: number, thirdPlaceMatch: boolean) => {
  let knockoutRoundNames = ['/16 фіналу', '1/8 фіналу', '1/4 фіналу', '1/2 фіналу', 'Фінал'];
  if (thirdPlaceMatch) {
    knockoutRoundNames = ['1/16 фіналу', '1/8 фіналу', '1/4 фіналу', '1/2 фіналу', 'Матч за 3-тє місце', 'Фінал'];
  }
  return knockoutRoundNames.slice(-knockoutRounds);
};

export const sliceMatches = (matches: IGames[], groupMatchNumber: number) => {
  const groupMatches = matches.slice(0, groupMatchNumber);
  const knockoutMatches = matches.slice(groupMatchNumber);
  return { groupMatches, knockoutMatches };
};
