const { Queue, Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis({
  host: process.env.REDIS_HOST, 
  port: process.env.REDIS_PORT, 
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
connection.on('connect', () => {
  console.log('Connected to Redis');
});

connection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

const emailQueue = new Queue('email-queue', { connection });
const newEmailsQueue = new Queue('newEmails-queue', { connection });
const openaiResponseQueue = new Queue('openaiResponse-queue', { connection });

// Define schedulers for the queues
// const emailScheduler = new QueueScheduler('email-queue', { connection });
// const newEmailsScheduler = new QueueScheduler('newEmails-queue', { connection });
// const openaiResponseScheduler = new QueueScheduler('openaiResponse-queue', { connection });

async function emptyQueues() {
  try {
    // Empty each queue
    await emailQueue.drain();
    await newEmailsQueue.drain();
    await openaiResponseQueue.drain();
    
    console.log('All queues have been emptied.');
  } catch (error) {
    console.error('Error emptying queues:', error);
  } finally {
    // Close the queues
    // await emailQueue.close();
    // await newEmailsQueue.close();
    // await openaiResponseQueue.close();
  }
}
async function empty(){
  await emptyQueues();
}

// empty();


module.exports = {
  emailQueue, 
   newEmailsQueue, 
   openaiResponseQueue,
  
  connection // Export the connection for reuse if needed
};
