export type TournamentStatus = 'scheduled' | 'live' | 'completed';

export type TournamentType = 'club' | 'national';

export interface ITournament {
  id: number;
  name: string;
  groupNumber: number;
  groupMatchNumber: number;
  knockoutRound: number;
  thirdPlaceMatch: boolean;
  status: TournamentStatus;
  logo?: string;
  type: TournamentType;
  createdAt: string;
  updatedAt: string;
}

export interface IStandingsItem {
  id: string;
  team: string;
  logo: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  goalsScored: number;
  goalsAgainst: number;
  points: number;
}

export interface IStandings {
  [key: string]: IStandingsItem[];
}
