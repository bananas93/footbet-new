export enum TeamType {
  CLUB = 'club',
  NATIONAL = 'national',
}

export interface ITeam {
  id: number;
  name: string;
  type: TeamType;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}
