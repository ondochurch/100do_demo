let qaPairs = [];
let currentQA = null;
let coverItems = [];
let videoTimeout;
let currentIndex = 0;
let isTyping = false;
const videoDuration = 20000;
const videoStartTime = 6;

const textContainer = document.getElementById('text-container');
const coverflow = document.getElementById('coverflow');
const progressBar = document.getElementById('progress-bar');
const particlesContainer = document.getElementById('particles');
const overlay = document.getElementById('video-overlay');
const overlayVideo = document.getElementById('overlay-video');
const closeOverlayBtn = document.getElementById('close-overlay');

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Load external JSON
fetch('qa.json')
  .then(response => response.json())
  .then(data => {
    shuffleArray(data);   // ✅ shuffle the loaded data
    qaPairs = data;
    init();
  })
  .catch(error => {
    console.error("Error loading QA data:", error);
  });


function createParticles() {
  const particleCount = window.innerWidth < 768 ? 30 : 50;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    const size = Math.random() * 5 + 1;
    const posX = Math.random() * window.innerWidth;
    const posY = Math.random() * window.innerHeight;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    const opacity = Math.random() * 0.5 + 0.1;
    Object.assign(particle.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${posX}px`,
      top: `${posY}px`,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
      opacity: opacity
    });
    particlesContainer.appendChild(particle);
  }
}

function getNextQA() {
    const randomIndex = Math.floor(Math.random() * qaPairs.length);
    currentIndex = randomIndex;
    return qaPairs[randomIndex];
  }
function typeText(element, text, speed = 50) {
  return new Promise(resolve => {
    element.textContent = '';
    let i = 0;
    const typing = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typing);
        element.classList.remove('typing');
        resolve();
      }
    }, speed);
    element.classList.add('typing');
  });
}

function createCoverflow() {
  coverflow.innerHTML = '';
  coverItems = [];
  qaPairs.forEach((qa, index) => {
    const item = document.createElement('div');
    item.className = 'cover-item';
    item.dataset.videoId = qa.videoId;
    item.dataset.index = index;
    const img = document.createElement('img');
    // img.src = `https://img.youtube.com/vi/${qa.videoId}/mqdefault.jpg`;
    img.src = `thumbnails/${qa.videoId}.webm.jpg`;

    img.alt = qa.title;
    item.appendChild(img);
    coverflow.appendChild(item);
    coverItems.push(item);
    item.addEventListener('click', () => {
      if (isTyping) return;
      clearTimeout(videoTimeout);
      expandVideo(index);
    });
  });
  positionCoverItems();
}

function positionCoverItems() {
  const centerIndex = Math.floor(coverItems.length / 2);
  // const spacing = window.innerWidth < 768 ? 120 : 180;
  const spacing = 100;
  coverItems.forEach((item, index) => {
    const offset = index - centerIndex;
    const absOffset = Math.abs(offset);
    const z = -absOffset * 40;
    const rotation = offset * 5;
    Object.assign(item.style, {
      transform: `
        translateX(${offset * spacing}px)
        translateZ(${z}px)
        rotateY(${rotation}deg)
        scale(${1 - absOffset * 0.1})`,
      zIndex: coverItems.length - absOffset,
      opacity: 1 - absOffset * 0.1
    });
  });
}

function animateCoverflowTo(index) {
  const centerIndex = Math.floor(coverItems.length / 2);

  const offset = index - centerIndex;
  const spacing = window.innerWidth < 768 ? 120 : 180;
  coverflow.style.transform = `translateX(${-offset * spacing}px)`;
  coverItems.forEach((item, i) => {
    const newIndex = i - offset;
    const newOffset = newIndex - centerIndex;
    const absOffset = Math.abs(newOffset);
    const z = -absOffset * 40;
    const rotation = newOffset * 15;
    Object.assign(item.style, {
      transform: `
        translateX(${newOffset * spacing}px)
        translateZ(${z}px)
        rotateY(${rotation}deg)
        scale(${1 - absOffset * 0.1})`,
      zIndex: coverItems.length - absOffset,
      opacity: 1 - absOffset * 0.3
    });
  });
}

function expandVideo(index) {
  const videoPath = 'videos/' + qaPairs[index].videoId + '.webm';
  const videoElement = overlayVideo;

  document.body.classList.add('video-playing');
  // animateCoverflowTo(index);

  // coverItems.forEach(item => item.classList.remove('selected', 'auto-selected'));
  // coverItems[index].classList.add('selected', 'auto-selected');

  overlay.classList.add('active');

  // Reset video state
  videoElement.pause();
  videoElement.src = videoPath;
  videoElement.load();  // re-initialize the video
  videoElement.muted = true;  // allow autoplay

  // Wait until video metadata is loaded before seeking
  videoElement.addEventListener('loadedmetadata', function handleLoaded() {
    videoElement.currentTime = videoStartTime; // set to 7 seconds or whatever
    videoElement.play().catch(err => console.warn('Autoplay failed:', err));
    videoElement.removeEventListener('loadedmetadata', handleLoaded);
  });

  videoTimeout = setTimeout(() => {
    closeOverlay();
  }, videoDuration);
}

function closeOverlay() {
  overlay.classList.remove('active');
  overlayVideo.src = '';
  document.body.classList.remove('video-playing');
  coverflow.style.transform = 'translateX(0)';
  positionCoverItems();

  if (!isTyping) {
    runSequence();
  }
}

async function runSequence() {
  if (isTyping) return;
  isTyping = true;

  textContainer.innerHTML = '';
  currentQA = getNextQA();

  const questionBox = document.createElement('div');
  questionBox.className = 'search-box';
  questionBox.innerHTML = `
    <span class="icon">🔍</span>
    <span class="question typing"></span>
  `;
  textContainer.appendChild(questionBox);
  
  const questionElement = questionBox.querySelector('.question');
  await typeText(questionElement, currentQA.question);
  
  const videoMessageElement = document.createElement('div');
  videoMessageElement.className = 'video-message typing';
  textContainer.appendChild(videoMessageElement);
  await typeText(videoMessageElement, "설교영상: " + currentQA.title);

  const answerElement = document.createElement('div');
  answerElement.className = 'answer typing';
  textContainer.appendChild(answerElement);
  await typeText(answerElement, currentQA.answer);

  animateCoverflowTo(currentIndex);
  
  setTimeout(() => {
    const videoIndex = qaPairs.findIndex(qa => qa.videoId === currentQA.videoId);
    if (videoIndex >= 0) {
      expandVideo(videoIndex);
    }
    isTyping = false;
  }, 500);
}

function handleResize() {
  positionCoverItems();
}

function init() {
  createParticles();
  createCoverflow();
  runSequence();

  window.addEventListener('resize', handleResize);
  closeOverlayBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeOverlay();
    }
  });
}