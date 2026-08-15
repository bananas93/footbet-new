import { IPredict } from './predict';
import { ITeam } from './team';

export enum MatchStage {
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

export enum MatchResult {
  HOME_WIN = 'Home Win',
  AWAY_WIN = 'Away Win',
  DRAW = 'Draw',
}

export enum MatchStatus {
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'Live',
  FINISHED = 'Finished',
  POSTPONED = 'Postponed',
}

export interface IGames {
  id: number;
  data: IMatch[];
  stage: string;
  startDate: string;
  endDate: string;
}

export interface IMatch {
  id: number;
  apiFixtureId?: number;
  stage: MatchStage;
  groupTour: MatchGroupTour;
  tournamentLeague: number;
  status: MatchStatus;
  result: MatchResult;
  groupName: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  tournamentId: number;
  homeTeamId: number;
  awayTeamId: number;
  createdAt: string;
  updatedAt: string;
  homeTeam: ITeam;
  awayTeam: ITeam;
  predict: IPredict;
}
