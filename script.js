const loadingScreen = document.getElementById('loading');
const countdownScreen = document.getElementById('countdown');
const mainContent = document.getElementById('main-content');
const angkaCount = document.getElementById('angka-count');
const tombolBuka = document.getElementById('tombol-buka');
const tombolReplay = document.getElementById('tombol-replay');
const judul = document.getElementById('judul');
const foto = document.getElementById('foto');
const pesanWrapper = document.getElementById('pesan-wrapper');
const pesanTeks = document.querySelectorAll('.pesan-teks');

// Elemen form umur
const formUmur = document.getElementById('form-umur');
const inputUmur = document.getElementById('input-umur');
const tombolLanjut = document.getElementById('tombol-lanjut');

const sfxKlik = document.getElementById('sfx-klik');
const lagu = document.getElementById('lagu-ultah');

// Loading -> Countdown
setTimeout(() => {
    loadingScreen.classList.remove('active');
    countdownScreen.classList.add('active');
    
    let count = 3;
    const timer = setInterval(() => {
        count--;
        if(count > 0) {
            angkaCount.innerText = count;
            angkaCount.style.animation = 'none';
            angkaCount.offsetHeight; 
            angkaCount.style.animation = 'popIn 1s ease-in-out';
        } else {
            clearInterval(timer);
            countdownScreen.classList.remove('active');
            mainContent.classList.add('active');
            setTimeout(() => foto.classList.add('muncul'), 100);
        }
    }, 1000);
}, 2000);

// Klik "Buka Pesan" -> Munculin form nanya umur
tombolBuka.addEventListener('click', () => {
    try { sfxKlik.play().catch(() => {}); } catch(err) {} // Kebal error sfx
    tombolBuka.classList.add('hidden'); 
    formUmur.classList.remove('hidden'); 
});

// Klik "Lanjut" setelah isi umur
tombolLanjut.addEventListener('click', () => {
    const umur = inputUmur.value;
    
    // Validasi biar dia ngisi dulu
    if(!umur || umur <= 0) {
        alert("Isi dulu dong umurnya! 😆");
        return;
    }

    try { sfxKlik.play().catch(() => {}); } catch(err) {} // Kebal error sfx
    formUmur.classList.add('hidden'); 
    
    setTimeout(() => {
        try { lagu.play().catch(() => {}); } catch(err) {} // Kebal error lagu
        tembakConfetti();

        // Judul nyesuain umur
        ketikJudul(`Happy ${umur}th Birthday, Teh Ia! 🎂`, () => {
            judul.classList.add('glow'); 
            
            pesanWrapper.classList.remove('hidden');
            munculinPesanSatuSatu();
        });

        terbanginBalon();
        setTimeout(tembakFireworks, 3500);

    }, 300);
});

// Tombol Replay (Versi Kebal Error biar pasti bisa diklik)
tombolReplay.addEventListener('click', () => {
    try { sfxKlik.play().catch(() => {}); } catch(err) {}
    
    setTimeout(() => {
        window.location.href = window.location.pathname; 
    }, 300);
});

// --- FUNGSI PENDUKUNG --- //

function ketikJudul(teks, callback) {
    let i = 0;
    judul.innerHTML = "";
    const ketikTimer = setInterval(() => {
        if (i < teks.length) {
            judul.innerHTML += teks.charAt(i);
            i++;
        } else {
            clearInterval(ketikTimer);
            if(callback) callback();
        }
    }, 100);
}

function munculinPesanSatuSatu() {
    let delay = 0;
    pesanTeks.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('muncul');
            if(index === pesanTeks.length - 1) {
                setTimeout(() => tombolReplay.classList.remove('hidden'), 1500);
            }
        }, delay);
        delay += 1200; 
    });
}

function terbanginBalon() {
    const warnaBalon = ['#ff4757', '#1e90ff', '#2ed573', '#ffa502', '#ff6b81'];
    for(let i = 0; i < 15; i++) {
        let balon = document.createElement('div');
        balon.classList.add('balloon');
        balon.style.left = Math.random() * 100 + 'vw';
        balon.style.backgroundColor = warnaBalon[Math.floor(Math.random() * warnaBalon.length)];
        balon.style.animationDuration = (Math.random() * 3 + 6) + 's'; 
        balon.style.animationDelay = (Math.random() * 2) + 's';
        document.body.appendChild(balon);
    }
}

function tembakConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 }
        });
    }
}

function tembakFireworks() {
    if (typeof confetti !== 'function') return;
    var duration = 5 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }
        var particleCount = 50 * (timeLeft / duration);
        
        confetti(Object.assign({}, defaults, { particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, { particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
    }, 250);
}
