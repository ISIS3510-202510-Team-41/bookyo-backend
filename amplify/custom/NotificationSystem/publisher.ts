import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import type { Handler } from 'aws-lambda';

// Define the types of notifications
export type NotificationType = 'NEW_BOOK' | 'BOOK_SOLD' | 'SYSTEM_NOTIFICATION';

// Message format for notifications
export type NotificationMessage = {
    title: string;
    body: string;
    recipient: string; // userId or "*" for broadcast
    type: NotificationType;
    metadata?: Record<string, any>; // Optional additional data
};

// Initialize the SNS client
const sns = new SNSClient({ region: process.env.AWS_REGION });

/**
 * Lambda handler to publish notifications to SNS
 */
export const handler: Handler<NotificationMessage, void> = async (event) => {
    const { title, body, recipient, type, metadata } = event;
    
    console.log(`Publishing ${type} notification to ${recipient}: ${title}`);
    
    // Validate the event
    if (!title || !body || !recipient || !type) {
        throw new Error('Missing required fields in notification message');
    }
    
    const message = {
        title,
        body,
        recipient,
        type,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
    };
    
    const command = new PublishCommand({
        TopicArn: process.env.TOPIC_ARN,
        Message: JSON.stringify(message),
        MessageAttributes: {
            'type': {
                DataType: 'String',
                StringValue: type
            },
            'recipient': {
                DataType: 'String',
                StringValue: recipient
            }
        }
    });

    try {
        const result = await sns.send(command);
        console.log('Successfully published notification:', result.MessageId);
    } catch (error) {
        console.error('Failed to publish notification:', error);
        throw new Error('Failed to publish notification', { cause: error });
    }
};