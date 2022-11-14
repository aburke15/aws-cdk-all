import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as r53patterns from 'aws-cdk-lib/aws-route53-patterns';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';

interface IDnsDefinitionProps extends cdk.StackProps {
  aburkeTechDomain: string;
  www: string;
  env: cdk.Environment;
}

export class DnsDefinitionStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: IDnsDefinitionProps) {
    super(parent, name, props);

    // create public hosted zone in route 53 for custom dns
    // need to add nameservers from aws hosted zone to namecheap
    const zone = new route53.PublicHostedZone(this, 'AburkeTechZone', {
      zoneName: props.aburkeTechDomain,
      comment: 'Public hosted zone for the aburke.tech domain.',
    });

    // if the stack is deleted, delete the hosted zone
    zone.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // cfn out the hosted zone id
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: zone.hostedZoneId,
    });

    // create cname for aburke.tech
    const aburkeTechCname = new route53.CnameRecord(this, `AburkeTechCname`, {
      recordName: props.www,
      domainName: 'cname.vercel-dns.com',
      zone,
    });

    // if the stack is destroyed, delete the cname record
    aburkeTechCname.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // cfn out the cname record
    new cdk.CfnOutput(this, 'CnameDomainName', {
      value: aburkeTechCname.domainName,
    });

    // redirect aburke.tech to www.aburke.tech
    new r53patterns.HttpsRedirect(this, 'AburkeTechRedirect', {
      recordNames: [props.aburkeTechDomain],
      targetDomain: `${props.www}.${props.aburkeTechDomain}`,
      zone,
    });

    // create a secret for the public hosted zone id to retrieved elsewhere
    const zoneIdSecret = new sm.Secret(this, 'AburkeTechZoneIdSecret', {
      secretName: 'AburkeTechZoneId',
      secretStringValue: new cdk.SecretValue(zone.hostedZoneId),
    });

    // cfn out the zone id secret arn
    new cdk.CfnOutput(this, 'ZoneIdSecretArn', {
      value: zoneIdSecret.secretArn,
    });
  }
}
