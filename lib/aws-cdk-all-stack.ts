import * as cdk from 'aws-cdk-lib';
import { CloudResumeStack } from './cloud-resume-stack';
import { DnsDefinitionStack } from './dns-definition-stack';

export class AwsCdkAllStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    const env: cdk.Environment = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    };

    const aburkeTechDomain: string = parent.node.tryGetContext('abtechdomain');

    const dnsDefinitionStack = new DnsDefinitionStack(parent, 'DnsDefinitionStack', {
      aburkeTechDomain,
      www: parent.node.tryGetContext('www'),
      env,
    });

    cdk.Tags.of(dnsDefinitionStack).add('Project', 'Dns Definition Stack for aburke.tech');

    const cloudResumeStack = new CloudResumeStack(parent, 'CloudResumeStack', {
      aburkeTechDomain,
      res: parent.node.tryGetContext('res'),
      env,
    });

    cdk.Tags.of(cloudResumeStack).add('Project', 'Cloud Resume Stack for my html resume');
  }
}
