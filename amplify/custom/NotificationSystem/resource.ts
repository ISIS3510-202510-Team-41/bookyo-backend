// File: resource.ts - renamed to match imports in backend.ts
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib/core';

// Get the equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type NotificationSystemProps = {
  apiId: string;
  region: string;
}

export class NotificationSystem extends Construct {
  public readonly topic: Topic;

  constructor(scope: Construct, id: string, props: NotificationSystemProps) {
    super(scope, id);
  
    // Create an SNS topic
    this.topic = new Topic(this, 'NotificationTopic');

    // Get the directory for Lambda functions
    const lambdaDir = path.join(__dirname);
    
    // Lambda function to publish messages to SNS
    const publisher = new NodejsFunction(this, 'Publisher', {
      entry: path.join(lambdaDir, 'publisher.ts'),
      environment: {
        TOPIC_ARN: this.topic.topicArn
      },
      runtime: Runtime.NODEJS_22_X
    });

    // Grant publish permissions to the lambda function
    this.topic.grantPublish(publisher);

    // Lambda function to save notifications to DynamoDB via AppSync
    const notificationHandler = new NodejsFunction(this, 'NotificationHandler', {
      entry: path.join(lambdaDir, 'notification-handler.ts'),
      environment: {
        APPSYNC_API_URL: `https://${props.apiId}.appsync-api.${props.region}.amazonaws.com/graphql`,
        APPSYNC_API_KEY: `#{amplify:AppSync:${props.apiId}:ApiKey}`, // This syntax extracts value from Amplify output
      },
      runtime: Runtime.NODEJS_18_X
    });

    // Subscribe the Lambda function to the SNS topic
    this.topic.addSubscription(new LambdaSubscription(notificationHandler));

    // Grant AppSync permissions to the Lambda function
    // Get region and account ID from the stack
    const region = Stack.of(this).region;
    const account = Stack.of(this).account;
    
    notificationHandler.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'appsync:GraphQL'
      ],
      resources: [
        `arn:aws:appsync:${region}:${account}:apis/${props.apiId}/*`
      ]
    }));
  }
}