import {
  SendTaskSuccessCommand,
  SendTaskFailureCommand,
} from "@aws-sdk/client-sfn";
import { SQSEvent } from "aws-lambda";
import { updateBookQuantity } from "../utils/helpers";
import { Book, Input, RedeemPointsResult, BillCustomerResult } from "../types";
import { sfnClient } from "../utils/clients";

export const sqsWorker = async (event: SQSEvent) => {
  console.log(JSON.stringify(event));
  const record = event.Records[0];
  const body = JSON.parse(record.body) as {
    Input: { book: Book } & Input & RedeemPointsResult & BillCustomerResult;
    Token: string;
  };

  try {
    // find a courier
    const courier = "mb.preply.1@gmail.com";

    // update book quantity
    await updateBookQuantity(body.Input.bookId, body.Input.quantity, "-");

    // Attach courier information to the order
    const command = new SendTaskSuccessCommand({
      taskToken: body.Token,
      output: JSON.stringify({ courier }),
    });

    await sfnClient.send(command);
  } catch (e) {
    console.log("You got an Error");

    console.log(e);

    const command = new SendTaskFailureCommand({
      taskToken: body.Token,
      error: "NoCourierAvailable",
      cause: "No couriers are available",
    });

    await sfnClient.send(command);
  }
};
