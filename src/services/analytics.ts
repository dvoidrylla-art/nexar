import {
  Product,
  Sale,
  Expense,
  Customer,
  BusinessInsight,
  ActionPlanItem,
} from '../types';

export class AnalyticsService {
  /**
   * Generates actionable, evidence-based business insights from real records.
   * Never fabricates fake trends or imaginary items.
   */
  static generateInsights(params: {
    businessId: string;
    currency: string;
    products: Product[];
    sales: Sale[];
    expenses: Expense[];
    customers: Customer[];
  }): BusinessInsight[] {
    const { businessId, currency, products, sales, expenses, customers } = params;
    const insights: BusinessInsight[] = [];
    const activeProducts = products.filter((p) => !p.isArchived);

    // 1. LOW STOCK INSIGHT
    const lowStockProducts = activeProducts.filter((p) => p.currentStock <= p.minStock);
    if (lowStockProducts.length > 0) {
      const topLow = lowStockProducts[0];
      insights.push({
        id: 'ins_low_stock_' + topLow.id,
        businessId,
        type: 'LOW_STOCK',
        title: `Low stock alert: ${topLow.name}`,
        description: `${topLow.name} has only ${topLow.currentStock} units remaining (minimum stock threshold is ${topLow.minStock}).`,
        evidence: `Current stock: ${topLow.currentStock}, Minimum set: ${topLow.minStock}, Purchase cost: ${topLow.purchasePrice.toLocaleString()} ${currency}`,
        severity: 'high',
        status: 'new',
        actionLabel: 'Restock Product',
        actionPayload: { productId: topLow.id },
        createdAt: new Date().toISOString(),
      });
    }

    // 2. FAST SELLER / VELOCITY INSIGHT
    // Count items sold in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSales = sales.filter((s) => new Date(s.date) >= sevenDaysAgo);

    const productSalesCount: Record<string, { name: string; qty: number; revenue: number; currentStock: number }> = {};
    for (const sale of recentSales) {
      for (const item of sale.items) {
        if (!productSalesCount[item.productId]) {
          const prod = activeProducts.find((p) => p.id === item.productId);
          productSalesCount[item.productId] = {
            name: item.productName,
            qty: 0,
            revenue: 0,
            currentStock: prod ? prod.currentStock : 0,
          };
        }
        productSalesCount[item.productId].qty += item.quantity;
        productSalesCount[item.productId].revenue += item.subtotal;
      }
    }

    const fastSellers = Object.entries(productSalesCount)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.qty - a.qty);

    if (fastSellers.length > 0 && fastSellers[0].qty >= 2) {
      const best = fastSellers[0];
      const daysOfStockLeft = best.qty > 0 ? Math.round((best.currentStock / (best.qty / 7)) * 10) / 10 : 99;
      insights.push({
        id: 'ins_fast_seller_' + best.id,
        businessId,
        type: 'FAST_SELLER',
        title: `${best.name} is selling fast`,
        description: `You sold ${best.qty} units in the last 7 days. At this rate, stock may run out in ~${Math.max(1, Math.round(daysOfStockLeft))} days.`,
        evidence: `7-day sales: ${best.qty} units (${best.revenue.toLocaleString()} ${currency}). Remaining inventory: ${best.currentStock} units.`,
        severity: best.currentStock <= 10 ? 'high' : 'medium',
        status: 'new',
        actionLabel: 'View Sales',
        actionPayload: { productId: best.id },
        createdAt: new Date().toISOString(),
      });
    }

    // 3. CUSTOMER DEBT ALERT
    const indebtedCustomers = customers.filter((c) => c.outstandingDebt > 0);
    if (indebtedCustomers.length > 0) {
      const totalDebt = indebtedCustomers.reduce((acc, c) => acc + c.outstandingDebt, 0);
      const topDebtor = [...indebtedCustomers].sort((a, b) => b.outstandingDebt - a.outstandingDebt)[0];

      insights.push({
        id: 'ins_customer_debt',
        businessId,
        type: 'CUSTOMER_DEBT',
        title: `${indebtedCustomers.length} customer${indebtedCustomers.length > 1 ? 's owe' : ' owes'} you ${totalDebt.toLocaleString()} ${currency}`,
        description: `Largest balance: ${topDebtor.name} owes ${topDebtor.outstandingDebt.toLocaleString()} ${currency}. Following up can improve your liquid cash flow.`,
        evidence: `Total outstanding receivables: ${totalDebt.toLocaleString()} ${currency} across ${indebtedCustomers.length} account(s).`,
        severity: 'high',
        status: 'new',
        actionLabel: 'View Debtors',
        actionPayload: { filter: 'debt' },
        createdAt: new Date().toISOString(),
      });
    }

    // 4. SLOW INVENTORY (Products with zero sales in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaySales = sales.filter((s) => new Date(s.date) >= thirtyDaysAgo);
    const soldProductIds = new Set<string>();
    for (const s of thirtyDaySales) {
      for (const item of s.items) {
        soldProductIds.add(item.productId);
      }
    }

    const slowProducts = activeProducts.filter(
      (p) => p.currentStock > 0 && !soldProductIds.has(p.id)
    );
    if (slowProducts.length > 0) {
      const tiedUpCapital = slowProducts.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0);
      insights.push({
        id: 'ins_slow_stock',
        businessId,
        type: 'SLOW_SELLER',
        title: `${slowProducts.length} product${slowProducts.length > 1 ? 's have' : ' has'} not sold in 30+ days`,
        description: `You have ${tiedUpCapital.toLocaleString()} ${currency} of capital tied up in slow-moving stock (e.g., ${slowProducts.slice(0, 2).map((p) => p.name).join(', ')}).`,
        evidence: `Unsold products: ${slowProducts.map((p) => p.name).join(', ')}. Capital tied up: ${tiedUpCapital.toLocaleString()} ${currency}.`,
        severity: 'medium',
        status: 'new',
        actionLabel: 'Promote Inventory',
        actionPayload: { slowProductIds: slowProducts.map((p) => p.id) },
        createdAt: new Date().toISOString(),
      });
    }

    // 5. EXPENSE SPIKE DETECTION
    if (expenses.length >= 2) {
      const recentExpenses = expenses.slice(0, 5);
      const topExpense = [...recentExpenses].sort((a, b) => b.amount - a.amount)[0];
      if (topExpense) {
        insights.push({
          id: 'ins_expense_' + topExpense.id,
          businessId,
          type: 'EXPENSE_SPIKE',
          title: `Recent ${topExpense.category} expense: ${topExpense.amount.toLocaleString()} ${currency}`,
          description: `Note: ${topExpense.description || topExpense.category} was recorded. Keep an eye on operating overhead.`,
          evidence: `Recorded on ${topExpense.date.split('T')[0]}, Category: ${topExpense.category}, Payment: ${topExpense.paymentMethod}`,
          severity: 'low',
          status: 'new',
          actionLabel: 'View Expenses',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 6. BUNDLE OPPORTUNITY
    if (activeProducts.length >= 2) {
      const p1 = activeProducts[0];
      const p2 = activeProducts[1];
      const combinedSelling = p1.sellingPrice + p2.sellingPrice;
      const suggestedBundlePrice = Math.round(combinedSelling * 0.9);
      const combinedCost = p1.purchasePrice + p2.purchasePrice;
      const bundleMargin = Math.round(((suggestedBundlePrice - combinedCost) / suggestedBundlePrice) * 100);

      insights.push({
        id: 'ins_bundle_opp',
        businessId,
        type: 'BUNDLE_OPPORTUNITY',
        title: `Bundle opportunity: ${p1.name} + ${p2.name}`,
        description: `Offer a combo package at ~${suggestedBundlePrice.toLocaleString()} ${currency} (10% discount) to increase average cart size while maintaining a strong ${bundleMargin}% margin.`,
        evidence: `Individual sum: ${combinedSelling.toLocaleString()} ${currency}. Combined cost: ${combinedCost.toLocaleString()} ${currency}. Margin: ${bundleMargin}%.`,
        severity: 'low',
        status: 'new',
        actionLabel: 'View Bundle',
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * "What should I do?" Prioritized Recommendations
   */
  static getWhatShouldIDo(params: {
    currency: string;
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    expenses: Expense[];
  }): { title: string; reason: string; supportingData: string; suggestedAction: string }[] {
    const { currency, products, customers } = params;
    const actions: { title: string; reason: string; supportingData: string; suggestedAction: string }[] = [];
    const activeProducts = products.filter((p) => !p.isArchived);

    // 1. Low stock
    const lowStock = activeProducts.filter((p) => p.currentStock <= p.minStock);
    if (lowStock.length > 0) {
      const names = lowStock.map((p) => `${p.name} (${p.currentStock} left)`).join(', ');
      actions.push({
        title: 'Restock critical inventory',
        reason: 'Products at or below their minimum stock threshold will lead to lost sales.',
        supportingData: `${lowStock.length} product(s) low on stock: ${names}.`,
        suggestedAction: 'Contact suppliers today to place a replenishment order.',
      });
    }

    // 2. Customer debt follow-up
    const debtors = customers.filter((c) => c.outstandingDebt > 0);
    if (debtors.length > 0) {
      const totalDebt = debtors.reduce((acc, c) => acc + c.outstandingDebt, 0);
      actions.push({
        title: 'Follow up with customer debts',
        reason: 'Recovering outstanding balances directly increases your available cash flow without adding costs.',
        supportingData: `${debtors.length} customer(s) owe ${totalDebt.toLocaleString()} ${currency}. Top debtor: ${debtors[0].name} (${debtors[0].outstandingDebt.toLocaleString()} ${currency}).`,
        suggestedAction: 'Send a polite payment reminder to the top debtors.',
      });
    }

    // 3. Promote slow inventory
    const slowProducts = activeProducts.filter((p) => p.currentStock > 10);
    if (slowProducts.length > 0) {
      const topSlow = slowProducts[0];
      actions.push({
        title: `Promote or bundle ${topSlow.name}`,
        reason: 'Excess stock ties up business working capital that could be reinvested into faster-turning goods.',
        supportingData: `You have ${topSlow.currentStock} units in stock with ${topSlow.purchasePrice.toLocaleString()} ${currency} cost per unit.`,
        suggestedAction: 'Create a bundle or flash promotion to accelerate turnover.',
      });
    }

    // 4. Default baseline action if business is just starting
    if (actions.length < 3) {
      actions.push({
        title: 'Record all daily transactions immediately',
        reason: 'Accurate profit and stock tracking depends on logging every sale and minor expense in real time.',
        supportingData: 'Consistent data entry empowers Kora to detect trends and margin leakage early.',
        suggestedAction: 'Use the quick +Sale and +Expense buttons whenever business activity occurs.',
      });
    }

    return actions.slice(0, 4);
  }

  /**
   * "Grow My Business" Action Plan Generator
   */
  static generateActionPlans(params: {
    businessId: string;
    currency: string;
    products: Product[];
    customers: Customer[];
  }): ActionPlanItem[] {
    const { businessId, currency, products, customers } = params;
    const plans: ActionPlanItem[] = [];

    // Today
    const lowStock = products.filter((p) => !p.isArchived && p.currentStock <= p.minStock);
    plans.push({
      id: 'plan_today_1',
      businessId,
      timeframe: 'Today',
      title: lowStock.length > 0 ? `Restock ${lowStock[0].name}` : 'Audit top inventory levels',
      reason: lowStock.length > 0 ? 'Stock is nearing depletion' : 'Prevent stockouts on key lines',
      supportingData: lowStock.length > 0 ? `Current stock: ${lowStock[0].currentStock}` : `${products.length} active products in catalog`,
      suggestedAction: 'Check supplier availability and confirm order prices.',
      status: 'Not Started',
    });

    const debtors = customers.filter((c) => c.outstandingDebt > 0);
    plans.push({
      id: 'plan_today_2',
      businessId,
      timeframe: 'Today',
      title: 'Send polite debt reminders',
      reason: 'Improve liquid cash for current operations',
      supportingData: debtors.length > 0 ? `${debtors.length} customers owe ${debtors.reduce((a, c) => a + c.outstandingDebt, 0).toLocaleString()} ${currency}` : 'No active debts',
      suggestedAction: 'Generate WhatsApp reminders from the Customer screen.',
      status: 'Not Started',
    });

    // This Week
    plans.push({
      id: 'plan_week_1',
      businessId,
      timeframe: 'This Week',
      title: 'Introduce a product bundle',
      reason: 'Increases average order value and checkout basket size',
      supportingData: 'Bundling complementary products can lift sales by 15-25%',
      suggestedAction: 'Select two complementary items and test a combined promotional price.',
      status: 'Not Started',
    });

    plans.push({
      id: 'plan_week_2',
      businessId,
      timeframe: 'This Week',
      title: 'Review supplier purchasing costs',
      reason: 'Every 5% reduction in purchase price goes directly to net profit',
      supportingData: 'Compare price quotes from 2 alternate suppliers.',
      suggestedAction: 'Negotiate bulk discounts on your fastest-selling product lines.',
      status: 'Not Started',
    });

    // This Month
    plans.push({
      id: 'plan_month_1',
      businessId,
      timeframe: 'This Month',
      title: 'Liquidate dead stock',
      reason: 'Release trapped capital and free up storage space',
      supportingData: 'Items sitting over 30 days lose retail value and attract dust or damage.',
      suggestedAction: 'Host an end-of-month clearance discount or loyalty giveaway.',
      status: 'Not Started',
    });

    plans.push({
      id: 'plan_month_2',
      businessId,
      timeframe: 'This Month',
      title: 'Re-engage inactive customers',
      reason: 'Selling to an existing customer is 5x cheaper than acquiring a new one',
      supportingData: `${customers.length} registered customers in your database.`,
      suggestedAction: 'Send a special loyalty VIP offer to customers who haven’t purchased recently.',
      status: 'Not Started',
    });

    return plans;
  }

  /**
   * Smart Pricing Analysis
   */
  static calculateSmartPricing(params: {
    purchasePrice: number;
    desiredMarginPercent?: number;
    currentSellingPrice?: number;
  }) {
    const margin = params.desiredMarginPercent || 30; // default 30% margin
    const purchaseCost = params.purchasePrice;

    // Price = Cost / (1 - margin/100)
    const suggestedPrice = Math.round(purchaseCost / (1 - margin / 100));
    const profitPerUnit = suggestedPrice - purchaseCost;
    const actualMargin = Math.round((profitPerUnit / suggestedPrice) * 100);

    return {
      purchaseCost,
      suggestedPrice,
      profitPerUnit,
      marginPercent: actualMargin,
      reasoning: `Based on your purchase cost of ${purchaseCost.toLocaleString()}, setting a price of ${suggestedPrice.toLocaleString()} yields a ${actualMargin}% profit margin (${profitPerUnit.toLocaleString()} profit per unit).`,
    };
  }
}
