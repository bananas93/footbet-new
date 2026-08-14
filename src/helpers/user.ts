export const getUserDisplayName = (name?: string | null, nickname?: string | null) => {
  const normalizedNickname = (nickname || '').trim();
  if (normalizedNickname) {
    return normalizedNickname;
  }

  const normalizedName = (name || '').trim();
  if (normalizedName) {
    return normalizedName;
  }

  return 'Unknown user';
};

export const getUserInitials = (name?: string | null, nickname?: string | null) => {
  const displayName = getUserDisplayName(name, nickname).replace(/\s+/g, ' ').trim();
  if (!displayName) {
    return 'UN';
  }

  const parts = displayName.split(' ');
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return displayName.slice(0, 2).toUpperCase();
};
