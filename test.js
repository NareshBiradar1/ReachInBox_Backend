const { PubSub } = require('@google-cloud/pubsub');

// Creates a client
const pubSubClient = new PubSub();

// The name of your subscription
const subscriptionName = 'projects/galvanized-yeti-434222-f2/subscriptions/gmail-notifications-pull';
const subscription = pubSubClient.subscription(subscriptionName);

// Function to process received messages
const messageHandler = message => {
  console.log(`Received message ${message.id}`);
  console.log(`Data: ${message.data}`);
  console.log(`Attributes: ${JSON.stringify(message.attributes)}`);

  // Acknowledge the message
  message.ack();
};

// Listen for new messages
subscription.on('message', messageHandler);

// Handle errors
subscription.on('error', error => {
  console.error(`Received error: ${error}`);
  process.exit(1);
});
