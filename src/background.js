function getFriendsStatistics(table) {
    if (!table) {
        console.log('something went wrong when getting table');
        console.debug(table);
    }
    else{
        const friends = [];
        for (let i = 1; i < table.rows.length; i++) {
            const row = table.rows[i];
            const firstCellChildNodes = row.cells[0].querySelectorAll('div');
            const avatar = firstCellChildNodes[0].querySelector('a').style.backgroundImage.replaceAll('"', '');
            const nickname = firstCellChildNodes[1].querySelector('a').textContent;
            const profileUrl = firstCellChildNodes[1].querySelector('a').href;
            const score = row.cells[1].textContent;
            const status = row.cells[2].textContent;
            const friend = {
                'avatar': avatar,
                'nickname': nickname,
                'profileUrl': profileUrl,
                'score': score,
                'status': status
            };
            friends.push(friend);
        }
        return friends;
    }
}

function handleMessage(message, sender, sendResponse) {
    if (message.url) {
        fetch(message.url, {
            method: 'GET',
            mode: 'no-cors'
        }).then(data => data.text()).then(html =>{
            const domParser = new DOMParser();
            const dom = domParser.parseFromString(html, 'text/html');
            const table = dom.querySelector('table[class=table-recently-updated]');
            const friendsStats = getFriendsStatistics(table);
            sendResponse({'friendsStats': friendsStats});
        });
        return true;
    } else if (message.fullUrl) {
        fetch(message.fullUrl, {
            method: 'GET',
            mode: 'no-cors'
        }).then(data => data.text()).then(html => {
            const domParser = new DOMParser();
            const dom = domParser.parseFromString(html, 'text/html');
            const fullUrl = dom.querySelector('link[rel=canonical]').attributes['href'].value + '/stats';
            sendResponse({'fullUrl': fullUrl});
        });
        return true;
    }
    console.error('incorrect message params');
    return true;
}
chrome.runtime.onMessage.addListener(handleMessage);
console.log('start background script');