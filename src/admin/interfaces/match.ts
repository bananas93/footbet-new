import { ITeam } from './team';
import { ITournament } from './tournament';

export interface IMatch {
  id: number;
  apiFixtureId?: number;
  stage: MatchStage;
  groupTour: string;
  tournamentLeague: number;
  status: MatchStatus;
  result: MatchResult | null;
  groupName: string;
  tournament: ITournament;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  homeTeam: ITeam;
  awayTeam: ITeam;
}

export type MatchStage =
  | 'Group Stage'
  | 'Knockout Playoff'
  | 'Round of 16'
  | 'Quarterfinals'
  | 'Semifinals'
  | 'Final'
  | 'Third Place Playoff';

export enum MatchStageEnum {
  GROUP_STAGE = 'Group Stage',
  KNOCKOUT_PLAYOFF = 'Knockout Playoff',
  ROUND_OF_16 = 'Round of 16',
  QUARTERFINALS = 'Quarterfinals',
  SEMIFINALS = 'Semifinals',
  FINAL = 'Final',
  THIRD_PLACE_PLAYOFF = 'Third Place Playoff',
}

export type MatchGroupTour = `${number} tour`;

export const MAX_GROUP_TOUR = 50;

export const GROUP_TOUR_OPTIONS: MatchGroupTour[] = Array.from(
  { length: MAX_GROUP_TOUR },
  (_, index) => `${index + 1} tour` as MatchGroupTour,
);

export type MatchType = 'club' | 'national';
export type MatchStatus = 'Scheduled' | 'Live' | 'Finished';
export type MatchResult = 'Home Win' | 'Away Win' | 'Draw';
