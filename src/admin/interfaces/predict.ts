import { IMatch } from './match';

export interface IPredict {
  id: number;
  match: IMatch;
  user: {
    id: string;
    name: string;
  };
  homeScore: number;
  awayScore: number;
  points: number;
  correctScore: number;
  correctDifference: number;
  fivePlusGoals: number;
  correctResult: number;
}
