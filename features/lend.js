const { BotkitConversation } = require( 'botkit' );
const { MongoClient } = require('mongodb');
const { MongoDbStorage } = require('botbuilder-storage-mongodb');

module.exports = async function (controller) {

    controller.hears( 'lend', 'message,direct_message', async ( bot, message ) => {
        await bot.reply(message,{ text: "Adaptive cards are not supported!", attachments: form});


    
    });

    controller.on('attachmentActions', async (bot, message) => {
        let markdown = "Thanks.  Received Item Details";
        const mongoClient = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
        await mongoClient.connect();
        // Grab a collection handle off the connected client
        var collection = mongoClient.db("CareToShareDB").collection("ItemList");

        var newItem = message.value;
        newItem["personId"]= message.personId;
        newItem["AvailableToLend"]=true;
        
        console.log("Message", newItem);
        collection.insertOne(newItem, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
        });

        await bot.reply(message, { markdown: markdown });
    });

    controller.commandHelp.push( { command: 'lend', text: 'Display form to enter your items to lend' } );

}
var form =  [
    {
      "contentType": "application/vnd.microsoft.card.adaptive",
      "content": {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.2",
        "body": [
            {
                "type": "TextBlock",
                "size": "Medium",
                "weight": "Bolder",
                "text": "Enter Item to LEND",
                "horizontalAlignment": "Center"
            },
            {
                "type": "ColumnSet",
                "columns": [
                    {
                        "type": "Column",
                        "items": [
                            {
                                "type": "TextBlock",
                                "text": "Item Category"
                            },
                            {
                                "type": "Input.ChoiceSet",
                                "id": "ItemCategory",
                                "style": "compact",
                                "value": "Red",
                                "choices": [
                                    {
                                        "title": "Wifi Router",
                                        "value": "Wifi Router"
                                    },
                                    {
                                        "title": "Cisco equipment (non-bonded)",
                                        "value": "Cisco equipment (non-bonded)"
                                    },
                                    {
                                        "title": "Monitor",
                                        "value": "Monitor"
                                    },
                                    {
                                        "title": "Headset",
                                        "value": "Headset"
                                    },
                                    {
                                        "title": "Speaker",
                                        "value": "Speaker"
                                    },
                                    {
                                        "title": "Mouse",
                                        "value": "Mouse"
                                    },
                                    {
                                        "title": "Power Adapter",
                                        "value": "Power Adapter"
                                    },
                                    {
                                        "title": "Other",
                                        "value": "Other"
                                    }
                                ],
                                "placeholder": "Select one"
                            }
                        ],
                        "width": "stretch"
                    },
                    {
                        "type": "Column",
                        "items": [
                            {
                                "type": "TextBlock",
                                "text": "Brand Name",
                                "wrap": true
                            },
                            {
                                "type": "Input.Text",
                                "placeholder": "Enter brand Name",
                                "id": "BrandName"
                            }
                        ],
                        "width": "stretch"
                    }
                ]
            },
            {
                "type": "ColumnSet",
                "columns": [
                    {
                        "type": "Column",
                        "items": [
                            {
                                "type": "TextBlock",
                                "text": "Model No",
                                "wrap": true
                            },
                            {
                                "type": "Input.Text",
                                "placeholder": "Enter Model No",
                                "id": "ModelNo"
                            }
                        ],
                        "width": 70
                    },
                    {
                        "type": "Column",
                        "items": [
                            {
                                "type": "TextBlock",
                                "text": "Qty",
                                "wrap": true
                            },
                            {
                                "type": "Input.Number",
                                "placeholder": "1",
                                "value": 1,
                                "min": 1,
                                "id": "Qty"
                            }
                        ],
                        "width": "stretch"
                    }
                ]
            },
            {
                "type": "TextBlock",
                "text": "Description",
                "wrap": true
            },
            {
                "type": "Input.Text",
                "placeholder": "Item Description",
                "style": "text",
                "isMultiline": true,
                "maxLength": 0,
                "id": "ItemDesc"
            },
            {
                "type": "ColumnSet",
                "columns": [
                    {
                        "type": "Column",
                        "items": [
                            {
                                "type": "TextBlock",
                                "text": "City",
                                "wrap": true
                            },
                            {
                                "type": "Input.Text",
                                "placeholder": "Enter City",
                                "id": "ItemCity"
                            }
                        ],
                        "width": "auto"
                    },
                    {
                        "type": "Column",
                        "items": [
                            {
                                "type": "TextBlock",
                                "text": "Price per day (in USD)",
                                "wrap": true
                            },
                            {
                                "type": "Input.Number",
                                "placeholder": "Enter price per day",
                                "id": "Price",
                                "value": 0,
                                "min": 0
                            }
                        ],
                        "width": "stretch"
                    }
                ]
            }
        ],
        "actions": [
            {
                "type": "Action.Submit",
                "title": "Submit",
                "data": {
                    "cardType": "input",
                    "id": "input"
                }
            },
            {
                "type": "Action.Submit",
                "title": "Submit & Add another",
                "data": {
                    "cardType": "input",
                    "id": "inputonemore"
                }
            }
        ]
    }
    
}];