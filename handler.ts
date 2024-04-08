import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import {
  SFNClient,
  SendTaskFailureCommand,
  SendTaskSuccessCommand,
} from "@aws-sdk/client-sfn";
import { SQSEvent } from "aws-lambda";

// TODO: fix error with timed out task
// TODO: create topic, subsription, queue, tables using CloudFormation

const sfnClient = new SFNClient();
const client = new DynamoDBClient({
  region: "eu-north-1",
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

type Book = {
  quantity: number;
  price: number;
  bookId: string;
  title: string;
};

type User = {
  userId: string;
  name: string;
  points: number;
};

type Input = {
  bookId: string;
  quantity: number;
  userId: string;
};

const isBookAvailable = (book: Book, quantity: number) => {
  return book.quantity >= quantity;
};

const deductPoints = async (userId: string, leftPoints: number) => {
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

const updateBookQuantity = async (
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

type CalculateTotalResult = {
  total: number;
};

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

type RedeemPointsResult = { total: { total: number; points: number } };

// {
//   userId: string
//   bookId: string;
//   quantity: number;
//   book: Book
//   total: { total: number, points: number },
// }

export const billCustomer = async () => {
  // bill the customer using stripe

  return "Successfully billed";
};

type BillCustomerResult = {
  billingStatus: string;
  customerBillingError?: string;
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

type SqsWorkerResult = {
  courierStatus: string;
  courierError?: string;
};

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

// {
//   userId: string
//   bookId: string;
//   quantity: number;
//   book: Book
//   total: { total: number, points: number },
//   billingStatus: string
//   customerBillingError: string
//   courierStatus: string
//   courierError: string
// }

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