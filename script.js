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
    '#FF0000', // Red
    '#FF7F00', // Orange
    '#FFFF00', // Yellow
    '#7FFF00', // Chartreuse Green
    '#00FF00', // Green
    '#00FF7F', // Spring Green
    '#00FFFF', // Cyan
    '#007FFF', // Azure Blue
    '#0000FF', // Blue
    '#7F00FF', // Violet
    '#FF00FF', // Magenta
    '#FF007F', // Rose
    '#000000', // Black
    '#FFFFFF'  // White
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

// Start painting (coloring or smearing)
canvas.addEventListener('mousedown', (event) => {
    if (isPickingColor) {
        pickColor(event.offsetX, event.offsetY);
        return;
    }

    isPainting = true;
    const x = event.offsetX;
    const y = event.offsetY;

    if (isSmearing) {
        // In smearing mode, no immediate drawing
        handleSmearing(x, y);
    } else {
        // In coloring mode, draw immediately
        drawCircle(x, y, brushSize, selectedColor);
        colors.push({ x, y, color: selectedColor }); // Add color point
    }
});

// Paint or smear while dragging
canvas.addEventListener('mousemove', (event) => {
    if (!isPainting) return;

    const x = event.offsetX;
    const y = event.offsetY;

    if (isSmearing) {
        // Handle smearing logic
        handleSmearing(x, y);
    } else {
        // Draw while dragging
        drawCircle(x, y, brushSize, selectedColor);
        colors.push({ x, y, color: selectedColor });
    }
});

// Stop painting (coloring or smearing)
canvas.addEventListener('mouseup', () => {
    isPainting = false;
});

// Enable smearing mode
paintButton.addEventListener('click', () => {
    isSmearing = !isSmearing;
    paintButton.textContent = isSmearing ? '涂抹模式: 开' : '涂抹模式: 关';
});

// Enable pick color mode
pickColorButton.addEventListener('click', () => {
    isPickingColor = !isPickingColor;
    pickColorButton.textContent = isPickingColor ? '取色模式: 开' : '取色模式: 关';
});

// Handle smearing logic
function handleSmearing(x, y) {
    // Get colors within brush range
    const coveredColors = getCoveredColors(x, y);

    // Blend colors
    const newColor = blendColors(coveredColors, x, y);

    // Draw blended color
    drawCircle(x, y, smearBrushSize, newColor);
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

    // Display the picked color in RGB format
    colorInfo.textContent = `RGB 值: (${r}, ${g}, ${b})`;

    // Show the picked color in the color picker input
    customColorInput.value = rgbToHex(r, g, b);

    isPickingColor = false; // Exit pick color mode
    pickColorButton.textContent = '取色模式: 关';
}

// Update the selected color when "确定" is clicked
confirmColorButton.addEventListener('click', () => {
    const customColor = customColorInput.value;
    selectedColor = customColor;

    // Display the RGB value of the custom color
    const { r, g, b } = hexToRgb(customColor);
    colorInfo.textContent = `RGB 值: (${r}, ${g}, ${b})`;

    // Add the custom color to the palette
    addColorToPalette(customColor);
});

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
    if (colorList.length === 0) return '#ffffff'; // Default to white if no colors found

    let totalWeight = 0;
    let r = 0, g = 0, b = 0;

    colorList.forEach(({ x: cx, y: cy, color }) => {
        const { r: cr, g: cg, b: cb } = hexToRgb(color);

        // Calculate distance from the brush center
        const distance = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);

        // Weight decreases with distance (use exponential decay for smoother effect)
        const weight = Math.exp(-distance / smearBrushSize);

        r += cr * weight;
        g += cg * weight;
        b += cb * weight;
        totalWeight += weight;
    });

    if (totalWeight === 0) return '#ffffff'; // Prevent division by zero

    r = Math.round(r / totalWeight);
    g = Math.round(g / totalWeight);
    b = Math.round(b / totalWeight);

    return `rgb(${r}, ${g}, ${b})`;
}

// Clear the canvas
clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    colors = []; // Reset the colors array
});

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

// Initialize the palette
initPalette();
