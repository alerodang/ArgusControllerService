'use strict';

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient;

const producersTable = process.env.PRODUCERS_TABLE;

module.exports.handler = async (event) => {
    const {account: accountId} = event.headers;

    const getStateParams = {Key: {"accountId": accountId}, TableName: producersTable};
    console.log('DEBUG: Getting item...');
    const accountData = await dynamoDB.get(getStateParams, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log('DEBUG: dynamo getItem', data); // successful response
    }).promise();

    return {
        statusCode: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            success: true,
            producers: accountData["Item"].producers
        })
    };
};