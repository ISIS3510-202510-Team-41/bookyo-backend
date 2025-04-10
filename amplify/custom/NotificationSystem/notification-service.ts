import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { NotificationType } from './publisher';

// Configure the Lambda client
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
const PUBLISHER_FUNCTION_NAME = process.env.PUBLISHER_FUNCTION_NAME;

// Types for notification service
type NotificationOptions = {
  title: string;
  body: string;
  recipient: string; // userId or "*" for broadcast
  type: NotificationType;
  metadata?: Record<string, any>;
};

/**
 * Service to send notifications using the notification system
 */
export class NotificationService {
  /**
   * Send a notification to a specific user
   */
  static async sendToUser(userId: string, options: Omit<NotificationOptions, 'recipient'>) {
    return NotificationService.send({
      ...options,
      recipient: userId
    });
  }

  /**
   * Send a broadcast notification to all users
   */
  static async broadcast(options: Omit<NotificationOptions, 'recipient'>) {
    return NotificationService.send({
      ...options,
      recipient: '*'
    });
  }

  /**
   * Send a new book notification to all users
   */
  static async notifyNewBook(bookTitle: string, authorName: string, bookId: string) {
    return NotificationService.broadcast({
      title: 'New Book Available',
      body: `"${bookTitle}" by ${authorName} is now available!`,
      type: 'NEW_BOOK',
      metadata: { bookId }
    });
  }

  /**
   * Send a book sold notification to the seller
   */
  static async notifyBookSold(sellerId: string, bookTitle: string, bookId: string) {
    return NotificationService.sendToUser(sellerId, {
      title: 'Book Sold',
      body: `Your book "${bookTitle}" has been sold.`,
      type: 'BOOK_SOLD',
      metadata: { bookId }
    });
  }

  /**
   * Base method to send a notification via Lambda invocation
   */
  private static async send(options: NotificationOptions) {
    if (!PUBLISHER_FUNCTION_NAME) {
      throw new Error('PUBLISHER_FUNCTION_NAME environment variable not set');
    }

    const payload = JSON.stringify(options);
    
    const command = new InvokeCommand({
      FunctionName: PUBLISHER_FUNCTION_NAME,
      Payload: Buffer.from(payload),
      InvocationType: 'Event' // Asynchronous invocation
    });
    
    try {
      await lambdaClient.send(command);
      console.log(`Notification sent successfully: ${options.type} to ${options.recipient}`);
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }
}