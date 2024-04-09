import { SendTaskSuccessCommand } from "@aws-sdk/client-sfn";
import { Book, Input, RedeemPointsResult, BillCustomerResult } from "../types";
import { sfnClient } from "../utils/clients";

export const rearmTaskToken = async (body: {
  Input: { book: Book } & Input & RedeemPointsResult & BillCustomerResult;
  Token: string;
}) => {
  const command = new SendTaskSuccessCommand({
    taskToken: body.Token,
    output: JSON.stringify({ rearmStatus: "Successfully rearmed" }),
  });

  await sfnClient.send(command);
};
