import api from "../services/axios.js";

export const sendAiChatMessage = (message) => api.post("/ai/chat", { message });
