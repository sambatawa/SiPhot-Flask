const gestureModal = document.getElementById('gestureModal');
const enableGestureBtn = document.querySelector('.enableGestureBtn');
const disabledGestureBtn = document.querySelector('.disabledGestureBtn');
let gestureEnabled = false;
document.addEventListener('DOMContentLoaded', () => {
    if (gestureModal) gestureModal.classList.add('modal_visible');
    
    if (enableGestureBtn) {
        enableGestureBtn.addEventListener('click', async () => {
            gestureEnabled = true;
            gestureModal.classList.remove('modal_visible');
            await startHandGesture();
        });
    } 
    if (disabledGestureBtn) {
        disabledGestureBtn.addEventListener('click', async () => {
            gestureEnabled = false;
            gestureModal.classList.remove('modal_visible');
            await stopHandGesture();
        });
    }
});
async function startHandGesture() {
    try {
        const response = await fetch('/hand_gesture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const result = await response.json();
        if (result.success) {
            showSuccess('Hand gesture mode diaktifkan!');
        } else {
            showError('Gagal mengaktifkan hand gesture: ' + result.error);
        }
    } catch (error) {
        showError('Gagal mengaktifkan hand gesture');
    }
}
async function stopHandGesture() {
    try {
        const response = await fetch('/hand_gesture', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const result = await response.json();
        if (result.success) {
            showSuccess('Hand gesture mode dinonaktifkan!');
        } else {
            showError('Gagal menonaktifkan hand gesture: ' + result.error);
        }
    } catch (error) {
        showError('Gagal menonaktifkan hand gesture');
    }
}
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const canvas2d = canvas.getContext('2d');
const ambil = document.getElementById('ambil');
const timer = document.getElementById('timer');
const cameraStatusText = document.getElementById('camera-status-text');
const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
const instructionsModal = document.getElementById('instructionsModal');
const frameConfig = {
  'frame1.png': [
    { x: 15, y: 30, width: 260, height: 150 },
    { x: 15, y: 190, width: 260, height: 150 },
    { x: 15, y: 360, width: 260, height: 150 },
    { x: 15, y: 520, width: 260, height: 150},
  ],
  'frame2.png': [
    { x: 15, y: 70, width: 260, height: 145 },
    { x: 15, y: 245, width: 260, height: 145 },
    { x: 15, y: 420, width: 260, height: 145 },
    { x: 15, y: 595, width: 260, height: 145},
  ],
  'frame3.png': [
    { x: 15, y: 159, width: 260, height: 155 },
    { x: 15, y: 324, width: 260, height: 155 },
    { x: 15, y: 488, width: 260, height: 155 },
    { x: 15, y: 652, width: 260, height: 155},
  ],
  'frame4.png': [
    { x: 15, y: 171, width: 260, height: 150 },
    { x: 15, y: 332, width: 260, height: 150 },
    { x: 15, y: 490, width: 260, height: 150 },
    { x: 15, y: 645, width: 260, height: 150},
  ],
};
let cameraStream = null;
async function requestCameraPermission() {
    try {
        cameraStatusText.textContent = 'Kamera Aktif';
        cameraStatusText.style.color = '#4CAF50';
        ambil.disabled = false;
        return true;
    } catch (error) {
        console.error('Error accessing camera:', error);
        cameraStatusText.textContent = 'Kamera Tidak Tersedia';
        cameraStatusText.style.color = '#f44336';
        showError('Gagal mengakses kamera');
        return false;
    }
}
async function initializeCamera() {
    console.log('Requesting camera permission...');
    await requestCameraPermission();
}
let selectedFrame = null;
document.querySelectorAll('.frame-button').forEach(button => {
    button.addEventListener('click', async () => {
        const frameName = button.getAttribute('data-frame');
        document.querySelectorAll('.frame-button').forEach(btn => {
            btn.classList.remove('aktif');
        });
        button.classList.add('aktif');
        selectedFrame = frameName;
        if (cameraStatusText.textContent === 'Kamera Aktif') {
            ambil.disabled = false;
        }
        try {
            const response = await fetch('/select_frame', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ frame: frameName })
            });
            const result = await response.json();
            if (!result.success) {
                showError('Gagal memilih frame: ' + result.error);
            }
        } catch (error) {
            showError('Gagal memilih frame');
        }
    });
});
const countdown = document.getElementById('countdown');
function runCountdown(seconds) {
  return new Promise(resolve => {
        if (seconds <= 0) {
      resolve();
      return;
    }
    let count = seconds;
    countdown.textContent = count;
    countdown.style.display = 'block';
    const interval = setInterval(() => {
      count -= 1;
      if (count >= 0) {
        countdown.textContent = count;
      }
      if (count < 0) {
        clearInterval(interval);
        countdown.textContent = '';
                countdown.style.display = 'none';
        resolve();
      }
    }, 1000);
  });
}

let capturedPhotos = [];
async function capturePhoto() {
    if (!selectedFrame) {
        showError('Pilih frame terlebih dahulu!');
        return;
    }
    try {
        const timerValue = parseInt(timer.value) || 0;
        ambil.disabled = true;
        timer.disabled = true;
        if (timerValue > 0) {
            await runCountdown(timerValue);
        }
        canvas.width = video.naturalWidth || 1000;
        canvas.height = video.naturalHeight || 576;
        canvas2d.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        const response = await fetch('/capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                timer: 0,
                photo_data: photoData.split(',')[1]
            })
        });
        const result = await response.json();
        if (result.success) {
            capturedPhotos.push({
                id: result.photo_id,
                data: result.photo_data,
                timestamp: new Date().toISOString()
            });
            updateCanvasPreview();
            showSuccess(`Foto ${result.total_photos} berhasil diambil!`);
            if (capturedPhotos.length >= 7) {
                showPhotoGallery();
            }
        } else {
            showError('Gagal mengambil foto: ' + result.error);
        }
    } catch (error) {
        console.error('Error capturing photo:', error);
        showError('Gagal mengambil foto');
    } finally {
        ambil.disabled = false;
        timer.disabled = false;
    }
}
function updateCanvasPreview() {
    if (capturedPhotos.length === 0) return;
    const fotoWidth = 150;
    const fotoHeight = 110;
    const gap = 10; 
    canvas.width = (fotoWidth * 7) + (gap * 6);
    canvas.height = fotoHeight;
    canvas2d.clearRect(0, 0, canvas.width, canvas.height);
    capturedPhotos.slice(0, 7).forEach((photo, i) => {
        const img = new Image();
        img.onload = () => {
            const x = i * (fotoWidth + gap);
            canvas2d.drawImage(img, x, 0, fotoWidth, fotoHeight);
        };
        img.src = 'data:image/jpeg;base64,' + photo.data;
    });
}
const galeri = document.getElementById('pilihanfoto');
let selectedPhotos = [];
function showPhotoGallery() {
    galeri.innerHTML = '';
    galeri.style.display = 'flex';
    const canvas = document.getElementById('canvas');
    canvas.style.display = 'block';
    capturedPhotos.forEach((photo, index) => {
        const img = document.createElement('img');
        img.src = 'data:image/jpeg;base64,' + photo.data;
        img.className = 'foto-preview';
        img.setAttribute('data-index', index);
        img.addEventListener('click', () => {
            if (selectedPhotos.length >= 4 && !img.classList.contains('selected')) {
                showError('Maksimal 4 foto yang bisa dipilih!');
                return;
            }
            img.classList.toggle('selected');
            updateSelectedPhotos();
            updatePhotoInteractions();
        });
        galeri.appendChild(img);
    });
    updatePhotoInteractions();
}
const simpan = document.getElementById('simpan');
const unduh = document.getElementById('unduh');
const hasil = document.getElementById('hasil');
const hasilGabungan = hasil.getContext('2d');
function updateSelectedPhotos() {
    const selectedElements = document.querySelectorAll('.foto-preview.selected');
    selectedPhotos = Array.from(selectedElements).map(el => {
        const index = parseInt(el.getAttribute('data-index'));
        return capturedPhotos[index];
    });
    simpan.disabled = selectedPhotos.length !== 4;
}
function updatePhotoInteractions() {
    const photoPreviews = document.querySelectorAll('.foto-preview');
    photoPreviews.forEach(img => {
        if (selectedPhotos.length >= 4 && !img.classList.contains('selected')) {
            img.style.pointerEvents = 'none';
            img.style.opacity = '0.5';
            img.style.cursor = 'not-allowed';
        } else {
            img.style.pointerEvents = 'auto';
            img.style.opacity = '1';
            img.style.cursor = 'pointer';
        }
    });
}
simpan.addEventListener('click', async () => {
    if (selectedPhotos.length !== 4) {
        showError('Pilih tepat 4 foto!');
        return;
    }
    let frameW = 290, frameH = 821;
    if (selectedFrame === 'frame2.png') {
        frameH = 870;
    }
    hasil.width = frameW;
    hasil.height = frameH;
    hasilGabungan.clearRect(0, 0, hasil.width, hasil.height);
    hasil.style.display = 'block';
    const positions = frameConfig[selectedFrame];
    let loadedCount = 0;
    selectedPhotos.forEach((photo, i) => {
        const pos = positions[i];
        if (!pos) {
            console.error(`Position for photo ${i} is undefined`);
            return;
        }
        const img = new Image();
        img.onload = () => {
            const x = pos.x;
            const y = pos.y;
            const w = pos.width;
            const h = pos.height;

            let srcW = img.width;
            let srcH = img.height;
            let targetRatio = w / h;
            let srcRatio = srcW / srcH;
            let sx = 0, sy = 0, sw = srcW, sh = srcH;
            if (srcRatio > targetRatio) {
                sw = sh * targetRatio;
                sx = (srcW - sw) / 2;
            } else if (srcRatio < targetRatio) {
                sh = sw / targetRatio;
                sy = (srcH - sh) / 2;
            }
            hasilGabungan.drawImage(img, sx, sy, sw, sh, x, y, w, h);
            loadedCount++;
            if (loadedCount === 4) {
                const frameImg = new Image();
                frameImg.onload = () => {
                    hasilGabungan.drawImage(frameImg, 0, 0, frameW, frameH);
                    unduh.disabled = false;
                };
                frameImg.src = `/assets/${selectedFrame}`;
            }
        };
        img.src = 'data:image/jpeg;base64,' + photo.data;
    });
});
async function createComposition() {
    try {
        const response = await fetch('/create_composition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const result = await response.json();
        if (result.success) {
            const img = new Image();
            img.onload = () => {
                hasil.width = 800;
                hasil.height = 600;
                hasilGabungan.drawImage(img, 0, 0, 800, 600);
                hasil.style.display = 'block';
                unduh.disabled = false;
            };
            img.src = 'data:image/jpeg;base64,' + result.composition_data;
            showSuccess('Komposisi foto berhasil dibuat!');
        } else {
            showError('Gagal membuat komposisi: ' + result.error);
        }
    } catch (error) {
        console.error('Error creating composition:', error);
        showError('Gagal membuat komposisi');
    }
}
function downloadComposition(filename) {
    window.open(`/download/${filename}`, '_blank');
}
function downloadCanvasResult() {
    try {
        if (hasil.width === 0 || hasil.height === 0) {
            showError('Tidak ada hasil untuk diunduh');
            return;
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `siphot_hasil_${timestamp}.jpg`;
        const dataURL = hasil.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess('Hasil berhasil diunduh!');  
    } catch (error) {
        showError('Gagal mengunduh hasil');
    }
}
async function resetSession() {
    try {
        const response = await fetch('/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const result = await response.json();
        if (result.success) {
            capturedPhotos = [];
            selectedPhotos = [];
            galeri.innerHTML = '';
            galeri.style.display = 'none';
            const canvas = document.getElementById('canvas');
            canvas.style.display = 'none';
            canvas.width = 800;
            canvas.height = 180;
            canvas2d.clearRect(0, 0, canvas.width, canvas.height);
            hasil.width = 290;
            hasil.height = 150;
            hasilGabungan.clearRect(0, 0, hasil.width, hasil.height);
            hasil.style.display = 'none';
            simpan.disabled = true;
            unduh.disabled = true;
            showSuccess('Sesi berhasil direset!');
        } else {
            showError('Gagal mereset sesi: ' + result.error);
        }
    } catch (error) {
        console.error('Error resetting session:', error);
        showError('Gagal mereset sesi');
    }
}
ambil.addEventListener('click', async () => {
    if (!selectedFrame) {
        showError('Kamu belum memilih frame!');
        return;
    }
    if (capturedPhotos.length >= 7) {
        showError('Sudah mengambil 7 foto! Pilih 4 foto terbaik.');
        return;
    }
    let resumeGestureAfter = false;
    try {
        if (gestureEnabled) {
            await stopHandGesture();
            resumeGestureAfter = true;
        }
    } catch (e) {}
    ambil.disabled = true;
    timer.disabled = true;
    let timerValue = parseInt(timer.value) || 0;
    for (let i = capturedPhotos.length; i < 7; i++) {
        if (timerValue > 0) {
            await runCountdown(timerValue);
        }
        await capturePhotoAuto();
    }
    ambil.disabled = false;
    timer.disabled = false;
    showPhotoGallery();
    try {
        if (resumeGestureAfter && capturedPhotos.length >= 7) {
            await startHandGesture();
        }
    } catch (e) {}
});
async function capturePhotoAuto() {
    try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.naturalWidth || 1000;
        tempCanvas.height = video.naturalHeight || 576;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(video, 0, 0);
        const photoData = tempCanvas.toDataURL('image/jpeg', 0.8);
        capturedPhotos.push({
            id: Date.now() + Math.random(),
            data: photoData.split(',')[1],
            timestamp: new Date().toISOString()
        });
        updateCanvasPreview();
    } catch (error) {
        console.error('Error capturing photo:', error);
        showError('Gagal mengambil foto');
    }
}
if (closeInstructionsBtn && instructionsModal) {
    closeInstructionsBtn.addEventListener('click', async () => {
        instructionsModal.style.display = 'none';
        await requestCameraPermission();
    });
}
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
document.addEventListener('DOMContentLoaded', () => {
    console.log('SiPhot Photobooth initialized');
    if (!video || !canvas || !ambil || !timer || !simpan || !unduh || !hasil) {
        console.error('Required DOM elements not found');
        showError('Error: Required elements not found');
        return;
    }
    initializeCamera();
    simpan.disabled = true;
    unduh.disabled = true;
    unduh.addEventListener('click', downloadCanvasResult);
    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSession);
    }
});