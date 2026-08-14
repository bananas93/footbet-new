export interface IPredict {
  id: number;
  homeScore: number;
  awayScore: number;
  points: number;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}
