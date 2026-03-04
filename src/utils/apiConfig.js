const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL?.trim();
const GENERIC_API_URL = import.meta.env.VITE_API_URL?.trim();

const BASE_URL = LOCAL_API_URL || GENERIC_API_URL || 'http://localhost:3004';

export const API_BASE_URL = BASE_URL.replace(/\/+$/, '');
