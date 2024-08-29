const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { connection } = require('./bullmq-config');


// const redisClient = new Redis(); 

const worker = new Worker('openaiResponse-queue', async (job) => {
  // Your task processing logic here
  console.log(`Worker 3 processing job ${job.id}`);
  // send email
}, { 
  connection ,
  concurrency: 10,
});

worker.on('completed', job => {
  console.log(`Worker 3 job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Worker 3 job ${job.id} failed with error ${err.message}`);
});
