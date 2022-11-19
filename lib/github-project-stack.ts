import * as cdk from 'aws-cdk-lib';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';

export class GitHubProjectStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
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
    const rule = new events.Rule(this, 'TODO:', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '*/4',
        month: '*',
        weekDay: '1,3,5,7',
      }),
    });

    // 2 node js functions
    const insertProjectFunction = new lambda.NodejsFunction(this, 'TODO:', {});
    // one for getting projects from github and inserting them into dynamo db
    // one for deleting the projects just in case they are out of date
  }
}
