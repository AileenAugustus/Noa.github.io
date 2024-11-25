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

// 禁用画布默认触摸行为
canvas.style.touchAction = 'none';

// 初始化调色板
function initPalette() {
    const paletteColors = [
        '#FF0000', '#FF7F00', '#FFFF00', '#7FFF00',
        '#00FF00', '#00FF7F', '#00FFFF', '#007FFF',
        '#0000FF', '#7F00FF', '#FF00FF', '#FF007F',
        '#000000', '#FFFFFF'
    ];
    paletteColors.forEach(color => {
        addColorToPalette(color);
    });
}

// 添加颜色到调色板
function addColorToPalette(color) {
    const button = document.createElement('div');
    button.className = 'color-button';
    button.style.backgroundColor = color;
    button.style.width = '30px';
    button.style.height = '30px';
    button.style.display = 'inline-block';
    button.style.margin = '2px';

    button.addEventListener('click', () => {
        selectedColor = color;
    });

    colorPalette.appendChild(button);

    // 自动换行
    if (colorPalette.childElementCount % 15 === 0) {
        const breakLine = document.createElement('div');
        breakLine.style.width = '100%';
        breakLine.style.height = '0';
        colorPalette.appendChild(breakLine);
    }
}

// 开始操作
function startAction(x, y) {
    if (isPickingColor) {
        pickColor(x, y);
        return;
    }
    isPainting = true;

    if (isSmearing) {
        handleSmearing(x, y);
    } else {
        drawCircle(x, y, brushSize, selectedColor);
        colors.push({ x, y, color: selectedColor });
    }
}

// 移动操作
function moveAction(x, y) {
    if (!isPainting) return;

    if (isSmearing) {
        handleSmearing(x, y);
    } else {
        drawCircle(x, y, brushSize, selectedColor);
        colors.push({ x, y, color: selectedColor });
    }
}

// 停止操作
function stopAction() {
    isPainting = false;
}

// 在画布上绘制圆形
function drawCircle(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
}

// 从画布中取色
function pickColor(x, y) {
    const imageData = ctx.getImageData(x, y, 1, 1).data;
    const r = imageData[0];
    const g = imageData[1];
    const b = imageData[2];
    const pickedColor = `rgb(${r}, ${g}, ${b})`;
    selectedColor = pickedColor;

    colorInfo.textContent = `RGB 值: (${r}, ${g}, ${b})`;
    customColorInput.value = rgbToHex(r, g, b);

    isPickingColor = false;
    pickColorButton.textContent = '取色模式: 关';
}

// 涂抹逻辑
function handleSmearing(x, y) {
    const coveredColors = getCoveredColors(x, y);
    const newColor = blendColors(coveredColors, x, y);
    drawCircle(x, y, smearBrushSize, newColor);
}

// 获取笔刷范围内的颜色
function getCoveredColors(x, y) {
    return colors.filter(point => {
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= smearBrushSize;
    });
}

// 混合多种颜色
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

// HEX 转 RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

// RGB 转 HEX
function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// 鼠标事件
canvas.addEventListener('mousedown', (e) => startAction(e.offsetX, e.offsetY));
canvas.addEventListener('mousemove', (e) => moveAction(e.offsetX, e.offsetY));
canvas.addEventListener('mouseup', stopAction);

// 触摸事件
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

// 清空画布
clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    colors = [];
});

// 切换涂抹模式
paintButton.addEventListener('click', () => {
    isSmearing = !isSmearing;
    paintButton.textContent = isSmearing ? '涂抹模式: 开' : '涂抹模式: 关';
});

// 确定选择颜色
confirmColorButton.addEventListener('click', () => {
    const customColor = customColorInput.value;
    selectedColor = customColor;

    const { r, g, b } = hexToRgb(customColor);
    colorInfo.textContent = `RGB 值: (${r}, ${g}, ${b})`;

    addColorToPalette(customColor);
});

// 初始化调色板
initPalette();
