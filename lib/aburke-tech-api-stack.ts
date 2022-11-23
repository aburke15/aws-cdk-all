import * as cdk from 'aws-cdk-lib';
import * as ag from 'aws-cdk-lib/aws-apigateway';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { AburkeTechApiEndpoints } from './aburke-tech-api-endpoints';
import { AburkeTechApiFunctions } from './aburke-tech-api-functions';
import { ApiGateway } from 'aws-cdk-lib/aws-route53-targets';

interface IAburkeTechApiProps extends cdk.StackProps {
  aburkeTechDomain: string;
  api: string;
  env: cdk.Environment;
}

export class AburkeTechApiStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: IAburkeTechApiProps) {
    super(parent, name, props);

    // rest api gateway
    const restApi = new ag.RestApi(this, 'AburkeTechRestApi', {
      restApiName: 'AburkeTechRestApi',
    });

    // functions
    const lambdas = new AburkeTechApiFunctions(this, 'AburkeTechApiFunctions');

    // endpoints
    new AburkeTechApiEndpoints(this, 'AburkeTechApiEndpoints', {
      restApi: restApi,
      getProjectsFunction: lambdas.GetProjectsFunction,
    });

    // certificate
    const certArnSecret = sm.Secret.fromSecretNameV2(this, 'AburkeTechCertArnSecret', 'AbTechCertArnUsWestTwo');
    const certArn = certArnSecret.secretValue?.unsafeUnwrap()?.toString();
    const cert = acm.Certificate.fromCertificateArn(this, 'AburkeTechCertificate', certArn);

    restApi.addDomainName('AburkeTechApiDomain', {
      domainName: `${props.api}.${props.aburkeTechDomain}`,
      certificate: cert,
    });

    // public hosted zone
    const zone = route53.PublicHostedZone.fromLookup(this, 'ZoneForApi', {
      domainName: props.aburkeTechDomain,
    });

    // A Record
    new route53.ARecord(this, 'AburkeTechApiARecord', {
      zone: zone,
      target: route53.RecordTarget.fromAlias(new ApiGateway(restApi)),
      recordName: props.api,
    });
  }
}
