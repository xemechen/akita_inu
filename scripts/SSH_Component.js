var title = 'SSH';
	url = 'https://booking.sshxl.nl/accommodations',
	fileName = "ssh_result",
	optionFileName = "ssh_options",
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
    var HouseLinks = [];
    
    // Checking for the first time
    if(firstTimeFlag){     
        console.log("Checking for the first time");
        firstTimeFlag = false;
        previousReturnList = newList;
        return [false, HouseLinks];
    }
    
    // console.log("Checking for updated housing");
    // if(previousReturnList == null || previousReturnList.length == 0){
    //     previousReturnList = newList;
    //     return [false, HouseLinks];
    // }

    // checking after first time    
    
    var previousSummary = calculateSummary(previousReturnList);
    var newSummary = calculateSummary(newList);

    var updatedTypeList = compareTwoObject(previousSummary, newSummary);
    console.log(updatedTypeList);

    for(var index = 0; index < newList.length; index++){
        var houseItem = newList[index];
        if(updatedTypeList.indexOf(houseItem.Type) > -1){
            HouseLinks.push(new Housing(houseItem.Type, houseItem.Price, houseItem.link, houseItem.Available));
        }
    }

    previousReturnList = newList;
    if(HouseLinks.length > 0){
        return [true, HouseLinks, JSON.stringify(updatedTypeList)];
    }else{
        return [false, HouseLinks];
    }   
    
}

this.emailSubject = "SSH Housing alert! ";
this.emailContentBuilder = function(Housings){
	var text = "New room(s) available, please click the following link(s) to check. <br/>";
    if(Housings != null && Housings.length > 0){
        for(var k = 0; k < Housings.length; k++){
            var housingObj = Housings[k];
            var link = housingObj.href;
            var price = housingObj.price;
            var name = housingObj.name;
            // var availNumber = parseInt(housingObj.available);
            var linkText = "<a href='" + link + "' target='_blank'> " + name + "(" + housingObj.available + ") with Price: " + price + "</a>"
            if(text == null || text.trim().length == 0){
                text = linkText;
            }else{
                text = text + "<br/>" + linkText;
            }
        }        
        return text;
    }

    return "";
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
this.pageOperations = function(phInstanceParam, sitepage, dataPackage, waitFour, testing, delayMilSec, callback, callback2){
	var selectIndices = dataPackage.selectIndices;
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
        	}else{
                console.log("Operation finished: " + index);
            }
        });
    };

    var ttst = function(){
        return document.querySelectorAll("#Advertenties > a").length > 0;
    };

	selecting("RegioDropDown", selectIndices[0] || 1);	
	selecting("ContingenthouderDropDown", selectIndices[1] || 1);
	selecting("ContingentDoelgroepDropDown", selectIndices[2] || 1);
    selecting("ContingentPeriodeDropDown", 0);

    var callingWaitFor = function(){	
        waitFour(testing, ttst, function(){
        	// callback function when page is loaded
        	console.log("Calling onReady function");
        	sitepage.evaluate(function(){
            	var mapper = { "adres": "Address",
                            "type": "Type",
                            "grootte": "Size",
                            "adressen": "Available",
                            "prijs": "Price"
                        };

                var getChildrenEle = function(parent){
                	if(parent == null){
                		return [];
                	}
                    var children = parent.childNodes;
                    var elementChild = [];
                    for (i = 0; i < children.length; i++) {
                        if(children[i].nodeType == 1){
                            elementChild.push(children[i]);
                        }
                    }
                    return elementChild;
                }
                var buildObjects = function(children){
                	if(children.length == 0){
                		return null;
                	}

                    var returnObj = {};
                    for(var i = 0; i < children.length; i++){
                        var clas = children[i].getAttribute("class")
                        var text = children[i].textContent.split("\n").join("").trim();
                        returnObj[mapper[clas]] = text;
                    }
                    return returnObj;
                }

                var returnList = [];
                var returnObj = {'status':'success'};
                try{
                	if(document.querySelectorAll("#Advertenties").length == 0){
                		returnObj.status = 'error';
                		returnObj.error = "No results found";
                		return JSON.stringify(returnObj);
                	}
                    var aList = document.querySelectorAll("#Advertenties > a");
                    if(aList && aList.length > 0){
                        for(var j = 0; j < aList.length; j++){
                            var link = "https://booking.sshxl.nl" + aList[j].getAttribute("href");
                            var children = getChildrenEle(aList[j].children[1]);
                            var tempObj = buildObjects(children);
                            if(tempObj == null){

                            }else{
                            	tempObj.link = link;
                            	returnList.push(tempObj);	
                            }                                        
                        }
                    }
                }catch(err){
                    console.log("Page fectching error: " + err);
                    returnObj.error = err;
                    returnObj.status = 'error';
                }

                returnObj.result = returnList;

                return JSON.stringify(returnObj);
            })
            .then(function(outcome){  
            	var outcomeObj = JSON.parse(outcome);
            	if(outcomeObj.status == 'error'){
        			console.log("Page fectching error: " + outcomeObj.error);
            	}else{
            		var callbackString = JSON.stringify(outcomeObj.result);
            		console.log("Finished loading page");
                	callback(callbackString);	
            	}                            
                phInstance.exit();

                timeOutList = [];
                var finalTO = setTimeout(function(){
                	callback2();
                }, delayMilSec);
                timeOutList.push(finalTO);
            });
        }, 90000 + delayMilSec);
    };

    waitFour(testing, ttst, function(){
        setTimeout(function(){
            selecting("ContingentPeriodeDropDown", selectIndices[3] || 1);
            setTimeout(callingWaitFor, 5000);
        }, 5000);
    }, 90000 + delayMilSec);
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