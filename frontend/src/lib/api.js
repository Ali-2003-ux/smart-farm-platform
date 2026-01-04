import axios from 'axios';

// Official Cloud Backend URL (Hugging Face)
const PROD_URL = 'https://ifa78058-smart-farm-backend.hf.space/api/v1';

// Automatically select URL based on environment
// If VITE_API_URL is set (in Vercel), use it.
// If PROD build (Cloud), use PROD_URL.
// Otherwise (Localhost), use local backend.
const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_URL : 'http://localhost:8000/api/v1');

console.log(`[SmartFarm] Initializing API client with Base URL: ${BASE_URL}`);

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

export default api;
