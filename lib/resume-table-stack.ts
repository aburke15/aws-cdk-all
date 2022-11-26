import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';

export class ResumeTableStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    const table = new dynamodb.Table(this, 'PageCount', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new sm.Secret(this, 'PageCountTableNameSecret', {
      secretName: 'PageCountTableName',
      secretStringValue: new cdk.SecretValue(table.tableName),
    });
  }
}
