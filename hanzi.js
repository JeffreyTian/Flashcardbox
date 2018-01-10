window.onload = init;

// 添加单词还是修改单词
var isAdd = true;
// 是否需要刷新单词本。在添加单词时，可以连续添加。为避免频繁刷新页面，只有在退出添加单词 form 时才刷新单词本。
var toBeRefreshed = true;

function init() {
    mydb.open(refreshWebPage);

    var dialog = document.getElementById("addWordDialog");
    var form = document.getElementById("addWordForm");
    var submitButton = document.getElementById("wordSubmit");
    var resetButton = document.getElementById("wordReset");
    var openDialog = document.getElementById("openAddWordDialog");

    openDialog.onclick = function () {
        var title = document.getElementById("wordDialogTitle");
        title.innerHTML = "添加单词";
        dialog.style.display = "block";
        submitButton.style.marginLeft = "30px";
        submitButton.style.marginRight = "30px";
        resetButton.style.marginLeft = "30px";
        resetButton.style.marginRight = "30px";

        isAdd = true;
    };

    submitButton.onclick = function () {
        if (submitWord()) {
            if (isAdd) {
                form.reset();
            }
            else {
                closeDialog.click();
            }
        }
    };

    resetButton.onclick = function () {
        form.reset();
    };

    // 不知道为什么下面的程序不管用。
    // https://stackoverflow.com/a/14589251/5842010
    // form.onsubmit = function() {
    // handleWordSubmit();
    // make all iuput entries empty after adding a word in db.
    // form.reset(); 这条语句可能会引起数据库操作不正常。搞不明白。暂时不用了。
    // return false cancels default submission action and keep the pop up window open.
    // displayAllWords();
    // return false;
    // };

    var closeDialog = document.getElementById("closeAddWordDialog");
    closeDialog.onclick = function () {
        form.reset();
        resetButton.style.display = "inline-block";
        dialog.style.display = "none";
        // 不论是增加单词还是修改单词，只有按提交按钮才说明有更新，这时才需要 refresh web page
        if (toBeRefreshed) {
            refreshWebPage();
            toBeRefreshed = false;
        }
    };

    // init page changer
    var inputPage = document.getElementById("inputPage");
    var inputButton = document.getElementById("inputButton");

    inputPage.onkeypress = function (e) {
        if (e.keyCode === 13) {
            inputButton.click();
            return false;
        }
    };

    inputButton.onclick = function () {
        var number = inputPage.value;
        var regex = /^[0-9]+$/;
        if (!number.match(regex)) {
            alert("请输入一个整数。例如：3, 88, 102");
            return false;
        }
        inputPage.value = "";
        changePage(number);
    };


    // handle tags
    var inputTags = document.getElementById("inputTags");
    var selectTags = document.getElementById("selectTags");

    selectTags.onchange = function () {
        var tagsFromInput = inputTags.value.trim();
        var tagsFromSelect = getSelectValues(selectTags);
        if (tagsFromInput.length > 0) {
            var reg = /\s*,\s*/; // remove spaces
            //这种方法不能去掉字符串开头和末尾的空白符。
            //而且，如果有 ,,, 这样的输入，还是会产生一个空字符串。
            var inputValues = tagsFromInput.split(reg);
            for (var i = inputValues.length - 1; i >= 0; i--) {
                if (inputValues[i].length > 0 && tagsFromSelect.indexOf(inputValues[i]) === -1) {
                    tagsFromSelect.splice(0, 0, inputValues[i]);
                }
            }
        }

        inputTags.value = tagsFromSelect.toString();
    };

    // 初始化 words export 
    var exportButton = document.getElementById("exportWords");
    exportButton.onclick = exportWords;

    // 初始化 words import
    var importButton = document.getElementById("importFile");
    importButton.addEventListener('change', loadFile, false);
}

function loadFile(event) {
    var file = this.files[0];
    console.log(file);
    var reader = new FileReader();
    reader.onload = function (event) {
        var jsonText = reader.result;
        updateResults(jsonText);
    }
    reader.readAsText(file);
}

function updateResults(text) {
    console.log("replacing with imported file...")
    initializeResultSet(JSON.parse(text));
}

function exportWords() {
    var wordString = JSON.stringify(results);
    // wordString 必须放在数组中
    var wordBlob = new Blob([wordString], {text : 'application/json'});

    var aTag = document.createElement('a');
    aTag.download = "wordsBak.json";
    aTag.href = URL.createObjectURL(wordBlob);
    aTag.click();
    URL.revokeObjectURL(wordBlob);
}

function initializeResultSet(words) {
    results = words;
    changePage(1);
}

function addWordToResultSet(word) {
    results.push(word);
}

function removeWordFromResultSet(key) {
    for (var i = 0; i < results.length; i++) {
        if (results[i].timeStamp === key) {
            results.splice(i, 1);
            break;
        }
    }
    changePage(current_page);
}

function updateWordInResultSet(word) {
    for (var i = 0; i < results.length; i++) {
        if (results[i].timeStamp === word.timeStamp) {
            results[i] = word;
            console.log(word.word + " 被修改了");
            break;
        }
    }
    changePage(current_page);
}

function refreshWebPage() {
    mydb.getAllTags(updateTagSelectOptions);
    mydb.getAllWords(initializeResultSet);
}

function createTagDropDownListInTableCell(tags) {
    var dropDown = document.createElement("select");
    if (!tags) {
        return;
    }
    // 如果不使用 toString 方法，会出错，JS 认为 tags 不是一个 string。
    // 需要琢磨琢磨。
    var list = tags.toString().split(',');
    for (var i = 0; i < list.length; i++) {
        var optionObj = document.createElement("option");
        optionObj.text = list[i];
        optionObj.value = list[i];
        dropDown.add(optionObj);
    }
    // 这里不能使用 innerHTML
    return dropDown.outerHTML;
}

function updateTagSelectOptions(tags) {
    var selectTags = document.getElementById("selectTags");
    selectTags.options.length = 0; //remove all options
    if (!tags)
        return;
    for (var i = 0; i < tags.length; i++) {
        var optionObj = document.createElement("option");
        optionObj.text = tags[i];
        optionObj.value = tags[i];
        selectTags.options.add(optionObj);
    }
}

function submitWord() {
    // 需要对输入进行校验：
    // 单词不能为空
    // 标签不能为空
    // 标签的格式必须正确。
    toBeRefreshed = true;

    var word = document.getElementById("word").value.trim();
    var phonetic = document.getElementById("phonetic").value.trim();
    var wordnote = document.getElementById("wordnote").value.trim();
    var tags = document.getElementById("inputTags").value.trim();
    var timeStamp = document.getElementById("timeStampFlag").value;

    // we also commit tags change.
    var inputTags = document.getElementById("inputTags");
    var selectTags = document.getElementById("selectTags");

    var tagsFromInput = inputTags.value.trim();
    var tagsFromSelect = getSelectOptionValues(selectTags);

    if (word.length === 0) {
        alert("单词不能为空。");
        return false;
    }

    if (tagsFromInput.length === 0) {
        alert("标签不能为空。");
        return false;
    }

    var reg = /\s*,\s*/; // remove spaces
    //这种方法不能去掉字符串开头和末尾的空白符。
    //而且，如果有 ,,, 这样的输入，还是会产生一个空字符串。
    var inputValues = tagsFromInput.split(reg);
    for (var i = inputValues.length - 1; i >= 0; i--) {
        if (inputValues[i].length > 0 && tagsFromSelect.indexOf(inputValues[i]) === -1) {
            tagsFromSelect.splice(0, 0, inputValues[i]);
        }
    }

    var newTags = {
        key: "tags",
        value: tagsFromSelect
    };

    mydb.updateTags(newTags, updateTagSelectOptions);

    if (timeStamp == "")
        timeStamp = new Date().getTime();
    else
        // 如果不转换为 integer，会出现 NaN 错误。
        timeStamp = parseInt(timeStamp);

    var res = {
        word: word,
        phonetic: phonetic,
        wordnote: wordnote,
        tags: tags.split(","), //还需要检验：是否为空，是否前后有空白等等。
        timeStamp: timeStamp
    };

    if (isAdd) {
        mydb.addWord(res, addWordToResultSet);
    }
    else {
        mydb.updateWord(res, updateWordInResultSet);
    }

    return true;
}

function editWord(word) {
    var dialog = document.getElementById("addWordDialog");
    dialog.style.display = "block";
    var resetButton = document.getElementById("wordReset");
    resetButton.style.display = "none";
    var submitButton = document.getElementById("wordSubmit");
    submitButton.style.marginLeft = "95px";
    submitButton.style.marginRight = "95px";
    var title = document.getElementById("wordDialogTitle");
    title.innerHTML = "编辑单词";

    var myWord = document.getElementById("word");
    myWord.value = word.word;
    var phonetic = document.getElementById("phonetic");
    phonetic.value = word.phonetic;
    var wordnote = document.getElementById("wordnote");
    wordnote.innerHTML = word.wordnote;
    var tags = document.getElementById("inputTags");
    tags.value = word.tags;

    var flag = document.getElementById("timeStampFlag");
    flag.value = word.timeStamp;

    isAdd = false;
}


var current_page = 1; // 当前页
var records_per_page = 5; // 每页记录数
var results = [];

function previousPage() {
    if (current_page > 1) {
        current_page--;
        changePage(current_page);
    }
}

function nextPage() {
    if (current_page < numPages()) {
        current_page++;
        changePage(current_page);
    }
}

function firstPage() {
    current_page = 1;
    changePage(current_page);
}

function lastPage() {
    current_page = numPages();
    changePage(current_page);
}


function changePage(page) {
    // Validate page
    if (numPages() === 0) {
        alert("数据库为空。");
        return;
    }

    if (page < 1) page = 1;
    if (page > numPages()) page = numPages();


    var wordTable = document.getElementById("wordTable");
    wordTable.innerHTML = "";

    var header = ["单词", "音标", "解释", "标签", "加入时间", "操作"];
    var headerWidth = ["80px", "80px", "", "80px", "80px", "80px"];
    var table = document.createElement("table");
    table.id = "wordbook";
    var headerRow = table.insertRow(-1);
    for (var i = 0; i < header.length; i++) {
        var headerCell = document.createElement("th");
        headerCell.innerHTML = header[i];
        headerCell.style.width = headerWidth[i];
        headerRow.appendChild(headerCell);
    }

    var start = (page - 1) * records_per_page;
    var end = Math.min(page * records_per_page, results.length);
    for (var i = start; i < end; i++) {
        var res = results[i];
        var arr = [res.word, res.phonetic, res.wordnote, createTagDropDownListInTableCell(res.tags), getDateString(res.timeStamp)];
        var row = table.insertRow(-1);
        for (var j = 0; j < header.length - 1; j++) {
            var cell = row.insertCell(-1);
            cell.innerHTML = arr[j];
        }

        var editImg = document.createElement("img");
        editImg.src = "images/edit.png";
        editImg.className = "wordEdit";
        editImg.setAttribute("word-key", res.timeStamp);
        editImg.setAttribute("word", res.word);

        var deleteImg = document.createElement("img");
        deleteImg.src = "images/delete.png";
        deleteImg.className = "wordDelete";
        deleteImg.setAttribute("word-key", res.timeStamp);
        deleteImg.setAttribute("word", res.word);

        var cell = row.insertCell(-1);
        cell.appendChild(editImg);
        cell.appendChild(deleteImg);

        deleteImg.onclick = function (event) {
            var key = event.target.getAttribute("word-key");
            var word = event.target.getAttribute("word");
            var toDelete = confirm("您确定删除单词 " + word + " 吗？");
            if (toDelete) {
                mydb.deleteWord(parseInt(key), word, removeWordFromResultSet);
            }
        };

        // 一开始，删除操作写成下面这样。但是，在删除的时候，总是删除列表中最后一个
        // 单词。我估计这又跟闭包之类的操作有关。可能在每次循环时，正确的 res 值
        // 并没有赋给 deleteWord 的参数。
        // 如果想使用闭包，必须运行相应的内部函数，才能把外部环境中的变量值记住。
        // 下面的函数并没有执行，估计就记不住了。
        // deleteImg.onclick = function() {
        //     deleteWord(res);
        // }

        editImg.onclick = function (event) {
            var key = event.target.getAttribute("word-key");
            mydb.getWordById(parseInt(key), editWord);
        };
    }

    wordTable.appendChild(table);

    var firstPage;
    var previousPage;
    var nextPage;
    var lastPage;

    if (page == 1) {
        firstPage = "首页&nbsp;";
        previousPage = "上页&nbsp;";
    } else {
        firstPage = '<a href="javascript:firstPage()">' + '首页' + '</a>&nbsp;';
        previousPage = '<a href="javascript:previousPage()">' + '上页' + '</a>&nbsp;';
    }

    if (page == numPages()) {
        nextPage = "下页&nbsp;";
        lastPage = "末页&nbsp;";
    } else {
        nextPage = '<a href="javascript:nextPage()">' + '下页' + '</a>&nbsp;';
        lastPage = '<a href="javascript:lastPage()">' + '末页' + '</a>&nbsp;';
    }

    var currentAndTotalPages = "&nbsp当前页: " + page + "/" + numPages() + "&nbsp";

    document.getElementById("pageChanger").innerHTML =
        firstPage + previousPage + nextPage + lastPage + currentAndTotalPages;

    var inputPage = document.getElementById("inputPage");
    var inputButton = document.getElementById("inputButton");
    inputPage.style.display = "inline-block";
    inputPage.style.display = "inline-block";
}

function numPages() {
    //如果数据库为空，返回的值就为 0 。在 caller 那里必须对这种情况进行判断。
    return Math.ceil(results.length / records_per_page);
}

