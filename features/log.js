const { BotkitConversation } = require( 'botkit' );
const { MongoClient } = require('mongodb');
const { MongoDbStorage } = require('botbuilder-storage-mongodb');

module.exports = async function (controller) {

    controller.hears( 'log', 'message,direct_message', async ( bot, message ) => {

        await bot.reply(message, { markdown: "Fetching your Logs" });
   
        const mongoClient = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
        await mongoClient.connect();

        // Grab a collection handle off the connected client
        var collection = mongoClient.db("CareToShareDB").collection("ItemList");
        var cursor = collection.find();

        // Execute the each command, triggers for each document
        cursor.each(function(err, item) {
            // If the item is null then the cursor is exhausted/empty and closed
            if(item == null) {
                // you may not want to close the DB if you have more code....
                return;
            }
            array.push(item);
            bot.reply(message, { markdown: JSON.stringify(item)});
        });

        await bot.reply(message, { markdown: JSON.stringify(array)});
    });

    controller.commandHelp.push( { command: 'log', text: 'Log of all your items lend/borrow' } );
}