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

export type MatchType = 'club' | 'national';
export type MatchStatus = 'Scheduled' | 'Live' | 'Finished';
export type MatchResult = 'Home Win' | 'Away Win' | 'Draw';
