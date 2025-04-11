    const textContainer = document.getElementById('text-container');
    const coverflow = document.getElementById('coverflow');
    const progressBar = document.getElementById('progress-bar');
    const particlesContainer = document.getElementById('particles');
    const overlay = document.getElementById('video-overlay');
    const overlayVideo = document.getElementById('overlay-video');
    const closeOverlayBtn = document.getElementById('close-overlay');

    // Load external JSON
fetch('qa.json')
.then(response => response.json())
.then(data => {
    qaPairs = data;
    init(); // initialize after loading
})
.catch(error => {
    console.error("Error loading QA data:", error);
});

    let currentQA = null;
    let coverItems = [];
    let videoTimeout;
    let currentIndex = 0;
    const videoDuration = 10000;
    const videoStartTime = 30;

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
        currentIndex = (currentIndex + 1) % qaPairs.length;
        return qaPairs[currentIndex];
    }

    function typeText(element, text, speed = 30) {
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
            img.src = `https://img.youtube.com/vi/${qa.videoId}/mqdefault.jpg`;
            img.alt = qa.title;
            item.appendChild(img);
            coverflow.appendChild(item);
            coverItems.push(item);
            item.addEventListener('click', () => {
                clearTimeout(videoTimeout);
                expandVideo(index);
            });
        });
        positionCoverItems();
    }

    function positionCoverItems() {
        const centerIndex = Math.floor(coverItems.length / 2);
        const spacing = window.innerWidth < 768 ? 120 : 180;
        coverItems.forEach((item, index) => {
            const offset = index - centerIndex;
            const absOffset = Math.abs(offset);
            const z = -absOffset * 40;
            const rotation = offset * 15;
            Object.assign(item.style, {
                transform: `
                    translateX(${offset * spacing}px)
                    translateZ(${z}px)
                    rotateY(${rotation}deg)
                    scale(${1 - absOffset * 0.1})`,
                zIndex: coverItems.length - absOffset,
                opacity: 1 - absOffset * 0.3
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
        const videoId = qaPairs[index].videoId;
        document.body.classList.add('video-playing');
        animateCoverflowTo(index);
        coverItems.forEach(item => item.classList.remove('selected', 'auto-selected'));
        coverItems[index].classList.add('selected', 'auto-selected');
        overlayVideo.src = `https://www.youtube.com/embed/${videoId}?start=${videoStartTime}&autoplay=1&rel=0`;
        overlay.classList.add('active');
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
        runSequence(); // restart sequence immediately after close
    }

    async function runSequence() {
        textContainer.innerHTML = '';
        currentQA = getNextQA();

        const questionElement = document.createElement('div');
        questionElement.className = 'question typing';
        textContainer.appendChild(questionElement);
        await typeText(questionElement, currentQA.question);

        const answerElement = document.createElement('div');
        answerElement.className = 'answer typing';
        textContainer.appendChild(answerElement);
        await typeText(answerElement, currentQA.answer);

        const videoMessageElement = document.createElement('div');
        videoMessageElement.className = 'video-message typing';
        textContainer.appendChild(videoMessageElement);
        await typeText(videoMessageElement, "Detailed explanation can be watched from the following video:");

        setTimeout(() => {
            const videoIndex = qaPairs.findIndex(qa => qa.videoId === currentQA.videoId);
            if (videoIndex >= 0) expandVideo(videoIndex);
        }, 1000);
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

    window.addEventListener('load', init);