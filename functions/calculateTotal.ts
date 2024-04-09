import { Book, Input } from "../types";

export const calculateTotal = async (params: { book: Book } & Input) => {
  const { book, quantity } = params;

  return book.price * quantity;
};

// {
//   userId: string
//   bookId: string;
//   quantity: number;
//   book: Book
//   total: number
// }