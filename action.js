var constantItemStorageKey = '$$lilBitLess$$';
var exchgrateKey = "bitCoinrate";

function emptyItemListInStorage() {
	var itemsKvp = {};
	itemsKvp[constantItemStorageKey] = undefined;
	chrome.storage.local.set(itemsKvp, function() { alert('emptied'); });
}

function getItemListFromStorage(callback) {
	// input validation
	// if callback isn't a function then there's nothing to execute
	if (typeof callback != 'function') {
		return;
	}
	
	// get from local storage
	chrome.storage.local.get(constantItemStorageKey, function(itemsKvp) {
		// get our itemlist
		var items = itemsKvp[constantItemStorageKey];
		console.log(items);
		// items could be null/undefined/uninitialized object
		if (!Array.isArray(items)) {console.log("fail!");
			// return empty array to prevent exceptions
			callback([]);
		}
		else {
			callback(items);
		}
	});
}

function addItemToStorage(item) {
	// get the list from storage
	chrome.storage.local.get(constantItemStorageKey, function(itemsKvp) {
		// get our itemlist
		var items = itemsKvp[constantItemStorageKey];
	
		// init array if not initialized
		if (!Array.isArray(items)) {
			// init with empty array
			items = [];
		}
		
		// get next index number
		var index = items.length + 1;
		item.index = index;
		
		// add item to list in the back
		items.push(item);
		
		// save back into storage
		itemsKvp[constantItemStorageKey] = items;
		chrome.storage.local.set(itemsKvp, function() { alert('saved'); });
	});
}

$(document).ready(function() {

	// empty the list for debugging
	//emptyItemListInStorage();
	
	// binds the callback from sourceParser.js to the chrome extensions
	chrome.extension.onMessage.addListener(function(request, sender) {
	  if (request.action == "parsedSource") {
		// parse item
		var item = JSON.parse(request.source);
		
		// populate form
		$('#item-image').text(item.imageUrl);
		$('#item-title').text(item.title);
		$('#item-price').text(item.price);
		$('#item-original-item').text(request.source);
		
		// convert bitcoin price
		convert(item);
		
		
		// get low average price
	  }
	});
	
	// run the sourceParser in the tab context
	// aka inject js into browser page
	chrome.tabs.executeScript(null, {
		file: "sourceParser.js"
	}, function() {
		// If you try and inject into an extensions page or the webstore/NTP you'll get an error
		if (chrome.extension.lastError) {
		window.alert("fail!");
		}
	});

	// bind tab click actions
	$('.nav-bar .tab-links a').on('click', function(e)  {
        var currentAttrValue = $(this).attr('href');
 
        // Show/Hide Tabs
        $('.nav-bar ' + currentAttrValue).show().siblings().hide();
 
        // Change/remove current tab to active
        $(this).parent('li').addClass('active').siblings().removeClass('active');
 
        e.preventDefault();
    });

	// bind form submit action 
    $('#item-form').submit(function(e) {
		console.log('[act] User submitted');
		e.preventDefault();
		
		// parse original item
		var item = JSON.parse($('#item-original-item').text());
		
		// parse user reservation price
		var reservationPrice = $('#item-reservation-price').val();
		
		// parse original bitcoins
		var bitprice = $('#item-bitprice').text();
		
		// parse new bitPrice
		var desiredBitPrice = reservationPrice / (item.price / bitprice);
		
		// create item object
		var itemObject = {}
		itemObject.title = item.title;
		itemObject.url = item.url;
		itemObject.imageUrl = item.imageUrl;
		itemObject.price = item.price;
		itemObject.createDate = item.createDate;
		itemObject.reservationPrice = reservationPrice;
		itemObject.bitprice = bitprice;
		itemObject.desiredBitPrice = desiredBitPrice;
		itemObject.diff = 0;
		itemObject.currPrice = item.price;				
		
		// save in local storage
		addItemToStorage(itemObject);
				
		// update UI to success
		// switch to list view
		//$('#tab2').click();
	});

    main();//fires off main method
});

function main(){
	console.log('start');
	$('.tab-links').on('click', '#List', function() {
		console.log("fire");		
		getItemListFromStorage(createTable);
	});
}

function createTable(data){
	var html = '<table class="table1"><thead><tr><td>No.</td><td>Item name</td><td>Current value<br/>(how much more to go)</td></tr></thead><tbody>';
	for (var i = 0, len = data.length; i < len; ++i) {
    	html += '<tr>';
    	var index = i+1;
    	for (var j = 0, rowLen = 3; j < rowLen; ++j ) {
        	if(j==0)
        		html += '<td>' + index + '</td>';
        	else if(j==1)
        		html += '<td><a href="' + data[i].url + '">' + data[i].title + '</a></td>';
        	else {
				if (data[i].diff > 0) {
					html += '<td>$' + data[i].currPrice + '<br/><span class="red">($' + data[i].diff + ' over your price)</span>' + '</td>';
				}
				else {
					html += '<td>$' + data[i].currPrice + '<br/><span  class="green">($' + Math.abs(data[i].diff) + ' to go towards your price!)</span>' + '</td>';
				}
			}
    	}
   		html += "</tr>";
	}
	html += '</tbody><tfoot><tr></tr></tfoot></table>';

	$('#tab2').html(html);
}

function convert(obj){
	var rate;
	chrome.storage.local.get(exchgrateKey, function(items){
		if(items[exchgrateKey]!==undefined){
			rate=items[exchgrateKey];
			var bits = obj.price/rate;
			$('#item-bitprice').text(bits);
		}
		else
			window.alert("fail");
	});
}