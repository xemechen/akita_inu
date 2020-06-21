var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var stylus = require('stylus');

var index = require('./routes/index');
var users = require('./routes/users');
var pageGetter = require('./scripts/PageGetter');

var app = express();

var emailPassword = "";
var tempPasscode = "";
// getting password to send email from cmd argument "PW[password]"
process.argv.forEach(function (val, index, array) {
    if(val.indexOf("PW") == 0){        
        emailPassword = val.substring(2);
        var toPrint = "";
        for(var i = 0; i < emailPassword.length; i++){
            if(i > 8){
                toPrint = toPrint + "*";
            }else if(i%2 == 0){
                toPrint = toPrint + emailPassword[i];
            }else{
                toPrint = toPrint + "*";
            }
        }
        console.log('Email password: ' + toPrint);
        pageGetter.setPassword(emailPassword);
    }    
    if(val.indexOf("PC") == 0){        
        tempPasscode = val.substring(2);
        console.log('Access passcode: ' + tempPasscode);
    }    
});


app.all('*',function(req,res,next)
{
    if (!req.get('Origin')) return next();

    res.set('Access-Control-Allow-Origin','*');
    res.set('Access-Control-Allow-Methods','GET,POST');
    res.set('Access-Control-Allow-Headers','X-Requested-With,Content-Type');

    if ('OPTIONS' == req.method) return res.send(200);

    next();
});




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

var connectionPool = {'127.0.0.1:3000':false}; // e.g., {'52.32.108.109'}:true
// set REST API
var checkingConnection= function(reqParam){
    var toReturn = false;
    var connectionKey = reqParam.headers.host;

    if(reqParam && reqParam.body && reqParam.body.passcode){
        var inputPasscode = reqParam.body.passcode.trim();
        if(tempPasscode == inputPasscode){
            toReturn = true;    
        }        
    }
    return toReturn;
    // if(connectionPool[connectionKey]){
    //     return true;
    // }
    // return false;
}
app.post('/submitPass', function(req, res) {    
    var connectionKey = req.headers.host;
    var inputPasscode = req.body.passcode;
    console.log(connectionKey);
    console.log(inputPasscode);
    if(tempPasscode == inputPasscode){
        console.log("Passcode correct!");
        // connectionPool[connectionKey] = true;
        res.writeHead(200, { 'Content-Type' : 'application/json' });
        res.end('[]');
    }else{
        // connectionPool[connectionKey] = false;
        res.writeHead(404, { 'Content-Type' : 'application/json' });
        res.end('[]');
    }
});

// app.get('/submitPass', function(req, res) {   
//     if(checkingConnection(req)){
//         res.writeHead(200, { 'Content-Type' : 'application/json' });
//         res.end('[]');
//     }else{
//         res.writeHead(404, { 'Content-Type' : 'application/json' });
//         res.end('[]');
//     }
// });

app.post('/crawlingOptions', function(req, res) {   
    if(checkingConnection(req)){
        console.log("Getting options..."); 

        pageGetter.selectComponent(0);        
        pageGetter.getOptions(function(returnData){
            res.writeHead(200, { 'Content-Type' : 'application/json' });
            res.end(returnData);
        });        
    }else{
        res.writeHead(404, { 'Content-Type' : 'application/json' });
        res.end('[]');
    }
});

var crawlingFlag = false;
app.post('/startCrawling', function(req, res) { 
    if(checkingConnection(req)){
        if(!crawlingFlag){    
            var emailReceivers = req.body['emails[]'];
            var dataPackage = JSON.parse(req.body['dataPackage']);
            var dSecond = req.body['dSecond'];
            dSecond = (dSecond == null || dSecond < 0)?0:dSecond;
            dSecond = parseInt(dSecond);
            delayMilSec = dSecond * 1000;
            pageGetter.setDelaySeconds(delayMilSec);
            console.log("Receivers: " + emailReceivers);
            console.log("Data Package: " + JSON.stringify(dataPackage));
            console.log("Delayed time: " + delayMilSec + " ms");
            console.log(req.body.ProcessTime);
            // start the function to crawl
            pageGetter.selectComponent(0);
            crawlingFlag = true;
            pageGetter.intervalGrabbing(emailReceivers, dataPackage);        
        }
        res.writeHead(200, { 'Content-Type' : 'application/json' });
        res.end('[]');
    }else{
        res.writeHead(404, { 'Content-Type' : 'application/json' });
        res.end('[]');
    }
});

app.post('/stopCrawling', function(req, res) { 
    if(checkingConnection(req)){
        if(crawlingFlag){
            console.log("Stop the grabbing interval");
            // stop the function to crawl
            crawlingFlag = false;
            pageGetter.stopGrabbing();    
        }	
        res.writeHead(200, { 'Content-Type' : 'application/json' });
                    "Crawling stopped..."
        res.end('[]');
    }else{
        res.writeHead(404, { 'Content-Type' : 'application/json' });
        res.end('[]');
    }
});

// crawling Amazon
var amazonCrawlingFlag = true;
app.post('/crawlingAmazon', function(req, res) {   
    if(checkingConnection(req)){
        if(amazonCrawlingFlag){
            pageGetter.selectComponent(1);
            pageGetter.setDelaySeconds(300000);
            console.log("Start watching Amazon item");
            var emailReceivers = req.body['emails[]'];
            var targetUrl = req.body['pagelink'];
            pageGetter.setUrl(targetUrl);
            console.log("Receivers: " + emailReceivers);
            console.log(req.body.ProcessTime);
            // start the function to crawl
            // amazonCrawlingFlag = false;
            try{
                pageGetter.intervalGrabbing(emailReceivers, {}); 
            }catch(err){
                amazonCrawlingFlag = true;
            }
        }   
        res.writeHead(200, { 'Content-Type' : 'application/json' });
                    "Crawling Amazon..."
        res.end('[]');
    }else{
        res.writeHead(404, { 'Content-Type' : 'application/json' });
        res.end('[]');
    }
});

app.post('/stopAmazon', function(req, res) { 
    if(checkingConnection(req)){
        console.log("Stop the grabbing interval");
        // stop the function to crawl
        crawlingFlag = false;
        pageGetter.stopGrabbing();   
        res.writeHead(200, { 'Content-Type' : 'application/json' });
                    "Crawling stopped..."
        res.end('[]');
    }else{
        res.writeHead(404, { 'Content-Type' : 'application/json' });
        res.end('[]');
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



// app.listen(80); // disable comment for production
module.exports = app;
