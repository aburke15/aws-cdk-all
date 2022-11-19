import * as aws from 'aws-sdk';
import * as lambda from 'aws-lambda';
import * as dynamo from 'aws-sdk/clients/dynamodb';

aws.config.update({ region: 'us-west-2' });

const apiVersion = {
  apiVersion: '2012-08-10',
};

const functionName: string = process.env.DOWNSTREAM_FUNCTION_NAME!;
const tableName: string = process.env.TABLE_NAME!;

let ddb = new aws.DynamoDB(apiVersion);
let func = new aws.Lambda();

exports.handler = async (event: lambda.APIGatewayEvent) => {
  console.log(JSON.stringify(event, null, 2));
  try {
    if (!ddb) {
      ddb = new aws.DynamoDB(apiVersion);
    }
    if (!func) {
      func = new aws.Lambda();
    }

    const data = await getProjectsFromDynamo(ddb);
    await deleteProjectsFromDynamo(ddb, data);

    await func
      .invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(event, null, 2),
      })
      .promise();
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
  }
};

const getProjectsFromDynamo = (ddb: aws.DynamoDB) => {
  const params: dynamo.ScanInput = {
    TableName: tableName,
  };

  return ddb.scan(params).promise();
};

const deleteProjectsFromDynamo = async (ddb: aws.DynamoDB, data: dynamo.ScanOutput): Promise<void> => {
  const items = data.Items?.map((item) => {
    return ddb
      .deleteItem({
        TableName: tableName,
        Key: {
          id: { S: item.id.S },
          createdAt: { S: item.createdAt.S },
        },
      })
      .promise();
  });

  try {
    await Promise.all(items!);
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
  }
};
