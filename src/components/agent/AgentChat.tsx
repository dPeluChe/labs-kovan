import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Bot, Send, X, Sparkles } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function AgentChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const sendMessage = useAction(api.agent.sendMessage);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsLoading(true);

        try {
            // Convert to Vercel AI SDK format if needed, simplistic maps for now
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            history.push({ role: "user", content: userMsg });

            const response = await sendMessage({ messages: history });

            setMessages(prev => [...prev, { role: "assistant", content: String(response) }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, hubo un error al procesar tu solicitud." }]);
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
                        <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-sm btn-circle text-primary-content">
                            <X className="w-6 h-6" />
                        </button>
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
                                <div className="chat-image avatar placeholder">
                                    <div className={`w-8 rounded-full ${msg.role === "user" ? "bg-secondary text-secondary-content" : "bg-primary text-primary-content"}`}>
                                        {msg.role === "user" ? <span>Yo</span> : <Bot className="w-5 h-5" />}
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
