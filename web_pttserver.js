var myBot = require('./bot/web_pttbot.js');
var request = require('request');
var http = require('http');
var fs = require('fs');
var cheerio = require("cheerio");
var S = require('string');
var interval;

pttBot("peipei");

function pttBot(owner){
    run_bot(owner,function(name,bname,index,item){
        if(name==0||bname==0){
            console.log("run_bot error");   
        }
        else{
            //console.log("name:"+name+" bname:"+bname+" index:"+index+" item:"+item);
            crawlIndex(name,bname,index,item);
        }
    });
}

function run_bot(owner,fin){
    try{
        var boards;
        service = JSON.parse(fs.readFileSync('./service/'+owner+'/service'));
        boards = service['boards'];
        dir = service['data_dir'];
        interval = service['intervalPer'];
        for(var i=0;i<boards.length;i++){
            createDir(owner,boards[i].name,function(name,bname,index,item){
                fin(name,bname,index,item);
            });
        }
    }
    catch(e){
        console.log("[error] run_bot:"+e);
        fin(0,0,0,0);

    }
}

function createDir(owner,board,fin){
    var index;
    var item;
    var status=0;
    try{
        fs.exists(dir+"/"+owner+"/"+board,function(exists){
            if(exists) {
                console.log(dir+"/"+owner+"/"+board+" is exists");
                fs.readFile(dir+'/'+owner+'/'+board+'/index.txt',function read(err,data){
                    if(err){
                        throw err;
                    }
                    else{
                        index = parseInt(data);
                        fs.readFile(dir+'/'+owner+'/'+board+'/item.txt',function read(err,data){
                            if(err){
                                throw err;
                            }
                            else{
                                item = parseInt(data);
                                fin(owner,board,index,item);
                            }
                        });
                    }
                });
            }
            else{
                index=1;
                item=0;
                console.log("no "+ dir+"/"+owner+"/"+board);
                fs.mkdir(dir,function(){
                    console.log("create:"+dir);
                    fs.mkdir(dir+"/"+owner,function(){
                        console.log("create:"+dir+"/"+owner);
                        fs.mkdir(dir+"/"+owner+"/"+board,function(){
                            console.log("create:"+dir+"/"+owner+"/"+board);
                            fs.writeFile(dir+'/'+owner+"/"+board+'/index.txt','1');
                            fs.writeFile(dir+'/'+owner+"/"+board+'/item.txt','0');
                            fin(owner,board,index,item);

                        });

                    });

                });

            }
        });
    }
    catch(e){
        console.log("[error] createDir:"+e);
        status=1;
        fin(0,0,0,0);
    }
}

function crawlIndex(name,bname,index,item){
    //get new page
    //request.cookie('over18=1');
    request({
        uri: "https://www.ptt.cc/bbs/"+bname+"/index.html",
    headers:{
        'Cookie': 'over18=1'
    }
    },function(error, response, body){
        var status="";
        try{
            var $ = cheerio.load(body);
            var nextpage=0;
            var  get_page = $("div > div > div.action-bar > div.btn-group.pull-right > a:nth-child(2).btn.wide");
            page = parseInt(S(get_page.attr('href')).between('index','.html').s)+1;

        }
        catch(e){
            status="false";
            //console.log("error:"+error+" statusCode"+response.statusCode);
            fs.writeFile('./ptt_data/'+name+'/'+bname+'/log_web_article.txt', "false---->\n"+body+'\nhttps://www.ptt.cc/bbs/'+bname+'/index'+index+'.html');
        }
        finally{
            if(status=="false"){
                return;
            }
            else{
                if(item==20&&page!=index){
                    item=0;
                    nextpage=1;
                }
                //console.log("from index:"+index+" to page:"+page+" current_item:"+item);
                //fs.appendFile('./ptt_data/'+board+'/log_web_article.txt',"index:"+index+" page:"+page+"\n");
                if(page!=index){
                    fs.writeFile('./ptt_data/'+name+'/'+bname+'/index.txt',page);
                }
                var i = index;
                var tag = setInterval(function(){
                    if(i>page){
                        clearInterval(tag);
                    }
                    else{
                        //fs.appendFile('./ptt_data/'+board+'/log_web_article.txt','https://www.ptt.cc/bbs/'+board+'/index'+i+'.html'+"\n");
                        //console.log('https://www.ptt.cc/bbs/'+board+'/index'+i+'.html');
                        href = 'https://www.ptt.cc/bbs/'+bname+'/index'+i+'.html';
                        lookp(i,page,href,item,nextpage,name,bname,interval);
                        item=0;
                        nextpage=0;
                        i++;
                    }
                },interval);

            }
        }
    });

}

function lookp(current_page,end_page,href,item,nextpage,owner,board,timeper){
    request({
        uri: href,
    headers:{                                                                                                                                'Cookie': 'over18=1'
    },
    timeout:100000,
    }, function(error, response, body) {
        if(typeof response == "undefined"){
            lookp(current_page,end_page,href,item,nextpage,owner,board,timeper);						
        }
        else if(response.statusCode!==200){
            //fs.appendFile('./ptt_data/'+board+'/log_web_article.txt', "--->["+i+"]page response:"+response.statusCode+'\n'+"uri:"+'https://www.ptt.cc/bbs/'+board+'/index'+i+'.html'+"\n");
            if(response.statusCode===503){
                lookp(current_page,end_page,href,item,nextpage,owner,board,timeper);
            }
        }
        else{
            myBot.checklist(body,end_page,owner,function(listnum){
                //console.log("listnum:"+listnum);
                if(item<listnum&&nextpage!=1){
                    fs.writeFile('./ptt_data/'+owner+'/'+board+'/item.txt',listnum);
                    myBot.start(body,board,current_page,end_page,item,owner,timeper,function(result){
                        //console.log(result);
                    });
                    console.log("page:"+current_page+"  from link :"+item+" to link :"+listnum);
                }
                else if(item==0||item==20){
                    console.log("page:"+current_page+"  old link :"+item+" -> next page:"+(current_page+1));
                }
                else{
                    console.log("page:"+current_page+"  current link :"+item+" -> next link:"+listnum);
                }

            });
            //fs.appendFile('./ptt_data/'+board+'/log_web_article.txt', "--->["+i+"]page response:"+response.statusCode+'\n'+"uri:"+'https://www.ptt.cc/bbs/'+board+'/index'+i+'.html'+"\n");
        }
    });
}

exports.pttBot=pttBot;
