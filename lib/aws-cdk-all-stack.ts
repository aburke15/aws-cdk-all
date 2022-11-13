import * as cdk from 'aws-cdk-lib';

export class AwsCdkAllStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'AwsCdkAllQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
