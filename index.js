const express = require('express');
const mongoose = require('mongoose');
const app = express();
const gmailAuthRoutes = require('./Routes/gmailAuthRoutes');
const gmailWatchRoute = require('./Routes/gmailWatchRoute');
const {listenForMessages} = require('./Routes/gmailnewEmailManage');

// const sendEmailWorker = require('./Task-Scheduler/sendEmailWorker');

const {connectDB} = require('./Database/connectDB');
require('dotenv').config();

const cors = require('cors');
app.use(cors());

const userRoutes = require('./Routes/UserRoutes');
const userAccountRoutes = require('./Routes/UserAccountRoutes');
const gmailnewEmailManage = require('./Routes/gmailnewEmailManage');


// const {getEmailWorker} = require('./Task-Scheduler/getEmailWorker');
// const {generateResponseWorker} = require('./Task-Scheduler/generateAiResponseWorker');
// const {sendEmailWorker} = require('./Task-Scheduler/sendEmailWorker');


app.use(express.json());

async function connectDataBase(){
    await connectDB();
}
connectDataBase();



app.use('/users', userRoutes);
app.use('/users/accounts', userAccountRoutes);
app.use('/', gmailAuthRoutes);
app.use('/', gmailnewEmailManage);
app.use('/gmail' , gmailWatchRoute);

app.get('/', (req, res) => {
    res.send("Authorization completed succesfully");
});

const port = 3000 || process.env.PORT;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


  