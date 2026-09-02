export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  FEDERATION_ADMIN: "FEDERATION_ADMIN",
  WORKER: "WORKER",
  CUSTOMER: "CUSTOMER",
} as const;

export type UserRoleConstant = (typeof USER_ROLES)[keyof typeof USER_ROLES];
