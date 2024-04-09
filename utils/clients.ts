import { SFNClient } from "@aws-sdk/client-sfn";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "eu-north-1",
});
export const ddbDocClient = DynamoDBDocumentClient.from(client);

export const sfnClient = new SFNClient();
