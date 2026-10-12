import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, History, Activity, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const knowledgeBase = [
  { keywords: ['crocin', 'paracetamol', 'fever', 'headache'], response: "Crocin, which contains Paracetamol, is generally used for fever and mild pain relief. Please take it as prescribed." },
  { keywords: ['ibuprofen', 'advil', 'pain'], response: "Ibuprofen is an NSAID used to reduce inflammation and pain. It's recommended to take it with food." },
  { keywords: ['amoxicillin', 'antibiotic'], response: "Amoxicillin is a common antibiotic. Remember to complete your entire prescribed course, even if you feel better." },
  { keywords: ['search', 'find'], response: "You can find more detailed medicine information by navigating to the Search Medicine section from your dashboard." },
  { keywords: ['reminder', 'schedule'], response: "To set up a reminder for your medicine, simply tap the Reminders button on your dashboard." }
];

export default function VoiceAssistant() {
  const { currentUser } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [transcript, setTranscript] = useState('');
  const [history, setHistory] = useState([]);
  
  const recognitionRef = useRef(null);

  // Load history
  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`voice_history_${currentUser.uid}`);
      if (saved) setHistory(JSON.parse(saved));
    }
  }, [currentUser]);

  // Init recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus('Not Supported in Browser');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('Listening...');
      setTranscript('');
      window.speechSynthesis.cancel();
    };

    recognition.onresult = (event) => {
      let currentResult = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentResult += event.results[i][0].transcript;
          processQuery(currentResult);
        } else {
          setTranscript(event.results[i][0].transcript);
        }
      }
    };

    recognition.onerror = (e) => {
      console.error(e.error);
      setIsListening(false);
      setStatus('Idle');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    
    // Cleanup
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      window.speechSynthesis.cancel();
    };
  }, []);

  const startListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (status !== 'Not Supported in Browser') {
        recognitionRef.current?.start();
      }
    }
  };

  const processQuery = (text) => {
    setTranscript(text);
    setStatus('Processing...');
    
    setTimeout(() => {
      const queryLower = text.toLowerCase();
      let response = "I'm sorry, I couldn't find specific information about that. Try asking about Crocin, or ask me how to set up a reminder.";
      
      for (const item of knowledgeBase) {
        if (item.keywords.some(kw => queryLower.includes(kw))) {
          response = item.response;
          break;
        }
      }
      
      setStatus('Speaking...');
      speakResponse(text, response);
    }, 800);
  };

  const speakResponse = (queryText, responseText) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(responseText);
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setStatus('Idle');
      
      const newEntry = {
        id: Date.now(),
        query: queryText,
        response: responseText,
        timestamp: new Date().toISOString()
      };
      
      const updatedHistory = [newEntry, ...history].slice(0, 15);
      setHistory(updatedHistory);
      if (currentUser) {
        localStorage.setItem(`voice_history_${currentUser.uid}`, JSON.stringify(updatedHistory));
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const replayAudio = (text) => {
     window.speechSynthesis.cancel();
     const utterance = new SpeechSynthesisUtterance(text);
     window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="premium-glass rounded-3xl p-6 md:p-8 relative overflow-hidden group border border-[var(--border-color)]">
      <div className="absolute top-0 left-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Interaction Area */}
        <div className="flex flex-col items-center justify-center space-y-6 text-center py-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-brand" /> Voice Assistant
            </h2>
            <p className="text-sm text-[var(--text-secondary)] font-medium max-w-xs mx-auto">
              Hands-free help. Tap the microphone and ask a medical question.
            </p>
          </div>
          
          <button
            onClick={startListening}
            disabled={isSpeaking || status === 'Not Supported in Browser'}
            title="Start Listening"
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening ? 'bg-red-500/20 text-red-500 ring-4 ring-red-500/40 animate-pulse-slow shadow-[0_0_30px_rgba(239,68,68,0.5)]'
              : isSpeaking ? 'bg-brand/20 text-brand ring-4 ring-brand/40 shadow-[0_0_30px_rgba(33,150,243,0.5)]'
              : 'bg-brand text-white hover:scale-105 shadow-xl shadow-brand/30 hover:shadow-brand/50 focus:ring-4 focus:ring-brand/50'
            }`}
          >
             {isListening ? <Activity className="w-10 h-10 animate-bounce" /> 
              : isSpeaking ? <Volume2 className="w-10 h-10 animate-pulse" /> 
              : <Mic className="w-10 h-10" />}
          </button>
          
          <div className="space-y-4 w-full max-w-sm">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-secondary)] ring-1 ring-[var(--border-color)] shadow-sm text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : isSpeaking ? 'bg-brand animate-pulse' : status === 'Idle' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
              {status}
            </div>
            
            <div className="min-h-[80px] p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center auto-grow shadow-inner">
               <p className="text-[var(--text-primary)] font-medium text-lg leading-relaxed italic transition-all duration-300">
                 {transcript ? `"${transcript}"` : (
                    <span className="opacity-50 text-sm not-italic">e.g., "Tell me about Crocin"</span>
                 )}
               </p>
            </div>
          </div>
        </div>

        {/* Right: History Area */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-5 border border-[var(--glass-border)] flex flex-col h-[400px] shadow-inner relative overflow-hidden">
          <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 z-10 pb-2 border-b border-[var(--border-color)]">
            <History className="w-5 h-5 text-brand" /> Voice History
          </h3>
          <div className="overflow-y-auto pr-2 space-y-3 flex-1 custom-scrollbar z-10 relative">
            {history.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-2">
                 <Mic className="w-8 h-8 text-[var(--text-secondary)]" />
                 <p className="text-sm text-[var(--text-secondary)] italic text-center font-medium">No voice interactions yet.</p>
               </div>
            ) : (
              history.map(item => (
                <div key={item.id} className="p-4 bg-[var(--bg-primary)] rounded-xl group hover:border-brand/30 border border-transparent transition-all hover:shadow-md animate-fade-in">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-sm font-bold text-[var(--text-primary)] flex items-start gap-2 leading-tight">
                       <Mic className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" /> "{item.query}"
                     </p>
                     <span className="text-[10px] text-[var(--text-secondary)] font-medium ml-2 flex-shrink-0 bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                       {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
                  <div className="flex gap-3 pl-1">
                    <div className="w-1 bg-brand/30 rounded-full mt-1"></div>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed flex-1">
                      {item.response}
                    </p>
                    <button 
                      onClick={() => replayAudio(item.response)} 
                      title="Replay Response"
                      className="p-2 h-fit bg-[var(--bg-secondary)] rounded-xl text-[var(--text-secondary)] hover:text-brand hover:bg-brand/10 transition-colors shadow-sm ring-1 ring-[var(--glass-border)]"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
