const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasWrap = document.getElementById('canvasWrap');
const colorPicker = document.getElementById('colorPicker');
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
const pencilTool = document.getElementById('pencilTool');
const eraserTool = document.getElementById('eraserTool');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const coordDisplay = document.getElementById('coordDisplay');

let isDrawing = false;
let currentTool = 'pencil';
let lastX = 0;
let lastY = 0;

// History for undo/redo
let history = [];
let historyStep = -1;

function initCanvas() {
    canvas.width = canvasWrap.clientWidth;
    canvas.height = canvasWrap.clientHeight;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill background with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    saveState();
}

function saveState() {
    historyStep++;
    if (historyStep < history.length) {
        history.length = historyStep;
    }
    history.push(canvas.toDataURL());
    updateHistoryButtons();
}

function updateHistoryButtons() {
    undoBtn.disabled = historyStep <= 0;
    redoBtn.disabled = historyStep >= history.length - 1;
    undoBtn.style.opacity = undoBtn.disabled ? '0.3' : '1';
    redoBtn.style.opacity = redoBtn.disabled ? '0.3' : '1';
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = getCoordinates(e);
}

function draw(e) {
    if (!isDrawing) return;

    const [x, y] = getCoordinates(e);
    coordDisplay.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);

    if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // Content doesn't matter for destination-out
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = colorPicker.value;
    }

    ctx.lineWidth = sizeSlider.value;
    ctx.stroke();

    [lastX, lastY] = [x, y];
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveState();
    }
}

function getCoordinates(e) {
    let clientX, clientY;
    if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    return [
        clientX - rect.left,
        clientY - rect.top
    ];
}

// Tool switching
pencilTool.addEventListener('click', () => {
    currentTool = 'pencil';
    pencilTool.classList.add('active');
    eraserTool.classList.remove('active');
});

eraserTool.addEventListener('click', () => {
    currentTool = 'eraser';
    eraserTool.classList.add('active');
    pencilTool.classList.remove('active');
});

// UI controls
sizeSlider.addEventListener('input', () => {
    sizeValue.textContent = sizeSlider.value;
});

clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the entire canvas?')) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
    }
});

undoBtn.addEventListener('click', () => {
    if (historyStep > 0) {
        historyStep--;
        loadState(history[historyStep]);
    }
});

redoBtn.addEventListener('click', () => {
    if (historyStep < history.length - 1) {
        historyStep++;
        loadState(history[historyStep]);
    }
});

function loadState(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        updateHistoryButtons();
    };
}

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'sketch.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', stopDrawing);

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
}, { passive: false });

canvas.addEventListener('touchend', stopDrawing);

// Window resize
window.addEventListener('resize', () => {
    // Preserve content on resize
    const tempImg = canvas.toDataURL();
    canvas.width = canvasWrap.clientWidth;
    canvas.height = canvasWrap.clientHeight;

    const img = new Image();
    img.src = tempImg;
    img.onload = () => {
        ctx.drawImage(img, 0, 0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    };
});

// Initialize
window.onload = initCanvas;
