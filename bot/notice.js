var fs = require('fs');
var iconv = require('iconv-lite');
var cheerio = require("cheerio");
var S = require('string');
var he = require('he');
var moment = require('moment');
var dateFormat = require('dateformat');
var request = require('request');
var striptags = require('striptags');
var deleteTag = require('/home/crazyrabbit/idbapi/tool/deleteTag.js');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport();
var page_link;
var article_link = Array();

function convert(title,body,board,url){
    var record;
    var content_temp;
    
    deleteTag.delhtml(body,function(result){
        time = S(result).between("時間","\n");
        time = he.decode(time);
        result = S(result).between(time,"※ 發信站: 批踢踢實業坊(ptt.cc)");
        result = he.decode(result);
        if(result==""||result=="\t\t"){
            result = S(result).between(time,"※ 編輯");
            result = he.decode(result);
        }

        findBoardGame(title,result,function(game,matchnums,type,matchlist){
            if(game!=-1&&type!=-1){
                transporter.sendMail({
                    from: "crazyrabbit@boardgameinfor",
                    to: "willow111333@gmail.com",
                    subject: title,
                    text: "Match list:"+matchlist+"\nMatching Nums:"+matchnums+"\nLink:"+url+"\n"+result
                });
            }
        });


    });



}
exports.convert = convert;

function findBoardGame(title,body,callback){
    var gamelist = JSON.parse(fs.readFileSync('./control/list'));
    var game = gamelist['game'];
    var type = gamelist['type'];
    var match = gamelist['match'];
    var nomatch = gamelist['not'];
    var game_matchnums=0;
    var namecheck=-1,typecheck=0,nomatchcheck=0;
    var games = game.split(",");
    var matchlist="";
    body =  body.toLowerCase();
    title = title.toLowerCase();
    //console.log("title:"+title);
    if((nomatchcheck=title.indexOf(nomatch))!=-1){
        callback(-1,0,-1,matchlist);
    }
    else{
        if(type=="none"){
            for(var i=0;i<games.length;i++){
                //console.log("["+i+"]games:"+games[i]);
                if((namecheck=body.indexOf(games[i]))!=-1){
                    if(game_matchnums!=0){
                        matchlist+=","+games[i];
                    }
                    else{
                        matchlist+=games[i];
                    }
                    game_matchnums++;
                }
            }
            if(game_matchnums==0){//no match game
                callback(-1,0,0,matchlist);
            }
            else if(games.length==game_matchnums){//all match
                callback(2,game_matchnums,0,matchlist);
                //console.log("["+i+"]games:"+games[i]);
            }
            else if(match<=game_matchnums){//match at least [match] 
                callback(1,game_matchnums,0,matchlist);
            }
            else if(match>game_matchnums){//match nums less than specify range
                callback(0,game_matchnums,0,matchlist);
            }
        }
        else{
            if((typecheck=body.indexOf(type))!=-1){
                for(var i=0;i<games.length;i++){
                    if((namecheck=body.indexOf(games[i]))!=-1){
                        if(game_matchnums!=0){
                            matchlist+=","+games[i];
                        }
                        else{
                            matchlist+=games[i];
                        }
                        game_matchnums++;
                    }
                }
                if(game_matchnums==0){//no match game
                    callback(-1,0,1,matchlist);
                }
                else if(games.length==game_matchnums){//all match
                    callback(2,game_matchnums,0,matchlist);
                }
                else if(match<=game_matchnums){//match at least [match] 
                    callback(1,game_matchnums,0,matchlist);
                }
                else if(match>game_matchnums){//match nums less than specify range
                    callback(0,game_matchnums,0,matchlist);
                }
            }
            else{
                callback(0,0,-1,matchlist);
            }
        }

    }
}
