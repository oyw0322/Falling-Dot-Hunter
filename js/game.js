const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext("2d");
const scoreSpan = document.getElementById("score");
const livesSpan = document.getElementById("lives");
const timerSpan = document.getElementById("timer");


// --- 랭킹 관련 변수 및 상수 ---
const rankingList = document.getElementById("rankingList");
const resetRankingButton = document.getElementById("resetRanking");
const MAX_RANKING_ENTRIES = 5; // 표시할 최대 랭킹 항목 수

// --- 게임 시간 설정  ---
const TIME_LIMIT = 180; // 제한 시간 (초)
const FRAME_DURATION = 1000 / 60; // 초당 60프레임 가정

// 🔵 색상별 점수 정의 
const COLOR_SCORES = {
    "red": 2,
    "blue": 3,
    "green": 2, 
    "skyblue": 3,
    "purple": 2,
    "teal": 3,
    "ivory": 2 
};

// 🔊 효과음 객체 생성 
const clickSound = new Audio("sounds/click.mp3");

// 원 객체 생성 
let circle = {
    x: Math.random() * 350 + 25,
    y: 0,
    initialR: 30, // 기본 반지름
    minR: 10, // 최소 반지름
    r: 30,
    rDecreaseRate: 0.005, // 프레임당 반지름 감소량

    speed: 1, // 기본 속도
    accelerationRate: 0.01, // 프레임당 속도 증가량
    color: getRandomColor()
};

let score = 0; // 점수 변수 생성
let lives = 3; // 목숨 변수 및 초기값 설정 
let isGameOver = false; // 게임 상태 변수

// --- 타이머 관련 변수 ---
let timeLeft = TIME_LIMIT;
let lastTime = 0; // requestAnimationFrame의 타임스탬프를 저장할 변수

// 초기 목숨 및 타이머 표시 업데이트
livesSpan.textContent = lives;
timerSpan.textContent = timeLeft; // 초기 타이머 값 표시

// 랜덤 색상 함수 생성
function getRandomColor() {
    // 💡 COLOR_SCORES 객체의 키를 사용하여 사용 가능한 색상 배열을 생성
    const colors = Object.keys(COLOR_SCORES);
    return colors[Math.floor(Math.random() * colors.length)]; // 랜덤 색상 반환
}

// 원 리셋 함수 생성 (클릭 성공 시)
function resetCircle() {
    circle.x = Math.random() * (canvas.width - 50) + 25;
    circle.y = 0;
    // 새로운 색상을 할당
    circle.color = getRandomColor(); 
}

// 원 그리기 함수 생성
function drawCircle() {
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2); // 원 그리기
    ctx.fillStyle = circle.color;
    ctx.fill();
    ctx.closePath();
}

// 게임 오버 화면 표시 함수 (시간 종료/목숨 소진 모두 사용)
function drawGameOver(reason = "시간 종료") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // 반투명 배경

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    
    // 종료 이유에 따라 메시지 변경
    const gameOverText = (lives <= 0) ? "GAME OVER (목숨 소진)" : "GAME OVER (시간 종료)";
    ctx.fillText(gameOverText, canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = "24px Arial";
    ctx.fillText(`최종 점수: ${score}점`, canvas.width / 2, canvas.height / 2 + 30);
}

// 게임 업데이트 함수 생성 (시간 인자를 받아 프레임 시간 간격 계산)
function updateGame(currentTime) {
    if (isGameOver) {
        // 이미 drawGameOver()가 호출되었을 수 있으나, requestAnimationFrame이 계속 호출될 경우를 대비
        drawGameOver(); 
        return; 
    }
    
    // --- 타이머 로직 ---
    if (lastTime) {
        // 이전 프레임으로부터 경과된 시간 (밀리초)
        const deltaTime = currentTime - lastTime;
        
        // 경과된 시간을 초 단위로 변환하여 timeLeft에서 차감
        timeLeft -= deltaTime / 1000; 

        if (timeLeft <= 0) {
            timeLeft = 0;
            isGameOver = true; // 시간 종료로 게임 오버
            timerSpan.textContent = "0.00";
            drawGameOver("시간 종료");
            return;
        }

        // 화면에 표시되는 타이머 업데이트 (소수점 둘째 자리까지)
        timerSpan.textContent = timeLeft.toFixed(2);
    }
    lastTime = currentTime; // 현재 시간을 다음 프레임을 위해 저장
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawCircle();

    // 1. 속도 증가 로직
    circle.speed += circle.accelerationRate;

    // 2. 반지름 감소 로직(크기 감소)
    if (circle.r > circle.minR) {
        circle.r -= circle.rDecreaseRate;
    }

    // 원 이동
    circle.y += circle.speed;

    if (circle.y - circle.r > canvas.height) {
        // 바닥에 닿으면 
        
        // 크기와 속도 리셋은 resetCircle() 내에서 처리되도록 수정
        circle.r = circle.initialR; // 크기 리셋 (이동 로직에서는 초기 크기로 설정)
        circle.speed = 1; // 속도 리셋

        // 목숨 차감 로직 
        lives--;
        livesSpan.textContent = lives; // 목숨 표시 업데이트

        if (lives <= 0) {
            isGameOver = true; // 목숨 소진으로 게임 오버 설정
        } else {
            resetCircle(); // 목숨이 남아있으면 원 초기화
        }
    }

    requestAnimationFrame(updateGame);
}

// 원 클릭 이벤트 함수 생성
canvas.addEventListener("click", function (e) {
    if (isGameOver) return; // 게임 오버 시 클릭 무시

    const rect = canvas.getBoundingClientRect(); 
    const mouseX = e.clientX - rect.left; 
    const mouseY = e.clientY - rect.top; 

    const dx = mouseX - circle.x; 
    const dy = mouseY - circle.y; 
    const distance = Math.sqrt(dx * dx + dy * dy); 

    if (distance < circle.r) { // 성공적으로 클릭했을 경우
        
        // 🔊 효과음 재생 로직
        // 현재 재생 중인 경우 처음부터 다시 재생하도록 설정
        clickSound.currentTime = 0; 
        clickSound.play();
        
        // 색상별 점수 추가 로직
        const points = COLOR_SCORES[circle.color] || 1; // 정의된 점수가 없으면 기본 1점
        score += points;
        
        scoreSpan.textContent = score; // 점수 표시
        resetCircle(); // 원 초기화
    }
});

// 랭킹 데이터를 로컬 스토리지에서 불러오는 함수
function loadRanking() {
    const rankingString = localStorage.getItem('clickGameRanking');
    // 저장된 데이터가 없으면 빈 배열 반환, 있으면 파싱하여 반환
    return rankingString ? JSON.parse(rankingString) : []; 
}

// 새로운 점수를 랭킹에 추가하고 저장하는 함수
function saveRanking(newScore) {
    const ranking = loadRanking();
    
    // 현재 점수와 시간을 기록합니다.
    const newEntry = {
        score: newScore,
        date: new Date().toLocaleString('ko-KR', { 
            year: '2-digit', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute: '2-digit' 
        })
    };
    
    ranking.push(newEntry);
    
    // 점수가 높은 순서로 내림차순 정렬
    ranking.sort((a, b) => b.score - a.score);
    
    // 최대 항목 수를 초과하면 제거
    if (ranking.length > MAX_RANKING_ENTRIES) {
        ranking.length = MAX_RANKING_ENTRIES; 
    }
    
    // 로컬 스토리지에 저장
    localStorage.setItem('clickGameRanking', JSON.stringify(ranking));
    
    // 랭킹 목록 업데이트
    displayRanking();
}

// 랭킹판을 HTML에 표시하는 함수
function displayRanking() {
    const ranking = loadRanking();
    rankingList.innerHTML = ''; // 기존 목록 초기화

    if (ranking.length === 0) {
        rankingList.innerHTML = '<li>아직 기록이 없습니다.</li>';
        return;
    }

    ranking.forEach((entry, index) => {
        const listItem = document.createElement('li');
        // 순위, 점수, 기록 시간 표시
        listItem.textContent = `#${index + 1} - ${entry.score}점 (기록: ${entry.date})`;
        rankingList.appendChild(listItem);
    });
}

// ⭐ 랭킹 초기화 버튼 이벤트 리스너
resetRankingButton.addEventListener('click', function() {
    if (confirm("정말로 랭킹을 초기화하시겠습니까?")) {
        localStorage.removeItem('clickGameRanking'); // 랭킹 데이터 삭제
        displayRanking(); // 랭킹판 업데이트
        alert("랭킹이 초기화되었습니다.");
    }
});

// ⭐ 윈도우 로드시 저장된 랭킹 플래그 삭제 (새 게임을 위해)
window.onload = function() {
    localStorage.removeItem('rankingSaved');
}

// 게임 업데이트 함수 호출
requestAnimationFrame(updateGame);