import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface ICloudResumeProps extends cdk.StackProps {}

export class CloudResumeStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: ICloudResumeProps) {
    super(parent, name, props);

    // first, create the s3 bucket
    const cloudResumeBucket = new s3.Bucket(this, 'CloudResumeBucket', {
      websiteIndexDocument: 'index.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: true,
      autoDeleteObjects: true,
    });
  }
}
