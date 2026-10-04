import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { BusinessProfile, Product, Sale, Expense, Customer, CustomerPayment, User } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

export class FirestoreSyncService {
  /**
   * Save or sync authenticated user in /users/{userId}
   */
  static async syncUserProfile(user: User): Promise<void> {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Save Business profile in /businesses/{businessId}
   */
  static async saveBusiness(business: BusinessProfile, uid: string): Promise<void> {
    const path = `businesses/${business.id}`;
    try {
      await setDoc(doc(db, 'businesses', business.id), {
        ...business,
        ownerUid: uid,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Save Product in /businesses/{businessId}/products/{productId}
   */
  static async saveProduct(businessId: string, product: Product): Promise<void> {
    const path = `businesses/${businessId}/products/${product.id}`;
    try {
      await setDoc(doc(db, 'businesses', businessId, 'products', product.id), product, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Save Sale in /businesses/{businessId}/sales/{saleId}
   */
  static async saveSale(businessId: string, sale: Sale): Promise<void> {
    const path = `businesses/${businessId}/sales/${sale.id}`;
    try {
      await setDoc(doc(db, 'businesses', businessId, 'sales', sale.id), sale, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Save Expense in /businesses/{businessId}/expenses/{expenseId}
   */
  static async saveExpense(businessId: string, expense: Expense): Promise<void> {
    const path = `businesses/${businessId}/expenses/${expense.id}`;
    try {
      await setDoc(doc(db, 'businesses', businessId, 'expenses', expense.id), expense, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Save Customer in /businesses/{businessId}/customers/{customerId}
   */
  static async saveCustomer(businessId: string, customer: Customer): Promise<void> {
    const path = `businesses/${businessId}/customers/${customer.id}`;
    try {
      await setDoc(doc(db, 'businesses', businessId, 'customers', customer.id), customer, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Load entire business dataset from Firestore
   */
  static async loadBusinessData(businessId: string): Promise<{
    business: BusinessProfile | null;
    products: Product[];
    sales: Sale[];
    expenses: Expense[];
    customers: Customer[];
  }> {
    try {
      const bizDoc = await getDoc(doc(db, 'businesses', businessId));
      const business = bizDoc.exists() ? (bizDoc.data() as BusinessProfile) : null;

      const [prodsSnap, salesSnap, expsSnap, custsSnap] = await Promise.all([
        getDocs(collection(db, 'businesses', businessId, 'products')),
        getDocs(collection(db, 'businesses', businessId, 'sales')),
        getDocs(collection(db, 'businesses', businessId, 'expenses')),
        getDocs(collection(db, 'businesses', businessId, 'customers')),
      ]);

      return {
        business,
        products: prodsSnap.docs.map((d) => d.data() as Product),
        sales: salesSnap.docs.map((d) => d.data() as Sale),
        expenses: expsSnap.docs.map((d) => d.data() as Expense),
        customers: custsSnap.docs.map((d) => d.data() as Customer),
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `businesses/${businessId}`);
      return {
        business: null,
        products: [],
        sales: [],
        expenses: [],
        customers: [],
      };
    }
  }
}
