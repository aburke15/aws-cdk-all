#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkAllStack } from '../lib/aws-cdk-all-stack';

// whether you synth or deploy, pass all of the flags or else it will fail
const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const awsCdkAllStack = new AwsCdkAllStack(app, 'AwsCdkAllStack', { env });

cdk.Tags.of(awsCdkAllStack).add('Project', 'Parent stack for all other child stacks.');

app.synth();
