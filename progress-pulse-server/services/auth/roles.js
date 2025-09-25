// services/auth/roles.js

// Unified role levels for the whole app
export const Roles = {
  ADMIN: 10,    // Full control (admin-only endpoints)
  TRAINEE: 20,  // Default user
  COACH: 30,    // Read-only on trainees' history + coach module
};

// Small helpers for readability across middlewares/controllers
export const isAdmin   = (rlv) => rlv === Roles.ADMIN;
export const isTrainee = (rlv) => rlv === Roles.TRAINEE;
export const isCoach   = (rlv) => rlv === Roles.COACH;
