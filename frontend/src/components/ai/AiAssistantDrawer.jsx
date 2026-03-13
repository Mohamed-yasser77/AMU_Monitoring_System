import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Book, ShieldAlert, Sparkles, User, Info } from 'lucide-react';
import aiService from '../../services/aiService';

const AiAssistantDrawer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I am your Regulatory Assistant. How can I help you with AMU guidelines or MRL limits today?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [species, setSpecies] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userQuery = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userQuery, timestamp: new Date() }]);
        setInput('');
        setLoading(true);

        try {
            const response = await aiService.getRegulatoryAnswer(userQuery, species);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.answer,
                source: response.source,
                confidence: response.confidence,
                flagged: response.flagged_for_review,
                timestamp: new Date()
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again later.',
                isError: true,
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-[#00c096] text-[#14171a] rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[60] teal-glow-strong group"
                >
                    <Bot size={28} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center animate-pulse">
                        <Sparkles size={10} className="text-[#00c096]" />
                    </div>
                </button>
            )}

            {/* Drawer Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] animate-fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sliding Drawer */}
            <div
                className={`fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-[#01050a] border-l border-white/5 z-[80] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-[#020b17] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#00c096]/10 rounded-xl flex items-center justify-center text-[#00c096] border border-[#00c096]/20">
                            <Bot size={22} />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg leading-tight uppercase tracking-tighter">Regulatory Assistant</h2>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00c096] animate-pulse" />
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Grounded AI Active</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Filters/Context */}
                <div className="px-6 py-3 border-b border-white/5 bg-[#01050a]/50 flex gap-2 overflow-x-auto no-scrollbar">
                    <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center shrink-0">Context:</span>
                    {['GLOBAL', 'AVI', 'BOV', 'OVI'].map(s => (
                        <button
                            key={s}
                            onClick={() => setSpecies(s === 'GLOBAL' ? '' : s)}
                            className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border ${(s === 'GLOBAL' && !species) || species === s
                                    ? 'bg-[#00c096] text-[#14171a] border-[#00c096]'
                                    : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(0,192,150,0.03),transparent_40%)]">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-enter`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 text-sm font-medium leading-relaxed ${msg.role === 'user'
                                    ? 'bg-[#00c096] text-[#14171a]'
                                    : 'bg-white/5 text-slate-300 border border-white/5'
                                }`}>
                                {msg.content}

                                {msg.source && (
                                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded text-[9px] font-black tracking-tighter uppercase">
                                            <Book size={10} className="text-[#00c096]" />
                                            Source: {msg.source}
                                        </div>
                                        {msg.confidence && (
                                            <span className="text-[9px] text-slate-500 font-bold uppercase">Conf: {(msg.confidence * 100).toFixed(0)}%</span>
                                        )}
                                    </div>
                                )}

                                {msg.flagged && (
                                    <div className="mt-2 flex items-center gap-1.5 text-amber-500 text-[9px] font-black uppercase tracking-tighter bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                        <ShieldAlert size={10} />
                                        Consult Vet for confirmation
                                    </div>
                                )}
                            </div>
                            <span className="mt-2 text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                                {msg.role === 'user' ? 'Scientist' : 'Assistant'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex flex-col items-start animate-pulse">
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00c096] animate-bounce" />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00c096] animate-bounce delay-75" />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00c096] animate-bounce delay-150" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-[#020b17] border-t border-white/5">
                    <form onSubmit={handleSend} className="relative group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about MRLs or regulations..."
                            className="w-full bg-[#01050a] border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white placeholder:text-slate-600 focus:border-[#00c096]/50 focus:ring-4 focus:ring-[#00c096]/5 transition-all outline-none font-bold"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#00c096] text-[#14171a] rounded-xl flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-95 teal-glow"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <p className="mt-4 text-[9px] text-slate-600 font-bold text-center uppercase tracking-widest flex items-center justify-center gap-2">
                        <Info size={10} />
                        OpenAI GPT-4o-mini Informed by Local Regulatory Corpus
                    </p>
                </div>
            </div>
        </>
    );
};

export default AiAssistantDrawer;
