import {
  Book,
  Input,
  RedeemPointsResult,
  BillCustomerResult,
  SqsWorkerResult,
} from "../types";
import { updateBookQuantity } from "../utils/helpers";

export const restoreQuantity = async (
  params: { book: Book } & Input &
    RedeemPointsResult &
    BillCustomerResult &
    SqsWorkerResult
) => {
  const { bookId, quantity } = params;

  await updateBookQuantity(bookId, quantity, "+");

  return "Quantity restored";
};

// {
//   userId: string
//   bookId: string;
//   quantity: number;
//   book: Book
//   total: { total: number, points: number },
//   billingStatus: string
//   customerBillingError?: string
//   courierStatus: string
//   courierError?: string
//   restoreQuantityStatus: string
// }
