import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as types from './utils/types';
import * as path from 'path';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';

export class AburkeTechApiFunctions extends Construct {
  public GetProjectsFunction: lambda.Function;
  public IncrementPageCountFunction: lambda.Function;

  constructor(scope: Construct, name: string) {
    super(scope, name);

    // GitHub Projects
    const gitHubTableSecrect = sm.Secret.fromSecretNameV2(this, 'GitHubTableNameSecret', 'GitHubTableName');
    const gitHubTableName: string = gitHubTableSecrect.secretValue?.unsafeUnwrap()?.toString();
    const gitHubTable: ddb.ITable = ddb.Table.fromTableName(this, 'GitHub', gitHubTableName);

    this.GetProjectsFunction = new lambda.Function(this, 'GetProjectsFunction', {
      timeout: types.timeout,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: `github-get-projects-function.${types.handlerName}`,
      code: lambda.Code.fromAsset(path.join(types.directoryName)),
      environment: {
        TABLE_NAME: gitHubTable.tableName,
      },
    });

    gitHubTable.grantReadData(this.GetProjectsFunction);

    // Cloud Resume/Page Count
    const pageCountTableSecrect = sm.Secret.fromSecretNameV2(this, 'PageCountTableNameSecret', 'PageCountTableName');
    const pageCountTableName: string = pageCountTableSecrect.secretValue?.unsafeUnwrap()?.toString();
    const pageCountTable: ddb.ITable = ddb.Table.fromTableName(this, 'PageCount', pageCountTableName);

    const getPageCountFunction = new lambda.Function(this, 'GetPageCountFunction', {
      timeout: types.timeout,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: `get-page-count-function.${types.handlerName}`,
      code: lambda.Code.fromAsset(path.join(types.directoryName)),
      environment: {
        TABLE_NAME: pageCountTable.tableName,
      },
    });

    this.IncrementPageCountFunction = new lambda.Function(this, 'IncrementPageCountFunction', {
      timeout: types.timeout,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: `increment-page-count-function.${types.handlerName}`,
      code: lambda.Code.fromAsset(path.join(types.directoryName)),
      environment: {
        TABLE_NAME: pageCountTable.tableName,
        DOWNSTREAM: getPageCountFunction.functionName,
      },
    });

    pageCountTable.grantReadWriteData(this.IncrementPageCountFunction);
    pageCountTable.grantReadData(getPageCountFunction);

    getPageCountFunction.grantInvoke(this.IncrementPageCountFunction);
  }
}
