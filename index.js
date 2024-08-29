const express = require('express');
const mongoose = require('mongoose');
const app = express();
const gmailAuthRoutes = require('./Routes/gmailAuthRoutes');

const sendEmailWorker = require('./Task-Scheduler/sendEmailWorker');

const {connectDB} = require('./Database/connectDB');
require('dotenv').config();
const cors = require('cors');
app.use(cors());

const userRoutes = require('./Routes/UserRoutes');
const userAccountRoutes = require('./Routes/UserAccountRoutes');
const gmailnewEmailManage = require('./Routes/gmailnewEmailManage');



app.use(express.json());
// Connect to MongoDB Database


connectDB();

app.use('/users', userRoutes);
app.use('/users/accounts', userAccountRoutes);
app.use('/', gmailAuthRoutes);
app.use('/', gmailnewEmailManage);

app.get('/', (req, res) => {
    res.send("Authorization completed succesfully");
});

const port = 3000 || process.env.PORT;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// sendEmailWorker.run().then(() => {
//     console.log('Worker has started and is running.');
//   }).catch(err => {
//     console.error('Failed to start the worker:', err);
//   });
  