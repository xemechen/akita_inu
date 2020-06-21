var title = 'AmazonJP',
	// url = 'https://www.amazon.co.jp/gp/offer-listing/B01NAU8B71/',
	url = 'https://www.amazon.co.jp/gp/offer-listing/B01NBWQWTF/ref=olp_twister_all?ie=UTF8&mv_color_name=all&mv_size_name=all&mv_style_name=all',
	// url = 'https://www.amazon.co.jp/gp/offer-listing/B01N12HJHQ/ref=dp_olp_new?ie=UTF8&condition=new',
	fileName = "amazon_result",
	optionFileName = "amazon_options",
	selectorList = ["#RegioDropDown",
                    "#ContingenthouderDropDown",
                    "#ContingentDoelgroepDropDown",
                    "#ContingentPeriodeDropDown"]; // file name to save

this.title = title;
this.url = url,
this.fileName = fileName,
this.optionFileName = optionFileName,
this.selectorList = selectorList; // file name to save

var Housing = function(Name, Price, Href, Available){
    this.name = Name;
    this.price = Price;
    this.href = Href;
    this.available = Available;
};

var calculateSummary = function(list){
    if(list == null || list.length == 0){
        return {};
    }
    console.log("Process summary");
    var summaryObj = {};
    for(var i = 0; i < list.length; i++){
        var itm = list[i];
        if(summaryObj[itm.Type] == null){
            summaryObj[itm.Type] = parseInt(itm.Available);
        }else{
            summaryObj[itm.Type] = summaryObj[itm.Type] + parseInt(itm.Available);
        }
    }
    // console.log(summaryObj);
    return summaryObj;
}

var compareTwoObject = function(oldO, newO){ 
    console.log("Compare two summary");
    console.log(oldO);
    console.log(newO);
    var keyType = [];
    for(key in newO){
        if(oldO[key] == null){
            keyType.push(key);
        }else{
            if(newO[key] > oldO[key]){
                keyType.push(key);
            }
        }
    }
    return keyType;
}

var previousReturnList = [];
var firstTimeFlag = true;
this.dataChecker = function(newList){   
    if(newList.length > 0 && newList[0] > 0){
        return [true, {}, ""];
    }else{
        return [false, {}];
    }   
    
}

this.emailSubject = "Amazon Available alert! ";
this.emailContentBuilder = function(objectData){	
    return "Available items found!!! <br/> <a href='" + url + "'>Link</a>";
}

this.getPageOptions = function(sitepage, fs, callbackFn){
	var selectId = "RegioDropDown";
	var textSearch = "Groningen";
	sitepage.evaluate(function(selectId, textSearch, selectorList){
		var output = {};
		for(var j = 0; j < selectorList.length; j++){
			var sgSelector = selectorList[j];
			var options = $(sgSelector).children();
			var optionList = [];
            for(var i = 0; i < options.length; i++){
            	var optionText = $(options[i]).text().trim();
            	if(optionText.length > 0){
            		optionList.push({'selIndex':i, 'selText':optionText});
            	};
            }
            if(optionList.length > 0){
            	output[sgSelector] = optionList;
            }
		}
        
        return JSON.stringify(output);
    }, selectId, textSearch, this.selectorList).then(function(output){
    	var fsFlag = true;
    	var outputJson = JSON.parse(output);
    	if(outputJson == null){
    		fsFlag = false;	
    	}else{
    		for(key in outputJson){
    			if(outputJson[key] == null || outputJson[key].length == 0){
					fsFlag = false;
    			}
    		}
    	}
    	
    	if(fsFlag){
            fs.writeFile('public/' + optionFileName +'.json', output, function(err) {
                if (err) {
                    return console.error(err);
                }
                console.log("===***=== Select Options written for client access ===***===");
            });
        }
		callbackFn(output);
    });
}

var timeOutList = [];
var phInstance;
this.pageOperations = function(phInstanceParam, sitepage, dataPackage, waitFour, testing, delayMilSec, callback, callback2, fs){	
	console.log("Calling page operations in component");
	phInstance = phInstanceParam;

    // create selecting function
    var selecting = function(selector, index){
        var selectEle = sitepage.evaluate(function(selector, index){
        	try{
        		var sel = document.getElementById(selector);
                sel.selectedIndex = index;
                var event = document.createEvent("UIEvents"); // or "HTMLEvents"
                event.initUIEvent("change", true, true);
                sel.dispatchEvent(event);
                return null;
                // return document.body.innerHTML;	
        	}catch(err){
        		return err;
        	}
            
        }, selector, index).then(function(processOutput){
        	if(processOutput != null && processOutput.length > 0){
        		console.log("Operation error: " + processOutput);	
        	}                        	
        });
    };

    var clicking = function(){
    	console.log("Clicking link");
        sitepage.evaluate(function(){
        	try{        		
        		var target = document.querySelectorAll("#variationsTwister li a");
                // var event = document.createEvent("UIEvents"); // or "HTMLEvents"
                // event.initUIEvent("click", true, true);
                // target[0].dispatchEvent(event);
                var target2 = document.querySelectorAll("#olpOfferList div.a-row"); // index 0 is the title row, 
                																	// rest: two elements for one item

				var targetSeller = document.querySelectorAll("#olpOfferList div.a-row .olpSellerName > img");
				if(targetSeller.length > 0){
					var altName = targetSeller[0].getAttribute('alt');
					if(altName == 'Amazon.co.jp'){
						return "success";
					}
				}
                
                return 'Test ' + targetSeller.length;
        	}catch(err){
        		return "Error: " + err;
        	}
        }).then(function(processOutput){
        	if(processOutput != null && processOutput.length > 0){
        		if(processOutput == "success"){        			
        			callback("[1]");	
            	}else{
            		console.log("Nothing found...");
            	}                            
                phInstance.exit();

                timeOutList = [];
                console.log("Next crawling in: " + delayMilSec + " ms");
                var finalTO = setTimeout(function(){
                	callback2();
                }, delayMilSec);
                timeOutList.push(finalTO);
        	}                        	
        });
    };
    
	clicking();

	var test1 = function(){
		return document.querySelectorAll("#olpOfferList div.a-row").length > 0;
	};

  //   waitFour(testing, test1, function(){
  //   	// callback function when page is loaded
  //   	console.log("Calling onReady function");
		// sitepage.evaluate(function(){
  //       	return document.querySelectorAll("#olpOfferList div.a-row").length;            
  //       }).then(function(processOutput){
  //       	console.log("Output: "+ processOutput);	
  //       });        
  //   }, 90000 + delayMilSec);
}

this.stopPhantom = function(){
    for(var j = 0; j < timeOutList.length; j++){
        clearTimeout(timeOutList[j]);
    }
}

this.setUrl = function(urlParam){
	url = urlParam;
}

module.exports = this;