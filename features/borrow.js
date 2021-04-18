const { BotkitConversation } = require( 'botkit' );
const { MongoClient } = require('mongodb');
const { MongoDbStorage } = require('botbuilder-storage-mongodb');

module.exports = async function (controller) {
    let items = `The list of  Headset(s) available are \n`;
    items +="```| Sl | Item Category  | Model No   | Description                        | Qty | Price per day | City      |```\n";
    items +="```|----|----------------|------------|------------------------------------|-----|---------------|-----------|```\n";
    items +="```| 1  | Headset        | Cisco 730  | Cisco Noise cancelling head BL set | 2   | 0.2$          | Beijing   |```\n";
    items +="```| 2  | Headset        | Jabra 3100 | Wired headset                      | 1   | 0             | Bangalore |```\n\n";
    items += '_Enter the Sl. no to choose_';;

    controller.hears( 'borrow', 'message,direct_message', async ( bot, message ) => {
        const mongoClient = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
        await mongoClient.connect();
        // Grab a collection handle off the connected client
        var collection = mongoClient.db("CareToShareDB").collection("ItemList");

        itemSearch=message.text.replaceAll("borrow",'');
        itemSearch=itemSearch.replaceAll("Borrow",'');
        itemSearch=itemSearch.replace(" ",'');


        console.log("I heard",itemSearch);
        var title= " List of "+ itemSearch+" available are :";
        const query = { $text: { $search: itemSearch } };
        const projection = { _id: 0 };
        const cursor = collection.find(query).project(projection) ;
        
        
    cursor.each(function(err, item){
            // If the item is null then the cursor is exhausted/empty and closed
            if(item == null) {
                // you may not want to close the DB if you have more code...
                return;
            }
            //items.push(item);
            //console.log("**********************\n", items);

    });
    //console.log("Second", items);
    await bot.reply(message,{ text: "List ", markdown: items});
    mongoClient.close();
    });

    controller.commandHelp.push( { command: 'borrow <item>', text: 'Search if item is available to borrow' } );
}


