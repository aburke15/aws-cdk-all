import * as cdk from 'aws-cdk-lib';
import { AburkeTechApiStack } from './aburke-tech-api-stack';
import { CloudResumeStack } from './cloud-resume-stack';
import { DnsDefinitionStack } from './dns-definition-stack';
import { GitHubProjectStack } from './github-project-stack';
import { ResumeTableStack } from './resume-table-stack';

export class AwsCdkAllStack extends cdk.Stack {
  private props: cdk.StackProps;

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props);

    this.props = props!;

    const aburkeTechDomain: string = parent.node.tryGetContext('abtechdomain');

    const dnsDefinitionStack = new DnsDefinitionStack(parent, 'DnsDefinitionStack', {
      aburkeTechDomain,
      www: parent.node.tryGetContext('www'),
      env: this.props.env,
    });

    cdk.Tags.of(dnsDefinitionStack).add('Project', 'Dns Definition Stack for aburke.tech');

    const cloudResumeStack = new CloudResumeStack(parent, 'CloudResumeStack', {
      aburkeTechDomain,
      res: parent.node.tryGetContext('res'),
      env: this.props.env,
    });

    cdk.Tags.of(cloudResumeStack).add('Project', 'Cloud Resume Stack for my html resume');

    const gitHubProjectStack = new GitHubProjectStack(parent, 'GitHubProjectStack', {
      gitHubUser: parent.node.tryGetContext('githubuser'),
      env: this.props.env,
    });

    cdk.Tags.of(gitHubProjectStack).add('Project', 'GitHub Project Stack inserting and deleting');

    const resumeTableStack = new ResumeTableStack(parent, 'ResumeTableStack', {
      env: this.props.env,
    });

    cdk.Tags.of(resumeTableStack).add('Project', 'Resume Table Stack definition for cloud resume functions');

    const aburkeTechApiStack = new AburkeTechApiStack(parent, 'AburkeTechApiStack', {
      aburkeTechDomain,
      api: parent.node.tryGetContext('api'),
      env: this.props.env,
    });

    cdk.Tags.of(aburkeTechApiStack).add('Project', 'Aburke Tech Api Stack definition and endpoints');
  }
}
