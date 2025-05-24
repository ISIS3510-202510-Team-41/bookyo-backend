// File to be placed in amplify/custom/NotificationSystem/listing-hook.ts

import { NotificationService } from './notification-service';

// Define interface for the resolver event
interface ResolverEvent {
  result: any;
  arguments: any;
  identity: any;
  source: any;
  request: any;
  prev: any;
}

/**
 * Post-confirmation hook for when a listing is created.
 * This will be triggered after a listing is successfully created in the AppSync API.
 */
export const afterListingCreate = async (event: ResolverEvent) => {
  try {
    // Extract listing information from the event
    const { id, price, bookId } = event.result;
    
    // We need to fetch the book details to get the title
    const { Book } = require('../../data/resource'); // Import the Book model from data resources
    const bookResult = await Book.get({ id: bookId });
    
    if (!bookResult) {
      console.error(`Book with ID ${bookId} not found`);
      return event.result;
    }
    
    const bookTitle = bookResult.title || 'Unknown Book';
    
    // Send a broadcast notification about the new listing
    await NotificationService.notifyNewListing(bookTitle, price, id);
    
    console.log(`Notification sent for new listing: ${bookTitle} at price $${price}`);
    
    // Return the original result unchanged
    return event.result;
  } catch (error) {
    console.error('Error sending notification for new listing:', error);
    
    // Even if notification fails, return the original result
    // so the GraphQL operation succeeds
    return event.result;
  }
};

/**
 * This function can be used as a resolver for custom mutations
 * or can be triggered by AWS Lambda functions after listing creation.
 */
export const notifyNewListing = async (bookTitle: string, price: number, listingId: string) => {
  try {
    await NotificationService.notifyNewListing(bookTitle, price, listingId);
    return { success: true };
  } catch (error) {
    console.error('Error sending listing notification:', error);
    return { success: false, error: (error as Error).message };
  }
};