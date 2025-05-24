// src/api.js
import axios from 'axios';

// Fallback to localhost for dev, but in production this will read the Azure URL.
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8088';

export default axios.create({ baseURL: API_BASE });
