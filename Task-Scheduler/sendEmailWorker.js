const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { connection } = require('./bullmq-config');



const worker = new Worker('openaiResponse-queue', async (job) => {
  console.log(`Worker 3 processing job ${job.id}`);
}, { 
  connection ,
  concurrency: 100,
});

worker.on('completed', job => {
  console.log(`Worker 3 job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Worker 3 job ${job.id} failed with error ${err.message}`);
});
