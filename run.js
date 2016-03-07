var web_pttserver = require('./web_pttserver.js');
var CronJob = require('cron').CronJob;
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport();

setBot("peipei");

function setBot(owner){
    new CronJob('00 */1 * * * *', function() {
        web_pttserver.pttBot(owner);
    }, null, true, 'Asia/Taipei');

    new CronJob('00 00 9,19 * * *', function() {
        transporter.sendMail({
            from: 'crazyrabbit@boardgameinfor',
            to: 'willow111333@gmail.com',
            subject:'[PTT] Bot Running',
            text:"I'm alive. :)"
        });
    }, null, true, 'Asia/Taipei');

}
