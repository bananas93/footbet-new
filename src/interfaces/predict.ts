export interface IPredict {
  id: number;
  homeScore: number;
  awayScore: number;
  points: number;
  user: {
    id: number;
    name: string;
  };
}
