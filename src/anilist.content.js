console.log('read start of script');

const extensionUniqueIdForCustomFollowingDiv = 'made-by-AniMALFriendsScores';
const malUrl = 'https://myanimelist.net';
const mal = 'MyAnimeList';
const cdnMalImages = 'https://cdn.myanimelist.net/images/';

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
            return url + '/stats';
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

    function createLinkToMal(type, id) {
        const isMobile = document.getElementsByClassName('mobile-nav').length > 0;
        const externalLinks = document.getElementsByClassName('external-links-wrap');
        if (externalLinks.length > 0) {
            const externalLinksDiv = externalLinks[1] ? externalLinks[1] : externalLinks[0];
            const dataAttributeName = getDataAttributeName(externalLinksDiv.children[0]);
            const a = document.createElement('a');
            a.className = 'external-link';
            a.href = getMediaUrl(type, id);
            a.setAttribute(dataAttributeName, '');
            a.style.cssText = '--link-color: #2e51a2;';
            const div = document.createElement('div');
            div.className = 'icon-wrap';
            div.setAttribute(dataAttributeName, '');
            const img = document.createElement('img');
            img.className = 'icon';
            img.setAttribute(dataAttributeName, '');
            img.src = `${cdnMalImages}favicon.ico`;
            img.style.minWidth = '24px';
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
            a.className = 'button';
            a.href = getMediaUrl(type, id);
            a.text = mal;
            a.style.cssText = 'display: flex;';
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
        a.className = 'follow';
        a.href = hrefUrl;
        a.style.cssText = 'align-items:center; background:rgb(var(--color-foreground)); border-radius:3px; display:grid; font-size:1.4rem; grid-template-columns:30px 2fr 1fr .5fr; margin-bottom:10px; padding:10px; border-style: solid; border-width: 1px;';
        const avatarDiv = document.createElement('div');
        a.appendChild(avatarDiv);
        avatarDiv.className = 'avatar';
        avatarDiv.style.cssText = 'background-position:50%; background-repeat:no-repeat; background-size:cover; border-radius:3px; height:30px; width:30px; background-image: ' + avatarUrl;
        const nameDiv = document.createElement('div');
        a.appendChild(nameDiv);
        nameDiv.className = 'name';
        nameDiv.innerText = nickname;
        nameDiv.style.cssText = 'padding-left:15px; font-weight:500;overflow: hidden;margin-right:2em;';
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

    const getAlId = () => window.location.href.match(/\d+/)[0];
    /// END OF FUNCTIONS

    let currentUrl = '';

    // looping forever so we can react to change of url
    // noinspection InfiniteLoopJS
    while (true) {
        if (// Url changed
            window.location.href !== currentUrl
            &&
            // Current page is anime or manga page
            window.location.href.match(/(anilist.co\/(manga|anime)\/(\d+)\/([\w-_]+)((\/social)|$|(\/$)))/)) {
            console.log('Changed url: ' + JSON.stringify({'previousUrl': currentUrl, 'newUrl': window.location.href}));
            currentUrl = window.location.href;
            // Clear all scores from previous pages
            for (let i = 0; i < 10; i++) { // loop 10 times because clearing once can leave previous
                for (let elementsByTagNameElement of document.getElementsByTagName('a')) {
                    if (elementsByTagNameElement.href.includes(malUrl)) {
                        elementsByTagNameElement.remove();
                    }
                }
            }
            console.debug('In process func');
            const type = getMediaType();
            const alId = getAlId();


            const malId = await getMalIdFromAlId(alId);
            if (malId !== null && malId !== undefined) {
                const malFullUrl = await malGetFullUrl(type, malId);
                const response = await getMalTableFriendUpdatesTableOrNull(malFullUrl);
                displayFriendsStatistics(response.friendsStats, response.loggedIn);
                createLinkToMal(type, malId);
            }
            else{
                console.log('Seems like this AL page doesn\'t have MAL id');
            }
        }
        await sleep(500);
    }
}

process().catch(er => console.log(er)).then(r => console.log(r));
