import { TournamentStatus } from '../interfaces/tournament';

export const getTournamentStatus = (status: TournamentStatus) => {
  switch (status) {
    case 'scheduled':
      return 'Запланований';
    case 'live':
      return 'В прогресі';
    case 'completed':
      return 'Завершений';
    default:
      return '';
  }
};

export const getTournamentType = (type: string) => {
  switch (type) {
    case 'club':
      return 'Клубний';
    case 'national':
      return 'Збірні';
    default:
      return '';
  }
};
