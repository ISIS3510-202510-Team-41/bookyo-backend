import { Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as url from 'node:url';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export type Message = {
  title: string;
  body: string;
  recipient: string;
  type: 'NEW_BOOK' | 'BOOK_SOLD' | 'SYSTEM_NOTIFICATION';
}

export class CustomNotifications extends Construct {
  public readonly topic: Topic;

  constructor(scope: Construct, id: string) {
    super(scope, id);
  
    this.topic = new Topic(this, 'NotificationTopic');

    // Lambda function
    const publisher = new NodejsFunction(this, 'Publisher', {
      entry: url.fileURLToPath(new URL('publisher.ts', import.meta.url)),
      environment: {
        TOPIC_ARN: this.topic.topicArn
      },
      runtime: Runtime.NODEJS_18_X
    });

    // Grant publish permissions to the lambda function
    this.topic.grantPublish(publisher);
  }
}