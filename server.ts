import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client utility
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// Role-specific system prompt builder
function buildSystemInstruction(role: string, businessContext: any) {
  let roleTitle = 'Kora, an intelligent and trusted business assistant in the pocket of a small-business owner';
  let roleFocus = 'Provide practical, encouraging, and balanced advice to help the owner manage sales, inventory, and finances.';

  if (role === 'finance') {
    roleTitle = 'Kora Financial Auditor & Profit Strategist';
    roleFocus = 'Focus specifically on gross margin analysis, net profit calculations, expense reduction opportunities, and cash flow health.';
  } else if (role === 'inventory') {
    roleTitle = 'Kora Inventory & Stock Optimization Specialist';
    roleFocus = 'Focus specifically on low stock alerts, stockout risk forecasting, turnover rates, identifying dead/slow inventory, and restock prioritization.';
  } else if (role === 'debt') {
    roleTitle = 'Kora Credit & Debt Recovery Advisor';
    roleFocus = 'Focus specifically on tracking outstanding customer credit, calculating overdue balances, and composing courteous debt reminder messages.';
  }

  return `You are ${roleTitle}.
Role Focus: ${roleFocus}

Current Live Business Data:
${JSON.stringify(businessContext, null, 2)}

CRITICAL SYSTEM RULES:
1. NEVER invent transactions, sales, expenses, debts, or inventory numbers.
2. The AI must NEVER modify or create financial records unless the user explicitly confirms.
3. If uncertain about any item or customer, ask a clarification question. Never guess.
4. Base all answers strictly on the actual business records provided above.
5. If data is lacking, state: "I don't have enough data to calculate that accurately yet."
6. Always format money clearly using the business currency (${businessContext?.currency || 'CFA'}).
7. Keep tone professional, supportive, clear, concise, and humble ("Based on your data...", "Consider..."). Avoid dense corporate jargon.`;
}

// API endpoint: Multi-turn Chat with Kora AI Assistant
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, businessContext, role = 'general', taskType = 'general' } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (!ai) {
      // Fallback response if GEMINI_API_KEY is not set
      res.json({
        reply: generateDeterministicChatReply(message, businessContext),
        isFallback: true,
        modelUsed: 'deterministic-engine',
      });
      return;
    }

    // Model selection per instruction:
    // gemini-3.1-pro-preview for complex tasks
    // gemini-3.5-flash for general tasks
    // gemini-3.1-flash-lite for tasks that should happen fast
    let selectedModel = 'gemini-3.5-flash';
    if (taskType === 'complex' || role === 'finance') {
      selectedModel = 'gemini-3.1-pro-preview';
    } else if (taskType === 'fast') {
      selectedModel = 'gemini-3.1-flash-lite';
    }

    const systemInstruction = buildSystemInstruction(role, businessContext);

    const chatContents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (h.role === 'user' || h.role === 'assistant') {
          chatContents.push({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }],
          });
        }
      }
    }

    chatContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: chatContents,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const reply = response.text || "I'm analyzing your business data. How else can I assist you?";
    res.json({ reply, isFallback: false, modelUsed: selectedModel });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    // Graceful fallback to deterministic engine on any API error
    const fallbackReply = generateDeterministicChatReply(
      req.body.message || '',
      req.body.businessContext || {}
    );
    res.json({
      reply: fallbackReply,
      isFallback: true,
      modelUsed: 'deterministic-fallback',
      errorNotice: 'Processed using local business intelligence.',
    });
  }
});

// API endpoint: Natural language business command parser
app.post('/api/ai/parse-command', async (req, res) => {
  try {
    const { command, products = [], customers = [] } = req.body;

    if (!command) {
      res.status(400).json({ error: 'Command text is required' });
      return;
    }

    if (!ai) {
      const parsed = parseCommandDeterministic(command, products, customers);
      res.json({ parsed, isFallback: true });
      return;
    }

    const productCatalogSummary = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      sellingPrice: p.sellingPrice,
      purchasePrice: p.purchasePrice,
      currentStock: p.currentStock,
    }));

    const customerSummary = customers.map((c: any) => ({
      id: c.id,
      name: c.name,
      outstandingDebt: c.outstandingDebt,
    }));

    const prompt = `Analyze this spoken/typed command by a shopkeeper:
"${command}"

Available Products:
${JSON.stringify(productCatalogSummary, null, 2)}

Available Customers:
${JSON.stringify(customerSummary, null, 2)}

Identify the user intent:
1. "SALE": User is selling items.
2. "EXPENSE": User spent money (e.g. transport, rent, lunch).
3. "PAYMENT": Customer is paying off debt.
4. "RESTOCK": User bought new inventory.
5. "UNCLEAR": Command is ambiguous or incomplete.

Respond ONLY with a valid JSON object matching this schema:
{
  "intent": "SALE" | "EXPENSE" | "PAYMENT" | "RESTOCK" | "UNCLEAR",
  "confidence": number (0.0 to 1.0),
  "clarificationNeeded": boolean,
  "clarificationQuestion": string | null,
  "proposedData": {
    "productId": string | null,
    "productName": string | null,
    "quantity": number | null,
    "unitPrice": number | null,
    "totalAmount": number | null,
    "amountPaid": number | null,
    "paymentMethod": "Cash" | "Mobile Money" | "Credit" | "Bank Transfer" | null,
    "paymentStatus": "Paid" | "Partially Paid" | "Unpaid" | null,
    "customerId": string | null,
    "customerName": string | null,
    "expenseCategory": string | null,
    "expenseDescription": string | null,
    "amount": number | null
  },
  "summary": string
}`;

    // Fast command parsing using gemini-3.1-flash-lite
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    res.json({ parsed: parsedJson, isFallback: false });
  } catch (error: any) {
    console.error('Gemini command parsing error:', error);
    const parsed = parseCommandDeterministic(
      req.body.command || '',
      req.body.products || [],
      req.body.customers || []
    );
    res.json({ parsed, isFallback: true });
  }
});

// Deterministic Chat Fallback
function generateDeterministicChatReply(message: string, context: any = {}): string {
  const q = message.toLowerCase();
  const currency = context.currency || 'CFA';
  const recentSales = context.recentSales || [];
  const products = context.products || [];
  const customers = context.customers || [];
  const metrics = context.metrics || {};

  if (q.includes('profit') || q.includes('how much did i make')) {
    if (recentSales.length > 0) {
      const s = recentSales[0];
      return `From your latest sale (#${s.receiptNumber}), total revenue was ${Number(s.totalAmount || 0).toLocaleString()} ${currency} with an estimated gross profit of ${Number(s.estimatedGrossProfit || 0).toLocaleString()} ${currency}.`;
    }
    return `You haven't recorded any sales yet today. Once you record your first sale, I will calculate and display your revenue and gross profit.`;
  }

  if (q.includes('what should i do') || q.includes('what to do')) {
    const lowStock = products.filter((p: any) => p.currentStock <= p.minStock);
    const debtors = customers.filter((c: any) => c.outstandingDebt > 0);
    const actions: string[] = [];

    if (lowStock.length > 0) {
      actions.push(`• Low Stock Warning: ${lowStock.map((p: any) => `${p.name} (${p.currentStock} remaining)`).join(', ')}.`);
    }
    if (debtors.length > 0) {
      const sum = debtors.reduce((acc: number, c: any) => acc + (c.outstandingDebt || 0), 0);
      actions.push(`• Recover Debt: ${debtors.length} customer(s) owe ${sum.toLocaleString()} ${currency}.`);
    }
    if (actions.length === 0) {
      actions.push(`• Record today's transactions regularly to build real business visibility.`);
      actions.push(`• Check your product prices to maintain healthy profit margins.`);
    }

    return `Here are your prioritized recommendations based on live records:\n\n${actions.join('\n\n')}`;
  }

  if (q.includes('today') || q.includes('performance')) {
    return `Today's Overview:\n• Sales: ${(metrics.todaySales || 0).toLocaleString()} ${currency}\n• Expenses: ${(metrics.todayExpenses || 0).toLocaleString()} ${currency}\n• Estimated Profit: ${(metrics.estimatedProfit || 0).toLocaleString()} ${currency}\n• Customer Debt: ${(metrics.customerDebt || 0).toLocaleString()} ${currency}`;
  }

  return `I'm monitoring your store with ${products.length} products and ${recentSales.length} sales. You can ask me: "What should I do today?", "How much did I make from the sale?", or "Who owes me money?".`;
}

// Deterministic Command Parser Fallback
function parseCommandDeterministic(command: string, products: any[] = [], customers: any[] = []): any {
  const text = command.toLowerCase();
  const numMatch = text.match(/(\d+[\d,\.]*)/g);
  const numbers = numMatch ? numMatch.map((n) => parseInt(n.replace(/,/g, ''), 10)) : [];

  if (text.includes('sold') || text.includes('sell') || text.includes('vendu')) {
    let matchedProduct = null;
    for (const p of products) {
      if (text.includes(p.name.toLowerCase())) {
        matchedProduct = p;
        break;
      }
    }

    let matchedCustomer = null;
    for (const c of customers) {
      if (text.includes(c.name.toLowerCase())) {
        matchedCustomer = c;
        break;
      }
    }

    let qty = 1;
    if (numbers.length >= 2) {
      qty = numbers[0];
    } else if (text.includes('two') || text.includes('2')) qty = 2;
    else if (text.includes('three') || text.includes('3')) qty = 3;

    let totalAmount = numbers.length > 0 ? numbers[numbers.length - 1] : (matchedProduct ? matchedProduct.sellingPrice * qty : 0);

    const isCredit = text.includes('credit') || text.includes('debt') || text.includes('owe');
    const paymentMethod = isCredit ? 'Credit' : 'Cash';

    return {
      intent: 'SALE',
      confidence: matchedProduct ? 0.9 : 0.4,
      clarificationNeeded: !matchedProduct,
      clarificationQuestion: !matchedProduct ? 'Which product did you sell?' : null,
      proposedData: matchedProduct
        ? {
            productId: matchedProduct.id,
            productName: matchedProduct.name,
            quantity: qty,
            unitPrice: matchedProduct.sellingPrice,
            totalAmount: totalAmount || matchedProduct.sellingPrice * qty,
            amountPaid: isCredit ? 0 : totalAmount,
            paymentMethod,
            paymentStatus: isCredit ? 'Unpaid' : 'Paid',
            customerName: matchedCustomer?.name,
            customerId: matchedCustomer?.id,
          }
        : null,
      summary: matchedProduct ? `Sold ${qty}x ${matchedProduct.name} for ${(totalAmount || matchedProduct.sellingPrice * qty).toLocaleString()}` : 'Unrecognized product sale',
    };
  }

  if (text.includes('paid') || text.includes('spent') || text.includes('expense') || text.includes('depense')) {
    const amount = numbers.length > 0 ? numbers[0] : 0;
    let cat = 'Other';
    if (text.includes('transport') || text.includes('taxi')) cat = 'Transport';
    else if (text.includes('rent')) cat = 'Rent';
    else if (text.includes('electric') || text.includes('power')) cat = 'Electricity';
    else if (text.includes('food') || text.includes('lunch')) cat = 'Supplies';

    return {
      intent: 'EXPENSE',
      confidence: amount > 0 ? 0.85 : 0.4,
      clarificationNeeded: amount === 0,
      clarificationQuestion: amount === 0 ? 'How much did you spend?' : null,
      proposedData: {
        amount,
        expenseCategory: cat,
        expenseDescription: command,
      },
      summary: `Expense of ${amount.toLocaleString()} for ${cat}`,
    };
  }

  return {
    intent: 'UNCLEAR',
    confidence: 0.2,
    clarificationNeeded: true,
    clarificationQuestion: 'Could you clarify what transaction you would like to record?',
    proposedData: null,
    summary: 'Command unclear',
  };
}

// Set up server listening, WebSocket for Live API (gemini-3.8-live), and Vite integration
async function startServer() {
  const server = http.createServer(app);

  // Set up WebSocket server for real-time voice conversations (gemini-3.8-live)
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Live API] Client connected to /live WebSocket');

    if (!ai) {
      clientWs.send(
        JSON.stringify({
          error: 'Gemini API key is not configured on the server.',
          interrupted: true,
        })
      );
      return;
    }

    try {
      // Connect to Gemini Live API with model gemini-3.8-live
      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction:
            'You are Kora, an intelligent, helpful voice business assistant for small-business owners. Provide friendly, concise, spoken business advice and answers based on user inquiries.',
        },
        callbacks: {
          onmessage: (message: any) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
      });

      clientWs.on('message', (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          } else if (parsed.text) {
            session.sendRealtimeInput({
              text: parsed.text,
            });
          }
        } catch (err) {
          console.error('[Live API] Error handling client message:', err);
        }
      });

      clientWs.on('close', () => {
        console.log('[Live API] Client disconnected from /live');
        try {
          session.close();
        } catch {}
      });
    } catch (err: any) {
      console.error('[Live API] Failed to start live session:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: err.message || 'Live session failed' }));
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Kora server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
