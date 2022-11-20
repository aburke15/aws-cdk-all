import * as cdk from 'aws-cdk-lib';

export interface GitHubProject {
  id: string | undefined;
  name: string | undefined;
  createdAt: string | undefined;
  description: string | undefined;
  htmlUrl: string | undefined;
  language: string | undefined;
}

export const timeout: cdk.Duration = cdk.Duration.seconds(30);
export const handlerName: string = 'handler';
export const directoryName: string = 'lambda';
