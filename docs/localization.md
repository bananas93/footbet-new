# Localization

## Supported URL prefixes

The app uses language prefixes in URL:

- `/ua`
- `/en`

If a user opens a URL without a prefix (for example, `/signin`), the app redirects to `/ua/signin`.

## Translation files

All migrated UI text is stored in JSON dictionaries:

- `src/i18n/locales/ua.json`
- `src/i18n/locales/en.json`

## How to add a new language (example: Spanish)

1. Create a new locale file:
   - `src/i18n/locales/es.json`
2. Copy the structure from `ua.json` and translate values.
3. Register language in `src/i18n/index.tsx`:
   - add `es` to `SUPPORTED_LANGS`
   - import `es.json`
   - add `es` to `dictionaries`
4. Use URL with prefix:
   - `/es`
   - `/es/signin`

## Usage in components

Use `useI18n()` and call `t`:

- `t('auth.signIn.title')`
- `t('auth.common.repeatAfter', undefined, { time: '00:20' })`

The translator supports placeholders in the format `{{name}}`.
