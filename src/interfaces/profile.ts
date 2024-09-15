export interface IProfile {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    role: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
  };
  predictions: {
    id: number;
    correctDifference: number;
    correctResult: number;
    correctScore: number;
    fivePlusGoals: number;
    homeScore: number;
    points: number;
  }[];
}
