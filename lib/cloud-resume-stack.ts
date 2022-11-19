import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';

interface ICloudResumeProps extends cdk.StackProps {
  aburkeTechDomain: string;
  res: string;
  env: cdk.Environment;
}

export class CloudResumeStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: ICloudResumeProps) {
    super(parent, name, props);

    const siteDomain: string = `${props.res}.${props.aburkeTechDomain}`;

    new cdk.CfnOutput(this, 'SiteDomain', {
      value: `https://${siteDomain}`,
    });

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'cloudfront-OAI', {
      comment: `OAI for ${name}`,
    });

    // first, create the s3 bucket
    const cloudResumeBucket = new s3.Bucket(this, 'CloudResumeBucket', {
      bucketName: siteDomain,
      websiteIndexDocument: 'index.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: true,
      autoDeleteObjects: true,
    });

    const certArnSecret = sm.Secret.fromSecretNameV2(this, 'AburkeTechCertificateArnSecret', 'AbTechCertArn');
    const certificateArn = certArnSecret.secretValue.unsafeUnwrap().toString();
    const certificate = acm.Certificate.fromCertificateArn(this, 'AburkeTechCertificate', certificateArn);

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificateArn,
    });

    // bucket policy
    cloudResumeBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [cloudResumeBucket.arnForObjects('*')],
        principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      })
    );

    // distribuion
    const distribution = new cloudfront.Distribution(this, 'AburkeTechDistribution', {
      certificate,
      defaultRootObject: 'index.html',
      domainNames: [siteDomain],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin: new S3Origin(cloudResumeBucket),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    // cfn out the distribution id
    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
    });

    // get public hosted zone from lookup via domain name
    const zone = route53.PublicHostedZone.fromLookup(this, 'AburkeTechZone', {
      domainName: props.aburkeTechDomain,
    });

    // route 53 a record
    new route53.ARecord(this, 'ResARecord', {
      recordName: props.res,
      target: route53.RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone,
    });

    // create bucket deployment and location of files to upload
    new s3deploy.BucketDeployment(this, 'AburkeTechBucketDeployment', {
      sources: [s3deploy.Source.asset('./web')],
      destinationBucket: cloudResumeBucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}
