export type Category = {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
};

export type Expense = {
  id: string;
  amount: number;
  date: string;
  note: string | null;
  receiptUrl: string | null;
  categoryId: string;
  category: Category;
};

export type Budget = {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  spent: number;
  category: Category;
};
