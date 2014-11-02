// script injected into browser page
var newEggUrlRegex = /^.+newegg\.com\/product\/product\.aspx\?item=.+$/i
var newEggImageContainerRegex = /CurImage:["|']([^"|'])+["|']/i
var newEggImageIdRegex = /([0-9]+-[0-9]+-[0-9]+)-[0-9a-z]+/i

function parseNewEggItem() {
	var item = {};
		
	// save url
	item.url = document.URL;
	
	// parse for title
	item.title = document.title;
	
	// parse for price
	var priceTag = document.getElementById('singleFinalPrice');
	item.price = priceTag.getAttribute('content');
	
	// parse for image url
	var imageHolder = document.getElementById('A2');
	var imageIdFull = newEggImageContainerRegex.exec(imageHolder.getAttribute('onclick'))[0];
	var imageId = newEggImageIdRegex.exec(imageIdFull)[1];
	
	// pad imageId with zeros
	if (imageId[0] != 0 && imageId.indexOf('-') <= 2) {
		imageId = '0' + imageId;
	}

	// get tag Id
	var imageTagId = 'mainSlide_' + imageId;
	item.imageUrl = document.getElementById(imageTagId).getAttribute('src');
	
	// save date created
	item.dateCreated = new Date();
	
	return item;
}

function parseSource() {
	// get document url
	var url = document.URL;
	var result = null;
	
	// if is newegg item page url
	if (newEggUrlRegex.test(url)) {
		console.log('[sp] NewEgg item page found.');
		result = parseNewEggItem();
	}
	else {
		console.log('[sp] Did not match any page types');
	}
	
	// return result
	if (result != null) {
		return JSON.stringify(result);
	}
	else {
		return null;
	}
}

// send callback to chrome extension
chrome.extension.sendMessage({
    action: "parsedSource",
    source: parseSource(document)
});