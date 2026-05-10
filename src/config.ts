export const APP_NAME = 'Clinic Queue Pro';
export const ADMIN_UID = 'a2uvKrLDoNVPOafbOOM8BlErxek1';
export const DEFAULT_REPO_BASE = '/reimagined-octo-guide/';
export const DEFAULT_AVERAGE_VISIT_MINUTES = 10;

export const STATUS_ORDER = [
  'waiting',
  'called',
  'in_progress',
  'postponed',
  'skipped',
  'finished',
  'cancelled',
  'no_show'
] as const;
