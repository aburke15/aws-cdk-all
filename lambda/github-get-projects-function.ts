import * as aws from 'aws-sdk';
import * as api from 'aws-lambda';
import * as dynamo from 'aws-sdk/clients/dynamodb';
import * as types from '../lib/utils/types';
import { PromiseResult } from 'aws-sdk/lib/request';

aws.config.update({ region: 'us-west-2' });

const apiVersion = {
  apiVersion: '2012-08-10',
};

let ddb = new aws.DynamoDB(apiVersion);

const headers = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
} as const;

const response = {
  statusCode: 400,
  headers: headers,
  body: '',
};

const tableName: string = process.env.TABLE_NAME!;

exports.handler = async (event: api.APIGatewayEvent) => {
  console.info(JSON.stringify(event, null, 2));

  try {
    if (!ddb) {
      ddb = new aws.DynamoDB(apiVersion);
    }

    const data = await getProjectsFromDynamo(ddb);
    const status = data.$response.httpResponse.statusCode;

    if (status !== 200) {
      response.statusCode = status;
      response.body = JSON.stringify(data.Items, null, 2);

      return response;
    }

    const projects = toGitHubProjects(data?.Items);
    response.body = JSON.stringify(projects, null, 2);

    return response;
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
    return response;
  }
};

const getProjectsFromDynamo = (ddb: aws.DynamoDB) => {
  const params: dynamo.ScanInput = {
    TableName: tableName,
  };

  return ddb.scan(params).promise();
};

const toGitHubProjects = (itemList?: aws.DynamoDB.ItemList): types.GitHubProject[] => {
  const projects: types.GitHubProject[] = [];

  if (itemList === undefined || itemList === null) return projects;

  itemList.forEach((item) => {
    const project: types.GitHubProject = {
      id: item.id.S,
      name: item.name.S,
      createdAt: item.createdAt.S,
      description: item.description.S,
      htmlUrl: item.htmlUrl.S,
      language: item.language.S,
    };
    projects.push(project);
  });

  return projects;
};
