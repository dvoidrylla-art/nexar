import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  User as UserIcon,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { Product, Customer, PaymentMethod, PaymentStatus, Sale } from '../types';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  currency: string;
  onRecordSale: (saleParams: {
    items: { productId: string; quantity: number; unitSellingPrice: number }[];
    customerId?: string;
    customerName?: string;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    notes?: string;
  }) => Sale;
  onSaleSuccess: (sale: Sale) => void;
  initialProductId?: string;
  initialCustomerName?: string;
}

export const SaleModal: React.FC<SaleModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  currency,
  onRecordSale,
  onSaleSuccess,
  initialProductId,
  initialCustomerName,
}) => {
  const activeProducts = products.filter((p) => !p.isArchived);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || (activeProducts[0]?.id ?? '')
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [unitSellingPrice, setUnitSellingPrice] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>(initialCustomerName || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Safeguard confirmation state for negative/low stock
  const [showStockWarning, setShowStockWarning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedProduct = activeProducts.find((p) => p.id === selectedProductId);

  // Update default price when product changes
  useEffect(() => {
    if (selectedProduct) {
      setUnitSellingPrice(selectedProduct.sellingPrice);
      const total = selectedProduct.sellingPrice * quantity;
      if (paymentStatus === 'Paid') {
        setAmountPaid(total);
      } else if (paymentStatus === 'Unpaid') {
        setAmountPaid(0);
      }
    }
  }, [selectedProductId, selectedProduct]);

  // Recalculate total
  const totalAmount = unitSellingPrice * quantity;
  const unitPurchasePrice = selectedProduct?.purchasePrice || 0;
  const estimatedProfit = (unitSellingPrice - unitPurchasePrice) * quantity;
  const remainingDebt = Math.max(0, totalAmount - amountPaid);

  // Synchronize amountPaid based on status
  const handleStatusChange = (status: PaymentStatus) => {
    setPaymentStatus(status);
    if (status === 'Paid') {
      setAmountPaid(totalAmount);
    } else if (status === 'Unpaid') {
      setAmountPaid(0);
      setPaymentMethod('Credit');
    } else if (status === 'Partially Paid') {
      if (amountPaid === 0 || amountPaid === totalAmount) {
        setAmountPaid(Math.floor(totalAmount / 2));
      }
    }
  };

  // Select customer from suggestions
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
  };

  // Submit handler
  const handleSubmit = (forceAllowNegativeStock = false) => {
    setErrorMessage(null);

    if (!selectedProduct) {
      setErrorMessage('Please select a product.');
      return;
    }

    if (quantity <= 0) {
      setErrorMessage('Quantity must be at least 1.');
      return;
    }

    if (unitSellingPrice < 0) {
      setErrorMessage('Selling price cannot be negative.');
      return;
    }

    if (amountPaid < 0) {
      setErrorMessage('Amount paid cannot be negative.');
      return;
    }

    // Negative stock safeguard
    if (selectedProduct.currentStock < quantity && !forceAllowNegativeStock) {
      setShowStockWarning(true);
      return;
    }

    try {
      const sale = onRecordSale({
        items: [
          {
            productId: selectedProduct.id,
            quantity,
            unitSellingPrice,
          },
        ],
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim() || undefined,
        amountPaid: Number(amountPaid),
        paymentMethod,
        paymentStatus,
        notes: notes.trim() || undefined,
      });

      onClose();
      onSaleSuccess(sale);
    } catch (err: any) {
      setErrorMessage(err.message || 'We could not save that transaction. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Record Sale</h2>
              <p className="text-[11px] text-slate-400">Inventory and profit update automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.currentStock} in stock ({p.sellingPrice.toLocaleString()} {currency})
                </option>
              ))}
            </select>
            {selectedProduct && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
                <span>
                  Current Stock:{' '}
                  <strong
                    className={
                      selectedProduct.currentStock <= selectedProduct.minStock
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }
                  >
                    {selectedProduct.currentStock} units
                  </strong>
                </span>
                <span>Cost: {selectedProduct.purchasePrice.toLocaleString()} {currency}</span>
              </div>
            )}
          </div>

          {/* Quantity & Unit Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 flex items-center justify-center transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 flex items-center justify-center transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Unit Price ({currency})
              </label>
              <input
                type="number"
                value={unitSellingPrice}
                onChange={(e) => setUnitSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Customer Name (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Jean"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setSelectedCustomerId('');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>

            {/* Quick customer pick chips */}
            {customers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-slate-500 self-center">Existing:</span>
                {customers.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className={`text-[11px] px-2 py-0.5 rounded-lg border transition ${
                      customerName === c.name
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {c.name}
                    {c.outstandingDebt > 0 && ` (owes ${c.outstandingDebt.toLocaleString()})`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment Status & Method */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <label className="block text-xs font-medium text-slate-300">Payment Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Paid', 'Partially Paid', 'Unpaid'] as PaymentStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition ${
                    paymentStatus === status
                      ? status === 'Paid'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : status === 'Partially Paid'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                        : 'bg-rose-950/60 border-rose-500 text-rose-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid & Remaining Debt */}
          <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Amount Paid ({currency})</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                className="w-full py-1.5 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Remaining Debt</label>
              <div
                className={`py-1.5 px-2.5 bg-slate-900 border rounded-lg font-bold text-sm ${
                  remainingDebt > 0
                    ? 'text-rose-400 border-rose-900/60'
                    : 'text-emerald-400 border-slate-700'
                }`}
              >
                {remainingDebt.toLocaleString()} {currency}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Cash', 'Mobile Money', 'Card', 'Credit'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-1 text-[11px] font-medium rounded-xl border transition text-center truncate ${
                    paymentMethod === method
                      ? 'bg-slate-700 border-emerald-500 text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Live Profit Preview */}
          <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-400">Total Revenue</div>
              <div className="text-base font-extrabold text-white">
                {totalAmount.toLocaleString()} {currency}
              </div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400">Estimated Profit</div>
              <div className="text-base font-extrabold text-emerald-400">
                +{estimatedProfit.toLocaleString()} {currency}
              </div>
            </div>
          </div>

          {/* Stock Warning Modal / Confirmation */}
          {showStockWarning && selectedProduct && (
            <div className="p-3 bg-amber-950/80 border border-amber-600 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Low / Negative Stock Warning</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                You have <strong>{selectedProduct.currentStock}</strong> units of {selectedProduct.name} in stock, but are recording a sale of <strong>{quantity}</strong>. Completing this sale will result in <strong>{selectedProduct.currentStock - quantity}</strong> stock.
              </p>
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowStockWarning(false)}
                  className="flex-1 py-1.5 px-2 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition"
                >
                  Confirm Sale Anyway
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20"
          >
            <span>Complete Sale</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
