import { ITeam } from '../interfaces/team';
import { ITournament } from '../interfaces/tournament';
import { IUser } from '../interfaces/user';
import { IMatch } from '../interfaces/match';
import { IPredict } from '../interfaces/predict';

export interface IAdminRoom {
  id: number;
  name: string;
  type: 'public' | 'private';
  inviteCode: string;
  members: number;
  creator: string;
}

export interface ITournamentOption {
  id: number;
  name: string;
  type: ITournament['type'];
  leagues: number;
  isNationsLeague: boolean;
}

export const mapTeamFromDb = (team: any): ITeam => ({
  id: team.id,
  apiTeamId: team.api_team_id || undefined,
  name: team.name,
  type: team.type,
  rank: team.rank,
  logo: team.logo,
  createdAt: team.created_at,
  updatedAt: team.updated_at,
});

export const mapTournamentFromDb = (tournament: any): ITournament => ({
  id: tournament.id,
  name: tournament.name,
  groupNumber: tournament.group_number,
  groupMatchNumber: tournament.group_match_number,
  leagues: tournament.leagues,
  knockoutRound: tournament.knockout_round,
  directNextRound: tournament.direct_next_round,
  playoffRound: tournament.playoff_round,
  championsSlots: Number(tournament.champions_slots || tournament.direct_next_round || 0),
  europaSlots: Number(tournament.europa_slots || tournament.playoff_round || 0),
  relegationSlots: Number(tournament.relegation_slots || 0),
  type: tournament.type,
  status: tournament.status,
  thirdPlaceMatch: tournament.third_place_match,
  hasTable: tournament.has_table,
  isNationsLeague: !!tournament.is_nations_league,
  logo: tournament.logo,
  createdAt: tournament.created_at,
  updatedAt: tournament.updated_at,
});

export const mapTournamentOptionFromDb = (tournament: any): ITournamentOption => ({
  id: tournament.id,
  name: tournament.name,
  type: tournament.type,
  leagues: tournament.leagues,
  isNationsLeague: !!tournament.is_nations_league,
});

export const mapUserFromDb = (user: any): IUser => ({
  id: user.id,
  name: user.name,
  nickname: user.nickname || '',
  role: user.role,
  email: user.email || '',
  phone: user.phone || '',
  googleId: '',
  createdAt: user.created_at,
});

export const mapMatchFromDb = (match: any): IMatch => ({
  id: match.id,
  apiFixtureId: match.api_fixture_id || undefined,
  stage: match.stage,
  groupTour: match.group_tour,
  tournamentLeague: Number(match.tournament_league || 1),
  status: match.status,
  result: match.result,
  groupName: match.group_name,
  homeScore: match.home_score,
  awayScore: match.away_score,
  matchDate: match.match_date,
  tournament: match.tournament,
  homeTeam: match.homeTeam,
  awayTeam: match.awayTeam,
});

export const mapPredictFromDb = (predict: any): IPredict => ({
  id: predict.id,
  homeScore: predict.home_score,
  awayScore: predict.away_score,
  points: predict.points,
  correctScore: predict.correct_score,
  correctDifference: predict.correct_difference,
  fivePlusGoals: predict.five_plus_goals,
  correctResult: predict.correct_result,
  user: {
    id: predict.user?.id,
    name: predict.user?.name || 'Unknown user',
  },
  match: mapMatchFromDb(predict.match || {}),
});

export const mapRoomFromDb = (room: any): IAdminRoom => ({
  id: room.id,
  name: room.name,
  type: room.type,
  inviteCode: room.invite_code,
  members: room.room_members?.length || 0,
  creator: room.creator?.name || 'Unknown',
});
