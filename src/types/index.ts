export type Role = 'Owner' | 'Manager' | 'Cashier' | 'Stock Manager' | 'Employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  businessId: string;
}

export type BusinessCategory =
  | 'Clothing'
  | 'Shoes'
  | 'Electronics'
  | 'Phone accessories'
  | 'Cosmetics'
  | 'Grocery'
  | 'General retail'
  | 'Pharmacy'
  | 'Other';

export interface BusinessProfile {
  id: string;
  name: string;
  type: BusinessCategory;
  ownerName: string;
  currency: string; // e.g. 'CFA', '$', '€', '₦'
  phone?: string;
  country?: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku?: string;
  category: string;
  supplier?: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  image?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InventoryTransactionType =
  | 'SALE'
  | 'RESTOCK'
  | 'MANUAL_ADJUSTMENT'
  | 'RETURN'
  | 'DAMAGE'
  | 'INITIAL_STOCK';

export interface InventoryTransaction {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  type: InventoryTransactionType;
  quantityChange: number; // e.g. -2 for sale, +10 for restock
  previousStock: number;
  newStock: number;
  unitCost?: number;
  reason?: string;
  referenceId?: string; // e.g. saleId
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitSellingPrice: number;
  unitPurchasePrice: number;
  subtotal: number;
  grossProfit: number;
}

export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Card' | 'Credit' | 'Other';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid';

export interface Sale {
  id: string;
  businessId: string;
  receiptNumber: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  totalAmount: number;
  amountPaid: number;
  outstandingDebt: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  estimatedGrossProfit: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Transport'
  | 'Electricity'
  | 'Rent'
  | 'Salaries'
  | 'Packaging'
  | 'Supplies'
  | 'Marketing'
  | 'Maintenance'
  | 'Other';

export interface Expense {
  id: string;
  businessId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  paymentMethod: PaymentMethod;
  date: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone?: string;
  notes?: string;
  totalPurchases: number;
  amountPaid: number;
  outstandingDebt: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  date: string;
  createdAt: string;
}

export type InsightType =
  | 'LOW_STOCK'
  | 'FAST_SELLER'
  | 'SLOW_SELLER'
  | 'CUSTOMER_DEBT'
  | 'INACTIVE_CUSTOMER'
  | 'EXPENSE_SPIKE'
  | 'MARGIN_OPPORTUNITY'
  | 'BUNDLE_OPPORTUNITY'
  | 'SALES_TREND'
  | 'CASH_FLOW_RISK'
  | 'RESTOCK_SUGGESTION'
  | 'PROMOTION_OPPORTUNITY';

export interface BusinessInsight {
  id: string;
  businessId: string;
  type: InsightType;
  title: string;
  description: string;
  evidence: string;
  severity: 'high' | 'medium' | 'low';
  status: 'new' | 'viewed' | 'dismissed' | 'completed';
  actionLabel?: string;
  actionPayload?: any;
  createdAt: string;
}

export type ActionPlanTimeframe = 'Today' | 'This Week' | 'This Month';
export type ActionPlanStatus = 'Not Started' | 'In Progress' | 'Done';

export interface ActionPlanItem {
  id: string;
  businessId: string;
  timeframe: ActionPlanTimeframe;
  title: string;
  reason: string;
  supportingData: string;
  suggestedAction: string;
  status: ActionPlanStatus;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  pendingTransaction?: {
    type: 'SALE' | 'EXPENSE' | 'PAYMENT' | 'RESTOCK';
    data: any;
    summary: string;
  };
  clarificationOptions?: string[];
  isFallback?: boolean;
}

export interface DashboardMetrics {
  todaySales: number;
  todayExpenses: number;
  estimatedProfit: number;
  customerDebt: number;
  lowStockCount: number;
  inventoryValuePurchase: number;
  inventoryValueSelling: number;
  todayCashCollected: number;
}
