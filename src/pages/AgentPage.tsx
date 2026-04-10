import { useState, useRef, useEffect } from "react";
import { Bot, Send, Trash2, Sparkles } from "lucide-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function AgentPage() {
    const { user, sessionToken } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [lastRequestTime, setLastRequestTime] = useState<number>(0);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const RATE_LIMIT_MS = 15000; // 15 segundos entre peticiones

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
    }, [messages]);

    // Check rate limit timer
    useEffect(() => {
        if (isRateLimited) {
            const timer = setTimeout(() => {
                setIsRateLimited(false);
            }, RATE_LIMIT_MS);
            return () => clearTimeout(timer);
        }
    }, [isRateLimited]);

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

        // Rate limiting check
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        if (timeSinceLastRequest < RATE_LIMIT_MS && lastRequestTime > 0) {
            const remainingSeconds = Math.ceil((RATE_LIMIT_MS - timeSinceLastRequest) / 1000);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `⏱️ Por favor espera ${remainingSeconds} segundos antes de hacer otra pregunta. Esto ayuda a no exceder los límites de uso.`
            }]);
            return;
        }

        const userMsg = input.trim();
        setInput("");
        const newUserMessage = { role: "user" as const, content: userMsg };
        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);
        setLastRequestTime(now);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            history.push({ role: "user", content: userMsg });

            if (!user || !sessionToken) {
                setMessages(prev => [...prev, { role: "assistant", content: "No se ha encontrado un usuario activo. Por favor recarga la página." }]);
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
            setMessages(prev => [...prev, { role: "assistant", content: assistantMsg }]);

            // Save assistant message
            await saveMessageMutation({ sessionToken, role: "assistant", content: assistantMsg });

            // Enable rate limiting after successful request
            setIsRateLimited(true);
        } catch (error) {
            console.error("Agent error:", error);
            const errorStr = error instanceof Error ? error.message : String(error);

            let errorMsg = "";

            // Detect quota exceeded error
            if (errorStr.includes("429") || errorStr.includes("Too Many Requests") || errorStr.includes("quota")) {
                errorMsg = `🚫 **Límite de uso alcanzado**\n\nHemos excedido la cuota diaria del asistente IA. Por favor intenta:\n\n• Esperar hasta mañana\n• Contactar al administrador para aumentar la cuota\n\nMientras tanto, puedes usar la app normalmente para registrar gastos, eventos, etc. manualmente.`;
            } else if (errorStr.includes("rate limit") || errorStr.includes("Rate limit")) {
                errorMsg = `⏱️ **Demasiadas peticiones**\n\nPor favor espera unos segundos antes de intentar de nuevo.`;
            } else {
                errorMsg = `❌ **Error temporal**\n\n${errorStr}\n\nPor favor intenta de nuevo en unos segundos.`;
            }

            setMessages(prev => [...prev, {
                role: "assistant",
                content: errorMsg
            }]);

            // Save error message 
            if (sessionToken) {
                try {
                    await saveMessageMutation({ sessionToken, role: "assistant", content: errorMsg });
                } catch (saveError) {
                    console.error("Error saving error message:", saveError);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-base-200">
            {/* Header */}
            <div className="bg-primary text-primary-content p-4 shadow-lg">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Bot className="w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-bold">Kovan</h1>
                            <p className="text-sm opacity-90 flex items-center gap-1">
                                Tu asistente inteligente <Sparkles className="w-3 h-3" />
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClearConversation}
                        className="btn btn-ghost btn-sm gap-2"
                        title="Borrar conversación"
                    >
                        <Trash2 className="w-5 h-5" />
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-hidden">
                <div
                    ref={scrollRef}
                    className="h-full overflow-y-auto"
                >
                    <div className="container mx-auto max-w-4xl p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center mt-20">
                                <Bot className="w-16 h-16 mx-auto mb-4 opacity-50 text-primary" />
                                <h2 className="text-2xl font-bold mb-2">¡Hola! Soy Kovan 👋</h2>
                                <p className="text-body mb-6">Tu asistente personal para gestionar tu familia</p>
                                <div className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                                    <div className="card bg-base-100 shadow-sm p-4">
                                        <h3 className="font-bold text-sm mb-2">📊 Consultas</h3>
                                        <ul className="text-xs space-y-1 text-body">
                                            <li>"¿Cuánto gasté este mes?"</li>
                                            <li>"¿Quién me debe dinero?"</li>
                                            <li>"¿Qué libros tengo?"</li>
                                        </ul>
                                    </div>
                                    <div className="card bg-base-100 shadow-sm p-4">
                                        <h3 className="font-bold text-sm mb-2">✍️ Registros</h3>
                                        <ul className="text-xs space-y-1 text-body">
                                            <li>"Agrega gasto de $500 en comida"</li>
                                            <li>"Guarda el restaurante La Taquería"</li>
                                            <li>"Anota receta de pozole"</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}>
                                <div className="chat-image avatar">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-secondary text-secondary-content" : "bg-primary text-primary-content"}`}>
                                        {msg.role === "user" ? (
                                            <span className="text-sm font-bold">TÚ</span>
                                        ) : (
                                            <Bot className="w-5 h-5" />
                                        )}
                                    </div>
                                </div>
                                <div className={`chat-bubble ${msg.role === "user" ? "chat-bubble-secondary" : "chat-bubble-primary"} whitespace-pre-wrap`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="chat chat-start">
                                <div className="chat-image avatar">
                                    <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="chat-bubble chat-bubble-primary">
                                    <span className="loading loading-dots loading-sm"></span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-base-100 border-t border-base-300 p-4 shadow-lg">
                <form onSubmit={handleSubmit} className="container mx-auto max-w-4xl">
                    <div className="join w-full">
                        <input
                            type="text"
                            className="input input-bordered join-item flex-1"
                            placeholder="Pregúntame algo o dime qué registrar..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
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
        </div>
    );
}
