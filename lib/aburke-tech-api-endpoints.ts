import { Construct } from 'constructs';
import * as ag from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface IAburkeTechApiEndpointProps {
  restApi: ag.RestApi;
  getProjectsFunction: lambda.Function;
}

export class AburkeTechApiEndpoints extends Construct {
  constructor(scope: Construct, name: string, props: IAburkeTechApiEndpointProps) {
    super(scope, name);

    props.restApi.root
      .addResource('projects', {
        defaultCorsPreflightOptions: {
          allowOrigins: ['*'],
          allowMethods: ['GET'],
        },
      })
      .addMethod('GET', new ag.LambdaIntegration(props.getProjectsFunction));

    props.restApi.root.addResource('pagecount', {
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET'],
      },
    }); // add method once I have it ready
  }
}
