import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import type { Handler } from 'aws-lambda';
import type { Message } from './resource';

const sns = new SNSClient({ region: process.env.AWS_REGION });

export const handler: Handler<Message, void> = async (event) => {
    const {title, body, recipient, type} = event;
    const command = new PublishCommand({
        TopicArn: process.env.TOPIC_ARN,
        Message: JSON.stringify({ title, body, recipient, type })
    });

    try {
        const result = await sns.send(command);
        console.log(result);
    } catch (error) {
        console.log(error)
        throw new Error('Failed to publish message', {cause: error});
    }
};