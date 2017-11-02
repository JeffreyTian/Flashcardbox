function getDateString(timeStamp) {
	var date = new Date(timeStamp);
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();

	return year + '-' + month + '-' + day;
}

function isEmpty(string) {
	return !string.replace(/^\s+/g, "").length;
}

function getSelectValues(select) {
	var result = [];
	for (var i = 0; i < select.selectedOptions.length; i++) {
		result.push(select.selectedOptions[i].value);
	}
	return result;
}

function getSelectOptionValues(select) {
	var result = [];
	for (var i = 0; i < select.options.length; i++) {
		result.push(select.options[i].value);
	}
	return result;
}