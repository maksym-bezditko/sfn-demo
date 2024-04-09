import { UpdateCommandInput, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../utils/clients";
import { Book, Input, RedeemPointsResult, BillCustomerResult } from "../types";

export const restoreRedeemPoints = async (
  params: { book: Book } & Input & RedeemPointsResult & BillCustomerResult
) => {
  const {
    total: { points },
    userId,
  } = params;

  try {
    if (points) {
      const params: UpdateCommandInput = {
        TableName: "userTable",
        Key: {
          userId,
        },
        UpdateExpression: "SET points = points + :points",
        ExpressionAttributeValues: {
          ":points": points,
        },
      };

      await ddbDocClient.send(new UpdateCommand(params));

      return "Points successfully restored";
    }
  } catch (e) {
    throw new Error(e);
  }
};

// {
//   userId: string
//   bookId: string;
//   quantity: number;
//   book: Book
//   total: { total: number, points: number },
//   billingStatus: string
//   customerBillingError: string
// }