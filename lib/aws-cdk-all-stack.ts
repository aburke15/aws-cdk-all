import * as cdk from 'aws-cdk-lib';
import { DnsDefinitionStack } from './dns-definition-stack';

export class AwsCdkAllStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    const dnsDefinitionStack = new DnsDefinitionStack(parent, 'DnsDefinitionStack', {
      aburkeTechDomain: parent.node.tryGetContext('abtechdomain'),
      www: parent.node.tryGetContext('www'),
    });

    cdk.Tags.of(dnsDefinitionStack).add('Project', 'Dns Definition Stack for aburke.tech');
  }
}
