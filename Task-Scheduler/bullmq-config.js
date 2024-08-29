const { Queue, Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');

// Create a Redis connection
const connection = new Redis({
  host: 'localhost', // or your Redis host
  port: 6379, // default Redis port
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Define queues
const emailQueue = new Queue('email-queue', { connection });
const newEmailsQueue = new Queue('newEmails-queue', { connection });
const openaiResponseQueue = new Queue('openaiResponse-queue', { connection });

// Define schedulers for the queues
// const emailScheduler = new QueueScheduler('email-queue', { connection });
// const newEmailsScheduler = new QueueScheduler('newEmails-queue', { connection });
// const openaiResponseScheduler = new QueueScheduler('openaiResponse-queue', { connection });

module.exports = { 
 emailQueue, 
   newEmailsQueue, 
   openaiResponseQueue,
  
  connection // Export the connection for reuse if needed
};
