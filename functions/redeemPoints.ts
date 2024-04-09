import { GetCommandInput, GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../utils/clients";
import { deductPoints } from "../utils/helpers";
import { Book, Input, CalculateTotalResult, User } from "../types";

export const redeemPoints = async (
  params: { book: Book } & Input & CalculateTotalResult & { userId: string }
) => {
  try {
    const { userId, total } = params;

    const input: GetCommandInput = {
      TableName: "userTable",
      Key: {
        userId,
      },
    };

    const document = await ddbDocClient.send(new GetCommand(input));

    const item = document.Item as User;

    const userPoints = item.points;

    if (userPoints >= total) {
      const leftPoints = userPoints - total;

      await deductPoints(userId, leftPoints);

      return { total: 0, points: total };
    } else {
      throw new Error("Not enough points");
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
// }
