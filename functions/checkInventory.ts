import { GetCommandInput, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Book, Input } from "../types";
import { isBookAvailable } from "../utils/helpers";
import { ddbDocClient } from "../utils/clients";

type CheckInventoryResult = Book;

export const checkInventory = async (
  input: Input
): Promise<CheckInventoryResult> => {
  const { bookId, quantity } = input;

  try {
    const input: GetCommandInput = {
      TableName: "bookTable",
      Key: {
        bookId,
      },
    };

    const document = await ddbDocClient.send(new GetCommand(input));

    const item = document.Item as Book;

    if (!item) {
      const bookNotFoundError = new Error("The book is not found");
      bookNotFoundError.name = "BookNotFound";
      throw bookNotFoundError;
    }

    if (isBookAvailable(item, quantity)) {
      return item;
    }

    const bookOutOfStockError = new Error("The book is out of stock");
    bookOutOfStockError.name = "BookOutOfStock";
    throw bookOutOfStockError;
  } catch (e) {
    throw e;
  }
};

// {
//   userId: string
//   bookId: string;
//   quantity: number;
//   book: Book
// }
