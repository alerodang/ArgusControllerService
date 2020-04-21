'use strict';

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB;
const docClient = new AWS.DynamoDB.DocumentClient;
const jwt = require('jsonwebtoken');

const producersTable = process.env.PRODUCERS_TABLE;

function getData(accountId) {
    let getParams = {TableName: producersTable, Key: {"accountId": accountId}};

    return docClient.get(getParams, function (err, data) {
        if (err) console.log(err, err.stack);
        else console.log('DEBUG dynamo getItem:', data);
    }).promise();
}

function createItem(accountId, secret, initialState, name) {
    const params = {
        Item: {
            "accountId": {S: accountId},
            "producers": {
                L: [
                    {
                        "M": {
                            "name": {"S": name},
                            "secret": {"S": secret},
                            "state": {"S": initialState}
                        }
                    }
                ]
            },
        },
        TableName: producersTable
    };

    return dynamoDB.putItem(params, function (err, data) {
        if (err) console.log(err, err.stack);
        else console.log('DEBUG dynamo getItem:', data);
    }).promise();
}

function updateProducer(accountId, producers, secret, initialState, name) {
    producers.push({
        "name": name,
        "secret": secret,
        "state": initialState
    });

    const putParams = {
        TableName: producersTable,
        Key: {'accountId': accountId},
        UpdateExpression: 'set producers = :producers',
        ExpressionAttributeValues: {':producers': producers},
        ReturnValues: 'UPDATED_NEW'
    };

    return docClient.update(putParams, function (err, data) {
        if (err) console.log(err, err.stack);
        else console.log('DEBUG dynamo getItem:', data);
    }).promise();
}

module.exports.handler = async (event) => {
    console.log('DEBUG: Parsing header...');
    const {Authorization: token} = event.headers;
    const decodedToken = jwt.decode(token);
    const accountId = decodedToken["email"];

    console.log('DEBUG: Parsing body...');
    const {name, secret} = JSON.parse(event.body);

    const initialState = "off";
    console.log('DEBUG: Getting data...');
    const item = (await getData(accountId))['Item'];

    if (item === undefined) {
        console.log('DEBUG: Creating item...');
        await createItem(accountId, secret, initialState, name);
    } else {
        const producers = item.producers;
        console.log('DEBUG: Updating item...');
        await updateProducer(accountId, producers, secret, initialState, name);
    }

    return {
        statusCode: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            success: true,
        })
    }
};
