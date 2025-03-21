import * as sns from '@aws-cdk/aws-sns';
import { Construct } from 'constructs';
import * as url from 'node:url';
import { Runtime } from '@aws-cdk/aws-lambda';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';



//SNS configuration
export type Message = {
    title: string;
    body: string;
    recipient: string;
    type: 'NEW_BOOK' | 'BOOK_SOLD' | 'SYSTEM_NOTIFICATION';
  }
  
  export class CustomNotifications extends Construct {
    public readonly topic: sns.Topic;

    constructor(scope: Construct, id: string) {
        super(scope, id);
    
        this.topic = new sns.Topic(this, 'NotificationTopic')

        //Lambda function
        const publisher = new lambda.NodejsFunction(this, 'Publisher', {
            entry: url.fileURLToPath(new URL('publisher.ts', import.meta.url)),
            environment: {
                TOPIC_ARN: this.topic.topicArn
            },
            runtime: Runtime.NODEJS_16_X
        });

        this.topic.grantPublish(publisher);


    }
  
  }