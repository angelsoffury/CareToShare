
// Load process.env values from .env file
require('dotenv').config();

if (!process.env.WEBEX_ACCESS_TOKEN) {
    console.log( '\n-->Token missing: please provide a valid Webex Teams user or bot access token in .env or via WEBEX_ACCESS_TOKEN environment variable');
    process.exit(1);
}

// Read public URL from env, 
// if not specified, try to infer it from public cloud platforms environments
var public_url = process.env.PUBLIC_URL;

if (!public_url) {
    // Heroku hosting: available if dyno metadata are enabled, https://devcenter.heroku.com/articles/dyno-metadata
    if (process.env.HEROKU_APP_NAME) {
        public_url = 'https://' + process.env.HEROKU_APP_NAME + '.herokuapp.com';
    }

    // Glitch hosting
    if (process.env.PROJECT_DOMAIN) {
        public_url = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me';
    }
}

var storage;

if (process.env.REDIS_URL) {

    const redis = require('redis');
    const { RedisDbStorage } = require('botbuilder-storage-redis');

    // Initialize redis client
    const redisClient = redis.createClient(process.env.REDIS_URL, { prefix: 'bot-storage:' });
    storage = new RedisDbStorage(redisClient);
}

// Create Webex Adapter
const { v4: uuidv4 } = require( 'uuid' );
const { WebexAdapter } = require('botbuilder-adapter-webex');

// If PUBLIC_URL not configured, supply a dummy pulic_address
// If using websockets, don't supply a secret
const adapter = new WebexAdapter({

    access_token: process.env.WEBEX_ACCESS_TOKEN,
    public_address: public_url ? public_url : 'http://127.0.0.1',
    secret: ( process.env.WEBSOCKET_EVENTS == 'True' ) ? null : uuidv4()
});

const { Botkit } = require('botkit');

const controller = new Botkit({

    webhook_uri: '/api/messages',
    adapter: adapter,
    storage
});

// Create Botkit controller

if (process.env.CMS_URI) {
    const { BotkitCMSHelper } = require('botkit-plugin-cms');
    controller.usePlugin(new BotkitCMSHelper({
        uri: process.env.CMS_URI,
        token: process.env.CMS_TOKEN
    }));
};

// Express response stub to supply to processWebsocketActivity
// Luckily, the Webex adapter doesn't do anything meaningful with it
class responseStub {
    status(){}
    end(){}
}

function processWebsocketActivity( event ) {
    // Express request stub to fool the Activity processor
    let requestStub = {};
    // Event details are expected in a 'body' property
    requestStub.body = event;

    // Hand the event off to the Botkit activity processory
    controller.adapter.processActivity( requestStub, new responseStub, controller.handleTurn.bind( controller ) )
}

// Once the bot has booted up its internal services, you can use them to do stuff
controller.ready( async () => {

    // Create a MongoClient and connect it.
    const { MongoClient } = require('mongodb');
    const mongoClient = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
    await mongoClient.connect();

    const { MongoDbStorage } = require('botbuilder-storage-mongodb');
    // Grab a collection handle off the connected client
    storage = mongoClient.db("CareToShareDB").collection("ItemList");
    //const collection = MongoDbStorage.getCollection(mongoClient, "CareToShare", "ItemList");

    // Create a MongoDbStorage, supplying the collection to it.
    //const mongoStorage = storage = new MongoDbStorage(collection);


    const path = require('path');

    // load developer-created custom feature modules
    controller.loadModules( path.join( __dirname, 'features' ) );

    if ( ( !public_url ) && ( process.env.WEBSOCKET_EVENTS !== 'True' ) ) {
        console.log( '\n-->No inbound event channel available.  Please configure at least one of PUBLIC_URL and/or WEBSOCKET_EVENTS' );
        process.exit( 1 );
    }

    if ( public_url ) {
        // Make the app public_url available to feature modules, for use in adaptive card content links
        controller.public_url = public_url;
    }

    if ( process.env.WEBSOCKET_EVENTS == 'True' ) {

        await controller.adapter._api.memberships.listen();
        controller.adapter._api.memberships.on( 'created', ( event ) => processWebsocketActivity( event ) );
        controller.adapter._api.memberships.on( 'updated', ( event ) => processWebsocketActivity( event ) );
        controller.adapter._api.memberships.on( 'deleted', ( event ) => processWebsocketActivity( event ) );

        await controller.adapter._api.messages.listen();
        controller.adapter._api.messages.on('created', ( event ) => processWebsocketActivity( event ) );
        controller.adapter._api.messages.on('deleted', ( event ) => processWebsocketActivity( event ) );

        await controller.adapter._api.attachmentActions.listen();
        controller.adapter._api.attachmentActions.on('created', ( event ) => processWebsocketActivity( event ) );

        // Remove unnecessary auto-created webhook subscription
        await controller.adapter.resetWebhookSubscriptions();

        console.log( 'Using websockets for incoming messages/events');

        //For adaptivecards
        await controller.adapter.registerAdaptiveCardWebhookSubscription('/api/messages');
    }
    else {
        // Register attachmentActions webhook
        controller.adapter.registerAdaptiveCardWebhookSubscription( controller.getConfig( 'webhook_uri' ) );
    }
} );

controller.publicFolder( '/www', __dirname + '/www' );

controller.webserver.get( '/', ( req, res ) => {

    res.send( JSON.stringify( controller.botCommons, null, 4 ) );
} );

let healthCheckUrl = public_url ? public_url : `http://localhost:${ process.env.PORT }`;

console.log( `Health check available at: ${ healthCheckUrl }` );

controller.commandHelp = [];

controller.checkAddMention = function ( roomType, command ) {

    var botName = adapter.identity.displayName;

    if (roomType === 'group') {

        return `\`@${botName} ${command}\``
    }

    return `\`${command}\``
}

