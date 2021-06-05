# AniMALFriendsScores
![GitHub](https://img.shields.io/github/license/N0D4N/AniMALFriendsScores?style=flat-square)![Mozilla Add-on](https://img.shields.io/amo/v/animalfriendsscores?style=flat-square)
### Summary  
Small (<250 lines of effective code) **unofficial** browser extension for showing scores from your friends from MyAnimeList account on AniList anime or manga pages. 

### Installation  
* Mozilla Firefox   
  Extension is available on [Mozilla addon page](https://addons.mozilla.org/en-US/firefox/addon/animalfriendsscores/). Extension works in Firefox Android, however [requires extra steps](https://blog.mozilla.org/addons/2020/09/29/expanded-extension-support-in-firefox-for-android-nightly/).

* Google Chrome / Chromium  
  I don't use Chrome or Chromium, so I don't have any plans on publishing it to [Chrome Web Store](https://chrome.google.com/webstore/). However there are ways to install extensions not from Chrome Web Store, here is one of them:
  1. Go to [releases page](https://github.com/N0D4N/AniMALFriendsScores/releases/latest).  
  2. Download `Source code.zip`.
  3. Unzip it.
  4. Open `chrome://extensions/`.
  5. Enable developer mode.
  6. Click on `Load unpacked` button.
  7. Select `src` subfolder of folder where you unzipped `Source code.zip`.
  8. You are done.
  9. (Optional) Press `Watch` button on the top of the page, select `Custom` option and make a mark before Releases section, so you will be notified on new updates, so you will be able to update extension manually.
    
### How does it look like?
Scores from MyAnimeList friends have thin white border around them.
![Screenshot](images/screenshot1.png)  
Names were changed, in a browser your friends usernames names will be displayed correctly.

### How does it work?
Extension checks, if anime/manga on current AniList page has MyAnimeList id via [AniList GraphQL API](https://github.com/AniList/ApiV2-GraphQL-Docs), if it does, it fetches full url to anime/manga page via [Jikan REST API](https://jikan.moe/), then loads page with friends scores and statuses, parses it and displays on AniList page.

### CONTACT
For any contacts, questions, ideas, proposals or anything else - please open an [issue](https://github.com/N0D4N/AniMALFriendsScores/issues/new), I'll try to answer all of them.

## DISCLAIMER
AniMALFriendsScores is **unofficial** extension and is not affiliated with MyAnimeList.net or Anilist.co in any way.

## LICENSE
AniMALFriendsScores is licensed under MIT license. See LICENSE file for more details.
