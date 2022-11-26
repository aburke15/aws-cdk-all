import * as cdk from 'aws-cdk-lib';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as path from 'path';
import * as types from './utils/types';

interface IGitHubProjectProps extends cdk.StackProps {
  gitHubUser: string;
}

export class GitHubProjectStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: IGitHubProjectProps) {
    super(parent, name, props);

    // 1 dynamo db table
    const table = new ddb.Table(this, 'GitHub', {
      partitionKey: { name: 'id', type: ddb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 1 secret for the github repo table to be ref'd other places
    new sm.Secret(this, 'GitHubTableNameSecret', {
      secretName: 'GitHubTableName',
      secretStringValue: new cdk.SecretValue(table.tableName),
    });

    // 1 cron cloudwatch event which targets the delete and the delete invokes the insert
    const rule = new events.Rule(this, 'GitHubEventRule', {
      schedule: events.Schedule.cron({
        minute: '5',
        hour: '9,21',
        month: '*',
        weekDay: '1,3,5,7',
      }),
    });

    // need github credentials, specifically PAT token, can pass username
    const gitHubPatSecret = sm.Secret.fromSecretNameV2(this, 'GitHubPatSecret', 'GitHubPersonalAccessToken');

    // 2 node js functions, one for getting projects from github and inserting them into dynamo db
    const insertProjectsFunction = new lambda.Function(this, 'GitHubInsertProjectsFunction', {
      timeout: types.timeout,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: `github-insert-projects-function.${types.handlerName}`,
      code: lambda.Code.fromAsset(path.join(types.directoryName)),
      environment: {
        GITHUB_USER: props.gitHubUser,
        GITHUB_PAT: gitHubPatSecret.secretValue.unsafeUnwrap().toString(),
        TABLE_NAME: table.tableName,
      },
    });

    // one for deleting the projects just in case they are out of date
    const deleteProjectsFunction = new lambda.Function(this, 'GitHubDeleteProjectsFunction', {
      timeout: types.timeout,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: `github-delete-projects-function.${types.handlerName}`,
      code: lambda.Code.fromAsset(path.join(types.directoryName)),
      environment: {
        TABLE_NAME: table.tableName,
        DOWNSTREAM_FUNCTION_NAME: insertProjectsFunction.functionName,
      },
    });

    table.grantReadWriteData(deleteProjectsFunction);
    table.grantWriteData(insertProjectsFunction);

    insertProjectsFunction.grantInvoke(deleteProjectsFunction);
    rule.addTarget(new targets.LambdaFunction(deleteProjectsFunction));
  }
}
