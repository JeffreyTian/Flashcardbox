function databaseObject() {
    var dbObj = {
        name: "MyNoteBook",
        version: 1,
        onerror: function() {
            console.log("数据库操作错误发生了...");
            console.dir(e);
            alert("数据库操作错误。请关闭该应用，联系我们强大的客服团队。");
        }
    };

    var db;

    dbObj.open = function(callback) {
        var dbRequest = window.indexedDB.open(dbObj.name, dbObj.version);

        dbRequest.onerror = dbObj.handleError;

        dbRequest.onupgradeneeded = function(event){
            console.log("数据库正在更新......");

            var db = event.target.result;
            if (!db.objectStoreNames.contains('words')) {
                db.createObjectStore('words', {keyPath: "timeStamp"});
            }
            if (!db.objectStoreNames.contains('properties')) {
                db.createObjectStore('properties', {keyPath: 'key'});
            }
        };

        dbRequest.onsuccess  = function(event){
            console.log("数据库打开成功。");
            db = event.target.result;
            callback();
        };
    };

    dbObj.getAllWords = function(callback) {
        console.log("获取所有生字...");
        var transaction = db.transaction(["words"], "readonly");
        var objectStore = transaction.objectStore("words");
        var keyRange = IDBKeyRange.lowerBound(0);
        var cursorRequest = objectStore.openCursor(keyRange);

        transaction.oncomplete = function(e) {
            console.log("获取所有生字完成。");
            callback(results);
        };

        transaction.onerror = dbObj.handleError;

        var results = [];

        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;
            if (!result) {
                return;
            }

            results.push(result.value);
            result.continue();
        };

        cursorRequest.onerror = dbObj.handleError;
    };

    dbObj.addWord = function(wordObj, callback) {
        console.log("添加生字...");
        var transaction = db.transaction(["words", "properties"], "readwrite");
        var objectStore = transaction.objectStore("words");

        var request = objectStore.put(wordObj);
        request.onsuccess = function(event) {
            console.log("添加生字 ：" + wordObj.word + " " + wordObj.timeStamp +  " 成功！");
            callback(wordObj);
        };

        request.onerror = dbObj.handleError;
    };

    dbObj.updateWord = function(wordObj, callback) {
        console.log("更新生字...");
        var transaction = db.transaction(["words", "properties"], "readwrite");
        var objectStore = transaction.objectStore("words");

        var request = objectStore.put(wordObj);
        request.onsuccess = function(event) {
            console.log("更新生字 ：" + wordObj.word + " " + wordObj.timeStamp +  " 成功！");
            callback(wordObj);
        };

        request.onerror = dbObj.handleError;
    };

    dbObj.getWordById = function(key, callback) {
        console.log("查询单字...");
        var transaction = db.transaction(['words'], 'readonly');
        var objectStore = transaction.objectStore('words');

        var request = objectStore.get(key);

        request.onsuccess = function(event) {
            var word = event.target.result;
            console.log("单词 " + word.word + " 查询到了。");
            callback(word);
        };

        request.onerror = dbObj.handleError;
    };

    dbObj.deleteWord = function(key, word, callback) {
        console.log("删除单字...");
        var transaction = db.transaction(['words'], 'readwrite');
        var objectStore = transaction.objectStore('words');

        var request = objectStore.delete(key);

        request.onsuccess = function(event) {
            console.log("单词 " + word + " " + key + " 已经被删除了。");
            callback(key);
        };

        request.onerror = dbObj.handleError;
    };

    dbObj.getAllTags = function(callback) {
        console.log("获取所有标签...");
        var transaction = db.transaction(["properties"], "readonly");
        var objectStore = transaction.objectStore("properties");
        var request = objectStore.get("tags");

        request.onerror = dbObj.handleError;

        request.onsuccess = function(event) {
            console.log("获取所有标签完成。");
            // result 可能会是 undefined，如果没有任何标签定义的话
            var result = event.target.result;
            if (result) {
                callback(result.value);
            } else {
                console.log("数据库中没有任何标签信息。");
            }
        };
    };

    dbObj.updateTags = function(tags, callback) {
        console.log("更新所有标签...");
        var transaction = db.transaction(["properties"], "readwrite");
        var propStore = transaction.objectStore("properties");
        var tagsRequest = propStore.put(tags);

        tagsRequest.onsuccess = function(e) {
            console.log("更新所有标签成功。");
            // 数据库更新成功后再更新页面，以免出现页面更改了，但数据库却没有修改的错误。
            callback(tags.value);
        };

        tagsRequest.onerror = dbObj.handleError;
    };

    dbObj.addAllWords = function(words, callback) {
        console.log("添加所有单词...");
        var transaction = db.transaction(['words'], "readwrite")
        var objectStore = transaction.objectStore("words");

        transaction.oncomplete = function(event) {
            console.log("所有单词添加成功！");
            callback();
        }

        transaction.onerror = dbObj.handleError;

        for (var i in words) {
            var request = objectStore.add(wordObj);
            request.onsuccess = function (event) {
                console.log("添加生字 ：" + wordObj.word + " " + wordObj.timeStamp + " 成功！");
            };
        }
    }

    dbObj.clearAllWords = function(callback) {
        console.log("删除所有单词...");
        var transaction = db.transaction(['words'], 'readwrite');
        var objectStore = transaction.objectStore('words');


        var request = objectStore.clear();

        request.onsuccess = function(event) {
            console.log("所有单词已经被删除了。");
            callback();
        };

        request.onerror = dbObj.handleError;
    };
    return dbObj;
}

var mydb = databaseObject();

