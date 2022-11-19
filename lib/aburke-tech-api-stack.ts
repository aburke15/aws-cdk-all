import * as cdk from 'aws-cdk-lib';

interface IAburkeTechApiProps extends cdk.StackProps {}

export class AburkeTechApiStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: IAburkeTechApiProps) {
    super(parent, name, props);

    // A record, api.aburke.tech

    // api.aburke.tech/projects -> returns a list of github projects
    // api.aburke.tech/pagecount -> returns the page count of the res.aburke.tech page
    // these endpoints just expose GETs and don't actually perform the logic
  }
}
