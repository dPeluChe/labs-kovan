import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Trash2, Sparkles } from "lucide-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface ChatBubbleProps {
    isUser: boolean;
    avatar: React.ReactNode;
    compact?: boolean;
    dimmed?: boolean;
    children: React.ReactNode;
}

function ChatBubble({ isUser, avatar, compact = false, dimmed = false, children }: ChatBubbleProps) {
    return (
        <div className={`chat ${isUser ? "chat-end" : "chat-start"}`}>
            <div className={`chat-image avatar${compact ? " placeholder" : ""}`}>
                <div
                    className={`${compact ? "w-8" : "w-10 h-10 flex items-center justify-center"} rounded-full ${
                        isUser ? "bg-secondary text-secondary-content" : "bg-primary text-primary-content"
                    }`}
                >
                    {avatar}
                </div>
            </div>
            <div className={`chat-bubble ${isUser ? "chat-bubble-secondary" : "chat-bubble-primary"}${dimmed ? " opacity-50" : ""}`}>
                {children}
            </div>
        </div>
    );
}

export function AgentChat() {
    const { user, sessionToken } = useAuth();
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
        sessionToken ? { sessionToken } : "skip"
    );

    // Load conversation history on mount
    useEffect(() => {
        if (conversationHistory) {
            const loadedMessages = conversationHistory
                .reverse()
                .map((msg: { role: "user" | "assistant"; content: string }) => ({
                    id: crypto.randomUUID(),
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
        if (!user || !sessionToken || !confirm('¿Borrar todo el historial del chat?')) return;

        try {
            await clearConversationMutation({ sessionToken });
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
        const newUserMessage = { id: crypto.randomUUID(), role: "user" as const, content: userMsg };
        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);

        try {
            // Convert to Vercel AI SDK format if needed
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            history.push({ role: "user", content: userMsg });

            if (!user || !sessionToken) {
                setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "No se ha encontrado un usuario activo. Por favor recarga la página." }]);
                setIsLoading(false);
                return;
            }

            // Save user message
            await saveMessageMutation({ sessionToken, role: "user", content: userMsg });

            const response = await sendMessage({
                messages: history,
                sessionToken
            });

            const assistantMsg = String(response);
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: assistantMsg }]);

            // Save assistant message
            await saveMessageMutation({ sessionToken, role: "assistant", content: assistantMsg });
        } catch (error) {
            console.error("Agent error:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorMsg = `❌ Error: ${errorMessage}\n\nPor favor intenta de nuevo o reformula tu pregunta.`;
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: "assistant",
                content: errorMsg
            }]);

            // Save error message 
            if (sessionToken) {
                await saveMessageMutation({ sessionToken, role: "assistant", content: errorMsg });
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
                    aria-label="Abrir asistente"
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
                            <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-sm btn-circle text-primary-content" aria-label="Cerrar chat">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200/50" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="text-center text-subtle mt-10">
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

                        {messages.map((msg) => (
                            <ChatBubble
                                key={msg.id}
                                isUser={msg.role === "user"}
                                avatar={msg.role === "user" ? <span className="text-sm font-bold">U</span> : <Bot className="w-5 h-5" />}
                            >
                                {msg.content}
                            </ChatBubble>
                        ))}

                        {isLoading && (
                            <ChatBubble isUser={false} compact dimmed avatar={<Bot className="w-5 h-5" />}>
                                <span className="loading loading-dots loading-sm"></span>
                            </ChatBubble>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 bg-base-100 border-t border-base-300">
                        <div className="join w-full">
                            <input
                                type="text"
                                className="input input-bordered join-item w-full"
                                placeholder="Escribe tu solicitud..."
                                aria-label="Escribe tu solicitud"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="btn btn-primary join-item"
                                disabled={isLoading || !input.trim()}
                                aria-label="Enviar mensaje"
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
