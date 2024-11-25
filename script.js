const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const paintButton = document.getElementById('paintButton');
const colorPalette = document.getElementById('colorPalette');

// 创建清空画布按钮
const clearButton = document.createElement('button');
clearButton.textContent = '清空画布';
clearButton.style.marginLeft = '10px';
document.getElementById('toolbar').appendChild(clearButton);

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

// 显示颜色信息的容器
const colorInfo = document.createElement('div');
colorInfo.textContent = 'RGB 值: ';
colorInfo.style.marginTop = '10px';
document.body.appendChild(colorInfo);

let brushSize = 15; // Default brush size for coloring
let smearBrushSize = 90; // Default brush size for smearing
let selectedColor = '#000000'; // Default selected color
let isPainting = false; // Whether painting (coloring) is active
let isSmearing = false; // Smearing mode

// 存储画布颜色的二维数组
const colorMatrix = Array(canvas.width)
    .fill(null)
    .map(() => Array(canvas.height).fill('#FFFFFF')); // Default white

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

// 绘制矩阵中所有颜色
function drawColorMatrix() {
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            ctx.fillStyle = colorMatrix[x][y];
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

// 涂抹模式逻辑：更新矩阵中的颜色
function handleSmearing(x, y) {
    for (let i = -smearBrushSize; i <= smearBrushSize; i++) {
        for (let j = -smearBrushSize; j <= smearBrushSize; j++) {
            const dx = x + i;
            const dy = y + j;

            if (
                dx >= 0 &&
                dx < canvas.width &&
                dy >= 0 &&
                dy < canvas.height &&
                Math.sqrt(i ** 2 + j ** 2) <= smearBrushSize
            ) {
                const currentColor = colorMatrix[dx][dy];
                const blendedColor = blendColors(currentColor, selectedColor);
                colorMatrix[dx][dy] = blendedColor;
            }
        }
    }
    drawColorMatrix();
}

// 混合两个颜色
function blendColors(color1, color2) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    const r = Math.round((c1.r + c2.r) / 2);
    const g = Math.round((c1.g + c2.g) / 2);
    const b = Math.round((c1.b + c2.b) / 2);

    return rgbToHex(r, g, b);
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
canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    const x = Math.floor(e.offsetX);
    const y = Math.floor(e.offsetY);

    if (isSmearing) {
        handleSmearing(x, y);
    } else {
        colorMatrix[x][y] = selectedColor;
        drawColorMatrix();
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!isPainting) return;

    const x = Math.floor(e.offsetX);
    const y = Math.floor(e.offsetY);

    if (isSmearing) {
        handleSmearing(x, y);
    } else {
        colorMatrix[x][y] = selectedColor;
        drawColorMatrix();
    }
});

canvas.addEventListener('mouseup', () => {
    isPainting = false;
});

// 清空画布
clearButton.addEventListener('click', () => {
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            colorMatrix[x][y] = '#FFFFFF';
        }
    }
    drawColorMatrix();
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
drawColorMatrix();
