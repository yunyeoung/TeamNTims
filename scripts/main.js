/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Signs-in Friendly Chat.
function signIn() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).then(function(){
    saveUserAtRealDB(); //참고한 코드에는 indexedDB에 먼저 저장했지만 indexedDB오류때문에 일단 건너뛸것.
    //로그인 할때마다 저장하는것,,,?
  });

}

//user data를 IndexDB에 저장 및 데이터 변경 saveuseratrealdb호출하여 realdb에 저장
function saveUserAtIndexDB(userName, isSave){
  var user = firebase.auth().currentUser;
  if(indexedDB){
    var request = indexedDB.open(INDEXDB_DB_NAME, INDEXDB_VERSION); //데이터베이스 접근 요청
    var objectName = INDEXDB_STORE;
    request.onupgradeneeded = function(){ //데이터베이스 생성 또는 버전 업그레이드 시 수행
      var db = request.result; //데이터베이스 객체
      var store = db.createObjectStore(objectName, {keyPath : "uid"}); //테이블에 해당하는 object생성 및 키값 설정
    }
    request.onsuccess = function(){ //데이터베이스 접근 요청 성공
      var db = request.result;
      var tx = db.transaction(objectName, 'readwrite'); //읽기쓰기 권한으로 트랜잭션 얻음
      //39줄 여기서 오류가 난다...
      var store = tx.objectStore(objectName);

      store.get(user.uid).onsuccess = function(event){ //user.uid기준으로 indexedDB데이터 가져옴
        var data = event.target.result;
        if(!data){ //데이터 없으면 저장
          store.put({
            uid : user.uid,
            email : user.email,
            photoURL : user.photoURL ? user.photoURL : '',
            displayName : userName ? username: user.displayName,
            isSave : false
          }).then(saveUserAtRealDB());
        }

        if(data && isSave){ // 데이터 있고 isSave파라미터가 true이면 데이터 업데이트
          store.put({
            uid: user.uid,
            email: user.email,
            photoURL: user.photoURL ? user.photoURL: '',
            displayName: userName ? userName: user.displayName,
            isSave: true
          });
        }

      }
      tx.oncompleete = function(){
        db.close();
      }
    }
  }
}

//realtime database에 user 데이터 체크 후 저장
//userdata 한개만 생기기는 하는데 로그인 할때마다 적는다.
function saveUserAtRealDB(){
  var database = firebase.database(); //database reference
  var useruid = firebase.auth().currentUser.uid; //get current user uid
  var userRef = firebase.database().ref('/users/'+useruid); //database reference where save user data
  return userRef.set({
    useruid: useruid,
    name: getUserName(),
    email: getUserEmail(),
    profilePicUrl: getProfilePicUrl()
    }).catch(function(error) {
    console.error('Error writing new user to Firebase Database', error);
  });
}

// Signs-out of Friendly Chat.
function signOut() {
  // Sign out of Firebase.
  firebase.auth().signOut();
}

// Initiate firebase auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns the signed-in user's profile Pic URL.
function getProfilePicUrl() {
  return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

//Return the signed-in user's email
function getUserEmail(){
  return firebase.auth().currentUser.email;
}

// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages(roomId) {
  console.log(roomId);
  if(roomId){
    // messageListElement.innerHTML = ''; //메세지 화면 리셋
    // Loads the messages and listen for new ones.
    var callback = function(snap) {
      var data = snap.val();
      displayMessage(snap.key, data.name, data.text, data.profilePicUrl, data.imageUrl, data.fileUrl, data.filename);
    };

    firebase.database().ref('/messages/').child(roomId).on('child_added', callback); //데이터베이스에 새로운 데이터 생기거나
    firebase.database().ref('/messages/').child(roomId).on('child_changed', callback); //변하는 것 가져와서 모든 대화 출력
  }
}

// Loads user list and listens for upcoming ones.
function loadUserList(){
  var callback = function(snap){
    var data = snap.val();
    displayUser(snap.key, data.name+" 님");

    var arrList = userListElement.getElementsByClassName("user-container");
    var arrLen = arrList.length;
    console.log(arrLen);
    for(var i=0; i<arrLen;i++){
      arrList[i].addEventListener('click', onUserListClick(arrList[i]), false); //여기가 뭔가 잘못됨. 클릭은 안되고 무조건 클릭으로 들어감.
      // arrList[i].onclick = onUserListClick(arrList[i]); 이거도 똑같다.
    };
  }
  firebase.database().ref('/users/').on('child_added', callback);
  firebase.database().ref('/users/').on('child_changed', callback);
}

function loadChatList(){
  var callback = function(snap){
    var data = snap.val();
    displayChatRoom(snap.key);

    //var arrList = chatListElement.getelementsByClassName("chat-list-container");
    //var arrLen = arrLisg.length;
    //for(var i=0; i<arrLen; i++){
    //  arrList[i].addEventListener('click', onChatListClick(arrList[i]), false);
    //}
  }
  firebase.database().ref('/messages/').on('child_added', callback);
  firebase.database().ref('/messages/').on('child_changed', callback);
}

// Saves a new message on the Firebase DB.
function saveMessage(messageText) {
  var roomId = roomNameElement.innerHTML;
  // Add a new message entry to the Firebase Database.
  return firebase.database().ref('/messages/' + roomId).push({
    name: getUserName(),
    text: messageText,
    profilePicUrl: getProfilePicUrl()
  }).catch(function(error) {
    console.error('Error writing new message to Firebase Database', error);
  });
}

// Saves a new message containing an image in Firebase.
// This first saves the image in Firebase storage.
function saveImageMessage(file) {
  var roomId = roomNameElement.innerHTML;
  // 1 - We add a message with a loading icon that will get updated with the shared image.
  firebase.database().ref('/messages/'+ roomId).push({
    name: getUserName(),
    imageUrl: LOADING_IMAGE_URL,
    profilePicUrl: getProfilePicUrl()
  }).then(function(messageRef) {
    // 2 - Upload the image to Cloud Storage.
    var filePath = firebase.auth().currentUser.uid + '/' + messageRef.key + '/' + file.name;
    return firebase.storage().ref(filePath).put(file).then(function(fileSnapshot) {
      // 3 - Generate a public URL for the file.
      return fileSnapshot.ref.getDownloadURL().then((url) => {
        // 4 - Update the chat message placeholder with the image's URL.
        return messageRef.update({
          imageUrl: url,
          storageUri: fileSnapshot.metadata.fullPath
        });
      });
    });
  }).catch(function(error){
    console.error('there was an error uploading a file to Cloud Storage', error);
  });
}

// Saves a new message containing an image in Firebase.
// This first saves the image in Firebase storage.
function saveFileMessage(file) {
  var roomId = roomNameElement.innerHTML;
  // 1 - We add a message with a loading icon that will get updated with the shared image.
  firebase.database().ref('/messages/' + roomId).push({
    name: getUserName(),
    fileUrl: LOADING_FILE_URL,
    profilePicUrl: getProfilePicUrl(),
    filename: file.name
  }).then(function(messageRef) {
    // 2 - Upload the file to Cloud Storage.
    var filePath = firebase.auth().currentUser.uid + '/' + messageRef.key + '/' + file.name;
    return firebase.storage().ref(filePath).put(file).then(function(fileSnapshot) {
      // 3 - Generate a public URL for the file.
      return fileSnapshot.ref.getDownloadURL().then((url) => {
        // 4 - Update the chat message placeholder with the image's URL.
        return messageRef.update({
          fileUrl: url,
          storageUri: fileSnapshot.metadata.fullPath
        });
      });
    });
  }).catch(function(error){
    console.error('there was an error uploading a file to Cloud Storage', error);
  });
}


// Saves the messaging device token to the datastore.
function saveMessagingDeviceToken() {
  firebase.messaging().getToken().then(function(currentToken) {
    if (currentToken) {
      console.log('Got FCM device token', currentToken);
      // Saving the Device Token to the datastore.
      firebase.database().ref('fcmTokens').child(currentToken).set(firebase.auth().currentUser.uid);
    } else {
      // Need to request permissions to show notifications.
      requestNotificationsPermissions();
    }
  }).catch(function(error){
    console.error('Unable to get messaging token', error);
  });
}

// Requests permissions to show notifications.
function requestNotificationsPermissions() {
  console.log('Requesting notifications Permission...');
  firebase.messaging().requestPermission().then(function() {
    // Notification permission granted.
    save<essagingDeviceToken();
  }).catch(function(error) {
    console.error('Unable to get permissiont to notify.', error);
  });
}

// Triggered when a file is selected via the media picker.
function onFileSelected(event) {
  event.preventDefault();
  var file = event.target.files[0];

  var metadata = {
    'contentType': file.type
  };

  // Clear the selection in the file picker input.
  fileFormElement.reset();

  // Check if the user is signed-in
  if (checkSignedInWithMessage()) {
    saveFileMessage(file);
  }
}

// Triggered when a file is selected via the media picker.
function onMediaFileSelected(event) {
  event.preventDefault();
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  imageFormElement.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
    return;
  }
  // Check if the user is signed-in
  if (checkSignedInWithMessage()) {
    saveImageMessage(file);
  }
}

// Triggered when the send new message form is submitted.
function onMessageFormSubmit(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (messageInputElement.value && checkSignedInWithMessage()) {
    saveMessage(messageInputElement.value).then(function() {
      // Clear message text field and re-enable the SEND button.
      resetMaterialTextfield(messageInputElement);
      toggleButton();
    });
  }
}


// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) { // User is signed in!
    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    var userName = getUserName();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage = 'url(' + profilePicUrl + ')';
    userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    userNameElement.removeAttribute('hidden');
    userPicElement.removeAttribute('hidden');
    signOutButtonElement.removeAttribute('hidden');

    // Hide sign-in button.
    signInButtonElement.setAttribute('hidden', 'true');

    // We save the Firebase Messaging Device token and enable notifications.
    saveMessagingDeviceToken();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');
  }
}

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  return false;
}

// Resets the given MaterialTextField.
function resetMaterialTextfield(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

// Template for messages.
var MESSAGE_TEMPLATE =
    '<div class="message-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="message"></div>' +
      '<div class="name"></div>' +
    '</div>';

var USERLIST_TEMPLATE =
    '<div class="user-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="username"></div>' +
      '<div class="email"></div>' +
    '</div>';

var CHATLIST_TEMPLATE =
      '<div class="chatlist-container">' +
        '<div class= "roomName"></div>' +
      '</div>'

// A loading image URL.
var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';
var LOADING_FILE_URL = 'https://www.google.com/images/spin-32.gif?a'

// Display user list in the UI.
// UI다듬어야함. 왜 안바뀌냐 어유
function displayUser(key, name, picUrl, email){
  var div = document.getElementById(key);
  // If an element for that user does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = USERLIST_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    userListElement.appendChild(div);
  }
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
  div.querySelector('.username').textContent = name;
  div.querySelector('.email').textContent = email;
}

function displayChatRoom(roomId){
  var div = document.getElementById(roomId);
  if(!div){
    var container = document.createElement('div');
    container.innerHTML = CHATLIST_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', roomId);
    chatListElement.appendChild(div);
  }
  div.querySelector('.roomName').textContent = roomId;
}

// Displays a Message in the UI.
function displayMessage(key, name, text, picUrl, imageUrl, fileUrl, filename) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    messageListElement.appendChild(div);
  }
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
  div.querySelector('.name').textContent = name;
  var messageElement = div.querySelector('.message');
  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUrl) { // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      messageListElement.scrollTop = messageListElement.scrollHeight;
    });
    image.src = imageUrl + '&' + new Date().getTime();
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  } else if(fileUrl){
      messageElement.innerHTML = '<a href="' +  fileUrl + '">'+filename+'</a>';
  }
  // Show the card fading-in and scroll to view the new message.
  setTimeout(function() {div.classList.add('visible')}, 1);
  messageListElement.scrollTop = messageListElement.scrollHeight;
  messageInputElement.focus();
}

function loadCalenderEvent(){
  console.log("load Calendar!!");
  var callback = function(snap){
    var data = snap.val();
    displayEvent(snap.key, data.title, data.startdate, data.enddate);
  };
  firebase.database().ref('/calendar/').on('child_added', callback);
  firebase.database().ref('/calendar/').on('child_changed', callback);
  // firebase.database().ref('/calendar/').on('child_removed', callback);
}

function displayEvent(key, title, startdate, enddate){
  console.log("in display Event!");
  var myEvent = {
            title: title,
            allDay: true,
            start: moment(startdate),
            end: moment(enddate),
            key: key
          };
          if(moment(startdate).isValid()){
            $('#calendar').fullCalendar('renderEvent', myEvent);
          }else('invalid date.');
}

function deleteEvent(eventKey, eventId){
  console.log(eventKey);
  var database = firebase.database();
  var eventRef = firebase.database().ref('/calendar/').child(eventKey).remove();
  $('#calendar').fullCalendar('removeEvents',eventId);

}

//유저리스트 클릭
function onUserListClick(target){
  console.log("onuserlistclick!");
  var database = firebase.database();
  var targetUserUid = target.getAttribute("id");
  var ref = firebase.database().ref('/users/').child(targetUserUid).once('value').then(function(snapshot){
    var targetUserName = snapshot.val().name;
    console.log(targetUserName);
    var roomTitle = targetUserName + '님';
    var useruid = firebase.auth().currentUser.uid;
    var roomUserlist = [targetUserUid, useruid];
    var roomUserName = [targetUserName, getUserName()];
    var roomId = MAKEID_CHAR + useruid;
    openChatRoom(roomId, roomTitle);
  });
}

// 채팅방 열고 메세지 로드
function openChatRoom(roomId, roomTitle){
  console.log("open chat room!!");
  var isOpenRoom = true;
  if(roomTitle){
   //roomNameElement.innerHTML = roomTitle; <- 채팅방 이름 표시 함수
  }
  loadMessages(roomTitle);
}

function onChatListClick(target){

}
// Enables or disables the submit button depending on the values of the input
// fields.
function toggleButton() {
  if (messageInputElement.value) {
    submitButtonElement.removeAttribute('disabled');
  } else {
    submitButtonElement.setAttribute('disabled', 'true');
  }
}

// Checks that the Firebase SDK has been correctly setup and configured.
function checkSetup() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
}

// Checks that Firebase has been imported.
checkSetup();

// Shortcuts to DOM Elements.
var messageListElement = document.getElementById('messages');
var userListElement = document.getElementById('user-list-element');
var chatListElement = document.getElementById('chat-list-element');
var messageFormElement = document.getElementById('message-form');
var messageInputElement = document.getElementById('message');
var submitButtonElement = document.getElementById('submit');
var imageButtonElement = document.getElementById('submitImage');
var imageFormElement = document.getElementById('image-form');
var mediaCaptureElement = document.getElementById('mediaCapture');
var fileButtonElement = document.getElementById('submitFile');
var fileFormElement = document.getElementById('file-form');
var fileCaptureElement = document.getElementById('fileCapture');
var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var signInSnackbarElement = document.getElementById('must-signin-snackbar');
var roomNameElement = document.getElementById('roomName');

var INDEXDB_DB_NAME = "USER";
var INDEXDB_VERSION = 1;
var INDEXDB_STORE = 'users';
var MAKEID_CHAR = '@make@';

// Saves message on form submit.
messageFormElement.addEventListener('submit', onMessageFormSubmit);
signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);

// Toggle for the button.
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

// Events for image upload.
imageButtonElement.addEventListener('click', function(e) {
  e.preventDefault();
  mediaCaptureElement.click();
});
mediaCaptureElement.addEventListener('change', onMediaFileSelected);
// Events for file upload.
fileButtonElement.addEventListener('click', function(e) {
  e.preventDefault();
  fileCaptureElement.click();
});
fileCaptureElement.addEventListener('change', onFileSelected);


// initialize Firebase
initFirebaseAuth();

// We load currently existing chat messages and listen to new ones.
// loadMessages();
loadUserList();
loadChatList();
loadCalenderEvent();



$(function() {

// page is now ready, initialize the calendar...

$('#calendar').fullCalendar({
  defaultView: 'month',
  contentHeight:550,
  eventColor: 'orange',
  

  header:{
    left: 'month,agendaWeek',
    center: 'title,addEventButton,attendanceCheck',
    right: 'prev,today,next'
  },

  customButtons: {
    //일정추가 버튼
    addEventButton: {
      text: '일정 추가',
      click: function(){
        var database = firebase.database();
        var calendarRef = firebase.database().ref('/calendar/');
        var dateStr = prompt('Enter a date in YYYY-MM-DD format');
        var dateEnd = prompt('Enter a date end');
        var mytitle = prompt('Enter the title');
        var date = moment(dateStr);
        return calendarRef.push({
          title: mytitle,
          startdate: dateStr,
          enddate: dateEnd
        });
      }
    },

    //출석체크 버튼
    attendanceCheck: {
      text: '출석체크',
      id: 'check',
      click: function(){
        var calendarRef = firebase.database().ref('/calendar/');
       var userName = firebase.auth().currentUser.displayName;
        var date = $('#calendar').fullCalendar('getDate').format();
        alert(userName+"님 출석체크 완료!\n"+"( "+date+" )");

          return calendarRef.push({
          title: userName+" 출석",
          startdate: date,
          enddate: date,
        });
      }
    }

  },

  //이벤트 삭제
  eventClick: function(calEvent, jsEvent, view) {
      var eventName = prompt("클릭하시면 해당 일정이 지워집니다."+
      "\n정말 삭제하시려면 일정의 이름을 한번 더 입력하세요." +
      "\n(참고: 제목이 없는 일정은 확인 또는 취소 버튼을 누르면 삭제됩니다.)");
     if(eventName == calEvent.title){
      alert( calEvent.title + " 일정이 삭제되었습니다!");
      deleteEvent(calEvent.key, calEvent._id);
     }
     return;
  }


});


});
