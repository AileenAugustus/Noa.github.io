const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPalette = document.getElementById('colorPalette');
const paintButton = document.getElementById('paintButton');

// 创建清空画布按钮
const clearButton = document.createElement('button');
clearButton.textContent = '清空画布';
clearButton.style.marginLeft = '10px';
document.getElementById('toolbar').appendChild(clearButton);

// 创建取色按钮
const pickColorButton = document.createElement('button');
pickColorButton.textContent = '取色功能';
pickColorButton.style.marginLeft = '10px';
document.getElementById('toolbar').appendChild(pickColorButton);

// 创建颜色选择器
const customColorInput = document.createElement('input');
customColorInput.type = 'color';
customColorInput.style.marginLeft = '10px';
document.getElementById('toolbar').appendChild(customColorInput);

// 创建“确定”按钮
const confirmColorButton = document.createElement('button');
confirmColorButton.textContent = '确定';
confirmColorButton.style.marginLeft = '5px';
document.getElementById('toolbar').appendChild(confirmColorButton);

// 显示取色信息的容器
const colorInfo = document.createElement('div');
colorInfo.textContent = 'RGB 值: ';
colorInfo.style.marginTop = '10px';
document.body.appendChild(colorInfo);

let brushSize = 15; // Default brush size for coloring
let smearBrushSize = 90; // Default brush size for smearing
let selectedColor = '#000000'; // Default selected color
let isPainting = false; // Whether painting (coloring) is active
let isSmearing = false; // Smearing mode
let isPickingColor = false; // Whether picking color
let colors = []; // Store placed colors on the canvas

// Define 14 colors (12 from the color wheel + black and white)
const paletteColors = [
    '#FF0000', '#FF7F00', '#FFFF00', '#7FFF00',
    '#00FF00', '#00FF7F', '#00FFFF', '#007FFF',
    '#0000FF', '#7F00FF', '#FF00FF', '#FF007F',
    '#000000', '#FFFFFF'
];

// Initialize color palette
function initPalette() {
    paletteColors.forEach(color => {
        addColorToPalette(color);
    });
}

// Add a color to the palette
function addColorToPalette(color) {
    const button = document.createElement('div');
    button.className = 'color-button';
    button.style.backgroundColor = color;
    button.style.width = '30px';
    button.style.height = '30px';
    button.style.display = 'inline-block';
    button.style.margin = '2px';

    // Click to select a color
    button.addEventListener('click', () => {
        selectedColor = color;
    });

    colorPalette.appendChild(button);

    // Handle wrapping when more than 15 colors in a row
    if (colorPalette.childElementCount % 15 === 0) {
        const breakLine = document.createElement('div');
        breakLine.style.width = '100%';
        breakLine.style.height = '0';
        colorPalette.appendChild(breakLine);
    }
}

// Start painting or picking color
function startAction(x, y) {
    if (isPickingColor) {
        pickColor(x, y);
        return;
    }
    isPainting = true;

    if (isSmearing) {
        // Smearing mode
        handleSmearing(x, y);
    } else {
        // Coloring mode
        drawCircle(x, y, brushSize, selectedColor);
        colors.push({ x, y, color: selectedColor });
    }
}

// Paint or smear while moving
function moveAction(x, y) {
    if (!isPainting) return;

    if (isSmearing) {
        // Smearing mode
        handleSmearing(x, y);
    } else {
        // Coloring mode
        drawCircle(x, y, brushSize, selectedColor);
        colors.push({ x, y, color: selectedColor });
    }
}

// Stop painting or smearing
function stopAction() {
    isPainting = false;
}

// Draw a circle on the canvas
function drawCircle(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
}

// Pick a color from the canvas
function pickColor(x, y) {
    const imageData = ctx.getImageData(x, y, 1, 1).data;
    const r = imageData[0];
    const g = imageData[1];
    const b = imageData[2];
    const pickedColor = `rgb(${r}, ${g}, ${b})`;
    selectedColor = pickedColor;

    // Display the RGB value of the picked color
    colorInfo.textContent = `RGB 值: (${r}, ${g}, ${b})`;

    // Show the picked color in the color picker input
    customColorInput.value = rgbToHex(r, g, b);

    isPickingColor = false;
    pickColorButton.textContent = '取色模式: 关';
}

// Handle smearing logic
function handleSmearing(x, y) {
    const coveredColors = getCoveredColors(x, y);
    const newColor = blendColors(coveredColors, x, y);
    drawCircle(x, y, smearBrushSize, newColor);
}

// Get colors covered by the brush
function getCoveredColors(x, y) {
    return colors.filter(point => {
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= smearBrushSize;
    });
}

// Blend multiple colors with distance-based weighting
function blendColors(colorList, x, y) {
    if (colorList.length === 0) return '#ffffff';

    let totalWeight = 0;
    let r = 0, g = 0, b = 0;

    colorList.forEach(({ x: cx, y: cy, color }) => {
        const { r: cr, g: cg, b: cb } = hexToRgb(color);
        const distance = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
        const weight = Math.exp(-distance / smearBrushSize);

        r += cr * weight;
        g += cg * weight;
        b += cb * weight;
        totalWeight += weight;
    });

    if (totalWeight === 0) return '#ffffff';
    r = Math.round(r / totalWeight);
    g = Math.round(g / totalWeight);
    b = Math.round(b / totalWeight);

    return `rgb(${r}, ${g}, ${b})`;
}

// Convert HEX to RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

// Convert RGB to HEX
function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Event listeners for mouse and touch
canvas.addEventListener('mousedown', (e) => startAction(e.offsetX, e.offsetY));
canvas.addEventListener('mousemove', (e) => moveAction(e.offsetX, e.offsetY));
canvas.addEventListener('mouseup', stopAction);

canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    startAction(touch.clientX - rect.left, touch.clientY - rect.top);
    e.preventDefault();
});
canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    moveAction(touch.clientX - rect.left, touch.clientY - rect.top);
    e.preventDefault();
});
canvas.addEventListener('touchend', stopAction);

// Initialize palette and buttons
initPalette();

