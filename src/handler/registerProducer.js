'use strict';

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB;

const producersTable = process.env.PRODUCERS_TABLE;

module.exports.handler = async (event) => {

    console.log('DEBUG: parse body');
    const {account: accountId, name, secret} = JSON.parse(event.body);

    const initialState = "off";

    const params = {
        Item: {
            "accountId": {
                S: accountId
            },
            "producers": {
                L: [
                    {
                        "M": {
                            "name": {
                                "S": name
                            },
                            "secret": {
                                "S": secret
                            },
                            "state": {
                                "S": initialState
                            }
                        }
                    }
                ]
            },
        },
        TableName: producersTable
    };
    await dynamoDB.putItem(params).promise();

    return {
        statusCode: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            success: true,
        })
    }
};