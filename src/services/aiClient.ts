import { Product, Customer } from '../types';

export interface ChatResponse {
  reply: string;
  isFallback: boolean;
  modelUsed?: string;
  errorNotice?: string;
}

export type ChatRole = 'general' | 'finance' | 'inventory' | 'debt';
export type TaskType = 'general' | 'complex' | 'fast';

export interface ParsedCommandResult {
  intent: 'SALE' | 'EXPENSE' | 'PAYMENT' | 'RESTOCK' | 'UNCLEAR';
  clarificationNeeded: boolean;
  clarificationQuestion: string | null;
  clarificationOptions?: string[] | null;
  confidence: number;
  proposedData: any | null;
  summary: string;
}

export class AIClient {
  /**
   * Send a multi-turn chat message to Kora with role-specific system instructions
   * and task-specific model selection (gemini-3.1-pro-preview, gemini-3.5-flash, gemini-3.1-flash-lite).
   */
  static async chat(params: {
    message: string;
    history: { role: 'user' | 'assistant'; content: string }[];
    businessContext: any;
    role?: ChatRole;
    taskType?: TaskType;
  }): Promise<ChatResponse> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      return {
        reply: data.reply,
        isFallback: !!data.isFallback,
        modelUsed: data.modelUsed,
        errorNotice: data.errorNotice,
      };
    } catch (err: any) {
      console.warn('AI chat API fallback:', err);
      // Fallback response calculated deterministically
      const q = params.message.toLowerCase();
      const ctx = params.businessContext || {};
      const currency = ctx.currency || 'CFA';
      const recentSales = ctx.recentSales || [];
      const products: Product[] = ctx.products || [];
      const customers: Customer[] = ctx.customers || [];
      const metrics = ctx.metrics || {};

      if (q.includes('how much did i make') || q.includes('profit from the sale') || q.includes('from the sale')) {
        if (recentSales.length > 0) {
          const latestSale = recentSales[0];
          const itemsStr = latestSale.items?.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ') || 'item(s)';
          return {
            reply: `From your latest sale (${itemsStr}), your revenue was ${Number(latestSale.totalAmount || 0).toLocaleString()} ${currency} and your estimated gross profit was ${Number(latestSale.estimatedGrossProfit || 0).toLocaleString()} ${currency} (Amount paid: ${Number(latestSale.amountPaid || 0).toLocaleString()} ${currency}, remaining debt: ${Number(latestSale.outstandingDebt || 0).toLocaleString()} ${currency}).`,
            isFallback: true,
            modelUsed: 'local-analytics',
          };
        }
        return {
          reply: `No sales have been recorded yet today. Record your first sale and I will calculate your profit immediately.`,
          isFallback: true,
          modelUsed: 'local-analytics',
        };
      }

      if (q.includes('what should i do') || q.includes('what to do')) {
        const lowStock = products.filter((p) => p.currentStock <= p.minStock);
        const debtors = customers.filter((c) => c.outstandingDebt > 0);
        const tips: string[] = [];
        if (lowStock.length > 0) {
          tips.push(`• Restock low inventory: ${lowStock.map((p) => `${p.name} (${p.currentStock} left)`).join(', ')}.`);
        }
        if (debtors.length > 0) {
          const sum = debtors.reduce((a, c) => a + c.outstandingDebt, 0);
          tips.push(`• Follow up with debtors: ${debtors.length} customer(s) owe ${sum.toLocaleString()} ${currency}.`);
        }
        if (tips.length === 0) {
          tips.push(`• Record your daily sales to build a solid transaction history.`);
          tips.push(`• Monitor profit margins on your top-performing items.`);
        }
        return {
          reply: `Based on your live business data, consider these prioritized actions:\n\n${tips.join('\n\n')}`,
          isFallback: true,
          modelUsed: 'local-analytics',
        };
      }

      if (q.includes('today') || q.includes('how did i do')) {
        return {
          reply: `Today's figures: Sales: ${(metrics.todaySales || 0).toLocaleString()} ${currency}, Expenses: ${(metrics.todayExpenses || 0).toLocaleString()} ${currency}, Estimated Profit: ${(metrics.estimatedProfit || 0).toLocaleString()} ${currency}, Outstanding Debts: ${(metrics.customerDebt || 0).toLocaleString()} ${currency}.`,
          isFallback: true,
          modelUsed: 'local-analytics',
        };
      }

      return {
        reply: `I have reviewed your business records (${products.length} products, ${recentSales.length} sales). What would you like to check? You can ask about profits, debts, or inventory forecasts.`,
        isFallback: true,
        modelUsed: 'local-analytics',
      };
    }
  }

  /**
   * Parse natural language shopkeeper commands into structured transactions.
   */
  static async parseCommand(
    command: string,
    catalog: Product[],
    customers: Customer[]
  ): Promise<ParsedCommandResult> {
    try {
      const response = await fetch('/api/ai/parse-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, products: catalog, customers }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      return data.parsed;
    } catch (err: any) {
      console.warn('API command parse failed, falling back to local regex engine:', err);
      return this.parseCommandLocally(command, catalog, customers);
    }
  }

  /**
   * Deterministic local fallback parser for offline resilience.
   */
  private static parseCommandLocally(
    command: string,
    catalog: Product[],
    customers: Customer[]
  ): ParsedCommandResult {
    const text = command.toLowerCase();
    const numMatch = text.match(/(\d+[\d,\.]*)/g);
    const numbers = numMatch ? numMatch.map((n) => parseInt(n.replace(/,/g, ''), 10)) : [];

    if (text.includes('sold') || text.includes('sell') || text.includes('vendu')) {
      let matchedProduct: Product | undefined;
      for (const p of catalog) {
        if (text.includes(p.name.toLowerCase())) {
          matchedProduct = p;
          break;
        }
      }

      let matchedCustomer: Customer | undefined;
      for (const c of customers) {
        if (text.includes(c.name.toLowerCase())) {
          matchedCustomer = c;
          break;
        }
      }

      let qty = 1;
      if (numbers.length >= 2) qty = numbers[0];
      else if (text.includes('two') || text.includes(' 2 ')) qty = 2;
      else if (text.includes('three') || text.includes(' 3 ')) qty = 3;

      const totalAmount = numbers.length > 0 ? numbers[numbers.length - 1] : (matchedProduct ? matchedProduct.sellingPrice * qty : 0);
      const isCredit = text.includes('credit') || text.includes('debt') || text.includes('owe');

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
              paymentMethod: isCredit ? 'Credit' : 'Cash',
              paymentStatus: isCredit ? 'Unpaid' : 'Paid',
              customerName: matchedCustomer?.name,
              customerId: matchedCustomer?.id,
            }
          : null,
        summary: matchedProduct
          ? `Record sale of ${qty}x ${matchedProduct.name} for ${(totalAmount || matchedProduct.sellingPrice * qty).toLocaleString()}`
          : 'Could not identify product in sale command.',
      };
    }

    if (text.includes('spent') || text.includes('paid') || text.includes('expense')) {
      const amount = numbers.length > 0 ? numbers[0] : 0;
      let cat = 'Other';
      if (text.includes('transport') || text.includes('taxi')) cat = 'Transport';
      else if (text.includes('rent')) cat = 'Rent';
      else if (text.includes('electricity') || text.includes('power')) cat = 'Electricity';
      else if (text.includes('food') || text.includes('lunch')) cat = 'Supplies';

      return {
        intent: 'EXPENSE',
        confidence: amount > 0 ? 0.85 : 0.3,
        clarificationNeeded: amount === 0,
        clarificationQuestion: amount === 0 ? 'How much was the expense?' : null,
        proposedData: {
          amount,
          expenseCategory: cat,
          expenseDescription: command,
        },
        summary: `Record expense of ${amount.toLocaleString()} for ${cat}`,
      };
    }

    return {
      intent: 'UNCLEAR',
      confidence: 0.2,
      clarificationNeeded: true,
      clarificationQuestion: 'Could you please clarify what transaction you would like to record?',
      proposedData: null,
      summary: 'Command unclear',
    };
  }
}
