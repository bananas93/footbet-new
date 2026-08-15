export const getTeamType = (type: string) => {
  switch (type) {
    case 'club':
      return 'Клуб';
    case 'national':
      return 'Збірна';
    default:
      return '';
  }
};
