export interface IUser {
  id: number;
  email: string;
  phone?: string;
  name: string;
  nickname?: string;
  avatar?: string;
  role: string;
}

export interface IStatistics {
  total: number;
  totalPoints: number;
  correctScore: number;
  correctDifference: number;
  fivePlusGoals: number;
  correctResult: number;
  correctScorePercentage: number;
  correctResultPercentage: number;
  correctScorePerRow: number;
  correctResultPerRow: number;
  longestLosingStreak: number;
  mostCommonCorrectScore: string;
  correctHomePredictions: number;
  correctAwayPredictions: number;
  mostCommonPrediction: 'home' | 'away' | 'draw';
  topFiveFavoriteTeams: Array<{ team: string; points: number }>;
  mostPopularPredictedScore: string;
}
