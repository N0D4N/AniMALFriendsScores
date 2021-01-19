async function process() {
    /// FUNCTIONS
    const malRequestOptions = {
        method: 'get',
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "User-Agent": window.navigator.userAgent
        },
        mode: "no-cors"
    };

    async function getMalIdFromAlId(alId) {
        console.log("Trying to get Mal id for this entry")
        return fetch("https://graphql.anilist.co", {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: `{ Media(id: ${alId}) { idMal } }`
            })
        }).then(res => res.json()).then(json => json.data.Media.idMal);
    }

    const getMediaType = () => window.location.href.includes("/anime/") ? "anime" : "manga";

    async function malGetFullUrl(type, id) {
        /*console.log("Trying to get full url for this MAL entry")
        const url = await fetch(`https://api.jikan.moe/v3/${type}/${id}`, {
            method: "get"
        }).then(res => res.json()).then(j => j.url);
        if (url) {
            console.log("Got url from jikan.moe");
            return url + "/stats";
        }*/
        console.log("Failed to load full url from jikan.moe, trying to load it from MAL");
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({"fullUrl": `https://myanimelist.net/${type}/${id}`}, function (response) {
                if (response.fullUrl)
                    resolve(response.fullUrl);
                else
                    reject(response.error);
            });
        });
    }

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

    async function getMalTableFriendUpdatesTableOrNull(url) {
        console.log("Trying to get stats of friends on url " + url);
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({"url": url}, function (response) {
                if (response.friendsStats)
                    resolve(response.friendsStats);
                else
                    reject(response.error);
            });
        });
    }

    function displayFriendsStatistics(friendsStats) {
        const followingDiv = document.querySelector("div[class=following]");
        friendsStats.forEach(fs => {
            const parentDiv = document.createElement("div");
            followingDiv.appendChild(parentDiv);
            parentDiv.className = "limit";
            const a = document.createElement("a");
            parentDiv.appendChild(a);
            a.className = "follow";
            a.href = fs.profileUrl;
            a.style.cssText = "align-items:center; background:rgb(var(--color-foreground)); border-radius:3px; display:grid; font-size:1.4rem; grid-template-columns:30px 2fr 1fr .5fr; margin-bottom:10px; padding:10px; border-style: solid; border-width: 1px;";
            const avatarDiv = document.createElement("div");
            a.appendChild(avatarDiv);
            avatarDiv.className = "avatar";
            avatarDiv.style.cssText = "background-position:50%; background-repeat:no-repeat; background-size:cover; border-radius:3px; height:30px; width:30px; background-image: " + fs.avatar;
            const nameDiv = document.createElement("div");
            a.appendChild(nameDiv);
            nameDiv.className = "name";
            nameDiv.innerText = fs.nickname;
            nameDiv.style.cssText = "padding-left:15px; font-weight:500;";
            const statusDiv = document.createElement("div");
            a.appendChild(statusDiv);
            statusDiv.className = "status";
            statusDiv.innerText = fs.status;
            const scoreSpan = document.createElement("span");
            a.appendChild(scoreSpan);
            scoreSpan.innerText = fs.score;
        });
    }

    const getAlId = () => window.location.href.match(/\d+/)[0];
    /// END OF FUNCTIONS
    console.debug("In process func");
    const type = getMediaType();
    const alId = getAlId();

    const malId = await getMalIdFromAlId(alId);
    const malFullUrl = await malGetFullUrl(type, malId);
    const friendsStats = await getMalTableFriendUpdatesTableOrNull(malFullUrl);
    displayFriendsStatistics(friendsStats);
}

process();
