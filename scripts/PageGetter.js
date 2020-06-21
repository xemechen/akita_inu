var emailPassword = "";
/* ===== for crawling functions ===== */
var ComponentManager = require('./ComponentManager');
var allComponents = ComponentManager.getAllComponents(),
	currentComponent = allComponents[0]; // use SSH as default

var fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    phantom = require('phantom'),
    gmailSend = require('gmail-send');

var send = gmailSend({
	user: 'xemeusch@gmail.com',               // Your GMail account used to send emails
	pass: emailPassword,                      // Application-specific password
	to:   'xemeusch@gmail.com',               // Send back to yourself;
										// you also may set array of recipients:
										// [ 'user1@gmail.com', 'user2@gmail.com' ]
	// from:   '"User" <user@gmail.com>'  // from: by default equals to user
	// replyTo:'user@gmail.com'           // replyTo: by default undefined
	subject: 'test subject',
	// text:    'test text'
	html:    '<b>html text text</b>'
});

// Override any default option and send email
var sendingGmail = function(subject, content, receiver){
	var sendingObject = {
	  'subject': subject,
	  'html': content, // better be html code
	  'to' : receiver,
	  'user':'xemeusch@gmail.com',
	  'pass': emailPassword
	};

	var callbk = function (err, res) {
	  console.log('Alerting email sent: err:', err, '; res:', res);
	};

    console.log("Sending email to " + receiver);
    try{
		send(sendingObject, callbk);
	}catch(err){
		console.log(err);
	}
}

var sendingBatchGmails = function(subject, content, receiverList){
    if(receiverList != null && receiverList.length > 0){
        for(var i = 1; i < receiverList.length; i++){
            var receiver = receiverList[i];
            sendingGmail(subject, content, receiver);
        }        
    }
}

var phInstance = null;
var timeOutList = [];
var stopPhantom = function(){
    for(var j = 0; j < timeOutList.length; j++){
        clearTimeout(timeOutList[j]);
    }
    if(phInstance){
        console.log("Stop phantom");
        phInstance.exit();
    }
}

var getOptions = function(callbackFn) {	
	var url = currentComponent.url;
    var sitepage = null;
    phInstance = null;

    phantom.create()
        .then(instance => {
            console.log("PhantomJS is running to get options");
            phInstance = instance;
            return instance.createPage();
        })
        .then(page => {
        	// use page
            sitepage = page;
            console.log("Ready to open the page");            
            sitepage.open(url).then(function(status){
                console.log("Connection: " + status);
                if (status !== "success") {
                    console.log("Unable to access network");
                } else {
                    console.log("Operations begin");
                	currentComponent.getPageOptions(sitepage, fs, callbackFn);
                };
            });
        })
        .catch(error => {
            console.log(error);
            phInstance.exit();
        });

};

var delayMilSec = 0
var getPage = function(url, dataPackage, callback, callback2) {

    var sitepage = null;
    phInstance = null;

    phantom.create()
        .then(instance => {
            console.log("PhantomJS is running");
            phInstance = instance;
            return instance.createPage();
        })
        .then(page => {
            // use page
            sitepage = page;
            console.log("Ready to open the page");

            // create waiting function
        	var waitFour = function (testFx, conditionOperation, onReady, maxWait, start) {
				var start = start || new Date().getTime();
				var duration = new Date().getTime() - start;
				if (duration < maxWait) {
					testFx(function(result) {
						if (result) {
							console.log("Waited for " + duration + " ms");
							onReady();
						} else {
							setTimeout(function() {
								waitFour(testFx, conditionOperation, onReady, maxWait, start)
							}, 250)
						}
					}, conditionOperation);
				} else {
					console.error('page timed out');
					phInstance.exit();					
					callback2();
				}
			}
			var testing = function(cbTest, conditionOperation){
				var testingResult = false;				
				sitepage.evaluate(function(paramA, paramB, conditionOperation){
                	try{
                		// testing HTML DOM                		
                		if(conditionOperation()){
                			return "successful";
                		}else{
                			return "";
                		}
                	}catch(err){
                		return "";
                	}                    
                }, "", "", conditionOperation).then(function(processOutput){
                	if(processOutput == "successful"){
                		testingResult = true;
                		console.log("waitFor testing Done");
                	}else{
                		console.log("Still waiting...");
                	}
                	cbTest(testingResult);
                });				
			};

			console.log("Connect to: " + url);
            sitepage.open(url).then(function(status){
                console.log("Connection: " + status);
                if (status !== "success") {
                    console.log("Unable to access network");
                    var finalTO = setTimeout(function(){
                    	callback2();
                    }, delayMilSec);
                    timeOutList.push(finalTO);
                } else {
                	// ** jQuery 1.6.2 is included
                    console.log("Operations begin with delay: " +  + delayMilSec + " ms");
                	currentComponent.pageOperations(phInstance, sitepage, dataPackage
                		, waitFour, testing, delayMilSec, callback, callback2, fs);
                };
            });
        })
        .catch(error => {
            console.log(error);
            phInstance.exit();
        });

};



var toGetPageFn = function(emailReceivers, dataPackage){
    console.log("");
    console.log("======================================================");
    console.log("");
    console.log("開始讀取......");
    getPage(currentComponent.url, dataPackage, function(outcome) {
    	if(outcome == null){
    		return console.error("Error getting data from the page");
    	}
        var jsonObj = JSON.parse(outcome);
        console.log("Total " + jsonObj.length + " items found.");
        if(emailReceivers == null || emailReceivers.length == 1 || typeof emailReceivers == 'string'){
            emailReceivers = ["", "xemeusch@gmail.com"];
        }        

        var checkingResult = currentComponent.dataChecker(jsonObj);
        if(checkingResult[0]){
            // checked is true, send email alert
            var emailContent = currentComponent.emailContentBuilder(checkingResult[1]);
            sendingBatchGmails(currentComponent.emailSubject + checkingResult[2], emailContent, emailReceivers);

            // save to both JSON files
            fs.writeFile(currentComponent.fileName + '.json', outcome, function(err) {
                if (err) {
                    return console.error(err);
                }
                console.log("抓取結束1/2");
            });
            var timeStmp = new Date();
            var strTime = "" + timeStmp.getFullYear() + "-" + (timeStmp.getMonth()+1) + "-" + timeStmp.getDate() + "_"
            + timeStmp.getHours() + "-" + timeStmp.getMinutes() + "-" + timeStmp.getSeconds();
            fs.writeFile('archived/' + currentComponent.fileName + strTime + '.json', outcome, function(err) {
                if (err) {
                    return console.error(err);
                }
                console.log("抓取結束2/2");
            });

        }else{
            // no update, just update JSON
            fs.writeFile(currentComponent.fileName + '.json', outcome, function(err) {
                if (err) {
                    return console.error(err);
                }
                console.log("抓取結束");
            });
        }

        // write for client access
        if(jsonObj){
            fs.writeFile('public/' + currentComponent.fileName + '.json', outcome, function(err) {
                if (err) {
                    return console.error(err);
                }
                console.log("===***=== JSON written for client access ===***===");
            });
        }        
        
    }, toGetPageFnGlobal);
}
var emailReceiversGlobal, dataPackageGlobal;
var toGetPageFnGlobal = function(){
	toGetPageFn(emailReceiversGlobal, dataPackageGlobal);
}


var grabInterval;
var intervalGrabbing = function(emailReceivers, dataPackage){
    console.log("開始週期取值......with delay " + delayMilSec);
    firstTimeFlag = true;
    emailReceiversGlobal = emailReceivers;
    dataPackageGlobal = dataPackage;
    toGetPageFn(emailReceivers, dataPackage);

    // grabInterval = setInterval(function(){
    //     toGetPageFn(emailReceivers, selectIndices);
    // }, 90000 + delayMilSec);
};
var stopGrabbing = function(){
	console.log("停止週期取值......");
	clearInterval(grabInterval);
    stopPhantom();
    currentComponent.stopPhantom();
}

var setPassword = function(param){
	console.log('Password Set');
	emailPassword = param;
}
var setDelaySeconds = function(param){
	console.log('Delayed time Set: ' + param);
	delayMilSec = param;
}

var setUrl = function(param){
	console.log('Set new url: ' + param);
	currentComponent.setUrl(param);
	currentComponent.url = param;
}

var selectComponent = function(index){
	currentComponent = allComponents[index];
	console.log('Component selected: ' + currentComponent.title);
}

/* ===== for crawling functions ===== */

module.exports.setUrl = setUrl;
module.exports.intervalGrabbing = intervalGrabbing;
module.exports.stopGrabbing = stopGrabbing;
module.exports.setPassword = setPassword;
module.exports.setDelaySeconds = setDelaySeconds;
module.exports.getOptions = getOptions;
module.exports.selectComponent = selectComponent;