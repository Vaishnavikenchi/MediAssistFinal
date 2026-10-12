import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';

export default function MediBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi there! I am MediBot, your AI Health Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    // AI Mock Logic - In a real app, this would hit Gemini API or OpenAI
    setTimeout(() => {
      let botResponse = "I'm sorry, I couldn't understand that context. Could you clarify?";
      const lowerReq = userMessage.toLowerCase();

      if (lowerReq.includes('paracetamol') || lowerReq.includes('fever')) {
        botResponse = "Paracetamol is commonly used to treat fever and mild to moderate pain. Be sure not to exceed 4000mg per day to protect your liver.";
      } else if (lowerReq.includes('coffee') || lowerReq.includes('caffeine')) {
        botResponse = "While caffeine is fine with many medications, it can interact with drugs like certain antibiotics, asthma medicines, and stimulants. Always check your specific medication's precautions.";
      } else if (lowerReq.includes('hello') || lowerReq.includes('hi')) {
        botResponse = "Hello! I can answer questions about your medications or general health queries. What's on your mind?";
      } else if (lowerReq.includes('amoxicillin') || lowerReq.includes('antibiotic')) {
        botResponse = "Amoxicillin is an antibiotic. Make sure to finish your entire prescribed course, even if you start feeling better early, to prevent antibiotic resistance.";
      } else if (lowerReq.includes('ibuprofen') || lowerReq.includes('pain')) {
        botResponse = "Ibuprofen is a nonsteroidal anti-inflammatory drug (NSAID). It's best taken with food or milk to prevent stomach upset. Do not use if you have a history of severe stomach ulcers.";
      } else if (lowerReq.includes('missed') || lowerReq.includes('forgot')) {
        botResponse = "If you missed a dose, generally you should take it as soon as you remember. However, if it's almost time for your next dose, skip the missed one. Never take a double dose to make up for a missed one!";
      } else if (lowerReq.includes('headache')) {
        botResponse = "For mild headaches, resting in a quiet, dark room and staying hydrated can help. Over-the-counter pain relievers like Paracetamol or Ibuprofen may also be effective. If the headache is severe or unusual, please consult a doctor.";
      } else {
        botResponse = "That's a great question. Based on general medical guidelines, it's always best to consult your specific doctor for personalized advice. Is there a specific medication in your dashboard you'd like me to look up?";
      }

      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 p-4 bg-gradient-to-r from-brand to-brand-dark text-white rounded-full shadow-lg shadow-brand/40 hover:scale-110 transition-transform z-50 group flex items-center justify-center ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageCircle className="w-8 h-8 group-hover:animate-pulse" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-8 right-8 w-96 h-[500px] premium-glass bg-[var(--bg-primary)] border border-brand/20 shadow-2xl rounded-3xl z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-brand to-brand-dark p-4 flex items-center justify-between text-white border-b border-brand/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">MediBot AI</h3>
              <p className="text-xs text-brand-light font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-secondary)] custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white' : 'bg-gradient-to-br from-brand to-brand-dark text-white'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-tr-none shadow-lg shadow-purple-500/20' : 'premium-glass bg-white dark:bg-gray-800 text-[var(--text-primary)] rounded-tl-none border-[var(--border-color)]'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%] flex-row">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-brand to-brand-dark text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl premium-glass bg-white dark:bg-gray-800 rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-brand animate-spin" />
                  <span className="text-xs text-[var(--text-secondary)] font-medium">MediBot is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about medications or health..."
            className="flex-1 input-premium py-3 px-4 text-sm bg-[var(--bg-secondary)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-brand hover:bg-brand-dark text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-brand/20"
          >
            <Send className="w-5 h-5 -ml-1 mt-0.5" />
          </button>
        </form>
      </div>
    </>
  );
}
