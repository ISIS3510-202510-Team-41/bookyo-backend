import { SNSEvent, SNSEventRecord, Context } from 'aws-lambda';
import { v4 as uuid } from 'uuid';

// Simple GraphQL client implementation to avoid dependency issues
class GraphQLClient {
  private url: string;
  private headers: Record<string, string>;
  
  constructor(url: string, options: { headers: Record<string, string> }) {
    this.url = url;
    this.headers = options.headers;
  }
  
  async request(query: string, variables: any): Promise<any> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      body: JSON.stringify({
        query,
        variables
      })
    });
    
    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// GraphQL operations
const CREATE_NOTIFICATION = `
  mutation CreateNotification($input: CreateNotificationInput!) {
    createNotification(input: $input) {
      id
      title
      body
      recipient
      read
      type
    }
  }
`;

// Type for the notification message sent to SNS
type NotificationMessage = {
  title: string;
  body: string;
  recipient: string;
  type: 'NEW_BOOK' | 'BOOK_SOLD' | 'SYSTEM_NOTIFICATION';
};

// Create GraphQL client
const createGraphQLClient = () => {
  const APPSYNC_API_URL = process.env.APPSYNC_API_URL;
  const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY;
  
  if (!APPSYNC_API_URL || !APPSYNC_API_KEY) {
    throw new Error('Missing required environment variables: APPSYNC_API_URL and APPSYNC_API_KEY must be defined');
  }

  // Log the API URL for debugging
  console.log(`Using AppSync API URL: ${APPSYNC_API_URL}`);

  return new GraphQLClient(APPSYNC_API_URL, {
    headers: {
      'x-api-key': APPSYNC_API_KEY,
    },
  });
};

// Process a single SNS record
const processSNSRecord = async (record: SNSEventRecord): Promise<void> => {
  try {
    // Parse the SNS message
    const messageString = record.Sns.Message;
    const message: NotificationMessage = JSON.parse(messageString);
    
    // Validate message
    if (!message.title || !message.body || !message.recipient || !message.type) {
      console.error('Invalid notification message format:', message);
      return;
    }
    
    // Create the GraphQL client
    const client = createGraphQLClient();
    
    // Create notification in DynamoDB via AppSync
    const variables = {
      input: {
        id: uuid(),
        title: message.title,
        body: message.body,
        recipient: message.recipient,
        read: false,
        type: message.type
      }
    };
    
    // Send the mutation
    const result = await client.request(CREATE_NOTIFICATION, variables);
    console.log('Successfully created notification:', result);
  } catch (error) {
    console.error('Error processing SNS record:', error);
    throw error;
  }
};

// Main handler
export const handler = async (event: SNSEvent, context: Context): Promise<void> => {
  console.log('Received SNS event:', JSON.stringify(event, null, 2));
  
  // Process all records in parallel
  const processPromises = event.Records.map(processSNSRecord);
  
  try {
    await Promise.all(processPromises);
    console.log('Successfully processed all notifications');
  } catch (error) {
    console.error('Error processing notifications:', error);
    throw error;
  }
};