var key = "bitCoinrate";
var constantItemStorageKey = '$$lilBitLess$$';

// on launch, create alarm
console.log("launch");
chrome.alarms.create("fetchRate", {
	delayInMinutes: 0.1, periodInMinutes: 2.0});

function manipulateRate(rate) {
	var itemKvp = {};
	itemsKvp[exchgrateKey] = rate;
	chrome.storage.local.set(itemsKvp, function() { alert('manipulated'); });
}

function roundDecimal(number) {
	return Math.round(number * 100) / 100;
}

chrome.alarms.onAlarm.addListener(function( alarm ) {
	console.log("check");

	// get updated rate from blockchain
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "https://blockchain.info/ticker", true);
	xhr.onreadystatechange = function() {
	// if success
	if (xhr.readyState == 4) {
		// validate no errors
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError.message);
		} 
		
		// parse response
		var resp = JSON.parse(xhr.responseText);
		
		// get rate
		var rate = resp.USD["15m"];
		console.log(resp.USD["15m"]);
		
		// Save it using the Chrome extension storage API.
		// it will be used again by the submit form
		var obj= {};
		obj[key] = rate;
		chrome.storage.local.set(obj);
		
		// manipulate rate for debugging purposes
		//manipulateRate(rate / 2);
	
		// get item from storage
		chrome.storage.local.get(constantItemStorageKey, function(items){
			// input validation
			if(items[constantItemStorageKey]!==undefined){
			
				var itemObj = items[constantItemStorageKey];
				var bitValue;
				for(var i = 0, len = itemObj.length; i<len; i++){
					// calculate new current price
					bitValue = itemObj[i].bitprice * rate;
					console.log(bitValue);
					
					// if new current pice is lower than my reservation price,
					// send notification
					if(bitValue >= itemObj[i].reservationPrice){
						//rich notification
						 chrome.notifications.create('lowerPrice',{
						 type: 'basic',
						 iconUrl:'icon128x128.png',
						 title:'Lower Price Alert with Bitcoin',
						 message:'Buy now!!'
						 },function(){/**/});
						 console.log("cheaper");
					}
					
					// update price difference and current price for UI
					itemObj[i].diff = roundDecimal(bitValue - itemObj[i].price);
					itemObj[i].currPrice = roundDecimal(bitValue);
				}
				
				// save item back into storage
				items[constantItemStorageKey] = itemObj;
				chrome.storage.local.set(items, function(){console.log("Updated");});	
			}
			
		});
		
	  }
  }
  
  // make ajax request!
  xhr.send();
});
