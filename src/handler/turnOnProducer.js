'use strict';

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient;
const jwt = require('jsonwebtoken');

const producersTable = process.env.PRODUCERS_TABLE;

module.exports.handler = async (event) => {
    const {Authorization: token} = event.headers;
    const decodedToken = jwt.decode(token);
    const accountId = decodedToken["email"];

    const {producer: producerName} = JSON.parse(event.body);

    let getParams = {TableName: producersTable, Key:{"accountId": accountId}};

    console.log('DEBUG: Getting item...');
    let data = await docClient.get(getParams, function(err,data){
        if (err) console.log(err, err.stack);
        else console.log('DEBUG: dynamo getItem', data);
    }).promise();

    const producers = data['Item'].producers;
    let producerToReturn = undefined;

    producers.forEach(producer => {
        if (producer.name === producerName) {
            producer.state = 'on';
            producerToReturn = producer;
        }
    });

    const putParams = {
        TableName: producersTable,
        Key: {'accountId': accountId},
        UpdateExpression: 'set producers = :producers',
        ExpressionAttributeValues:{
            ':producers': producers
        },
        ReturnValues:'UPDATED_NEW'
    };

    console.log('DEBUG: Updating item...');
    await docClient.update(putParams, function (err, data) {
        if (err) console.log(err, err.stack);
        else console.log('DEBUG: dynamo getItem:', data);
    }).promise();

    return {
        statusCode: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            success: true,
            producer: producerToReturn
        })
    };
};