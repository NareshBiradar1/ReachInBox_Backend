const express = require('express');
const router = express.Router();

const userAccountControllers = require('../Controllers/userAccountController');


router.get('/:userId', userAccountControllers.retrieveAllUserAccountsByUserId);

module.exports = router;