import * as cdk from 'aws-cdk-lib';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

interface IGitHubProjectProps extends cdk.StackProps {
  gitHubUser: string;
  env: cdk.Environment;
}

const timeout: cdk.Duration = cdk.Duration.seconds(30);
const handlerName: string = 'handler';
const directoryName: string = 'lambda';

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
        minute: '0',
        hour: '*/4',
        month: '*',
        weekDay: '1,3,5,7',
      }),
    });

    // need github credentials, specifically PAT token, can pass username
    const gitHubPatSecret = sm.Secret.fromSecretNameV2(this, 'GitHubPatSecret', 'GitHubPersonalAccessToken');

    // 2 node js functions, one for getting projects from github and inserting them into dynamo db
    const insertProjectsFunction = new nodejs.NodejsFunction(this, 'GitHubInsertProjectsFunction', {
      timeout,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: handlerName,
      entry: lambda.Code.fromAsset(directoryName).path + '/github-insert-projects-function.ts',
      environment: {
        GITHUB_USER: props.gitHubUser,
        GITHUB_PAT: gitHubPatSecret.secretValue.unsafeUnwrap().toString(),
        TABLE_NAME: table.tableName,
      },
    });

    // one for deleting the projects just in case they are out of date
    const deleteProjectsFunction = new nodejs.NodejsFunction(this, 'GitHubDeleteProjectsFunction', {
      timeout,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: handlerName,
      entry: lambda.Code.fromAsset(directoryName).path + '/github-delete-projects-function.ts',
      environment: {
        TABLE_NAME: table.tableName,
        DOWNSTREAM_FUNCTION_NAME: insertProjectsFunction.functionName,
      },
    });

    table.grantReadWriteData(deleteProjectsFunction);
    table.grantWriteData(insertProjectsFunction);

    rule.addTarget(new LambdaFunction(deleteProjectsFunction));
  }
}
