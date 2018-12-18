College student team project chat program
=============

대학생 팀프로젝트 채팅 프로그램 "팀앤팀즈(TeamNTims)"  
-------------

>기존 협업 툴은 회사원들을 위해 개발되어있다. 대학생 팀프로젝트의 목적에 맞춰 기능을 제공하고, 최고의 협업을 돕기 위하고자 하는 웹 메신저이다. 채팅기능, 파일 업로드 및 다운로드, 현재접속자 확인, 회의알람 기능, 일정관리 기능 등을 갖추고 있다.

채팅 주요 기능
============

### 1. 기본 채팅  
***

>firebase database를 이용하여 메시지 및 사진을 주고받을 수 있는 기능이다.

#### 1.1 메시지 전송

##### first.html
 
 * 메시지 입력 폼 및 버튼 추가
 
 ```html
	<form id="message-form" action="#">
           <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
              <input class="mdl-textfield__input" type="text" id="message">
                 <label class="mdl-textfield__label" for="message">Message...</label>
           </div>
           <button id="submit" disabled type="submit" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect">
           Send
           </button>
        </form>
```

##### main.js

* first.html의 element에 id로 접근하는 변수 생성

```javascript
	var messageFormElement = document.getElementById('message-form');
	var messageInputElement = document.getElementById('message');
	var submitButtonElement = document.getElementById('submit');
```

* element에 eventlistner 추가

```javascript
	// Saves message on form submit.
	messageFormElement.addEventListener('submit', onMessageFormSubmit);
	// Toggle for the button.
	messageInputElement.addEventListener('keyup', toggleButton);
	messageInputElement.addEventListener('change', toggleButton);
```
messageInputElement 의 input이 변하거나, 글자수가 변하였을때도 toggleButton 실행.                    

* onMessageFormSubmit. 새로운 메시지를 전송하였을때 실행되는 함수. 메시지가 입력되었는지, 유저가 sign-in 상태인지 확인한 후 saveMessage 호출. 그 후 textfield를 비우고 toggleButton호출.

```javascript
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
```

* saveMessage. firebase database의 /messages 참조 아래에 해당 메시지를 형식에 맞게 저장한다.

```javascript
	// Saves a new message on the Firebase DB.
	function saveMessage(messageText) {
	  // Add a new message entry to the Firebase Database.
	  return firebase.database().ref('/messages/').push({
	    name: getUserName(),
	    text: messageText,
	    profilePicUrl: getProfilePicUrl()
	  }).catch(function(error) {
	    console.error('Error writing new message to Firebase Database', error);
	  });
	}
```


* toggleButton. input 메시지 있는지 확인 하여, 있으면 submitButtonElement의 disabled 속성 제거.

```javascript
	// Enables or disables the submit button depending on the values of the input fields.
	function toggleButton() {
	  if (messageInputElement.value) {
	    submitButtonElement.removeAttribute('disabled');
	  } else {
	    submitButtonElement.setAttribute('disabled', 'true');
	  }
	}
```

#### 1.2 사진 전송
##### first.html

* 사진 입력 폼 추가

```html
	<form id="image-form" action="#">
                <input id="mediaCapture" type="file" accept="image/*" capture="camera">
                <button id="submitImage" title="Add an image" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color--amber-400 mdl-color-text--white">
                  <i class="material-icons">image</i>
                </button>
              </form>
```

##### main.js

* first.html의 element에 id로 접근하는 변수 생성

```javascript
	var imageFormElement = document.getElementById('image-form');
	var mediaCaptureElement = document.getElementById('mediaCapture');
```

* element에 eventlistner 추가                           
imageButtonElement 를 click 하면 숨겨놓은 mediaCaptureElement 를 click하는 이벤트이다.                            
mediaCaptureElement 의 input에 변화가 생기면 onMediaFileSelected 이벤트가 실행된다

```javascript
	// Events for image upload.
	imageButtonElement.addEventListener('click', function(e) {
	  e.preventDefault();
 	 mediaCaptureElement.click();
	});
	mediaCaptureElement.addEventListener('change', onMediaFileSelected);
```

* onMediaFileSelected. 올바른 이미지 파일인지, 사용자가 sign-in상태인지 체크한 후 saveImageMessage 호출.

```javasctipt
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
```

* saveImageMessage. 이미지 파일을 firebase database와 firebase storage에 형식에 맞게 저장한다.

```javascript
	// Saves a new message containing an image in Firebase.
	// This first saves the image in Firebase storage.
	function saveImageMessage(file) {
	  // add a message with a loading icon that will get updated with the shared image.
	  firebase.database().ref('/messages/').push({
	    name: getUserName(),
	    imageUrl: LOADING_IMAGE_URL,
	    profilePicUrl: getProfilePicUrl()
	  }).then(function(messageRef) {
	    // Upload the image to Cloud Storage.
	    var filePath = firebase.auth().currentUser.uid + '/' + messageRef.key + '/' + file.name;
	    return firebase.storage().ref(filePath).put(file).then(function(fileSnapshot) {
	      // Generate a public URL for the file.
	      return fileSnapshot.ref.getDownloadURL().then((url) => {
	        // Update the chat message placeholder with the image's URL.
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
```

#### 1.3 메시지 출력
##### first.html

* 메시지를 출력할 공간 추가

```html
	      <div id="messages">
                <span id="message-filler"></span>
              </div>
```

##### main.js

* first.html의 element에 id로 접근하는 변수 생성

```javascript
	var messageListElement = document.getElementById('messages');
```

* loadMessage. firebase database의 /messages 참조 아래에 child가 변하거나 생기면 callback 호출.                   
callback에서는 해당 참조의 datasnapshot을 찍어 값을 displayMessage를 호출하며 넘겨준다.

```javascript
	// Loads chat messages history and listens for upcoming ones.
	function loadMessages() {
	    // Loads the messages and listen for new ones.
	    var callback = function(snap) {
	      var data = snap.val();
	      displayMessage(snap.key, data.name, data.text, data.profilePicUrl, data.imageUrl, data.fileUrl, data.filename);
	    };
	
	    firebase.database().ref('/messages/').on('child_added', callback); //데이터베이스에 새로운 데이터 생기거나
	    firebase.database().ref('/messages/').on('child_changed', callback); //변하는 것 가져와서 모든 대화 출력
	}
```

* displayMessage. 메시지를 담을 element를 만든 후 형식에 맞게 출력한다.

```javascript
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
```

### 2. 로그인 기능  
***

>기존 friendly-chat은 로그인을 하지 않아도 채팅 내역을 볼 수 있다. 그 부분에 대해 다른 창에 로그인 기능을 분리하여 로그인 해야만 채팅방 입장 버튼이 생기고, 입장을 할 수 있도록 한다.

#### 2.1 구글 로그인/로그아웃 버튼 추가   

##### index.html

* 로그인 로그아웃 화면 추가

```html
<!-- 유저 정보 & 로그인, 로그아웃 -->
  <center>
    <!-- 유저 정보 표시 -->
    <div hidden id="user-pic"></div>
    <div hidden id="user-name" class="mdl-color-text--orange-200"></div>

    <!-- 계정 로그인 & 로그아웃 버튼 -->
    <button hidden id="sign-out" class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-color-text--white">Sign-out
    </button>
    <button hidden id="sign-in" class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-color-text--white">
      <i class="material-icons">account_circle</i>Sign-in with Google
    </button>
  </center>
```

##### login.js

* 로그인 기능 구현

```javascript
	function signIn() {
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).then(function(){
    saveUserAtRealDB(); 
  });
}
```

* 로그아웃 기능 구현


```javascript
	function signOut() {
  firebase.auth().signOut();
}
```

#### 2.2 login 이후 채팅창 참여 버튼 생성

##### index.html

* 버튼을 누르면 first.html로 연결되도록 구현

```html
  <!-- 입장 버튼 -->
  <p align="center">
    <button id="login" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color-text--orange-200"
      onclick="location.href='/first.html'">
      ENTER TO CHAT ROOM
    </button>
  </p>
```

##### login.js

* 로그인 하면 입장버튼 만들기

```javascript  
    loginButtonElement.removeAttribute('hidden');
```

* 로그아웃 상태일 때 입장 버튼 지우기

```javascript
    loginButtonElement.setAttribute('hidden','true');
```

### 3. 파일 업로드 및 다운로드 기능  
***
#### 3.1 파일 업로드 
##### first.html
* 파일 입력 받는 폼 추가

```html
	<form id="file-form" action="#">
      		<input id="fileCapture" type="file" accept="/*" capture="camera">
 	             <button id="submitFile" title="Add an File" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color--amber-400 mdl-color-text--white">
      	       <i class="material-icons">cloud_upload</i></button>
	</form>
```

##### main.js
* first.html의 id에 접근하도록 변수 생성

```javascript
	var fileButtonElement = document.getElementById('submitFile');
	var fileFormElement = document.getElementById('file-form');
	var fileCaptureElement = document.getElementById('fileCapture');
```

* element에 listner 추가
fileButtonElement를 클릭했을 때 현재 이벤트의 기본 동작을 중단하고 filreCaptureElement를 클릭하는 메소드
	
```javascript
	// Events for file upload.
	fileButtonElement.addEventListener('click', function(e) {
	  // 현재 이벤트의 기본 동작 중단
	  e.preventDefault();
	  fileCaptureElement.click();
	});
```

* fileCaptureElement는 input 필드와 연결되어 있다. 파일이 선택되어 fileCaptureElement가 변할 때 onFileSelected 호출

```javascript
	fileCaptureElement.addEventListener('change', onFileSelected);
```

* onFileSelected 함수. 파일이 선택된 후 file변수에 해당 파일을 저장한 후 다음에 있을 파일 선택을 위해 file picker을 비우고 유저가 sign-in상태이면 saveFileMessage에 file을 넘겨주며 호출한다.

```javascript
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
```

* saveFileMessage함수. file을 입력받았을 시에 /messages 참조의해당 roomId참조 밑에 message format에 fileUrl과 filename을 더해 firebase database에 저장한다. fileUrl은 firebase storage에 업로드 한 후 snapshot을 통해 넘겨받는다. 

```javascript
	// Saves a new message containing an image in Firebase.
	// This first saves the image in Firebase storage.
	function saveFileMessage(file) {
	  var roomId = roomNameElement.innerHTML;
	  // add a message with a loading icon that will get updated with the shared file.
	  firebase.database().ref('/messages/' + roomId).push({
	    name: getUserName(),
 	   fileUrl: LOADING_FILE_URL,
 	   profilePicUrl: getProfilePicUrl(),
 	   filename: file.name
 	 }).then(function(messageRef) {
 	   // Upload the file to Cloud Storage.
  	  var filePath = firebase.auth().currentUser.uid + '/' + messageRef.key + '/' + file.name;
 	   return firebase.storage().ref(filePath).put(file).then(function(fileSnapshot) {
 	     // Generate a public URL for the file.
  	    return fileSnapshot.ref.getDownloadURL().then((url) => {
  	      // Update the chat message placeholder with the image's URL.
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
```

#### 3.2 파일 다운로드

displayMessage 메소드 안에서 filename 을 인자로 받았을 때, messageElement를 만든 후 그 안의 콘텐츠를 filename을 출력하고 fileUrl의 참조를 링크로 연결하여 다운로드 할 수 있게 구현하였다. 

```javascript
	messageElement.innerHTML = '<a href="' +  fileUrl + '">'+filename+'</a>';
```

### 4. 현재 접속자 확인
***

* 위젯을 추가하여 실시간 사용자 수를 확인할 수 있다.   
 [WhosAmungUs](https://whos.amung.us/)

#### first.html
```html
 	<strong style="font-size: 15px">현재 인원수</strong>
            <script id="_waue06">
              var _wau = _wau || []; _wau.push(["small", "sxz5miudyq", "e06"]);</script>
            <script async src="//waust.at/s.js"></script>
```

### 5. 일정 관리 기능
***
>일정을 함께 공유해야 하기 때문에 calendar에 일정을 표시함과 동시에 firebase database에 저장하여 공유할 수 있도록 구현하였다

#### 5.1 fullcalendar 사용 준비
##### first.html
calendar가 들어갈 페이지의 head부분에 위의 dependency load 문장을 작성

```html
	<link rel='stylesheet' href='fullcalendar/fullcalendar.css' />
	<script src='lib/jquery.min.js'></script>
  	<script src='lib/moment.min.js'></script>
  	<script src='fullcalendar/fullcalendar.js'></script>
```

#### 5.2 calendar 생성
##### first.html
* 캘린더 추가   
```html
	  <div id="calendar">
          </div> 
```
##### main.js
* jquery를 사용하여 달력 생성한 후 기본 설정

```javascript
	$(function() {
	
	$('#calendar').fullCalendar({
  	defaultView: 'month',
  	contentHeight:450,
  	eventColor: 'green',
	
  	header:{
 	   left: 'addEventButton, month, listWeek, prev, today, next',
 	   center: 'title',
 	   right: 'prev, today, next'
	  } 
	})
	}
```

#### 5.3 event 추가
##### main.js
* calendar을 생성한 jqery 안에 button을 추가하는 코드 추가한 후 클릭했을시 발생하는 메소드 정의.
'add event'이름의 버튼을 클릭했을 때 start date와 end date, title을 차례로 입력하면 firebase database의 calendar 아래에 저장.

```javascript
	customButtons: {
 	   addEventButton: {
	     text: 'add event',
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
 	   }
 	 }
```

* 채팅에 입장하였을때 calendar에 저장된 event를 불러오는 함수이다
firebase database의 calendar 참조 아래에 child가 더해지거나 변경되면 callback을 호출한다
callback안에서는 데이터의 snapshot을 찍어 값을 displayEvent을 호출하며 넘겨준다

```javascript
	function loadCalenderEvent(){
 	 var callback = function(snap){
 	   var data = snap.val();
	    displayEvent(snap.key, data.title, data.startdate, data.enddate);
	  };
	  firebase.database().ref('/calendar/').on('child_added', callback);
	  firebase.database().ref('/calendar/').on('child_changed', callback);
	}
```

* firebase database에서 받아온 값을 calendar에 찍어주는 메소드이다
event의 설정 값을 변수로 묶고 'renderEvent'를 통해 calendar에 찍어준다.

```javascript
	function displayEvent(key, title, startdate, enddate){
 	 console.log("in display Event!");
	  var myEvent = {
	          title: title,
 	          allDay: true,
 	          start: moment(startdate),
   	          end: moment(enddate).add('days',1),
  	          key: key
 	         };
 	         if(moment(startdate).isValid()){
 	           $('#calendar').fullCalendar('renderEvent', myEvent);
  	        }else('invalid date.');
	}
```
	
#### 5.4 event 삭제
##### main.js
* calendar을 생성한 jqery 안에 현재 calendar에 저장된 event를 클릭했을 때 일어나는 메소드 정의.
이벤트가 삭제됨을 알리는 경고창을 띄운 후 deleteEvent메소드를 호출하며 현재 event의 key에 저장된 값과 id값을 넘겨준다.

```javascript
    eventClick: function (calEvent, jsEvent, view) {
      var eventName = prompt("클릭하시면 해당 일정이 지워집니다." +
        "\n정말 삭제하시려면 일정의 이름을 한번 더 입력하세요." +
        "\n(참고: 제목이 없는 일정은 확인 또는 취소 버튼을 누르면 삭제됩니다.)");
      if (eventName == calEvent.title) {
        alert(calEvent.title + " 일정이 삭제되었습니다!");
        deleteEvent(calEvent.key, calEvent._id);
      }
      return;
    }
```

* deleteEvent 메소드에서는 firebase database의 calendar 참조 아래에 넘겨받은 event의 key 값과 같은 참조를 찾아 삭제한 후
'removeEvents'를 통해 해당 event를 calendar에서 삭제한다.

```javascript
function deleteEvent(eventKey, eventId){
	 console.log(eventKey);
	 var database = firebase.database();
	 var eventRef = firebase.database().ref('/calendar/').child(eventKey).remove();
	 $('#calendar').fullCalendar('removeEvents',eventId);
}
```

#### 5.5 출석체크 기능

calendar에 추가된 출석체크 기능을 사용하면 사용자의 유저ID와 기능을 사용한 현재시각을 calendar 일정에 추가한다.
또한, 사용자에게는 출석체크가 성공적으로 이뤄졌다는 알림창을 표시한다.

##### main.js

```javascript
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
```

### 6. user list 확인
***
* 사용자가 로그인 했을 때 사용자의 정보를 firebase database에 저장한 후 모든 유저를 listing 한다.
#### 6.1 유저 정보 저장

* SignIn 함수 안에 위치한다. popup창이 뜨며 signin한 후 saveUserAtRealDB 함수를 호출한다.

```javascript
	firebase.auth().signInWithPopup(provider).then(function(){
 	   saveUserAtRealDB(); 
 	 });
```

* saveUserAtRealDB
firebase database의 /user 참조 아래에 useruid 참조를 만든 후 아래에 해당 유저 정보를 저장한다.

```javascript
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
```

#### 6.2 유저 정보 리스팅

* loadUserList
유저정보를 불러온다. firebase databse 의 /user참조 아래에 child가 더해지거나 변화가 생기면 callback 호출한다. callback 안에서는 datasnapshot을 찍어 displayUser을 호출하며 넘겨준다.

```javascript
	function loadUserList(){
 	 var callback = function(snap){
 	   var data = snap.val();
 	   displayUser(snap.key, data.name + " 님");
	  firebase.database().ref('/users/').on('child_added', callback);
	  firebase.database().ref('/users/').on('child_changed', callback);
	}
```

* displayUser
html에 유저정보를 찍어주는 element를 만들어 유저 리스팅

```javascript
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
	  // div.querySelector('.email').textContent = email;
	}
```

### 7. 당일 회의 알람 설정
***

##### first.html

* UI 추가 html 코드

```html
            <strong style="font-size: 17px"> today's meeting time alarm </strong> <br>
          <form name=exf1>
              <B>현재시간 :</B>
              <input type=text name=ch size=2>시 <input type=text name=cm size=2>분 <input type=text name=cs size=2>초<br />
              <B>회의시간 :</B>
              <input type=text name=h size=2>시 <input type=text name=m size=2>분 <input type=text name=s size=2>초<br />
              <br>
              <input type=button name=b onclick=setAlarm() value="Set Alarm">     <input type=button name=r onclick=clearAlarm() value="Turn Alarm Off"><BR>
          </form>

```

* 알람 울리기 기능 추가

```html
<script>
                        var alarmTimer = null;
                        var alarmSet;
                        function setAlarm()   { alarmSet = true;  }
                        function clearAlarm() { alarmSet = false; }
                        function initAlarm() {
                            if (alarmTimer!=null)clearInterval(alarmTimer);
                            var nowTime = new Date();
                            clearAlarm();
                            document.exf1.h.value = nowTime.getHours();
                            document.exf1.m.value = nowTime.getMinutes();
                            document.exf1.s.value = nowTime.getSeconds();
                            alarmTimer=setInterval("countTime()",1000);
                        }
                        function matchH() { return (document.exf1.ch.value == document.exf1.h.value); }
                        function matchM() { return (document.exf1.cm.value == document.exf1.m.value); }
                        function matchS() { return (document.exf1.cs.value == document.exf1.s.value); }
                        function countTime() {
                            var nowTime = new Date();
                            document.exf1.ch.value = nowTime.getHours();
                            document.exf1.cm.value = nowTime.getMinutes();
                            document.exf1.cs.value = nowTime.getSeconds();
                            if (matchH() && matchM() && matchS()) {
                                alert("회의 참석 시간입니다.");
                            }
                        }
                        onload=initAlarm;
                    </script>
```

### 8. 기능과 관계 없는 UI 수정
***
##### index.html

* 어플리케이션의 로고를 입력하는 코드
 
```html
<div style="text-align:center; padding:200px 0 0 0"><img src="images/tNtLogo.png"/></div>
```


사용 오픈 소스 및 위젯
==============
- firebase friendly-chat https://github.com/firebase/friendlychat-web
- fullcalendar https://fullcalendar.io/ 
- WhosAmungUs https://whos.amung.us/



앱 설치 방법 및 사용법
==============

> TeamNTims는 웹 어플리케이션으로 별도의 설치 필요 없이 주소로 접속하시면 됩니다.   
> [TeamNTims](https://friendlychat-39754.firebaseapp.com/)   
> https://friendlychat-39754.firebaseapp.com/   

#### * 채팅방에 들어가 로그인을 합니다. 
###### (Log in to chat room) 

      
<div>
<img src="https://user-images.githubusercontent.com/40933818/50160744-63836080-031d-11e9-9a3b-c7111564f410.PNG" width="500">
<img src="https://user-images.githubusercontent.com/40933818/50160746-64b48d80-031d-11e9-985d-153060afb2dd.PNG" width=200">
</div>
<img src="https://user-images.githubusercontent.com/40933818/50160754-6716e780-031d-11e9-8776-ab14835d56a1.PNG" width="500">

#### * 팀원들과 채팅과 파일 공유를 할 수 있습니다.
###### (Chat and share files with team members)

<img src="https://user-images.githubusercontent.com/40933818/50161483-464f9180-031f-11e9-862d-30874c731e9f.PNG" width="400">

#### * 이 팀플에 참여한 사람과, 현재 접속자 수를 알 수 있습니다.   
###### (You can see the number of people who participated in this team, and the number of current members

<img src="https://user-images.githubusercontent.com/40933818/50161725-e86f7980-031f-11e9-995d-86deb65d0540.PNG" width="200">


#### * 일정을 관리할 수 있습니다. 회의시간에 출석을 체크할 수 있습니다.
###### (You can manage your team schedule. Can check attendance at meeting time.)

일정을 month 단위 week 단위로 확인할 수 있습니다.     

<div>
<img src="https://user-images.githubusercontent.com/40933818/50162288-4c467200-0321-11e9-9354-891e80b66364.PNG" width="400">
<img src="https://user-images.githubusercontent.com/40933818/50162289-4d779f00-0321-11e9-9161-2cc15ec49b45.PNG" width="400">
</div>

일정을 추가합니다.    

<div>
<img src="https://user-images.githubusercontent.com/40933818/50162436-b6f7ad80-0321-11e9-8db9-c3d258c32db2.PNG" width="300">
<img src="https://user-images.githubusercontent.com/40933818/50162440-b95a0780-0321-11e9-9b77-0699fe4028b1.PNG" width="300">
<img src="https://user-images.githubusercontent.com/40933818/50162445-bb23cb00-0321-11e9-97a3-9a45e6a53231.PNG" width="300">
</div>

일정이 추가된 걸 볼 수 있습니다.   
<img src="https://user-images.githubusercontent.com/40933818/50162672-4309d500-0322-11e9-8ae8-e1835f1517ed.PNG" width="500">
   
   
     
일정을 삭제합니다.

<img src="https://user-images.githubusercontent.com/40933818/50162683-469d5c00-0322-11e9-9bf1-8a4962b4d781.PNG" width="300">


#### * 회의 시간 알람을 설정할 수 있습니다.
###### (You can set the meeting time alarm on the day.)

<img src="https://user-images.githubusercontent.com/40933818/50161850-35535000-0320-11e9-80fa-9568090fb5ee.PNG" width="300">



라이센스 정보
===============

See [LICENSE](https://github.com/yunyeoung/TeamNTims/blob/right/LICENSE) , Apache License 2.0

개발자 정보
=============

- 1415020 김채윤 cyoonkim  
    * 중간발표  
    소스 조사, 발표   
	
    * 개발   
    index.html, indexstyle.css 첫 로그인 전 페이지 구현   
    login.js 이용하여 로그인 기능 구현   
    first.html, main.js  main.css로 기본 채팅 구현      
    이벤트 display 오류 수정     
 
    * 최종발표   
    readme 작성

- 1614037 최윤영 yunyeoung  
    * 중간발표   
    소스 조사, ppt 세부내용 작성

    * 개발   
    first.html, main.js  main.css로 기본 채팅 구현   
    main.js 이용해 user list, chatting list 구현   
    first.html로 채팅방 UI 구분   
    first.html main.js 수정하여 calender 기능 추가     
    파일 올리기 기능 추가      
    

    * 최종발표   
    readme 작성

- 1771036 안샛별 sbyeol3  
    * 중간발표   
    구글폼작성, 기업용메신저 조사, ppt 윤곽

    * 개발

    * 최종발표   
    발표, ppt 작성

- 1771093 문지현 door4658  
    * 중간발표   
    소스조사, ppt 세부내용 작성

    * 개발   
    first.html index.html에 팀 로고 추가   
    first.html main.js 수정하여 동접자 위젯 추가     
    fullCalendar을 이용해 출석체크 기능 구현    
    html, css 파일들 전체적인 UI 수정       
    일정 삭제 기능 일부 수정     

    * 최종발표   
    데모 영상 촬영

- 1771012 김수영 Sooyyoungg  
    * 중간발표   
    소스조사, 발표

    * 개발   
    first.html 수정하여 당일날 알림 구현

    * 최종발표   
    데모영상 촬영
