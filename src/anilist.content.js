console.log('read start of script');

const extensionUniqueIdForCustomFollowingDiv = 'made-by-AniMALFriendsScores';
const malUrl = 'https://myanimelist.net';
const mal = 'MyAnimeList';
const cdnMalImages = 'https://cdn.myanimelist.net/images/';
const cache = new Map();
let  isLoggedIn = true;

async function process() {
    /// FUNCTIONS
    async function getMalIdFromAlId(alId) {
        console.log('Trying to get Mal id for this entry: ' + JSON.stringify({'anilistId': alId}));
        return fetch('https://graphql.anilist.co', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `{ Media(id: ${alId}) { idMal } }`
            })
        }).then(res => res.json()).then(json => json.data.Media.idMal);
    }

    // FROM https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getMediaUrl(type, id) {
        return `${malUrl}/${type}/${id}`;
    }

    const getMediaType = () => window.location.href.includes('/anime/') ? 'anime' : 'manga';

    async function malGetFullUrl(type, id) {
        const jikanUrl = `https://api.jikan.moe/v4/${type}/${id}`;
        console.log('Trying to get full url for this MAL entry from jikan: ' + JSON.stringify({'jikanUrl': jikanUrl}));
        const url = await fetch(jikanUrl, {
            method: 'get'
        }).then(res => res.json()).then(j => {
            console.log(JSON.stringify(j));
            return j?.data?.url;
        });
        if (url) {
            console.log('Got full url from jikan.moe: ' + JSON.stringify({'fullUrl': url}));
            return url;
        }
        console.log('Failed to load full url from jikan.moe, trying to load it from MAL');
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({'fullUrl': getMediaUrl(type, id)}, function (response) {
                if (response.fullUrl)
                    resolve(response.fullUrl);
                else
                    reject(response.error);
            });
        });
    }

    function createCustomFollowingDiv() {
        const grid = document.getElementsByClassName('grid-section-wrap')[0];
        const inGrid = document.createElement('div');
        inGrid.id = extensionUniqueIdForCustomFollowingDiv;
        grid.appendChild(inGrid);
        const h2 = document.createElement('h2');
        h2.className = 'link';
        h2.textContent = 'Following';
        inGrid.appendChild(h2);
        const followingDiv = document.createElement('div');
        followingDiv.className = 'following';
        inGrid.appendChild(followingDiv);
        return followingDiv;
    }

    function getOrCreateFollowingDiv() {
        let followingDiv = document.querySelector('div[class=following]');
        if (followingDiv === null || followingDiv === undefined) {
            followingDiv = createCustomFollowingDiv();
        } else {
            const followingDivParent = document.getElementById(extensionUniqueIdForCustomFollowingDiv);
            if (followingDivParent !== null && followingDivParent !== undefined) {
                followingDivParent.remove();
                followingDiv = createCustomFollowingDiv();
            }
        }
        return followingDiv;
    }

    async function getMalTableFriendUpdatesTableOrNull(url) {
        console.log('Trying to get stats of friends on url ' + url);
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({'url': url}, function (response) {
                if (response.friendsStats)
                    resolve({'friendsStats': response.friendsStats, 'loggedIn': response.loggedIn});
                else
                    reject(response.error);
            });
        });
    }

    function getDataAttributeName(element) {
        for (let attribute of element.attributes) {
            if (attribute.name.startsWith('data-'))
                return attribute.name;
        }
        throw "Couldn't get value of data attribute";
    }

    function createLinkToMal(fullUrl) {
        const isMobile = document.getElementsByClassName('mobile-nav').length > 0;
        const externalLinks = document.getElementsByClassName('external-links-wrap');
        if (externalLinks.length > 0) {
            const externalLinksDiv = externalLinks[1] ? externalLinks[1] : externalLinks[0];
            const dataAttributeName = getDataAttributeName(externalLinksDiv.children[0]);
            const a = document.createElement('a');
            a.classList.add('external-link', 'am-external-link');
            a.href = fullUrl;
            a.setAttribute(dataAttributeName, '');
            const div = document.createElement('div');
            div.className = 'icon-wrap';
            div.setAttribute(dataAttributeName, '');
            const img = document.createElement('img');
            img.classList.add('icon', 'am-icon');
            img.setAttribute(dataAttributeName, '');
            img.src = `${cdnMalImages}favicon.ico`;
            div.appendChild(img);
            const span = document.createElement('span');
            span.className = 'name';
            span.setAttribute(dataAttributeName, '');
            span.textContent = mal;
            a.appendChild(div);
            a.appendChild(span);
            externalLinksDiv.appendChild(a);
        } else {
            const sidebar = document.getElementsByClassName('sidebar');
            const dataAttributeName = getDataAttributeName(sidebar[0].children[sidebar[0].children.length - 1]);
            const a = document.createElement('a');
            a.classList.add('button', 'am-button');
            a.href = fullUrl;
            a.text = mal;
            a.setAttribute(dataAttributeName, '');
            if (isMobile) {
                document.getElementsByClassName('overview')[0].appendChild(a);
            } else {
                sidebar[0].appendChild(a);
            }
        }
    }

    function createFriendStatDiv(hrefUrl, nickname, avatarUrl, statusMessage, score) {
        const parentDiv = document.createElement('div');
        parentDiv.className = 'limit';
        const a = document.createElement('a');
        parentDiv.appendChild(a);
        a.classList.add('follow', 'am-follow');
        a.href = hrefUrl;
        const avatarDiv = document.createElement('div');
        a.appendChild(avatarDiv);
        avatarDiv.classList.add('avatar', 'am-avatar');
        avatarDiv.style.cssText = 'background-image: ' + avatarUrl;
        const nameDiv = document.createElement('div');
        a.appendChild(nameDiv);
        nameDiv.classList.add('name', 'am-name');
        nameDiv.innerText = nickname;
        const statusDiv = document.createElement('div');
        a.appendChild(statusDiv);
        statusDiv.className = 'status';
        statusDiv.innerText = statusMessage;
        const scoreSpan = document.createElement('span');
        a.appendChild(scoreSpan);
        scoreSpan.innerText = score;
        return parentDiv;
    }

    function displayFriendsStatistics(friendsStats, isLoggedIn) {
        const followingDiv = getOrCreateFollowingDiv();
        if (isLoggedIn) {
            friendsStats.forEach(fs => {
                followingDiv.appendChild(createFriendStatDiv(fs.profileUrl, fs.nickname, fs.avatar, fs.status, fs.score));
            });
        } else {
            followingDiv.appendChild(createFriendStatDiv(`${malUrl}/login.php`, 'You should be logged in to MAL to use AniMALFriendsScores extension',
                `url("${cdnMalImages}MalAppIcon_180px.png")`, 'Click to log in', ''));
        }
    }

    async function getCachedOrQuery(type, alId){
        const cachedEntry = cache.get(alId);
        if(cachedEntry){
            console.log('Data was cached: ' + JSON.stringify(cachedEntry));
            return cachedEntry;
        }
        else{
            console.log('Data wasn\'t cached');
            const malId = await getMalIdFromAlId(alId);
            if (malId !== null && malId !== undefined) {
                const malFullUrl = await malGetFullUrl(type, malId);
                const response = await getMalTableFriendUpdatesTableOrNull(malFullUrl + '/stats');
                isLoggedIn = response.loggedIn;
                const result = {'friendStats': response.friendsStats, 'fullUrl': malFullUrl};
                cache.set(alId, result);
                return result;
            }
            else{
                console.log('Seems like this AL page doesn\'t have MAL id');
                return null;
            }
        }
    }

    const getAlId = () => window.location.href.match(/\d+/)[0];

    function getAllTagsAndGenresOnPage(){
        const result = [];
        const tags = document.querySelectorAll('div#app > div.page-content  div.tags > div.tag > a.name');
        for(let i = 0; i < tags.length; i++){
            result.push(tags[i].textContent);
        }
        const genres = [...document.querySelectorAll('div.sidebar > div.data > div.data-list')].find(x=> x.firstChild.textContent === 'Genres')?.querySelectorAll('div.value > span > a');
        if(genres){
            result.push(...[...genres].map(x=>x.textContent));
        }
        return result.map(x=>x.trim().toUpperCase());
    }
    const getBlockedTagsAndGenresAsync = () => browser.storage.local.get({'tags': []}).then(t => t.tags).catch(er => []);
    const setTitleColor = (color) => document.querySelector('.content > h1').style.color = color;
    function highlightIfContainsBlockedTagsAndGenres(blocked){
        console.log('at start of highlight');
        // if(blocked.length === 0){
        //     return;
        // }
        try{
            const present = getAllTagsAndGenresOnPage();
            console.log(blocked.join(';'));
            console.log(present.join(';'));
            if(present.some(x=> blocked.includes(x))){
                setTitleColor('red');
            }
        }
        catch(err){
            console.error(err);
        }
        console.log('at end of highlight');
    }
    /// END OF FUNCTIONS

    let currentUrl = '';
    console.debug('In process func');
    const blocked = await getBlockedTagsAndGenresAsync();
    // looping forever so we can react to change of url
    // noinspection InfiniteLoopJS
    while (true) {
        if (// Url changed
            window.location.href !== currentUrl
            &&
            // Current page is anime or manga page
            window.location.href.match(/(anilist.co\/(manga|anime)\/(\d+)\/([\w-_]+)((\/social)|$|(\/$)))/)) {
            console.log('Changed url: ' + JSON.stringify({'previousUrl': currentUrl, 'newUrl': window.location.href}));
            setTitleColor('')
            currentUrl = window.location.href;
            // Clear all scores from previous pages
            for (let i = 0; i < 10; i++) { // loop 10 times because clearing once can leave previous
                for (let elementsByTagNameElement of document.getElementsByTagName('a')) {
                    if (elementsByTagNameElement.href.includes(malUrl)) {
                        elementsByTagNameElement.remove();
                    }
                }
            }
            highlightIfContainsBlockedTagsAndGenres(blocked);

            const type = getMediaType();
            const alId = getAlId();

            const info = await getCachedOrQuery(type, alId);
            if(info){
                displayFriendsStatistics(info.friendStats, isLoggedIn);
                createLinkToMal(info.fullUrl);
            }
        }
        await sleep(1000);
    }
}

process().catch(er => console.log(er)).then(r => console.log(r));
