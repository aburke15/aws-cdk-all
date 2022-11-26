import * as aws from 'aws-sdk';
import * as api from 'aws-lambda';

aws.config.update({ region: 'us-west-2' });

const apiVersion = { apiVersion: '2012-08-10' };
const tableName: string = process.env.TABLE_NAME!;
const functionName: string = process.env.DOWNSTREAM!;

const headers = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
} as const;

let ddb = new aws.DynamoDB(apiVersion);
let lambda = new aws.Lambda();

exports.handler = async (event: api.APIGatewayEvent) => {
  console.log(JSON.stringify(event, null, 2));

  try {
    if (!ddb) {
      ddb = new aws.DynamoDB(apiVersion);
    }
    if (!lambda) {
      lambda = new aws.Lambda();
    }

    await ddb
      .updateItem({
        TableName: tableName,
        Key: { id: { N: '1' } },
        UpdateExpression: 'ADD visit_count :incr',
        ExpressionAttributeValues: { ':incr': { N: '1' } },
      })
      .promise();

    const response = await lambda
      .invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(event, null, 2),
      })
      .promise();

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(response?.Payload, null, 2),
    };
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));

    return {
      statusCode: 400,
      headers: headers,
      body: {},
    };
  }
};
