var web_pttserver = require('./web_pttserver.js');
var CronJob = require('cron').CronJob;

setBot("peipei");

function setBot(owner){
    new CronJob('00 */1 * * * *', function() {
        web_pttserver.pttBot(owner);
    }, null, true, 'Asia/Taipei');
}
