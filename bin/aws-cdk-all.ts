#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkAllStack } from '../lib/aws-cdk-all-stack';

// whether you synth or deploy, pass all of the flags or else it will fail
const app = new cdk.App();

const awsCdkAllStack = new AwsCdkAllStack(app, 'AwsCdkAllStack');

cdk.Tags.of(awsCdkAllStack).add('Project', 'Parent stack for all other child stacks.');

app.synth();
