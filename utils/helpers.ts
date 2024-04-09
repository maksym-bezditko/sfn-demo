import { UpdateCommandInput, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../utils/clients";
import { Book } from "../types";

export const isBookAvailable = (book: Book, quantity: number) => {
  return book.quantity >= quantity;
};

export const deductPoints = async (userId: string, leftPoints: number) => {
  const params: UpdateCommandInput = {
    TableName: "userTable",
    Key: {
      userId,
    },
    UpdateExpression: "SET points = :leftPoints",
    ExpressionAttributeValues: {
      ":leftPoints": leftPoints,
    },
  };

  const document = await ddbDocClient.send(new UpdateCommand(params));

  return document;
};

export const updateBookQuantity = async (
  bookId: string,
  quantity: number,
  operator: "+" | "-"
) => {
  const params: UpdateCommandInput = {
    TableName: "bookTable",
    Key: {
      bookId,
    },
    UpdateExpression: `SET quantity = quantity ${operator} :quantity`,
    ExpressionAttributeValues: {
      ":quantity": quantity,
    },
  };

  const document = await ddbDocClient.send(new UpdateCommand(params));

  return document;
};
