function importWords() {
    var options = {
        success: function (files) {
            alert("Here's the file link: " + files[0].link);
        },
        multiselect: false
    }

    var button = Dropbox.createChooseButton(options);
    document.getElementById("fileButton").appendChild(button);
}

