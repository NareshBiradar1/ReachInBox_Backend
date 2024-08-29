const userAccountModel = require('../Models/UserAccountModel');
const {connectDB} = require('../Database/connectDB');
const e = require('express');

require('dotenv').config();

exports.saveUserToDb = async (userAccountDetails) => {
    try {
        let accountType = 'OUTLOOK';
        if (userAccountDetails.iss === 'https://accounts.google.com') {
            accountType = 'GMAIL';
        }
        const userAccount = new userAccountModel({
            userId: userAccountDetails.userId,
            accountType: accountType,
            accountEmail: userAccountDetails.accountEmail,
            accessToken: userAccountDetails.accessToken,
            refreshToken: userAccountDetails.refreshToken,
            expiresAt: userAccountDetails.expiresIn,
        });

        const savedUserAccount = userAccount.save();
        return savedUserAccount;
    } catch (err) {
        
    }
}

exports.getRefreshTokenByEmail = async (email) => {
    try {
        await connectDB();
        console.log("got request for refresh token with emil = ",email);
        const userAccount = await userAccountModel.findOne({accountEmail: email});
        // console.log('userAccount:', userAccount);
        // console.log("userAccount = ",userAccount.refreshToken);
        return userAccount.refreshToken;
    }
    catch (err) {
        console.error('Error getting refresh token:', err);
        throw err;
    }
}

exports.getAccessToken = async(email)=>{
    try {
        await connectDB();
        const userAccount = await userAccountModel.findOne({accountEmail: email});
        // console.log('userAccount:', userAccount);
        let accessToken = userAccount.accessToken;
        let expiresAt = userAccount.expiresAt;

        if(expiresAt <= Date.now()){
            accessToken = await generateNewAccessToken(email , userAccount.refreshToken);
        }
        return accessToken;
    }
    catch (err) {
        console.error('Error getting refresh token:', err);
        throw err;
    }

}

async function generateNewAccessToken(email , refreshToken){
    const url = 'https://oauth2.googleapis.com/token';
  
  const params = new URLSearchParams();
  params.append('client_id', process.env.GOOGLE_CLIENT_ID);
  params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET);
  params.append('refresh_token', refreshToken);
  params.append('grant_type', 'refresh_token');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    //save the new access token to the database
    await updateAccessTokenByEmail(email , data.access_token);
    await updateExpiresAtByEmail(email , Date.now() + (45*60*1000));

    return data.access_token;
  } catch (error) {
    console.error('Failed to refresh access token:', error);
  }

}

let updateAccessTokenByEmail = async (email, newAccessToken) => {
    try {
        const updatedUserAccount = await userAccountModel.findOneAndUpdate(
            {accountEmail: email}, 
            {accessToken: newAccessToken},
            { new: true }
        );
        if (updatedUserAccount) return updatedUserAccount;
        else {
            throw new Error(`No user found with email: ${email}`);
        }
    } catch (err) {
        console.error(`Error updating access token for email ${email}:`, err.message);
        throw new Error(`Failed to update access token for email ${email}. Please try again later.`);
    }
}

// Update expiresAt by email
let updateExpiresAtByEmail = async (email, newExpiresAt) => {
    try {
        const updatedUserAccount = await userAccountModel.findOneAndUpdate(
            {accountEmail: email}, 
            {expiresAt: newExpiresAt}, 
            {new: true}
        );
        if (updatedUserAccount) return updatedUserAccount;
        else {
            throw new Error(`No user found with email: ${email}`);
        }
    } catch (err) {
        console.error(`Error updating expiresAt for email ${email}:`, err.message);
        throw new Error(`Failed to update expiresAt for email ${email}. Please try again later.`);
    }
}