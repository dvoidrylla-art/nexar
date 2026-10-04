import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Bot,
  User,
  ShoppingBag,
  ArrowDownRight,
  Wallet,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  Radio,
  Cpu,
} from 'lucide-react';
import { Product, Customer, Sale, Expense, BusinessProfile, AIMessage, DashboardMetrics } from '../types';
import { AIClient, ChatRole, TaskType } from '../services/aiClient';
import { LiveVoiceManager } from '../services/liveVoice';
import { KoraThinkingScreen } from './KoraThinkingScreen';

interface KoraChatProps {
  business: BusinessProfile | null;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  metrics: DashboardMetrics;
  currency: string;
  initialPrompt?: string;
  onExecutePendingSale: (saleData: any) => void;
  onExecutePendingExpense: (expenseData: any) => void;
  onExecutePendingPayment: (paymentData: any) => void;
}

const ROLES: { id: ChatRole; label: string; model: string; taskType: TaskType; desc: string }[] = [
  { id: 'general', label: 'General Assistant', model: 'gemini-3.5-flash', taskType: 'general', desc: 'Operating system & general business Q&A' },
  { id: 'finance', label: 'Financial Auditor', model: 'gemini-3.1-pro-preview', taskType: 'complex', desc: 'Complex reasoning, profit & cost audits' },
  { id: 'fast' as any, label: 'Fast Tasks', model: 'gemini-3.1-flash-lite', taskType: 'fast', desc: 'Instant responses & quick lookups' },
  { id: 'inventory', label: 'Stock Advisor', model: 'gemini-3.5-flash', taskType: 'general', desc: 'Restock warnings & velocity forecasting' },
  { id: 'debt', label: 'Debt Collector', model: 'gemini-3.5-flash', taskType: 'general', desc: 'Customer credit recovery & reminders' },
];

const SUGGESTED_PROMPTS = [
  'What should I do today?',
  'How much profit did I make this week?',
  'What should I restock right now?',
  'Who owes me money?',
  'What products are slow-moving?',
  'Audit my transport expenses',
];

export const KoraChat: React.FC<KoraChatProps> = ({
  business,
  products,
  customers,
  sales,
  expenses,
  metrics,
  currency,
  initialPrompt,
  onExecutePendingSale,
  onExecutePendingExpense,
  onExecutePendingPayment,
}) => {
  const [selectedRole, setSelectedRole] = useState<ChatRole>('general');
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType>('general');

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `I'm ready to help 🤖\n\nAsk Kora about your business. I'm actively monitoring your ${products.length} products, sales, expenses, and customer credit.\n\nType a question, pick a role above, or tap "Live Voice" to converse directly via gemini-3.8-live!`,
      modelUsed: 'gemini-3.5-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live API (gemini-3.8-live) Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceState, setVoiceState] = useState({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    error: null as string | null,
  });
  const liveManagerRef = useRef<LiveVoiceManager | null>(null);

  // Initialize LiveVoiceManager
  useEffect(() => {
    liveManagerRef.current = new LiveVoiceManager((state) => {
      setVoiceState(state);
      if (!state.isConnected && isVoiceActive && !state.isListening) {
        setIsVoiceActive(false);
      }
    });

    return () => {
      liveManagerRef.current?.stop();
    };
  }, []);

  const handleToggleVoice = async () => {
    if (isVoiceActive) {
      liveManagerRef.current?.stop();
      setIsVoiceActive(false);
    } else {
      setIsVoiceActive(true);
      await liveManagerRef.current?.start();
    }
  };

  // If initialPrompt provided from outside, auto-trigger it
  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Context builder for Gemini
  const buildBusinessContext = () => {
    return {
      businessName: business?.name || 'My Store',
      currency,
      metrics,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sellingPrice: p.sellingPrice,
        purchasePrice: p.purchasePrice,
        currentStock: p.currentStock,
        minStock: p.minStock,
      })),
      recentSales: sales.slice(0, 10).map((s) => ({
        id: s.id,
        receiptNumber: s.receiptNumber,
        customerName: s.customerName,
        totalAmount: s.totalAmount,
        amountPaid: s.amountPaid,
        outstandingDebt: s.outstandingDebt,
        estimatedGrossProfit: s.estimatedGrossProfit,
        paymentStatus: s.paymentStatus,
        paymentMethod: s.paymentMethod,
        items: s.items,
        date: s.date,
      })),
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        outstandingDebt: c.outstandingDebt,
        totalPurchases: c.totalPurchases,
      })),
      recentExpenses: expenses.slice(0, 5),
    };
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText.trim();
    if (!textToSend || isLoading) return;

    setInputText('');

    const userMessage: AIMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Step 1: Detect if this is a natural language command to record a transaction
      const isCommandCheck = textToSend.toLowerCase();
      const looksLikeCommand =
        isCommandCheck.startsWith('sold') ||
        isCommandCheck.startsWith('i sold') ||
        isCommandCheck.startsWith('sell') ||
        isCommandCheck.startsWith('paid') ||
        isCommandCheck.startsWith('bought') ||
        isCommandCheck.includes('bought from');

      if (looksLikeCommand) {
        const parsed = await AIClient.parseCommand(textToSend, products, customers);

        // If clarification needed (e.g. multiple shirts exist)
        if (parsed.clarificationNeeded) {
          setMessages((prev) => [
            ...prev,
            {
              id: 'msg_' + Date.now(),
              role: 'assistant',
              content:
                parsed.clarificationQuestion ||
                "I'm not completely certain which product or amount you mean. Please clarify:",
              clarificationOptions: parsed.clarificationOptions || undefined,
              modelUsed: 'gemini-3.1-flash-lite',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setIsLoading(false);
          return;
        }

        // Propose transaction for EXPLICIT confirmation
        if (
          parsed.proposedData &&
          (parsed.intent === 'SALE' ||
            parsed.intent === 'EXPENSE' ||
            parsed.intent === 'PAYMENT' ||
            parsed.intent === 'RESTOCK')
        ) {
          const actionType = parsed.intent as 'SALE' | 'EXPENSE' | 'PAYMENT' | 'RESTOCK';
          setMessages((prev) => [
            ...prev,
            {
              id: 'msg_' + Date.now(),
              role: 'assistant',
              content: `I understood: "${parsed.summary}".\n\nFinancial accuracy is critical: please confirm this transaction before it is saved to your business records.`,
              pendingTransaction: {
                type: actionType,
                data: parsed.proposedData,
                summary: parsed.summary,
              },
              modelUsed: 'gemini-3.1-flash-lite',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setIsLoading(false);
          return;
        }
      }

      // Step 2: Multi-turn business Q&A with selected role and task model
      const chatRes = await AIClient.chat({
        message: textToSend,
        history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        businessContext: buildBusinessContext(),
        role: selectedRole,
        taskType: selectedTaskType,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_' + Date.now(),
          role: 'assistant',
          content: chatRes.reply,
          isFallback: chatRes.isFallback,
          modelUsed: chatRes.modelUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_' + Date.now(),
          role: 'assistant',
          content:
            "I couldn't process that query right now. Please try asking again or check your internet connection.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransaction = (msgId: string, pending: AIMessage['pendingTransaction']) => {
    if (!pending) return;

    if (pending.type === 'SALE') {
      onExecutePendingSale(pending.data);
    } else if (pending.type === 'EXPENSE') {
      onExecutePendingExpense(pending.data);
    } else if (pending.type === 'PAYMENT') {
      onExecutePendingPayment(pending.data);
    }

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            content: `✅ Transaction confirmed and saved to your business records: ${pending.summary}. Inventory and metrics updated!`,
            pendingTransaction: undefined,
          };
        }
        return m;
      })
    );
  };

  const handleCancelTransaction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            content: `Transaction cancelled. No financial records were changed.`,
            pendingTransaction: undefined,
          };
        }
        return m;
      })
    );
  };

  const currentRoleConfig = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Sub-header with Role Selector & Live Voice Button */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/95 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 text-slate-950 font-bold shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-white flex items-center space-x-1.5">
                <span>✨ Kora AI</span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {currentRoleConfig.model}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Live API Voice Toggle Button */}
            <button
              onClick={handleToggleVoice}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                isVoiceActive
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/20'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
              }`}
              title="Live real-time voice conversation via gemini-3.8-live"
            >
              {isVoiceActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isVoiceActive ? 'End Live' : 'Live Voice'}</span>
            </button>

            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'msg_welcome_' + Date.now(),
                    role: 'assistant',
                    content: `I'm ready to help 🤖\n\nAsk Kora about your business. What would you like to check?`,
                    modelUsed: currentRoleConfig.model,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              }}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg border border-slate-700 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Role Selector Pills */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar pt-1">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => {
                setSelectedRole(role.id);
                setSelectedTaskType(role.taskType);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap shrink-0 transition ${
                selectedRole === role.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Voice Conversation Active Overlay / Banner */}
      {isVoiceActive && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-b border-emerald-500/30 p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center">
              <span className="w-8 h-8 rounded-full bg-emerald-500/30 animate-ping absolute" />
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-lg">
                <Radio className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span>Gemini 3.8 Live API Active</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-300">
                {voiceState.isSpeaking
                  ? 'Kora is speaking...'
                  : voiceState.isListening
                  ? 'Listening to your microphone (16kHz PCM)...'
                  : voiceState.error || 'Connecting to Live API...'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleVoice}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Scrollable Messages Thread maintaining history */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Clarification Options */}
                {m.clarificationOptions && m.clarificationOptions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold block">Select option:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.clarificationOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(`Sold ${opt}`)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium text-[11px] rounded-lg border border-slate-700 transition"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* PENDING TRANSACTION CONFIRMATION CARD */}
                {m.pendingTransaction && (
                  <div className="mt-3 p-3 bg-slate-950 border border-emerald-500/60 rounded-xl space-y-2 text-slate-200 shadow-md">
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pending Transaction Confirmation</span>
                    </div>

                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 font-mono text-[11px] space-y-0.5">
                      <div>
                        <strong>Type:</strong> {m.pendingTransaction.type}
                      </div>
                      <div>
                        <strong>Details:</strong> {m.pendingTransaction.summary}
                      </div>
                      {m.pendingTransaction.data.customerName && (
                        <div>
                          <strong>Customer:</strong> {m.pendingTransaction.data.customerName}
                        </div>
                      )}
                      {m.pendingTransaction.data.paymentMethod && (
                        <div>
                          <strong>Payment:</strong> {m.pendingTransaction.data.paymentMethod}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 pt-1">
                      <button
                        onClick={() => handleCancelTransaction(m.id)}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-[11px] flex items-center justify-center space-x-1 transition"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={() => handleConfirmTransaction(m.id, m.pendingTransaction)}
                        className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[11px] flex items-center justify-center space-x-1 transition shadow-md shadow-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm & Save</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp & Model pill */}
              <div className="flex items-center space-x-1.5 text-[9px] text-slate-500 mt-1 px-1">
                <span>{m.timestamp}</span>
                {m.modelUsed && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400/80 font-mono flex items-center space-x-0.5">
                      <Cpu className="w-2.5 h-2.5 inline" />
                      <span>{m.modelUsed}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="my-2 max-w-md w-full">
            <KoraThinkingScreen
              isInline={true}
              title="KORA is thinking..."
              subtitle={`Turning your ideas into real opportunities with ${currentRoleConfig.model}`}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts carousel */}
      <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] text-slate-500 shrink-0 font-medium">Try:</span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 shrink-0 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat input box */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder={`Ask Kora (${currentRoleConfig.label})...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition shadow-md shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
