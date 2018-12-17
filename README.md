College student team project chat program
=============

대학생 팀프로젝트 채팅 프로그램 "팀앤팀즈(TeamNTims)"  
-------------

>기존 협업 툴은 회사원들을 위해 개발되어있다. 대학생 팀프로젝트의 목적에 맞춰 기능을 제공하고, 최고의 협업을 돕기 위하고자 하는 웹 메신저이다. 채팅기능, 파일다운로드, 현재접속자 확인, 회의알람 기능, 일정관리 기능 등을 갖추고 있다.

채팅 주요 기능
============

### 1. 기본 채팅  
***

### 2. 로그인 기능  
***

### 3. 파일 다운로드 기능  
***

### 4. 현재 접속자 확인
***

### 5. 회의 알람 기능
***

### 6. 일정 관리 기능
***

### 7. user list 확인
***

### 8. 전체 UI 수정
***
#### 8.1 index.html

어플리케이션의 로고를 입력하는 코드
 
	<div style="text-align:center; padding:200px 0 0 0"><img src="images/tNtLogo.png"/></div>

구글 로그인 버튼, 그림 추가

	<div id="user-container" style="text-align:center; padding:300px 0 0 0">
            <div hidden id="user-pic"></div>
            <div hidden id="user-name"></div>
            <button hidden id="sign-out" class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-color-text--white">Sign-out
            </button>
            <button hidden id="sign-in" class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-color-text--white">
              <i class="material-icons">account_circle</i>Sign-in with Google
            </button>
          </div>

채팅방 입장 버튼 구현

```
<button id="login"
	class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color-text--orange-200" 
	onclick="location.href='/first.html'">
	  enter to chat room
	</button>
```
#### 8.2 index.html


앱 설치 방법 및 사용법
==============

> TeamNTims는 웹 어플리케이션으로 별도의 설치 필요 없이 주소로 접속하시면 됩니다.   
> [TeamNTims](https://friendlychat-39754.firebaseapp.com/)   
> https://friendlychat-39754.firebaseapp.com/   
> *****여기 이미지 추가 해야할 것 같아요!

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
    index.html main.js 수정하여 동접자 위젯 추가

    * 최종발표   
    데모 영상 촬영

- 1771012 김수영 Sooyyoungg  
    * 중간발표   
    소스조사, 발표

    * 개발   
    first.html 수정하여 당일날 알림 구현

    * 최종발표   
    데모영상 촬영
