const loadingScreen = document.getElementById('loading');
const countdownScreen = document.getElementById('countdown');
const mainContent = document.getElementById('main-content');
const angkaCount = document.getElementById('angka-count');
const tombolBuka = document.getElementById('tombol-buka');
const tombolReplay = document.getElementById('tombol-replay');
const tombolLanjut = document.getElementById('tombol-lanjut');
const tombolEdit = document.getElementById('tombol-edit');
const tombolUnduh = document.getElementById('tombol-unduh');
const tombolBagikan = document.getElementById('tombol-bagikan');
const tombolUnduhHasil = document.getElementById('tombol-unduh-hasil');
const tombolBagikanHasil = document.getElementById('tombol-bagikan-hasil');
const tombolMusik = document.getElementById('tombol-musik');
const tombolAnimasi = document.getElementById('tombol-animasi');
const judul = document.getElementById('judul');
const foto = document.getElementById('foto');
const fotoHasil = document.getElementById('foto-hasil');
const fotoPlaceholder = document.getElementById('foto-placeholder');
const fotoPlaceholderHasil = document.getElementById('foto-placeholder-hasil');
const previewPanel = document.getElementById('preview-panel');
const birthdayOutput = document.getElementById('birthday-output');
const formPersonalisasi = document.getElementById('form-personalisasi');
const inputNama = document.getElementById('input-nama');
const inputUmur = document.getElementById('input-umur');
const inputHubungan = document.getElementById('input-hubungan');
const inputGaya = document.getElementById('input-gaya');
const inputTema = document.getElementById('input-tema');
const inputFoto = document.getElementById('input-foto');
const infoFoto = document.getElementById('info-foto');
const statusPengiriman = document.getElementById('status-pengiriman');
const statusAksi = document.getElementById('status-aksi');
const persetujuanData = document.getElementById('persetujuan-data');
const lagu = document.getElementById('lagu-ultah');

const hubungan = {
    sahabat: 'Sahabat terbaikmu',
    teman: 'Teman tersayang',
    kakak: 'Kakak hebat',
    adik: 'Adik tersayang',
    pasangan: 'Pasangan tercinta',
    orang_tua: 'Orang tua tercinta',
    keluarga: 'Keluarga tersayang',
    spesial: 'Orang spesial'
};

const paletKartu = {
    rose: ['#542f58', '#302450', '#ffc0d2'],
    ocean: ['#245270', '#282e62', '#c4eeff'],
    sunshine: ['#7a4b36', '#553b48', '#ffefb5'],
    garden: ['#315a4b', '#34405d', '#d3f6d8']
};

let fotoObjectUrl = null;
let captchaToken = '';
let captchaWidgetId = null;
let isSubmitting = false;
let isMusicPlaying = false;
let animationsEnabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let details = null;

lagu.volume = 0.45;
document.body.classList.toggle('reduce-effects', !animationsEnabled);
updateAnimationButton();

inputNama.addEventListener('input', () => inputNama.setCustomValidity(''));
inputUmur.addEventListener('input', () => inputUmur.setCustomValidity(''));
persetujuanData.addEventListener('change', () => {
    captchaToken = '';
    updateRevealButton();
    document.getElementById('captcha-section').classList.toggle('hidden', !persetujuanData.checked);
    if (persetujuanData.checked) {
        statusPengiriman.textContent = '';
        void initializeTurnstile();
        return;
    }

    if (window.turnstile && captchaWidgetId !== null) {
        window.turnstile.remove(captchaWidgetId);
        captchaWidgetId = null;
    }
    statusPengiriman.textContent = 'Nama dan umur tidak akan disimpan. Kamu tetap bisa membuat kartu.';
});
inputTema.addEventListener('change', () => {
    document.body.dataset.theme = inputTema.value;
});

inputFoto.addEventListener('change', () => {
    const file = inputFoto.files[0];
    if (!file) {
        clearSelectedPhoto('Tidak ada foto yang dipilih. Foto bersifat opsional dan tidak diunggah.');
        return;
    }

    if (!file.type.startsWith('image/')) {
        inputFoto.value = '';
        clearSelectedPhoto('Pilih file gambar yang valid.');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        inputFoto.value = '';
        clearSelectedPhoto('Ukuran foto maksimal 5 MB.');
        return;
    }

    if (fotoObjectUrl) URL.revokeObjectURL(fotoObjectUrl);
    fotoObjectUrl = URL.createObjectURL(file);
    foto.src = fotoObjectUrl;
    foto.alt = `Foto ${inputNama.value.trim() || 'orang yang berulang tahun'}`;
    foto.classList.remove('hidden');
    fotoPlaceholder.classList.add('hidden');
    fotoHasil.src = fotoObjectUrl;
    fotoHasil.alt = foto.alt;
    fotoHasil.classList.remove('hidden');
    fotoPlaceholderHasil.classList.add('hidden');
    infoFoto.textContent = `Foto "${file.name}" siap dipakai. Foto tidak dikirim ke database.`;
});

function clearSelectedPhoto(message) {
    if (fotoObjectUrl) URL.revokeObjectURL(fotoObjectUrl);
    fotoObjectUrl = null;
    foto.removeAttribute('src');
    fotoHasil.removeAttribute('src');
    foto.classList.add('hidden');
    fotoHasil.classList.add('hidden');
    fotoPlaceholder.classList.remove('hidden');
    fotoPlaceholderHasil.classList.remove('hidden');
    infoFoto.textContent = message;
}

inputNama.addEventListener('input', () => {
    if (foto.src) {
        foto.alt = `Foto ${inputNama.value.trim() || 'orang yang berulang tahun'}`;
        fotoHasil.alt = foto.alt;
    }
});

tombolBuka.addEventListener('click', () => {
    tombolBuka.classList.add('hidden');
    document.querySelector('.intro').classList.add('hidden');
    formPersonalisasi.classList.remove('hidden');
    inputNama.focus();
});

formPersonalisasi.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = inputNama.value.trim();
    const age = inputUmur.valueAsNumber;

    if (!name) {
        inputNama.setCustomValidity('Masukkan nama orang yang berulang tahun.');
        inputNama.reportValidity();
        return;
    }

    inputNama.setCustomValidity('');
    if (!Number.isInteger(age) || age < 1 || age > 120) {
        inputUmur.setCustomValidity('Masukkan umur antara 1 dan 120 tahun.');
        inputUmur.reportValidity();
        return;
    }

    inputUmur.setCustomValidity('');
    details = {
        name,
        age,
        relationship: inputHubungan.value,
        style: inputGaya.value,
        theme: inputTema.value
    };

    document.body.dataset.theme = details.theme;
    renderGreeting(details);
    formPersonalisasi.classList.add('hidden');
    previewPanel.classList.remove('hidden');
    statusPengiriman.textContent = '';
    persetujuanData.checked = false;
    document.getElementById('captcha-section').classList.add('hidden');
    captchaToken = '';
    updateRevealButton();
    previewPanel.scrollIntoView({ behavior: animationsEnabled ? 'smooth' : 'auto', block: 'center' });
});

tombolEdit.addEventListener('click', () => {
    if (window.turnstile && captchaWidgetId !== null) {
        window.turnstile.remove(captchaWidgetId);
        captchaWidgetId = null;
    }
    captchaToken = '';
    persetujuanData.checked = false;
    document.getElementById('captcha-section').classList.add('hidden');
    previewPanel.classList.add('hidden');
    formPersonalisasi.classList.remove('hidden');
    statusPengiriman.textContent = '';
    formPersonalisasi.scrollIntoView({ behavior: animationsEnabled ? 'smooth' : 'auto', block: 'center' });
});

tombolLanjut.addEventListener('click', async () => {
    if (isSubmitting || !details) return;
    if (persetujuanData.checked && !captchaToken) {
        statusPengiriman.textContent = 'Selesaikan verifikasi anti-spam sebelum melanjutkan.';
        return;
    }

    isSubmitting = true;
    tombolLanjut.disabled = true;
    statusPengiriman.textContent = persetujuanData.checked
        ? 'Memverifikasi dan menyimpan data...'
        : 'Data tidak disimpan; menyiapkan kejutan...';

    if (persetujuanData.checked) {
        try {
            await simpanPenggunaan(details, captchaToken);
        } catch (error) {
            console.error('Gagal mengirim data penggunaan:', error);
            statusPengiriman.textContent = error.message;
            isSubmitting = false;
            captchaToken = '';
            if (window.turnstile && captchaWidgetId !== null) {
                window.turnstile.reset(captchaWidgetId);
            }
            updateRevealButton();
            return;
        }
    } else {
        isSubmitting = false;
    }

    isSubmitting = false;
    previewPanel.classList.add('hidden');
    mainContent.classList.remove('active');
    loadingScreen.classList.add('active');
    setTimeout(() => mulaiHitungMundur(details.name), 1200);
});

tombolMusik.addEventListener('click', async () => {
    if (isMusicPlaying) {
        lagu.pause();
        isMusicPlaying = false;
        updateMusicButton();
        return;
    }

    try {
        await lagu.play();
        isMusicPlaying = true;
        updateMusicButton();
    } catch (error) {
        statusPengiriman.textContent = 'Browser belum mengizinkan musik. Coba tekan tombol musik sekali lagi.';
    }
});

lagu.addEventListener('pause', () => {
    isMusicPlaying = false;
    updateMusicButton();
});
lagu.addEventListener('play', () => {
    isMusicPlaying = true;
    updateMusicButton();
});

tombolAnimasi.addEventListener('click', () => {
    animationsEnabled = !animationsEnabled;
    document.body.classList.toggle('reduce-effects', !animationsEnabled);
    if (!animationsEnabled) {
        document.querySelectorAll('.balloon').forEach((balloon) => balloon.remove());
        if (typeof confetti === 'function') confetti.reset();
    }
    updateAnimationButton();
});

tombolUnduh.addEventListener('click', (event) => void unduhKartu(event));
tombolUnduhHasil.addEventListener('click', (event) => void unduhKartu(event));
tombolBagikan.addEventListener('click', () => void bagikanKartu());
tombolBagikanHasil.addEventListener('click', () => void bagikanKartu());
tombolReplay.addEventListener('click', () => window.location.reload());

async function initializeTurnstile() {
    if (!persetujuanData.checked) return;
    const config = window.BIRTHDAY_DATABASE;
    const siteKey = config && config.turnstileSiteKey;
    if (!siteKey) {
        statusPengiriman.textContent = 'Pemilik web perlu mengatur Turnstile Site Key di supabase-config.js.';
        return;
    }

    try {
        await loadTurnstileScript();
        if (!persetujuanData.checked || previewPanel.classList.contains('hidden')) return;
        if (captchaWidgetId !== null) window.turnstile.remove(captchaWidgetId);
        captchaWidgetId = window.turnstile.render('#turnstile-widget', {
            sitekey: siteKey,
            theme: 'dark',
            action: 'birthday_submit',
            callback: (token) => {
                captchaToken = token;
                statusPengiriman.textContent = '';
                updateRevealButton();
            },
            'expired-callback': () => {
                captchaToken = '';
                updateRevealButton();
                statusPengiriman.textContent = 'Verifikasi kedaluwarsa. Selesaikan Turnstile sekali lagi.';
            },
            'error-callback': () => {
                captchaToken = '';
                updateRevealButton();
                statusPengiriman.textContent = 'Verifikasi anti-spam gagal dimuat. Muat ulang halaman dan coba lagi.';
            }
        });
    } catch (error) {
        console.error('Turnstile tidak dapat dimuat:', error);
        statusPengiriman.textContent = 'Turnstile tidak dapat dimuat. Periksa koneksi internet atau konfigurasi pemilik web.';
    }
}

function loadTurnstileScript() {
    if (window.turnstile) return Promise.resolve();

    const existingScript = document.querySelector('script[data-turnstile]');
    if (existingScript) {
        return new Promise((resolve, reject) => {
            existingScript.addEventListener('load', resolve, { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Turnstile script gagal dimuat.')), { once: true });
            if (window.turnstile) resolve();
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.turnstile = 'true';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Turnstile script gagal dimuat.'));
        document.head.appendChild(script);
    });
}

function updateRevealButton() {
    tombolLanjut.disabled = isSubmitting || (persetujuanData.checked && !captchaToken);
}

function updateMusicButton() {
    tombolMusik.textContent = isMusicPlaying ? '♫ Musik: nyala' : '♫ Musik: mati';
    tombolMusik.setAttribute('aria-pressed', String(isMusicPlaying));
}

function updateAnimationButton() {
    tombolAnimasi.textContent = animationsEnabled ? '✨ Animasi: nyala' : '✨ Animasi: mati';
    tombolAnimasi.setAttribute('aria-pressed', String(animationsEnabled));
}

function buatUcapan(data) {
    const relation = hubungan[data.relationship];
    const copy = {
        manis: {
            message: `Semoga di usia ${data.age} tahun ini, ${data.name} selalu dikelilingi kebahagiaan, kesehatan, dan orang-orang yang menyayangimu. Semoga semua hal baik yang kamu impikan perlahan menjadi nyata. 🌟`,
            prayer: `Untuk ${relation.toLowerCase()} yang selalu berarti: semoga hari-harimu dipenuhi tawa, cinta, dan kenangan indah. 💖`
        },
        lucu: {
            message: `Selamat naik level ke umur ${data.age}! Semoga kuenya besar, lilinnya sedikit, dan traktirannya tetap banyak. Semoga hari-harimu penuh tawa dan hal-hal seru! 🎈`,
            prayer: `Semoga panjang umur, sehat selalu, makin bahagia, dan semua keinginan baikmu segera tercapai. Tetap jadi ${relation.toLowerCase()} paling asyik! 😄`
        },
        islami: {
            message: `Barakallah fii umrik, ${data.name}. Semoga Allah senantiasa melimpahkan kesehatan, keberkahan umur, dan kebahagiaan di usia ${data.age} tahun ini.`,
            prayer: `Semoga setiap langkahmu dimudahkan, rezekimu dilapangkan, cita-citamu tercapai, dan kamu selalu dalam lindungan-Nya. Aamiin. 🤲`
        },
        formal: {
            message: `Selamat ulang tahun ke-${data.age}, ${data.name}. Semoga tahun ini membawa kesehatan, kebahagiaan, dan pencapaian yang membanggakan.`,
            prayer: `Semoga seluruh rencana dan harapan baik dapat terwujud. Salam hangat untuk ${relation.toLowerCase()}, semoga sukses selalu. ✨`
        },
        singkat: {
            message: `Selamat ulang tahun ke-${data.age}, ${data.name}! Semoga sehat, bahagia, dan semua harapan baikmu tercapai. 🎂`,
            prayer: `Selamat merayakan hari istimewamu, ${relation.toLowerCase()}! 💖`
        }
    };

    return {
        title: `Selamat Ulang Tahun, ${data.name}! 🎂`,
        relation,
        ...copy[data.style]
    };
}

function renderGreeting(data) {
    const greeting = buatUcapan(data);
    document.getElementById('preview-hubungan').textContent = greeting.relation;
    document.getElementById('preview-judul').textContent = greeting.title;
    document.getElementById('preview-pesan').textContent = greeting.message;
    document.getElementById('preview-doa').textContent = greeting.prayer;
    document.getElementById('preview-umur').textContent = `Merayakan ${data.age} tahun kehidupan`;

    document.getElementById('hasil-hubungan').textContent = greeting.relation;
    judul.textContent = greeting.title;
    document.getElementById('pesan-selamat').textContent = greeting.message;
    document.getElementById('pesan-harapan').textContent = greeting.prayer;
    document.getElementById('pesan-doa').textContent =
        `Semoga langkahmu di tahun yang baru ini selalu diberi kemudahan, keberanian, dan banyak alasan untuk tersenyum. Selamat menikmati hari spesialmu! 🌷`;
    document.getElementById('pesan-quote').textContent =
        `Babak baru dimulai—semoga penuh cerita indah, ${data.name}. ✨`;
}

async function simpanPenggunaan(data, token) {
    const config = window.BIRTHDAY_DATABASE;
    if (!config || !config.supabaseUrl || !config.supabaseAnonKey) {
        throw new Error('Penyimpanan online belum dikonfigurasi. Hubungi pemilik web.');
    }

    let projectUrl;
    try {
        projectUrl = new URL(config.supabaseUrl);
    } catch (error) {
        throw new Error('Alamat database belum dikonfigurasi dengan benar. Hubungi pemilik web.');
    }

    if (projectUrl.protocol !== 'https:' || !projectUrl.hostname.endsWith('.supabase.co')) {
        throw new Error('Alamat database Supabase tidak valid. Hubungi pemilik web.');
    }

    let response;
    try {
        response = await fetch(`${projectUrl.origin}/functions/v1/birthday-submit`, {
            method: 'POST',
            headers: {
                apikey: config.supabaseAnonKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: data.name,
                age: data.age,
                captchaToken: token,
                consent: persetujuanData.checked
            })
        });
    } catch (error) {
        throw new Error('Tidak bisa terhubung ke server. Periksa internet lalu coba lagi.');
    }

    if (!response.ok) {
        let detail = '';
        try {
            const result = await response.json();
            detail = result.error || '';
        } catch (error) {
            detail = '';
        }
        if (response.status === 403) {
            throw new Error(detail || 'Verifikasi keamanan gagal atau sudah kedaluwarsa. Silakan coba lagi.');
        }
        console.error('Server menolak penyimpanan:', response.status, detail);
        throw new Error(detail || 'Data gagal disimpan. Coba lagi atau hubungi pemilik web.');
    }
}

function mulaiHitungMundur(name) {
    setTimeout(() => {
        loadingScreen.classList.remove('active');
        countdownScreen.classList.add('active');

        let count = 3;
        angkaCount.textContent = count;
        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                angkaCount.textContent = count;
                angkaCount.style.animation = 'none';
                void angkaCount.offsetHeight;
                angkaCount.style.animation = 'popIn 1s ease-in-out';
                return;
            }

            clearInterval(timer);
            countdownScreen.classList.remove('active');
            mainContent.classList.add('active');
            tampilkanKejutan(name);
        }, 1000);
    }, 1400);
}

function tampilkanKejutan(name) {
    birthdayOutput.classList.remove('hidden');
    birthdayOutput.scrollIntoView({ behavior: animationsEnabled ? 'smooth' : 'auto', block: 'center' });
    void lagu.play().then(updateMusicButton).catch(() => {
        isMusicPlaying = false;
        updateMusicButton();
    });

    if (animationsEnabled) {
        tembakConfetti();
        terbanginBalon();
        setTimeout(tembakFireworks, 3500);
    }

    judul.classList.add('glow');
    const messages = birthdayOutput.querySelectorAll('.result-message');
    messages.forEach((message, index) => {
        if (!animationsEnabled) {
            message.classList.add('muncul');
            return;
        }
        setTimeout(() => message.classList.add('muncul'), index * 350);
    });
}

async function unduhKartu(event) {
    if (!details) return;
    const button = event.currentTarget;
    button.disabled = true;

    try {
        const blob = await renderCardPng();
        downloadPng(blob);
        statusAksi.textContent = 'Kartu PNG berhasil diunduh.';
    } catch (error) {
        console.error('Kartu gagal diekspor:', error);
        statusAksi.textContent = 'Kartu tidak bisa diunduh di browser ini. Coba browser lain.';
    } finally {
        button.disabled = false;
    }
}

function renderCardPng() {
    const greeting = buatUcapan(details);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1500;
    const context = canvas.getContext('2d');
    if (!context) return Promise.reject(new Error('Canvas tidak tersedia.'));

    const [from, to, accent] = paletKartu[details.theme];
    const background = context.createLinearGradient(0, 0, 1200, 1500);
    background.addColorStop(0, from);
    background.addColorStop(1, to);
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = 'rgba(255,255,255,0.12)';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(1030, 140, 180, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(120, 1390, 220, 0, Math.PI * 2);
    context.stroke();

    const drawText = () => {
        context.textAlign = 'center';
        context.fillStyle = accent;
        context.font = '700 25px Arial, sans-serif';
        context.fillText(greeting.relation.toUpperCase(), 600, 570, 1000);

        context.fillStyle = '#fff8f8';
        context.font = 'bold 66px Georgia, serif';
        drawWrappedText(context, `Selamat Ulang Tahun, ${details.name}!`, 600, 665, 1000, 82, 2);

        context.fillStyle = '#f5ebf5';
        context.font = '32px Arial, sans-serif';
        drawWrappedText(context, greeting.message, 600, 860, 930, 48, 5);
        context.fillStyle = '#fff0c8';
        context.font = 'italic 29px Arial, sans-serif';
        drawWrappedText(context, greeting.prayer, 600, 1150, 930, 44, 4);

        context.fillStyle = accent;
        context.font = '700 25px Arial, sans-serif';
        context.fillText(`MERAYAKAN ${details.age} TAHUN KEHIDUPAN`, 600, 1390, 1050);

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Browser gagal membuat gambar PNG.'));
            }, 'image/png');
        });
    };

    if (foto.classList.contains('hidden') || !foto.complete || !foto.naturalWidth) {
        context.textAlign = 'center';
        context.font = '130px Arial, sans-serif';
        context.fillText('🎂', 600, 390);
        return drawText();
    }

    const imageSize = 310;
    context.save();
    context.beginPath();
    context.arc(600, 330, imageSize / 2, 0, Math.PI * 2);
    context.clip();
    drawImageCover(context, foto, 600 - imageSize / 2, 330 - imageSize / 2, imageSize, imageSize);
    context.restore();

    context.strokeStyle = '#fff8f8';
    context.lineWidth = 9;
    context.beginPath();
    context.arc(600, 330, imageSize / 2 + 5, 0, Math.PI * 2);
    context.stroke();
    return drawText();
}

function drawImageCover(context, image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = (image.naturalHeight - sourceHeight) / 2;
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = text.split(/\s+/);
    let line = '';
    let lineCount = 0;
    for (const word of words) {
        const nextLine = line ? `${line} ${word}` : word;
        if (context.measureText(nextLine).width > maxWidth && line) {
            context.fillText(line, x, y, maxWidth);
            lineCount++;
            if (lineCount >= maxLines) return;
            line = word;
            y += lineHeight;
        } else {
            line = nextLine;
        }
    }
    if (line && lineCount < maxLines) context.fillText(line, x, y, maxWidth);
}

async function bagikanKartu() {
    if (!details) return;
    const text = `${buatUcapan(details).title}\n${buatUcapan(details).message}`;

    try {
        const blob = await renderCardPng();
        const file = new File([blob], namaFileKartu(), { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Kartu ucapan ulang tahun', text });
            statusAksi.textContent = 'Kartu berhasil dibagikan.';
            return;
        }

        if (navigator.share) {
            await navigator.share({ title: 'Kartu ucapan ulang tahun', text, url: window.location.href });
            statusAksi.textContent = 'Teks ucapan berhasil dibagikan. Unduh PNG jika ingin membagikan gambar kartunya.';
            return;
        }
    } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Berbagi kartu gagal:', error);
    }

    const url = `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${window.location.href}`)}`;
    try {
        const blob = await renderCardPng();
        downloadPng(blob);
        const shareLink = document.createElement('a');
        shareLink.href = url;
        shareLink.target = '_blank';
        shareLink.rel = 'noopener noreferrer';
        document.body.appendChild(shareLink);
        shareLink.click();
        shareLink.remove();
        statusAksi.textContent = 'Kartu PNG diunduh. Buka WhatsApp lalu lampirkan file PNG tersebut.';
    } catch (error) {
        console.error('Fallback berbagi kartu gagal:', error);
        statusAksi.textContent = 'Kartu gagal dibagikan. Coba unduh PNG lalu bagikan secara manual.';
    }
}

function namaFileKartu() {
    const safeName = details.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ulang-tahun';
    return `ucapan-${safeName}.png`;
}

function downloadPng(blob) {
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = namaFileKartu();
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function terbanginBalon() {
    if (!animationsEnabled) return;
    const colors = ['#ff4757', '#1e90ff', '#2ed573', '#ffa502', '#ff6b81'];
    for (let index = 0; index < 15; index++) {
        const balloon = document.createElement('div');
        balloon.classList.add('balloon');
        balloon.style.left = `${Math.random() * 100}vw`;
        balloon.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        balloon.style.animationDuration = `${Math.random() * 3 + 6}s`;
        balloon.style.animationDelay = `${Math.random() * 2}s`;
        document.body.appendChild(balloon);
        balloon.addEventListener('animationend', () => balloon.remove(), { once: true });
    }
}

function tembakConfetti() {
    if (!animationsEnabled || typeof confetti !== 'function') return;
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
}

function tembakFireworks() {
    if (!animationsEnabled || typeof confetti !== 'function') return;
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0 || !animationsEnabled) {
            clearInterval(interval);
            return;
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
}
