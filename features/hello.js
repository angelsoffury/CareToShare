//
// Respond to various 'hello' words, attach file by URL and from local file system
var fs = require('fs');

module.exports = function( controller ) {

    controller.hears( [ 'hi','hello','howdy','hey','aloha','hola','bonjour','oi' ], 'message,direct_message', async ( bot,message ) => {

        await bot.reply( message,'Greetings!' );
        await bot.reply( message, { markdown: 'Try `help` to see available commands' } );
      });
    

}