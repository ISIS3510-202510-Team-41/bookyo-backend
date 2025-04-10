import { NotificationService } from './notification-service';

// Define a simple interface for the resolver
interface ResolverEvent {
  result: any;
  arguments: any;
  identity: any;
  source: any;
  request: any;
  prev: any;
}

/**
 * Post-confirmation hook for when a book is created.
 * This will be triggered after a book is successfully created in the AppSync API.
 */
export const afterBookCreate = async (event: ResolverEvent) => {
  try {
    // Extract book information from the event
    const { title, author, id } = event.result;
    
    // Get the author name from the author object
    const authorName = author?.name || 'Unknown Author';
    
    // Send a broadcast notification about the new book
    await NotificationService.notifyNewBook(title, authorName, id);
    
    console.log(`Notification sent for new book: ${title}`);
    
    // Return the original result unchanged
    return event.result;
  } catch (error) {
    console.error('Error sending notification for new book:', error);
    
    // Even if notification fails, return the original result
    // so the GraphQL operation succeeds
    return event.result;
  }
};

/**
 * This function can be used as a resolver for custom mutations
 * or can be triggered by AWS Lambda functions after book creation.
 */
export const notifyNewBook = async (bookId: string, title: string, authorName: string) => {
  try {
    await NotificationService.notifyNewBook(title, authorName, bookId);
    return { success: true };
  } catch (error) {
    console.error('Error sending book notification:', error);
    return { success: false, error: (error as Error).message };
  }
};