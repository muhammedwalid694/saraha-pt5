export const GenderEnum = {
    FEMALE: "female",
    MALE: "male"
};

export const RolesEnum = {
    USER: "user",
    ADMIN: "admin",
    SUPER_ADMIN: "super_admin"
};

export const Privillages = {
    ADMINS: [RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN],
    SUPER_ADMIN: [RolesEnum.SUPER_ADMIN],
    ADMIN: [RolesEnum.ADMIN],
    USER: [RolesEnum.USER],
    ALL: [RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN, RolesEnum.USER],
    USER_ADMIN: [RolesEnum.USER, RolesEnum.ADMIN],
    USER_SUPER_ADMIN: [RolesEnum.USER, RolesEnum.SUPER_ADMIN]
};

export const SkillLevelEnum = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced"
};

export const ProvidersEnum = {
  LOCAL: "local",
  GOOGLE: "google",
};