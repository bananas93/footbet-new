export interface IPredict {
  id: number;
  matchId: number;
  tournamentId: number;
  userId: number;
  homeScore: number;
  awayScore: number;
  points: number;
  correctScore: number;
  correctDifference: number;
  fivePlusGoals: number;
  correctResult: number;
  createdAt: Date;
  updatedAt: Date;
}
