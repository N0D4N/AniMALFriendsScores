function getFriendsStatistics(table) {
    if (!table) {
        console.log("something went wrong when getting table");
    }
    const friends = [];
    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        const firstCellChildNodes = row.cells[0].querySelectorAll("div");
        const avatar = firstCellChildNodes[0].querySelector("a").style.backgroundImage.replaceAll('"', "");
        const nickname = firstCellChildNodes[1].querySelector("a").textContent;
        const profileUrl = firstCellChildNodes[1].querySelector("a").href;
        const score = row.cells[1].textContent;
        const status = row.cells[2].textContent;
        const friend = {
            "avatar": avatar,
            "nickname": nickname,
            "profileUrl": profileUrl,
            "score": score,
            "status": status
        };
        friends.push(friend);
    }
    return friends;
}

function handleMessage(message, sender, sendResponse) {
    const xhr = new XMLHttpRequest();

    if(message.url){
        xhr.open("GET", message.url);
        xhr.send();

        xhr.onload = function () {
            if (xhr.status != 200) {
                sendResponse({"error": "Failed request with status code " + xhr.status});
            } else {
                const domParser = new DOMParser();
                const dom = domParser.parseFromString(xhr.responseText, "text/html");
                const table = dom.querySelector("table[class=table-recently-updated]");
                const friendsStats = getFriendsStatistics(table);
                sendResponse({"friendsStats": friendsStats});
            }
        }
        return true;
    }
    else if(message.fullUrl){
        xhr.open("GET", message.fullUrl);
        xhr.send();

        xhr.onload = function () {
            if (xhr.status != 200) {
                sendResponse({"error": "Failed request with status code " + xhr.status});
            } else {
                const domParser = new DOMParser();
                const dom = domParser.parseFromString(xhr.responseText, "text/html");
                const fullUrl = dom.querySelector("link[rel=canonical]").attributes["href"].value + "/stats";
                sendResponse({"fullUrl": fullUrl});
            }
        }

        return true;
    }
    sendResponse({"error": "Doesnt match type"});
    return true;

}

chrome.runtime.onMessage.addListener(handleMessage);
