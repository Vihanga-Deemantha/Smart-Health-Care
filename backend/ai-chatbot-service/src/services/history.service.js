const MAX_CONTEXT_MESSAGES = 6;
const conversationStore = new Map();

export const getConversationHistory = (patientId) => {
  return conversationStore.get(patientId) || [];
};

export const saveConversationTurn = ({ patientId, userMessage, assistantMessage, suggestedSpecialty }) => {
  const existing = getConversationHistory(patientId);

  const updated = [
    ...existing,
    { role: "user", content: userMessage, timestamp: new Date().toISOString() },
    {
      role: "assistant",
      content: assistantMessage,
      suggestedSpecialty,
      timestamp: new Date().toISOString()
    }
  ].slice(-MAX_CONTEXT_MESSAGES);

  conversationStore.set(patientId, updated);

  return updated;
};
