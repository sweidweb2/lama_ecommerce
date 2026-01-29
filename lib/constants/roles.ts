export const ROLES = {
    USER: 'user',
    ADMIN: 'admin',
} as const
  

export type RoleKey = keyof typeof ROLES;
export type RoleValue = (typeof ROLES)[RoleKey];