const extensionUniqueIdForCustomFollowingDiv = 'made-by-AniMALFriendsScores';

async function process() {
    /// FUNCTIONS
    async function getMalIdFromAlId(alId) {
        console.log('Trying to get Mal id for this entry')
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

    const getMediaType = () => window.location.href.includes('/anime/') ? 'anime' : 'manga';

    async function malGetFullUrl(type, id) {
        console.log('Trying to get full url for this MAL entry')
        const url = await fetch(`https://api.jikan.moe/v3/${type}/${id}`, {
            method: 'get'
        }).then(res => res.json()).then(j => j.url);
        if (url) {
            console.log('Got url from jikan.moe');
            return url + '/stats';
        }
        console.log('Failed to load full url from jikan.moe, trying to load it from MAL');
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({'fullUrl': `https://myanimelist.net/${type}/${id}`}, function (response) {
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
                    resolve(response.friendsStats);
                else
                    reject(response.error);
            });
        });
    }

    function createLinkToMal(type, id) {
        const externalLinks = document.getElementsByClassName('external-links');
        if (externalLinks.length > 0) {
            const externalLinksDiv = externalLinks[0];
            let dataAttributeName;
            for (let attribute of externalLinksDiv.children[1].attributes) {
                if (attribute.name.startsWith('data-')) {
                    dataAttributeName = attribute.name;
                    break;
                }
            }
            const a = document.createElement('a');
            a.className = 'external-link';
            a.href = `https://myanimelist.net/${type}/${id}`;
            a.text = 'MyAnimeList';
            a.setAttribute(dataAttributeName, '');
            externalLinksDiv.appendChild(a);
        } else {
            const sidebar = document.getElementsByClassName('sidebar');
            let dataAttributeName;
            for (let attribute of sidebar[0].children[sidebar[0].children.length - 1].attributes) {
                if (attribute.name.startsWith('data-')) {
                    dataAttributeName = attribute.name;
                    break;
                }
            }
            const a = document.createElement('a');
            a.className = 'button';
            a.href = `https://myanimelist.net/${type}/${id}`;
            a.text = 'MyAnimeList';
            a.setAttribute(dataAttributeName, '');
            sidebar[0].appendChild(a);
        }
    }

    function displayFriendsStatistics(friendsStats) {
        let followingDiv = getOrCreateFollowingDiv();
        friendsStats.forEach(fs => {
            const parentDiv = document.createElement('div');
            followingDiv.appendChild(parentDiv);
            parentDiv.className = 'limit';
            const a = document.createElement('a');
            parentDiv.appendChild(a);
            a.className = 'follow';
            a.href = fs.profileUrl;
            a.style.cssText = 'align-items:center; background:rgb(var(--color-foreground)); border-radius:3px; display:grid; font-size:1.4rem; grid-template-columns:30px 2fr 1fr .5fr; margin-bottom:10px; padding:10px; border-style: solid; border-width: 1px;';
            const avatarDiv = document.createElement('div');
            a.appendChild(avatarDiv);
            avatarDiv.className = 'avatar';
            avatarDiv.style.cssText = 'background-position:50%; background-repeat:no-repeat; background-size:cover; border-radius:3px; height:30px; width:30px; background-image: ' + fs.avatar;
            const nameDiv = document.createElement('div');
            a.appendChild(nameDiv);
            nameDiv.className = 'name';
            nameDiv.innerText = fs.nickname;
            nameDiv.style.cssText = 'padding-left:15px; font-weight:500;';
            const statusDiv = document.createElement('div');
            a.appendChild(statusDiv);
            statusDiv.className = 'status';
            statusDiv.innerText = fs.status;
            const scoreSpan = document.createElement('span');
            a.appendChild(scoreSpan);
            scoreSpan.innerText = fs.score;
        });
    }

    const getAlId = () => window.location.href.match(/\d+/)[0];
    /// END OF FUNCTIONS
    let currentUrl = '';

    // looping forever so we can react to change of url
    // noinspection InfiniteLoopJS
    while (true) {
        // Current page is anime or manga page
        if (window.location.href.match(/(anilist.co\/(manga|anime)\/(\d+)\/([\w-_]+)((\/social)|$|(\/$)))/)
            &&
            // Url changed
            window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            // Clear all scores from previous pages
            for (let i = 0; i < 10; i++) { // loop 10 times because clearing once can leave previu
                for (let elementsByTagNameElement of document.getElementsByTagName('a')) {
                    if (elementsByTagNameElement.href.includes('https://myanimelist.net')) {
                        if(elementsByTagNameElement.href.includes('profile')){
                            elementsByTagNameElement.parentElement.remove();
                        }
                        else {
                            elementsByTagNameElement.remove();
                        }
                    }
                }
            }
            console.debug('In process func');
            const type = getMediaType();
            const alId = getAlId();


            const malId = await getMalIdFromAlId(alId);
            if (malId !== null && malId !== undefined) {
                createLinkToMal(type, malId);
                const malFullUrl = await malGetFullUrl(type, malId);
                const friendsStats = await getMalTableFriendUpdatesTableOrNull(malFullUrl);
                displayFriendsStatistics(friendsStats);
            }
        }
        await sleep(500);
    }
}

process().catch(er => console.log(er)).then(r => console.log(r));