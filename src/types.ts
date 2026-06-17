export interface AppVersionConfig {
  minVersion: string;
  currentVersion: string;
  playStoreUrl: string;
  updateMessage: string;
  updatedAt: any;
}

export interface AppVersion {
  major: number;
  minor: number;
  patch: number;
}
