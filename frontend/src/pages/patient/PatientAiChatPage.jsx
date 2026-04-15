import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, SendHorizontal, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import PortalLayout from "../../components/common/PortalLayout.jsx";
import PatientPortalNav from "../../components/patient/PatientPortalNav.jsx";
import { sendAiChatMessage } from "../../api/chatApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const PatientAiChatPage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I am your AI triage assistant. Share your symptoms and I will provide preliminary guidance and suggest a doctor specialty."
    }
  ]);

  const canSend = useMemo(() => input.trim().length >= 3 && !isTyping, [input, isTyping]);

  const handleSend = async (event) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || isTyping) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await sendAiChatMessage(message);
      const payload = response.data?.data || {};

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: payload.reply || "I can provide only preliminary guidance right now.",
          suggestedSpecialty: payload.suggestedSpecialty || null
        }
      ]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "AI service is unavailable right now."));
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "I could not process that request now. Please try again in a moment and consult a doctor for urgent symptoms."
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleBookSpecialty = (specialty) => {
    navigate(`/patient/book?specialty=${encodeURIComponent(specialty)}`);
  };

  return (
    <PortalLayout
      eyebrow="Patient Workspace"
      title="AI Chat"
      description="Describe your symptoms to get AI-assisted preliminary suggestions and a recommended specialty."
      accent="cyan"
    >
      <PatientPortalNav />

      <div className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-4">
        <div className="max-h-[420px] space-y-4 overflow-y-auto px-1 py-2">
          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[85%]">
                  <div
                    className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={{
                      background: isUser
                        ? "linear-gradient(135deg, rgba(14,165,233,0.85), rgba(34,211,238,0.9))"
                        : "rgba(15, 23, 42, 0.85)",
                      border: isUser
                        ? "1px solid rgba(34,211,238,0.9)"
                        : "1px solid rgba(148,163,184,0.25)",
                      color: "#f8fafc"
                    }}
                  >
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-200/80">
                      {isUser ? <UserRound size={13} /> : <Bot size={13} />}
                      <span>{isUser ? "You" : "Assistant"}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.suggestedSpecialty ? (
                    <button
                      type="button"
                      onClick={() => handleBookSpecialty(message.suggestedSpecialty)}
                      className="mt-2 rounded-lg border border-emerald-400/70 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/20"
                    >
                      Book appointment with a {message.suggestedSpecialty}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          {isTyping ? (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
                Assistant is typing...
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSend} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Example: I have fever and headache for 3 days"
            className="flex-1 rounded-xl border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex items-center gap-1 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send <SendHorizontal size={14} />
          </button>
        </form>
      </div>
    </PortalLayout>
  );
};

export default PatientAiChatPage;
