export interface ITeam {
  id: number;
  apiTeamId?: number;
  name: string;
  type: TeamType;
  rank: number;
  logo: string;
  createdAt: string;
  updatedAt: string;
}

export type TeamType = 'club' | 'national';
