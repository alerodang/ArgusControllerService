'use strict';

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient;

const producersTable = process.env.PRODUCERS_TABLE;

module.exports.handler = async (event) => {
    const {account, producer: producerName} = JSON.parse(event.body);

    let getParams = { TableName: producersTable, Key:{"accountId": account} };

    console.log('DEBUG: Getting the item...');
    let data = await docClient.get(getParams, function(err,data){
        if (err) console.log(err, err.stack);
        else console.log('DEBUG dynamo getItem:', data);
    }).promise();

    const producers = data['Item'].producers;
    let producerToReturn = undefined;

    producers.forEach(producer => {
        console.log(producer);
        if (producer.name === producerName) {
            producer.state = 'on';
            producerToReturn = producer;
        }
    });

    const putParams = {
        TableName: producersTable,
        Key: {'accountId': account},
        UpdateExpression: 'set producers = :producers',
        ExpressionAttributeValues:{
            ':producers': producers
        },
        ReturnValues:'UPDATED_NEW'
    };

    console.log('DEBUG: Updating the item...');
    await docClient.update(putParams, function (err, data) {
        if (err) console.log(err, err.stack);
        else console.log('DEBUG dynamo getItem:', data);
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