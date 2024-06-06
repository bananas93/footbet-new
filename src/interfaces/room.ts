export interface IParticipant {
  id: string;
  name: string;
}

export interface IRoom {
  id: string;
  name: string;
  type: 'public' | 'private';
  password?: string;
  inviteUrl?: string;
  participants: IParticipant[];
  creator: IParticipant;
  createdAt: string;
  updatedAt: string;
}
