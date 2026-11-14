// Base path for every backend endpoint this app calls. Kept in one place so
// src/api/http.ts never has to repeat it, and so an environment with a
// different prefix only needs one edit.
export const API_BASE_PATH = '/api/v1'
