import {
  BusinessProfile,
  Product,
  Sale,
  Expense,
  Customer,
  CustomerPayment,
  InventoryTransaction,
  BusinessInsight,
  ActionPlanItem,
  User,
  DashboardMetrics,
} from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'kora_user',
  CURRENT_BUSINESS: 'kora_business',
  ALL_BUSINESSES: 'kora_businesses_list',
  PRODUCTS_PREFIX: 'kora_products_',
  SALES_PREFIX: 'kora_sales_',
  EXPENSES_PREFIX: 'kora_expenses_',
  CUSTOMERS_PREFIX: 'kora_customers_',
  PAYMENTS_PREFIX: 'kora_payments_',
  TRANSACTIONS_PREFIX: 'kora_transactions_',
  INSIGHTS_PREFIX: 'kora_insights_',
  ACTION_PLANS_PREFIX: 'kora_action_plans_',
};

export class StorageService {
  // ----------------------------------------------------
  // User & Business Management
  // ----------------------------------------------------
  static getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  static getCurrentBusiness(): BusinessProfile | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_BUSINESS);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static saveCurrentBusiness(business: BusinessProfile): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_BUSINESS, JSON.stringify(business));
    // Also track in list of businesses
    const list = this.getAllBusinesses();
    const idx = list.findIndex((b) => b.id === business.id);
    if (idx >= 0) {
      list[idx] = business;
    } else {
      list.push(business);
    }
    localStorage.setItem(STORAGE_KEYS.ALL_BUSINESSES, JSON.stringify(list));
  }

  static getAllBusinesses(): BusinessProfile[] {
    const data = localStorage.getItem(STORAGE_KEYS.ALL_BUSINESSES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  // ----------------------------------------------------
  // Products
  // ----------------------------------------------------
  static getProducts(businessId: string): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS_PREFIX + businessId);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveProducts(businessId: string, products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS_PREFIX + businessId, JSON.stringify(products));
  }

  static addProduct(
    businessId: string,
    productData: Omit<Product, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>
  ): Product {
    const products = this.getProducts(businessId);
    const newProduct: Product = {
      ...productData,
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      businessId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.push(newProduct);
    this.saveProducts(businessId, products);

    // Record initial stock transaction if stock > 0
    if (newProduct.currentStock > 0) {
      this.recordInventoryTransaction(businessId, {
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'INITIAL_STOCK',
        quantityChange: newProduct.currentStock,
        previousStock: 0,
        newStock: newProduct.currentStock,
        unitCost: newProduct.purchasePrice,
        reason: 'Initial stock intake',
      });
    }

    return newProduct;
  }

  static updateProduct(businessId: string, product: Product): void {
    const products = this.getProducts(businessId);
    const idx = products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      products[idx] = {
        ...product,
        updatedAt: new Date().toISOString(),
      };
      this.saveProducts(businessId, products);
    }
  }

  static archiveProduct(businessId: string, productId: string): void {
    const products = this.getProducts(businessId);
    const idx = products.findIndex((p) => p.id === productId);
    if (idx >= 0) {
      products[idx].isArchived = true;
      products[idx].updatedAt = new Date().toISOString();
      this.saveProducts(businessId, products);
    }
  }

  static restockProduct(
    businessId: string,
    productId: string,
    quantityAdded: number,
    unitCost?: number,
    notes?: string
  ): Product | null {
    const products = this.getProducts(businessId);
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return null;

    const prod = products[idx];
    const prevStock = prod.currentStock;
    const newStock = prevStock + quantityAdded;
    prod.currentStock = newStock;
    if (unitCost !== undefined && unitCost > 0) {
      prod.purchasePrice = unitCost;
    }
    prod.updatedAt = new Date().toISOString();
    products[idx] = prod;
    this.saveProducts(businessId, products);

    this.recordInventoryTransaction(businessId, {
      productId: prod.id,
      productName: prod.name,
      type: 'RESTOCK',
      quantityChange: quantityAdded,
      previousStock: prevStock,
      newStock: newStock,
      unitCost: unitCost || prod.purchasePrice,
      reason: notes || 'Product restocked',
    });

    return prod;
  }

  // ----------------------------------------------------
  // Inventory Transactions (Audit Trail)
  // ----------------------------------------------------
  static getInventoryTransactions(businessId: string): InventoryTransaction[] {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS_PREFIX + businessId);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static recordInventoryTransaction(
    businessId: string,
    tx: Omit<InventoryTransaction, 'id' | 'businessId' | 'createdAt'>
  ): InventoryTransaction {
    const list = this.getInventoryTransactions(businessId);
    const newTx: InventoryTransaction = {
      ...tx,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      businessId,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS_PREFIX + businessId, JSON.stringify(list));
    return newTx;
  }

  // ----------------------------------------------------
  // Sales
  // ----------------------------------------------------
  static getSales(businessId: string): Sale[] {
    const data = localStorage.getItem(STORAGE_KEYS.SALES_PREFIX + businessId);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static recordSale(
    businessId: string,
    params: {
      customerId?: string;
      customerName?: string;
      items: {
        productId: string;
        quantity: number;
        unitSellingPrice?: number;
      }[];
      amountPaid: number;
      paymentMethod: Sale['paymentMethod'];
      date?: string;
      notes?: string;
    }
  ): { sale: Sale; updatedProducts: Product[]; updatedCustomer?: Customer } {
    const products = this.getProducts(businessId);
    const customers = this.getCustomers(businessId);

    // Build enriched items and reduce stock
    let totalRevenue = 0;
    let totalGrossProfit = 0;
    const enrichedItems: Sale['items'] = [];
    const updatedProducts: Product[] = [];

    for (const item of params.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const unitSelling = item.unitSellingPrice ?? prod.sellingPrice;
      const unitCost = prod.purchasePrice;
      const subtotal = unitSelling * item.quantity;
      const grossProfit = (unitSelling - unitCost) * item.quantity;

      totalRevenue += subtotal;
      totalGrossProfit += grossProfit;

      enrichedItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: item.quantity,
        unitSellingPrice: unitSelling,
        unitPurchasePrice: unitCost,
        subtotal,
        grossProfit,
      });

      // Update product inventory
      const prevStock = prod.currentStock;
      const newStock = prevStock - item.quantity;
      prod.currentStock = newStock;
      prod.updatedAt = new Date().toISOString();
      updatedProducts.push(prod);

      // Audit trail
      this.recordInventoryTransaction(businessId, {
        productId: prod.id,
        productName: prod.name,
        type: 'SALE',
        quantityChange: -item.quantity,
        previousStock: prevStock,
        newStock: newStock,
        unitCost: unitCost,
        reason: `Sold to ${params.customerName || 'Walk-in customer'}`,
      });
    }

    // Persist updated products
    this.saveProducts(businessId, products);

    // Calculate payment status & outstanding debt
    const amountPaid = Math.min(params.amountPaid, totalRevenue);
    const outstandingDebt = Math.max(0, totalRevenue - amountPaid);
    let paymentStatus: Sale['paymentStatus'] = 'Paid';
    if (amountPaid === 0) {
      paymentStatus = 'Unpaid';
    } else if (outstandingDebt > 0) {
      paymentStatus = 'Partially Paid';
    }

    // Handle customer debt & purchases
    let matchedCustomer: Customer | undefined;
    if (params.customerName || params.customerId) {
      if (params.customerId) {
        matchedCustomer = customers.find((c) => c.id === params.customerId);
      } else if (params.customerName) {
        matchedCustomer = customers.find(
          (c) => c.name.toLowerCase() === params.customerName!.trim().toLowerCase()
        );
        if (!matchedCustomer) {
          // Auto create customer
          matchedCustomer = this.addCustomer(businessId, {
            name: params.customerName.trim(),
            totalPurchases: 0,
            amountPaid: 0,
            outstandingDebt: 0,
          });
        }
      }

      if (matchedCustomer) {
        matchedCustomer.totalPurchases += totalRevenue;
        matchedCustomer.amountPaid += amountPaid;
        matchedCustomer.outstandingDebt += outstandingDebt;
        matchedCustomer.lastPurchaseDate = params.date || new Date().toISOString();
        this.updateCustomer(businessId, matchedCustomer);
      }
    }

    // Generate receipt number
    const salesList = this.getSales(businessId);
    const receiptNum = `REC-${(salesList.length + 1).toString().padStart(4, '0')}`;

    const newSale: Sale = {
      id: 'sale_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      businessId,
      receiptNumber: receiptNum,
      customerId: matchedCustomer?.id,
      customerName: matchedCustomer?.name || params.customerName,
      items: enrichedItems,
      totalAmount: totalRevenue,
      amountPaid: amountPaid,
      outstandingDebt: outstandingDebt,
      paymentMethod: params.paymentMethod,
      paymentStatus,
      estimatedGrossProfit: totalGrossProfit,
      date: params.date || new Date().toISOString(),
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    salesList.unshift(newSale);
    localStorage.setItem(STORAGE_KEYS.SALES_PREFIX + businessId, JSON.stringify(salesList));

    return { sale: newSale, updatedProducts, updatedCustomer: matchedCustomer };
  }

  // ----------------------------------------------------
  // Expenses
  // ----------------------------------------------------
  static getExpenses(businessId: string): Expense[] {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES_PREFIX + businessId);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static recordExpense(
    businessId: string,
    expenseData: Omit<Expense, 'id' | 'businessId' | 'createdAt'>
  ): Expense {
    const expenses = this.getExpenses(businessId);
    const newExpense: Expense = {
      ...expenseData,
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      businessId,
      createdAt: new Date().toISOString(),
    };
    expenses.unshift(newExpense);
    localStorage.setItem(STORAGE_KEYS.EXPENSES_PREFIX + businessId, JSON.stringify(expenses));
    return newExpense;
  }

  // ----------------------------------------------------
  // Customers & Debt Payments
  // ----------------------------------------------------
  static getCustomers(businessId: string): Customer[] {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS_PREFIX + businessId);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static addCustomer(
    businessId: string,
    customerData: Omit<Customer, 'id' | 'businessId' | 'createdAt'>
  ): Customer {
    const customers = this.getCustomers(businessId);
    const newCustomer: Customer = {
      ...customerData,
      id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      businessId,
      createdAt: new Date().toISOString(),
    };
    customers.push(newCustomer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS_PREFIX + businessId, JSON.stringify(customers));
    return newCustomer;
  }

  static updateCustomer(businessId: string, customer: Customer): void {
    const customers = this.getCustomers(businessId);
    const idx = customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = customer;
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS_PREFIX + businessId, JSON.stringify(customers));
    }
  }

  static getCustomerPayments(businessId: string): CustomerPayment[] {
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS_PREFIX + businessId);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static recordCustomerPayment(
    businessId: string,
    params: {
      customerId: string;
      amount: number;
      paymentMethod: CustomerPayment['paymentMethod'];
      notes?: string;
      date?: string;
    }
  ): { payment: CustomerPayment; customer: Customer } {
    const customers = this.getCustomers(businessId);
    const cust = customers.find((c) => c.id === params.customerId);
    if (!cust) throw new Error('Customer not found');

    cust.amountPaid += params.amount;
    cust.outstandingDebt = Math.max(0, cust.outstandingDebt - params.amount);
    this.updateCustomer(businessId, cust);

    const payment: CustomerPayment = {
      id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      businessId,
      customerId: cust.id,
      customerName: cust.name,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      notes: params.notes,
      date: params.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const payments = this.getCustomerPayments(businessId);
    payments.unshift(payment);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS_PREFIX + businessId, JSON.stringify(payments));

    return { payment, customer: cust };
  }

  // ----------------------------------------------------
  // Insights & Action Plans
  // ----------------------------------------------------
  static getInsights(businessId: string): BusinessInsight[] {
    const data = localStorage.getItem(STORAGE_KEYS.INSIGHTS_PREFIX + businessId);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveInsights(businessId: string, insights: BusinessInsight[]): void {
    localStorage.setItem(STORAGE_KEYS.INSIGHTS_PREFIX + businessId, JSON.stringify(insights));
  }

  static dismissInsight(businessId: string, insightId: string): void {
    const list = this.getInsights(businessId);
    const idx = list.findIndex((i) => i.id === insightId);
    if (idx >= 0) {
      list[idx].status = 'dismissed';
      this.saveInsights(businessId, list);
    }
  }

  static getActionPlans(businessId: string): ActionPlanItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.ACTION_PLANS_PREFIX + businessId);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveActionPlans(businessId: string, plans: ActionPlanItem[]): void {
    localStorage.setItem(STORAGE_KEYS.ACTION_PLANS_PREFIX + businessId, JSON.stringify(plans));
  }

  static updateActionPlanStatus(
    businessId: string,
    planId: string,
    status: ActionPlanItem['status']
  ): void {
    const list = this.getActionPlans(businessId);
    const idx = list.findIndex((p) => p.id === planId);
    if (idx >= 0) {
      list[idx].status = status;
      this.saveActionPlans(businessId, list);
    }
  }

  // ----------------------------------------------------
  // Deterministic Metrics Calculation
  // ----------------------------------------------------
  static calculateMetrics(businessId: string): DashboardMetrics {
    const sales = this.getSales(businessId);
    const expenses = this.getExpenses(businessId);
    const customers = this.getCustomers(businessId);
    const products = this.getProducts(businessId).filter((p) => !p.isArchived);
    const payments = this.getCustomerPayments(businessId);

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's Sales
    const todaySalesList = sales.filter((s) => s.date.startsWith(todayStr));
    const todaySales = todaySalesList.reduce((acc, s) => acc + s.totalAmount, 0);

    // Today's Expenses
    const todayExpensesList = expenses.filter((e) => e.date.startsWith(todayStr));
    const todayExpenses = todayExpensesList.reduce((acc, e) => acc + e.amount, 0);

    // Estimated Profit Today (Gross profit from sales - expenses)
    const todayGrossProfit = todaySalesList.reduce((acc, s) => acc + s.estimatedGrossProfit, 0);
    const estimatedProfit = todayGrossProfit - todayExpenses;

    // Total Customer Debt Outstanding
    const customerDebt = customers.reduce((acc, c) => acc + (c.outstandingDebt || 0), 0);

    // Low stock count (currentStock <= minStock)
    const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;

    // Inventory value
    const inventoryValuePurchase = products.reduce(
      (acc, p) => acc + Math.max(0, p.currentStock) * p.purchasePrice,
      0
    );
    const inventoryValueSelling = products.reduce(
      (acc, p) => acc + Math.max(0, p.currentStock) * p.sellingPrice,
      0
    );

    // Today cash collected (cash/momo/card sales paid + debt payments made today)
    const todaySalesPaid = todaySalesList.reduce((acc, s) => acc + s.amountPaid, 0);
    const todayDebtPayments = payments
      .filter((p) => p.date.startsWith(todayStr))
      .reduce((acc, p) => acc + p.amount, 0);
    const todayCashCollected = todaySalesPaid + todayDebtPayments;

    return {
      todaySales,
      todayExpenses,
      estimatedProfit,
      customerDebt,
      lowStockCount,
      inventoryValuePurchase,
      inventoryValueSelling,
      todayCashCollected,
    };
  }

  // ----------------------------------------------------
  // Demo Data Setup (Matches Requirement #53 Test Case)
  // ----------------------------------------------------
  static loadTestDemoFashionStore(): {
    business: BusinessProfile;
    products: Product[];
    customer: Customer;
  } {
    const businessId = 'biz_demo_fashion';
    const business: BusinessProfile = {
      id: businessId,
      name: 'Demo Fashion Store',
      type: 'Clothing',
      ownerName: 'Amina',
      currency: 'CFA',
      phone: '+221 77 123 4567',
      country: 'Senegal',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };

    const user: User = {
      id: 'user_amina',
      name: 'Amina',
      email: 'amina@demofashion.com',
      role: 'Owner',
      businessId,
    };

    this.setCurrentUser(user);
    this.saveCurrentBusiness(business);

    // Clear existing for this demo id
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.SALES_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.INSIGHTS_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.ACTION_PLANS_PREFIX + businessId);

    // Products from Requirement #53:
    // 1. Blue T-Shirt: purchase 5,000 CFA, selling 8,000 CFA, stock 20
    // 2. Black Jeans: purchase 10,000 CFA, selling 15,000 CFA, stock 10
    const p1 = this.addProduct(businessId, {
      name: 'Blue T-Shirt',
      category: 'Clothing',
      supplier: 'Dakar Textiles',
      purchasePrice: 5000,
      sellingPrice: 8000,
      currentStock: 20,
      minStock: 6,
    });

    const p2 = this.addProduct(businessId, {
      name: 'Black Jeans',
      category: 'Clothing',
      supplier: 'Abidjan Denim',
      purchasePrice: 10000,
      sellingPrice: 15000,
      currentStock: 10,
      minStock: 3,
    });

    // Customer from Requirement #53: Jean
    const customer = this.addCustomer(businessId, {
      name: 'Jean',
      phone: '+221 70 987 6543',
      notes: 'Regular customer',
      totalPurchases: 0,
      amountPaid: 0,
      outstandingDebt: 0,
    });

    return {
      business,
      products: [p1, p2],
      customer,
    };
  }

  // ----------------------------------------------------
  // Export & Reset
  // ----------------------------------------------------
  static exportAllData(businessId: string): string {
    const payload = {
      business: this.getCurrentBusiness(),
      user: this.getCurrentUser(),
      products: this.getProducts(businessId),
      sales: this.getSales(businessId),
      expenses: this.getExpenses(businessId),
      customers: this.getCustomers(businessId),
      payments: this.getCustomerPayments(businessId),
      transactions: this.getInventoryTransactions(businessId),
      insights: this.getInsights(businessId),
      actionPlans: this.getActionPlans(businessId),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(payload, null, 2);
  }

  static clearBusinessData(businessId: string): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.SALES_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.INSIGHTS_PREFIX + businessId);
    localStorage.removeItem(STORAGE_KEYS.ACTION_PLANS_PREFIX + businessId);
  }
}
