import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as types from './utils/types';
import * as path from 'path';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';

export class AburkeTechApiFunctions extends Construct {
  public GetProjectsFunction: lambda.Function;

  constructor(scope: Construct, name: string) {
    super(scope, name);

    const gitHubTableSecrect = sm.Secret.fromSecretNameV2(this, 'GitHubTableNameSecret', 'GitHubTableName');
    const tableName: string = gitHubTableSecrect.secretValue?.unsafeUnwrap()?.toString();
    const table: ddb.ITable = ddb.Table.fromTableName(this, 'GitHub', tableName);

    this.GetProjectsFunction = new lambda.Function(this, 'GitHubGetProjectsFunction', {
      timeout: types.timeout,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: `github-get-projects-function.${types.handlerName}`,
      code: lambda.Code.fromAsset(path.join(types.directoryName)),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantReadData(this.GetProjectsFunction);
  }
}
