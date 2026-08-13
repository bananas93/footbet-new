export const resolveAssetUrl = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }

  const base = process.env.REACT_APP_UPLOAD_URL || '';
  if (!base) {
    return value;
  }

  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = value.startsWith('/') ? value.slice(1) : value;
  return `${normalizedBase}/${normalizedPath}`;
};
