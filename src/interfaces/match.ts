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

export enum MatchGroupTour {
  FIRST = '1 tour',
  SECOND = '2 tour',
  THIRD = '3 tour',
  FOURTH = '4 tour',
  FIFTH = '5 tour',
  SIXTH = '6 tour',
  SEVENTH = '7 tour',
  EIGHTH = '8 tour',
  NINTH = '9 tour',
  TENTH = '10 tour',
  ELEVENTH = '11 tour',
  TWELFTH = '12 tour',
}

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

export enum MatchGroupName {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H',
}

export interface IGames {
  id: number;
  data: IMatch[];
  stage: string;
}

export interface IMatch {
  id: number;
  stage: MatchStage;
  groupTour: MatchGroupTour;
  status: MatchStatus;
  result: MatchResult;
  groupName: MatchGroupName;
  homeScore: number;
  awayScore: number;
  matchDate: Date;
  tournamentId: number;
  homeTeamId: number;
  awayTeamId: number;
  createdAt: Date;
  updatedAt: Date;
  homeTeam: ITeam;
  awayTeam: ITeam;
  predict: IPredict;
}
