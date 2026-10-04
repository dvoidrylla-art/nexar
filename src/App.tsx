import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { AnalyticsService } from './services/analytics';
import { auth, signInWithGoogle, signOutUser } from './services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FirestoreSyncService } from './services/firestoreSync';
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
  PaymentMethod,
  PaymentStatus,
  ActionPlanStatus,
} from './types';

import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ProductsScreen } from './components/ProductsScreen';
import { SalesScreen } from './components/SalesScreen';
import { CustomersScreen } from './components/CustomersScreen';
import { KoraScreen, KoraSubTab } from './components/KoraScreen';

import { OnboardingModal } from './components/OnboardingModal';
import { SaleModal } from './components/SaleModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ExpenseModal } from './components/ExpenseModal';
import { ProductModal } from './components/ProductModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CustomerModal } from './components/CustomerModal';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { PaymentModal } from './components/PaymentModal';
import { ReportsView } from './components/ReportsView';
import { SettingsModal } from './components/SettingsModal';
import { QuickActionFAB } from './components/QuickActionFAB';
import { ExpensesListModal } from './components/ExpensesListModal';
import { KoraThinkingScreen } from './components/KoraThinkingScreen';

export default function App() {
  // Core Business State
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlanItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todaySales: 0,
    todayExpenses: 0,
    estimatedProfit: 0,
    customerDebt: 0,
    lowStockCount: 0,
    inventoryValuePurchase: 0,
    inventoryValueSelling: 0,
    todayCashCollected: 0,
  });

  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [koraDefaultSubTab, setKoraDefaultSubTab] = useState<KoraSubTab>('chat');
  const [koraInitialPrompt, setKoraInitialPrompt] = useState<string | undefined>();

  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Modals
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentReceiptSale, setCurrentReceiptSale] = useState<Sale | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExpensesListModal, setShowExpensesListModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerForPayment, setCustomerForPayment] = useState<Customer | null>(null);
  const [showReports, setShowReports] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Pre-fill parameters for modals
  const [saleInitialProductId, setSaleInitialProductId] = useState<string | undefined>();
  const [saleInitialCustomerName, setSaleInitialCustomerName] = useState<string | undefined>();
  const [isInitializing, setIsInitializing] = useState(true);

  // 1. Initial Load from persistent storage
  useEffect(() => {
    let currBiz = StorageService.getCurrentBusiness();
    let currUser = StorageService.getCurrentUser();

    if (!currBiz || !currBiz.onboardingCompleted) {
      // If first run, check if user wants onboarding
      setShowOnboarding(true);
    } else {
      loadBusinessData(currBiz.id);
      setBusiness(currBiz);
      setUser(currUser);
    }
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const appUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Store Owner',
          email: fbUser.email || 'owner@kora.app',
          role: 'Owner',
          businessId: business?.id || 'biz_' + fbUser.uid,
        };
        setUser(appUser);
        await FirestoreSyncService.syncUserProfile(appUser);
        if (business) {
          await FirestoreSyncService.saveBusiness(business, fbUser.uid);
        }
      }
    });
    return () => unsub();
  }, [business?.id]);

  // Refresh all state from local storage for a given business ID
  const loadBusinessData = (bizId: string) => {
    const prods = StorageService.getProducts(bizId);
    const sls = StorageService.getSales(bizId);
    const exps = StorageService.getExpenses(bizId);
    const custs = StorageService.getCustomers(bizId);
    const pymts = StorageService.getCustomerPayments(bizId);
    const txs = StorageService.getInventoryTransactions(bizId);
    const calcMetrics = StorageService.calculateMetrics(bizId);

    const currBiz = StorageService.getCurrentBusiness();
    const currCurrency = currBiz?.currency || 'CFA';

    // Refresh dynamic insights
    const genInsights = AnalyticsService.generateInsights({
      businessId: bizId,
      currency: currCurrency,
      products: prods,
      sales: sls,
      expenses: exps,
      customers: custs,
    });
    StorageService.saveInsights(bizId, genInsights);

    // Refresh action plans if empty
    let plans = StorageService.getActionPlans(bizId);
    if (plans.length === 0) {
      plans = AnalyticsService.generateActionPlans({
        businessId: bizId,
        currency: currCurrency,
        products: prods,
        customers: custs,
      });
      StorageService.saveActionPlans(bizId, plans);
    }

    setProducts(prods);
    setSales(sls);
    setExpenses(exps);
    setCustomers(custs);
    setPayments(pymts);
    setTransactions(txs);
    setMetrics(calcMetrics);
    setInsights(genInsights);
    setActionPlans(plans);
  };

  const currentCurrency = business?.currency || 'CFA';

  // ----------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------
  const handleSignInGoogle = async () => {
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser && business) {
        await handleSyncToFirestore();
      }
    } catch (err) {
      console.error('Sign in with Google error:', err);
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await signOutUser();
      setFirebaseUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleSyncToFirestore = async () => {
    if (!business) return;
    try {
      const uid = firebaseUser?.uid || 'anonymous';
      await FirestoreSyncService.saveBusiness(business, uid);
      for (const p of products) {
        await FirestoreSyncService.saveProduct(business.id, p);
      }
      for (const s of sales) {
        await FirestoreSyncService.saveSale(business.id, s);
      }
      for (const e of expenses) {
        await FirestoreSyncService.saveExpense(business.id, e);
      }
      for (const c of customers) {
        await FirestoreSyncService.saveCustomer(business.id, c);
      }
    } catch (err) {
      console.error('Error syncing to Firestore:', err);
    }
  };

  const handleOnboardingComplete = (data: {
    name: string;
    type: any;
    ownerName: string;
    currency: string;
    firstProduct?: any;
  }) => {
    const businessId = 'biz_' + Date.now();
    const newBusiness: BusinessProfile = {
      id: businessId,
      name: data.name,
      type: data.type,
      ownerName: data.ownerName,
      currency: data.currency,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };

    const newUser: User = {
      id: 'user_' + Date.now(),
      name: data.ownerName,
      email: `${data.ownerName.toLowerCase().replace(/\s+/g, '')}@kora.app`,
      role: 'Owner',
      businessId,
    };

    StorageService.saveCurrentBusiness(newBusiness);
    StorageService.setCurrentUser(newUser);

    if (data.firstProduct) {
      StorageService.addProduct(businessId, data.firstProduct);
    }

    setBusiness(newBusiness);
    setUser(newUser);
    setShowOnboarding(false);
    loadBusinessData(businessId);
  };

  // Load the official test scenario (Requirement 53)
  const handleLoadDemoStore = () => {
    setIsInitializing(true);
    setTimeout(() => {
      const { business: demoBiz } = StorageService.loadTestDemoFashionStore();
      setBusiness(demoBiz);
      loadBusinessData(demoBiz.id);
      setShowOnboarding(false);
      setCurrentTab('home');
      setIsInitializing(false);
    }, 850);
  };

  // Record Sale
  const handleRecordSale = (params: {
    items: { productId: string; quantity: number; unitSellingPrice: number }[];
    customerId?: string;
    customerName?: string;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    notes?: string;
  }): Sale => {
    if (!business) throw new Error('No business profile loaded');

    const result = StorageService.recordSale(business.id, {
      ...params,
      date: new Date().toISOString(),
    });

    if (firebaseUser) {
      FirestoreSyncService.saveSale(business.id, result.sale);
    }

    loadBusinessData(business.id);
    return result.sale;
  };

  // Record Expense
  const handleRecordExpense = (expenseData: {
    amount: number;
    category: any;
    description: string;
    paymentMethod: PaymentMethod;
    date: string;
  }) => {
    if (!business) return;
    const newExp = StorageService.recordExpense(business.id, expenseData);
    if (firebaseUser) {
      FirestoreSyncService.saveExpense(business.id, newExp);
    }
    loadBusinessData(business.id);
  };

  // Save / Update Product
  const handleSaveProduct = (productData: any) => {
    if (!business) return;
    if (editingProduct) {
      const updated = {
        ...editingProduct,
        ...productData,
      };
      StorageService.updateProduct(business.id, updated);
      if (firebaseUser) {
        FirestoreSyncService.saveProduct(business.id, updated);
      }
      setEditingProduct(null);
    } else {
      const added = StorageService.addProduct(business.id, productData);
      if (firebaseUser) {
        FirestoreSyncService.saveProduct(business.id, added);
      }
    }
    loadBusinessData(business.id);
  };

  // Restock Product
  const handleRestockProduct = (productId: string, quantity: number, unitCost?: number) => {
    if (!business) return;
    StorageService.restockProduct(business.id, productId, quantity, unitCost);
    loadBusinessData(business.id);
  };

  // Archive Product
  const handleArchiveProduct = (productId: string) => {
    if (!business) return;
    StorageService.archiveProduct(business.id, productId);
    loadBusinessData(business.id);
  };

  // Add Customer
  const handleAddCustomer = (customerData: any) => {
    if (!business) return;
    const addedCust = StorageService.addCustomer(business.id, {
      ...customerData,
      totalPurchases: 0,
      amountPaid: 0,
      outstandingDebt: 0,
    });
    if (firebaseUser) {
      FirestoreSyncService.saveCustomer(business.id, addedCust);
    }
    loadBusinessData(business.id);
  };

  // Record Customer Payment (Debt payoff)
  const handleRecordCustomerPayment = (params: {
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => {
    if (!business) return;
    StorageService.recordCustomerPayment(business.id, params);
    loadBusinessData(business.id);
  };

  // Dismiss insight
  const handleDismissInsight = (insightId: string) => {
    if (!business) return;
    StorageService.dismissInsight(business.id, insightId);
    setInsights((prev) => prev.filter((i) => i.id !== insightId));
  };

  // Update action plan status
  const handleUpdateActionPlanStatus = (planId: string, status: ActionPlanStatus) => {
    if (!business) return;
    StorageService.updateActionPlanStatus(business.id, planId, status);
    setActionPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, status } : p))
    );
  };

  // Update business profile
  const handleUpdateBusiness = (updated: Partial<BusinessProfile>) => {
    if (!business) return;
    const updatedBiz: BusinessProfile = { ...business, ...updated };
    StorageService.saveCurrentBusiness(updatedBiz);
    setBusiness(updatedBiz);
    loadBusinessData(updatedBiz.id);
  };

  // Export Data JSON
  const handleExportData = () => {
    if (!business) return;
    const jsonStr = StorageService.exportAllData(business.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kora_backup_${business.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear / Reset business data
  const handleClearData = () => {
    if (!business) return;
    StorageService.clearBusinessData(business.id);
    loadBusinessData(business.id);
  };

  // Kora AI natural command executors
  const handleExecutePendingSale = (data: any) => {
    try {
      handleRecordSale({
        items: [
          {
            productId: data.productId,
            quantity: data.quantity || 1,
            unitSellingPrice: data.unitPrice,
          },
        ],
        customerName: data.customerName,
        customerId: data.customerId,
        amountPaid: data.amountPaid ?? data.totalAmount,
        paymentMethod: data.paymentMethod || 'Cash',
        paymentStatus: data.paymentStatus || 'Paid',
      });
    } catch (e: any) {
      console.error('Failed to execute AI proposed sale:', e);
    }
  };

  const handleExecutePendingExpense = (data: any) => {
    handleRecordExpense({
      amount: data.amount,
      category: data.expenseCategory || 'Other',
      description: data.expenseDescription || 'Natural command expense',
      paymentMethod: 'Cash',
      date: new Date().toISOString(),
    });
  };

  const handleExecutePendingPayment = (data: any) => {
    if (data.customerId) {
      handleRecordCustomerPayment({
        customerId: data.customerId,
        amount: data.amount,
        paymentMethod: 'Cash',
      });
    }
  };

  if (isInitializing) {
    return (
      <KoraThinkingScreen
        title="KORA is starting..."
        subtitle="Turning your ideas into real opportunities"
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        business={business}
        user={user}
        firebaseUser={firebaseUser}
        onOpenSettings={() => setShowSettings(true)}
        onOpenReports={() => setShowReports(true)}
        onLoadDemoStore={handleLoadDemoStore}
        onSignInGoogle={handleSignInGoogle}
        onSignOut={handleSignOutGoogle}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentTab === 'home' && (
          <HomeScreen
            business={business}
            metrics={metrics}
            currency={currentCurrency}
            insights={insights}
            recentSales={sales}
            recentExpenses={expenses}
            recentPayments={payments}
            onOpenSaleModal={() => {
              setSaleInitialProductId(undefined);
              setSaleInitialCustomerName(undefined);
              setShowSaleModal(true);
            }}
            onOpenExpenseModal={() => setShowExpenseModal(true)}
            onOpenProductModal={() => {
              setEditingProduct(null);
              setShowProductModal(true);
            }}
            onOpenCustomerModal={() => setShowCustomerModal(true)}
            onOpenWhatShouldIDo={() => {
              setKoraDefaultSubTab('what_to_do');
              setCurrentTab('kora');
            }}
            onOpenKoraSubTab={(sub) => {
              setKoraDefaultSubTab(sub);
              setCurrentTab('kora');
            }}
            onOpenKoraWithPrompt={(prompt) => {
              setKoraInitialPrompt(prompt);
              setKoraDefaultSubTab('chat');
              setCurrentTab('kora');
            }}
            onDismissInsight={handleDismissInsight}
            onViewInsight={(ins) => {
              if (ins.type === 'LOW_STOCK' && ins.actionPayload?.productId) {
                const prod = products.find((p) => p.id === ins.actionPayload.productId);
                if (prod) {
                  setSelectedProduct(prod);
                  setShowProductDetailModal(true);
                  return;
                }
              }
              if (ins.type === 'CUSTOMER_DEBT') {
                setCurrentTab('customers');
                return;
              }
              setKoraDefaultSubTab('ideas');
              setCurrentTab('kora');
            }}
          />
        )}

        {currentTab === 'products' && (
          <ProductsScreen
            products={products}
            currency={currentCurrency}
            onOpenAddProduct={() => {
              setEditingProduct(null);
              setShowProductModal(true);
            }}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              setShowProductDetailModal(true);
            }}
            onQuickRestock={(p) => {
              setSelectedProduct(p);
              setShowProductDetailModal(true);
            }}
          />
        )}

        {currentTab === 'sales' && (
          <SalesScreen
            sales={sales}
            currency={currentCurrency}
            onOpenRecordSale={() => {
              setSaleInitialProductId(undefined);
              setSaleInitialCustomerName(undefined);
              setShowSaleModal(true);
            }}
            onSelectSale={(s) => {
              setCurrentReceiptSale(s);
              setShowReceiptModal(true);
            }}
            onOpenKoraWithPrompt={(prompt) => {
              setKoraInitialPrompt(prompt || 'What should I do today?');
              setKoraDefaultSubTab('chat');
              setCurrentTab('kora');
            }}
          />
        )}

        {currentTab === 'customers' && (
          <CustomersScreen
            customers={customers}
            currency={currentCurrency}
            onOpenAddCustomer={() => setShowCustomerModal(true)}
            onSelectCustomer={(c) => {
              setSelectedCustomer(c);
              setShowCustomerDetailModal(true);
            }}
          />
        )}

        {currentTab === 'kora' && (
          <KoraScreen
            business={business}
            products={products}
            customers={customers}
            sales={sales}
            expenses={expenses}
            metrics={metrics}
            currency={currentCurrency}
            insights={insights}
            actionPlans={actionPlans}
            defaultSubTab={koraDefaultSubTab}
            initialPrompt={koraInitialPrompt}
            onDismissInsight={handleDismissInsight}
            onUpdateActionPlanStatus={handleUpdateActionPlanStatus}
            onExecutePendingSale={handleExecutePendingSale}
            onExecutePendingExpense={handleExecutePendingExpense}
            onExecutePendingPayment={handleExecutePendingPayment}
            onNavigateAction={(title) => {
              if (title.toLowerCase().includes('restock')) {
                setCurrentTab('products');
              } else if (title.toLowerCase().includes('debt')) {
                setCurrentTab('customers');
              } else {
                setKoraDefaultSubTab('grow');
              }
            }}
          />
        )}
      </main>

      {/* Floating Quick Action Button (Requirement 6) */}
      <QuickActionFAB
        onRecordSale={() => {
          setSaleInitialProductId(undefined);
          setSaleInitialCustomerName(undefined);
          setShowSaleModal(true);
        }}
        onRecordExpense={() => setShowExpenseModal(true)}
        onAddProduct={() => {
          setEditingProduct(null);
          setShowProductModal(true);
        }}
        onAddCustomer={() => setShowCustomerModal(true)}
      />

      {/* Bottom Mobile Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'kora') {
            setKoraDefaultSubTab('chat');
          }
          setCurrentTab(tab);
        }}
        badgeCount={metrics.lowStockCount + (metrics.customerDebt > 0 ? 1 : 0)}
      />

      {/* ----------------- MODALS ----------------- */}

      {/* 1. Onboarding */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* 2. Record Sale Modal */}
      <SaleModal
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        products={products}
        customers={customers}
        currency={currentCurrency}
        initialProductId={saleInitialProductId}
        initialCustomerName={saleInitialCustomerName}
        onRecordSale={handleRecordSale}
        onSaleSuccess={(newSale) => {
          setCurrentReceiptSale(newSale);
          setShowReceiptModal(true);
        }}
      />

      {/* 3. Sale Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        sale={currentReceiptSale}
        currency={currentCurrency}
        businessName={business?.name || 'My Store'}
        onClose={() => {
          setShowReceiptModal(false);
          setCurrentReceiptSale(null);
          setShowProductDetailModal(false);
          setShowCustomerDetailModal(false);
        }}
        onNewSale={() => {
          setShowReceiptModal(false);
          setCurrentReceiptSale(null);
          setShowProductDetailModal(false);
          setShowCustomerDetailModal(false);
          setSaleInitialProductId(undefined);
          setSaleInitialCustomerName(undefined);
          setShowSaleModal(true);
        }}
      />

      {/* 4. Record Expense Modal */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        currency={currentCurrency}
        onRecordExpense={handleRecordExpense}
      />

      {/* 4b. Expenses List Modal with Empty State */}
      <ExpensesListModal
        isOpen={showExpensesListModal}
        onClose={() => setShowExpensesListModal(false)}
        currency={currentCurrency}
        expenses={expenses}
        onOpenAddExpense={() => setShowExpenseModal(true)}
      />

      {/* 5. Add / Edit Product Modal */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        currency={currentCurrency}
        initialProduct={editingProduct}
        onSaveProduct={handleSaveProduct}
      />

      {/* 6. Product Details Modal */}
      <ProductDetailModal
        product={selectedProduct}
        currency={currentCurrency}
        sales={sales}
        transactions={transactions}
        onClose={() => setShowProductDetailModal(false)}
        onEdit={(p) => {
          setEditingProduct(p);
          setShowProductModal(true);
        }}
        onRestock={handleRestockProduct}
        onSell={(p) => {
          setShowProductDetailModal(false);
          setSaleInitialProductId(p.id);
          setShowSaleModal(true);
        }}
        onArchive={handleArchiveProduct}
      />

      {/* 7. Add Customer Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onAddCustomer={handleAddCustomer}
      />

      {/* 8. Customer Details Modal */}
      <CustomerDetailModal
        customer={selectedCustomer}
        currency={currentCurrency}
        businessName={business?.name || 'My Store'}
        sales={sales}
        payments={payments}
        onClose={() => setShowCustomerDetailModal(false)}
        onOpenRecordPayment={(cust) => {
          setCustomerForPayment(cust);
          setShowPaymentModal(true);
        }}
        onOpenRecordSale={(cust) => {
          setShowCustomerDetailModal(false);
          setSaleInitialCustomerName(cust.name);
          setShowSaleModal(true);
        }}
      />

      {/* 9. Record Customer Debt Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        customer={customerForPayment}
        currency={currentCurrency}
        onRecordPayment={handleRecordCustomerPayment}
      />

      {/* 10. Reports View */}
      <ReportsView
        isOpen={showReports}
        onClose={() => setShowReports(false)}
        currency={currentCurrency}
        sales={sales}
        expenses={expenses}
        products={products}
        customers={customers}
      />

      {/* 11. Settings & Tools Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        business={business}
        user={user}
        firebaseUser={firebaseUser}
        onUpdateBusiness={handleUpdateBusiness}
        onLoadDemoStore={handleLoadDemoStore}
        onExportData={handleExportData}
        onClearData={handleClearData}
        onSignInGoogle={handleSignInGoogle}
        onSignOut={handleSignOutGoogle}
        onSyncFirestore={handleSyncToFirestore}
      />
    </div>
  );
}
