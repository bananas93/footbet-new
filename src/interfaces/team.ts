export enum TeamType {
  CLUB = 'club',
  NATIONAL = 'national',
}

export interface ITeam {
  id: number;
  apiTeamId?: number;
  name: string;
  type: TeamType;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}
