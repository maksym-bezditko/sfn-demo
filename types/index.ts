export type Book = {
  quantity: number;
  price: number;
  bookId: string;
  title: string;
};

export type User = {
  userId: string;
  name: string;
  points: number;
};

export type Input = {
  bookId: string;
  quantity: number;
  userId: string;
};

export type CalculateTotalResult = {
  total: number;
};

export type RedeemPointsResult = { total: { total: number; points: number } };

export type BillCustomerResult = {
  billingStatus: string;
  customerBillingError?: string;
};

export type SqsWorkerResult = {
  courierStatus: string;
  courierError?: string;
};
