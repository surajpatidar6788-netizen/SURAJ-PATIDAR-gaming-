import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  RotateCcw,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import type { AppCopy } from '../i18n/translations';
import type { PairedTVInfo } from '../hooks/useTVConnection';
import type {
  AppView,
  ChatMessage,
  ConnectionStatus,
  DirectionMode,
  Language,
} from '../types';

interface AITeacherViewProps {
  copy: AppCopy;
  language: Language;
  connectionStatus: ConnectionStatus;
  pairedTv: PairedTVInfo | null;
  directionMode: DirectionMode;
  onNavigateView: (view: AppView) => void;
}

export function AITeacherView({
  copy,
  language,
  connectionStatus,
  pairedTv,
  directionMode,
  onNavigateView,
}: AITeacherViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-init',
      role: 'assistant',
      text: copy.guide.welcomeMessage,
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Keep initial welcome message synced when user switches language before chatting
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-init') {
        return [{ ...prev[0], text: copy.guide.welcomeMessage }];
      }
      return prev;
    });
  }, [copy.guide.welcomeMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const askTeacher = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    setLastQuestion(trimmed);
    setInputValue('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'welcome-init' && !m.isError)
      .slice(-8)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          language,
          history: historyForApi,
          context: {
            connectionStatus,
            pairedTvName: pairedTv?.name || 'None',
            directionMode,
            currentView: 'guide',
          },
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        suggestedAction?: 'setup' | 'controller' | 'tv';
      };

      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Unable to reach AI Teacher.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: data.reply as string,
          timestamp: Date.now(),
          suggestedAction: data.suggestedAction,
        },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: message,
          timestamp: Date.now(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askTeacher(inputValue);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-init',
        role: 'assistant',
        text: copy.guide.welcomeMessage,
        timestamp: Date.now(),
      },
    ]);
    setLastQuestion(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Sidebar (Desktop) / Top Section (Mobile): Quick Prompt Chips */}
      <aside className="lg:col-span-4 rounded-2xl border border-white/[0.08] bg-[#131720] p-5 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Bot className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{copy.guide.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {copy.guide.subtitle}
          </p>
        </div>

        <div className="border-t border-white/[0.08] pt-4 space-y-2.5">
          <p className="text-xs font-semibold text-slate-400">
            {copy.guide.quickPromptsLabel}
          </p>
          <div className="flex flex-col gap-2">
            {copy.guide.quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={isLoading}
                onClick={() => askTeacher(prompt)}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#0E121B] px-3.5 py-2.5 text-left text-xs sm:text-sm font-medium text-slate-200 hover:border-emerald-400/50 hover:bg-[#171E2C] active:scale-[0.99] disabled:opacity-50 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Right Main Chat Workspace */}
      <section className="lg:col-span-8 flex flex-col rounded-2xl border border-white/[0.08] bg-[#131720] overflow-hidden min-h-[480px] lg:h-[600px]">
        {/* Chat Sub-bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0F131C] px-5 py-3">
          <span className="text-sm font-semibold text-slate-200">{copy.guide.title}</span>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors whitespace-nowrap"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{copy.guide.clearChat}</span>
          </button>
        </div>

        {/* Messages Feed */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isUser
                      ? 'bg-emerald-500 text-slate-950'
                      : msg.isError
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-[#1D2534] text-emerald-400'
                  }`}
                >
                  {isUser ? (
                    <User className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Bot className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-emerald-500/15 border border-emerald-400/25 text-slate-100'
                      : msg.isError
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-200'
                        : 'bg-[#0E121B] border border-white/[0.08] text-slate-200'
                  }`}
                >
                  <div>{msg.text}</div>

                  {msg.isError && lastQuestion && (
                    <button
                      type="button"
                      onClick={() => askTeacher(lastQuestion)}
                      className="mt-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{copy.guide.retry}</span>
                    </button>
                  )}

                  {msg.suggestedAction && !msg.isError && (
                    <button
                      type="button"
                      onClick={() => onNavigateView(msg.suggestedAction!)}
                      className="mt-3 inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                    >
                      <span>{copy.guide.actionShortcuts[msg.suggestedAction]}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1D2534] text-emerald-400">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-[#0E121B] px-4 py-3 text-sm text-slate-400">
                {copy.guide.thinking}
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-white/[0.08] bg-[#0F131C] p-3 sm:p-4"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={copy.guide.inputPlaceholder}
            disabled={isLoading}
            className="min-h-[48px] flex-1 rounded-xl border border-white/12 bg-[#161C28] px-4 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-500 px-4 sm:px-5 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-45 transition-colors whitespace-nowrap shrink-0"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>{copy.guide.send}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
