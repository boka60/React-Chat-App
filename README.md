# React Chat App

  

This is modified version of [FireShip's React Firebase Chat](https://github.com/fireship-io/react-firebase-chat) with commands and other things.
(Updated to the latest version of Firebase and Reactjs.)

  

## Installation

  

### You will need `node.js` and `npm`.

```bash

git clone https://github.com/boka60/React-Chat-App

cd React-Chat-App

npm install
```

### Setting up Firebase
1. Go to  [Firebase console](https://console.firebase.google.com/) 
2. Click on 'Add project'
3. Name your project
4. You will be asked if you want to enable Google Analytics. You can enable or disable, it doesn't matter.
5. Wait for your project to create
6. Click continue
7. Click Web (third icon) 
![alt text](https://media.discordapp.net/attachments/1024682498392871002/1024682536846237756/1.png)
8. Give your application a name.
9. 'Also set up Firebase Hosting for this app. Learn more' -Dont click this
10. Click 'Register app'
11. Click 'Use a < script > tag'
12. Just copy the config
```js
const firebaseConfig =  {
apiKey:  "",
authDomain:  "",
projectId:  "",
storageBucket:  "",
messagingSenderId:  "",
appId:  ""
};
```
13. Click 'Continue to console'
14. Paste this on **`/src/App.js`** line 9 to 17.
15. Save
16. In Firebase console go to **`Build > Authentication`**
17. Click 'Get Started'
18. You will be asked to select a provier. Click on Google.
19. Enable it. Select your email and click 'Save'.
20. Go to **`Build > Cloud Firestore`** and click 'Create database' (select 'production mode').
21. Choose location closest to you and click 'Enable'.
22. After creating database click on 'Rules'.
23. Delete everything and paste this:
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
    match /message/{docId} {
    allow read: if request.auth.uid != null;
    allow create: if canCreateMessage();
    }
    function canCreateMessage(){
    let isSignedIn = request.auth.uid != null;
    let isOwner = request.auth.uid == request.resource.data.uid;
    let isNotBanned = exists(
    /databases/$(database)/documents/banned/$(request.auth.uid)
    ) == false;
    return isSignedIn && isOwner && isNotBanned;
    }
  }
}
```
24. Click on 'Publish'.
25. That's it! You can now start the app with **`npm start`** command.

#### When you start the app it should automatically open `http://localhost:3000`. If not click <a href="http://localhost:3000" target="_blank">here</a>.

## Chat commands
##### /ban [messageID] [reason]
Does what it says, bans the user forver from accessing the chat.

**`[reason]` is optional.**

**Make sure that the reason is ONE word.**

**`Example:`**
`/ban msgID Spamming_And_Breaking_Rules` or `/ban msgID SpammingAndBreakingRules`

**When you ban a user they won't be able to signin. If they are online they will instantly get logged out.**
##### /unban [messageID]
**`messageID` needs to be from user that you want to unban, not system's message id!**
Unbans the user.

  

**When you ban or unban a user, system message will appear in chat.**

![alt text](https://media.discordapp.net/attachments/939918273372385320/1024657289912791050/unknown.png)

  
## How to set someone as admin
#### For now only one person can be admin!

#### Open `/src/App.js` file and change `adminID` and `adminEmail` on line `23` and `24`.
```js
const adminID = "id";
const adminEmail = "youremail@gmail.com";
```
#### How to get `adminID`?

##### After logging in with Google, send a message. After that go to Firestore database, then go to messages and click on your message. After doing that you will see something like this:

![alt text](https://media.discordapp.net/attachments/1024682498392871002/1024688290831552623/3.png)

  

#### Copy your `uid` and paste it on line `23`.
#### Good job! You have successfully set your self as an admin!
