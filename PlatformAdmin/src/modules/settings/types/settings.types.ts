export type UpdateProfileDto = {
  fullName: string;
  email: string;
};

export type UpdateSecurityDto = {
  currentPassword: string;
  newPassword: string;
};

export type SettingsProfileDto = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};
