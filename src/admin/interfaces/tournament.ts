export interface ITournament {
  id: number;
  name: string;
  groupNumber: number;
  groupMatchNumber: number;
  leagues: number;
  knockoutRound: number;
  directNextRound: number;
  playoffRound: number;
  type: TournamentType;
  status: TournamentStatus;
  thirdPlaceMatch: boolean;
  hasTable: boolean;
  isNationsLeague: boolean;
  logo: string;
  createdAt: string;
  updatedAt: string;
}

export type TournamentStatus = 'scheduled' | 'live' | 'completed';

export type TournamentType = 'club' | 'national';
