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

// Signs-out of Friendly Chat.
function signOut() {
  // Sign out of Firebase.
  firebase.auth().signOut();
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

// Initiate firebase auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
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
    //로그인 하면 입장버튼 만들기
    loginButtonElement.removeAttribute('hidden');

    // We save the Firebase Messaging Device token and enable notifications.
    saveMessagingDeviceToken();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');
    //로그아웃하면 입장버튼 없애기
    loginButtonElement.setAttribute('hidden','true');
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
//이부분 추가
var loginButtonElement = document.getElementById('login');

signInButtonElement.addEventListener('click', signIn);
signOutButtonElement.addEventListener('click', signOut);
//입장코드 추가
loginButtonElement.addEventListener('click',login);

initFirebaseAuth();
