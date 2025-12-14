import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Trash2, Sparkles } from "lucide-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function AgentChat() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const sendMessage = useAction(api.agent.sendMessage);
    const saveMessageMutation = useMutation(api.agentConversations.saveMessage);
    const clearConversationMutation = useMutation(api.agentConversations.clearConversation);
    const conversationHistory = useQuery(
        api.agentConversations.getConversationHistory,
        user ? { userId: user._id } : "skip"
    );

    // Load conversation history on mount
    useEffect(() => {
        if (conversationHistory) {
            const loadedMessages = conversationHistory
                .reverse()
                .map((msg: { role: "user" | "assistant"; content: string }) => ({
                    role: msg.role,
                    content: msg.content
                }));
            setMessages(loadedMessages);
        }
    }, [conversationHistory]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleClearConversation = async () => {
        if (!user || !confirm('¿Borrar todo el historial del chat?')) return;

        try {
            await clearConversationMutation({ userId: user._id });
            setMessages([]);
        } catch (error) {
            console.error("Error clearing conversation:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput("");
        const newUserMessage = { role: "user" as const, content: userMsg };
        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);

        try {
            // Convert to Vercel AI SDK format if needed
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            history.push({ role: "user", content: userMsg });

            if (!user) {
                setMessages(prev => [...prev, { role: "assistant", content: "No se ha encontrado un usuario activo. Por favor recarga la página." }]);
                setIsLoading(false);
                return;
            }

            // Save user message
            await saveMessageMutation({ userId: user._id, role: "user", content: userMsg });

            const response = await sendMessage({
                messages: history,
                userId: user._id
            });

            const assistantMsg = String(response);
            setMessages(prev => [...prev, { role: "assistant", content: assistantMsg }]);

            // Save assistant message
            await saveMessageMutation({ userId: user._id, role: "assistant", content: assistantMsg });
        } catch (error) {
            console.error("Agent error:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorMsg = `❌ Error: ${errorMessage}\n\nPor favor intenta de nuevo o reformula tu pregunta.`;
            setMessages(prev => [...prev, {
                role: "assistant",
                content: errorMsg
            }]);

            // Save error message 
            if (user) {
                await saveMessageMutation({ userId: user._id, role: "assistant", content: errorMsg });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-20 right-4 z-50 btn btn-circle btn-primary btn-lg shadow-xl animate-bounce-subtle"
                >
                    <Bot className="w-8 h-8" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 z-50 w-full md:w-96 h-[80vh] md:h-[600px] md:bottom-20 md:right-4 bg-base-100 shadow-2xl rounded-t-2xl md:rounded-2xl border border-base-300 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                    {/* Header */}
                    <div className="p-4 bg-primary text-primary-content flex justify-between items-center shadow-md">
                        <div className="flex items-center gap-2">
                            <Bot className="w-6 h-6" />
                            <div>
                                <h3 className="font-bold">Asistente IA</h3>
                                <span className="text-xs opacity-80 flex items-center gap-1">
                                    Generado por Gemini <Sparkles className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleClearConversation}
                                className="btn btn-ghost btn-sm btn-circle text-primary-content"
                                title="Borrar conversación"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-sm btn-circle text-primary-content">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200/50" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="text-center text-base-content/50 mt-10">
                                <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>¡Hola! Soy tu asistente personal.</p>
                                <p className="text-sm mt-2">Puedes pedirme:</p>
                                <ul className="text-xs mt-2 space-y-1">
                                    <li>"Agrega un gasto de $500 en comida"</li>
                                    <li>"Anota que Juan me debe $200"</li>
                                    <li>"Agrega Catan a mi colección"</li>
                                </ul>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}>
                                <div className="chat-image avatar">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-secondary text-secondary-content" : "bg-primary text-primary-content"}`}>
                                        {msg.role === "user" ? (
                                            <span className="text-sm font-bold">U</span>
                                        ) : (
                                            <Bot className="w-5 h-5" />
                                        )}
                                    </div>
                                </div>
                                <div className={`chat-bubble ${msg.role === "user" ? "chat-bubble-secondary" : "chat-bubble-primary"}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="chat chat-start">
                                <div className="chat-image avatar placeholder">
                                    <div className="w-8 rounded-full bg-primary text-primary-content">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="chat-bubble chat-bubble-primary opacity-50">
                                    <span className="loading loading-dots loading-sm"></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 bg-base-100 border-t border-base-300">
                        <div className="join w-full">
                            <input
                                type="text"
                                className="input input-bordered join-item w-full"
                                placeholder="Escribe tu solicitud..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="btn btn-primary join-item"
                                disabled={isLoading || !input.trim()}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
