import * as cdk from 'aws-cdk-lib';

interface IDnsDefinitionProps extends cdk.StackProps {
  aburkeTechDomain: string;
}

export class DnsDefinitionStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: IDnsDefinitionProps) {
    super(parent, name, props);
  }
}
