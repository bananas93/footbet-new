export interface IParticipant {
  id: string;
  name: string;
}

export interface IRoom {
  id: number;
  name: string;
  type: 'public' | 'private';
  inviteCode?: string;
  participants: IParticipant[];
  creator: IParticipant;
  createdAt: string;
  updatedAt: string;
}
