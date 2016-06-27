//var parseHtml = require('./parseHtml');
var parseHtml = require('./notice');
var request = require('request');
var fs = require('fs');
var iconv = require('iconv-lite');
var cheerio = require("cheerio");
var S = require('string');
var he = require('he');
var sleep = require('sleep');

var web  = 'https://www.ptt.cc';
var page_link;

var tag;
var time=500;
var board = 'BoardGame';

function checklist(body,page,owner,callback){
    var i=0;
    var value=1;
    var article_text = new Array();
    endpage = parseInt(page);
    //get all list a and grab the web
    try{
        if((bodytemp = S(body).between('<html>','<div class="r-list-sep"></div>'))){
            if(bodytemp!=""){
                body = he.decode(bodytemp);
                body = body+"</body></html>";
            }
        }
        var $ = cheerio.load(body);
        $("div > div > div > div.title").each(function(){
            i++;
            var link = $(this);
            var text = link.text();
            article_text.push(text);
        });
    }
    catch(e){
        fs.writeFile('./ptt_data/'+owner+'/'+board+'/log_web_article.txt', "[ckecklist]false---->\n"+body);
    }
    finally{
        callback(article_text.length);
    }
}

function start(body,board,current_page,end_page,citem,owner,timeper,callback){

    var i;
    var status="";
    var value=1;
    endpage = parseInt(end_page);
    var article_link = new Array();
    var article_text = new Array();
    var cnt=0;
    //get all list a and grab the web
    try{
        if((bodytemp = S(body).between('<html>','<div class="r-list-sep"></div>'))){
            if(bodytemp!=""){
                body = he.decode(bodytemp);
                body = body+"</body></html>";
                //console.log("=>"+bodytemp);
                //            
            }

        }
        var $ = cheerio.load(body);
        $("div > div > div > div.title").each(function(){
            var link = $(this);
            var text = link.text();
            var href = link.children().attr('href');
            //if(text.indexOf("板務暨違規公告區")==-1&&text.indexOf("桌遊資源|置底閒聊|違規檢舉|板務反應")==-1&&text.indexOf("預計要出的中文遊戲")==-1){
            article_link.push(href);
            article_text.push(text);
            //}
            cnt++;
        });
    }
    catch(e){
        status="false";
        fs.writeFile('./ptt_data/'+owner+'/'+board+'/log_web_article.txt', "[start]false---->\n"+body);
    }
    finally{
        if(status!="false"){
            /*
            for(i=citem;i<article_link.length;i++){
                fs.appendFile('./ptt_data/'+owner+'/'+board+'/articlelist.txt',"["+i+"]"+article_text[i]+"\t"+article_link[i]+"\n");
                //fs.appendFile('./ptt_data/articlelist.txt',article_text[i]+"\n");
                //console.log("["+i+"]"+"link length:"+article_link.length+" link:"+article_link[i]);
            }
            */
            var linc=citem;
            var terid = setInterval(function(){
                text = article_text[linc];
                href = article_link[linc];
                if(typeof article_link[linc]=="undefined"){
                    console.log("[404] current_page:"+current_page+" linc:"+linc+" article_link.length:"+article_link.length);
                    //console.log("linc:"+linc+" article_link.length:"+article_link.length);
                    linc++;
                    if(linc>=article_link.length){
                        clearInterval(terid);
                    }

                }
                else{
                    fs.appendFile('./ptt_data/'+owner+'/'+board+'/articlelist.txt',"["+current_page+"] "+linc+" grap[:"+board+"] href:"+href+"\n");
                    look(href,text,"0",board,owner);
                    linc++;
                    if(linc>=article_link.length){
                        clearInterval(terid);
                    }
                }

            },timeper);
            callback("start ok");
        }
        else{
            callback("start false"); 
        }
    }
}
exports.checklist=checklist;
exports.start = start;
function look(href,text,value,board,owner){
    request({
        uri:web+href,
        headers:{                                                                                                                                'Cookie': 'over18=1'
        },
        timeout:100000,
    },function(error,response,body){
        if(typeof response == "undefined"){
            look(href,text,"503",board,owner);
        }
        else if(response.statusCode!==200){
            if(response.statusCode===503){
                if(value=="503"){
                    //fs.appendFile('./ptt_data/log_web_article.txt', "\trepetenotok["+num+"]bot response:"+response.statusCode+'\n'+"\ttext:"+text+"\n"+"\thref:"+web+href+"\n");
                }
                else{
                    //fs.appendFile('./ptt_data/'+board+'/log_web_article.txt', "\trepeteb["+num+"]bot response:"+response.statusCode+'\n'+"\ttext:"+text+"\n"+"\thref:"+web+href+"\n");
                }
    look(href,text,"503",board,owner);
            }
            else{
                //fs.appendFile('./ptt_data/log_web_article.txt', "\trepetenotok["+num+"]bot response:"+response.statusCode+'\n'+"\ttext:"+text+"\n"+"\thref:"+web+href+"\n");
            }
        }
        else{
            if(value=="503"){
                //fs.appendFile('./ptt_data/log_web_article.txt', "\trepeteok["+num+"]bot response:"+response.statusCode+'\n'+"\ttext:"+text+"\n"+"\thref:"+web+href+"\n");
            }
            else{
                //fs.appendFile('./ptt_data/log_web_article.txt', "\tonceok[o]["+num+"]bot response:"+response.statusCode+'\n'+"\ttext:"+text+"\n"+"\thref:"+web+href+"\n");
            }
            //fs.appendFile('./ptt_data/'+board+'/web_article.txt',"\t"+iconv.encode(body,'utf-8'),function (err){});
            iconv.encode(body,'utf-8');
            url = web+href;
            parseHtml.convert(text,body,board,url);
            return 200;
        }
    });
    return 503;

}
