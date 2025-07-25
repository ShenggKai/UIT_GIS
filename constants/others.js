const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === "true";
const COZE_TOKEN = import.meta.env.VITE_COZE_TOKEN;
const COZE_BOT_ID = import.meta.env.VITE_COZE_BOT_ID;

export { API_BASE_URL, DEBUG_MODE, COZE_TOKEN, COZE_BOT_ID };
