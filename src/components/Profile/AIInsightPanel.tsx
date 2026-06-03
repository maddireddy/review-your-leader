'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Sparkles, Loader2 } from 'lucide-react';
import { Representative } from '@/types';

const QUICK_QUESTIONS = [
  'Summarize this leader\'s key achievements',
  'What are the main criticisms?',
  'How does their performance compare?',
  'What ministry portfolios have they held?',
];

interface AIInsightPanelProps {
  representative: Representative;
}

export function AIInsightPanel({ representative }: AIInsightPanelProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage(question: string) {
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, representative }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'ai', text: data.answer || 'No response available.' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Unable to connect to AI service. Please configure the Anthropic API key.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="glass-card p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">AI Political Analyst</div>
          <div className="text-xs text-slate-400">Powered by Claude Haiku</div>
        </div>
      </div>

      {/* Quick questions */}
      {messages.length === 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">Quick questions:</p>
          <div className="space-y-1.5">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="w-full text-left text-sm p-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-slate-300 hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-bl-sm'
                }`}
              >
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span className="text-xs text-violet-400 font-medium">Claude Haiku</span>
                  </div>
                )}
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div className="flex justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-bl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about this leader..."
          className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
