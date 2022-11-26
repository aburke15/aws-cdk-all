import * as aws from 'aws-sdk';
import * as lambda from 'aws-lambda';

aws.config.update({ region: 'us-west-2' });

const apiVersion = { apiVersion: '2012-08-10' };
const tableName: string = process.env.TABLE_NAME!;

const response = {
  statusCode: 200,
  headers: { 'Content-Type': 'text/plain' },
  body: {},
};

let ddb = new aws.DynamoDB(apiVersion);

exports.handler = async (event: lambda.APIGatewayEvent) => {
  console.log(JSON.stringify(event, null, 2));

  try {
    if (!ddb) {
      ddb = new aws.DynamoDB(apiVersion);
    }

    const result = await getPageCountFromDynamo(ddb);
    const counter = { count: 0 };

    result?.Items?.forEach((item) => {
      counter.count = parseInt(item.visit_count.N ?? '1');
    });

    response.body = counter;

    return response;
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));
    response.statusCode = 400;

    return response;
  }
};

const getPageCountFromDynamo = (ddb: aws.DynamoDB) => {
  const params: aws.DynamoDB.ScanInput = {
    TableName: tableName,
  };

  return ddb.scan(params).promise();
};
