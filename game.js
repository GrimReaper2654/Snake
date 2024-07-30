// get keypress events
let keyboard = {};
window.onkeyup = function(e) {
    keyboard[e.key.toLowerCase()] = false; 
}
window.onkeydown = function(e) {
    keyboard[e.key.toLowerCase()] = true; 
}

function randint(min, max) { 
    if (max - min < 1) {
        return min;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clearCanvas(canvas, start, size) {
    var c = document.getElementById(canvas);
    var ctx = c.getContext("2d");
    ctx.clearRect(start.x, start.y, size.x, size.y);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function drawPolygon(canvas, points, offset, style, debug=false) {
    if (points.length < 3) {
        console.error(`Error: Polygon needs minimum 3 points.`);
        return;
    }
    var c = document.getElementById(canvas);
    var ctx = c.getContext("2d");
    ctx.beginPath();

    // go to first point
    ctx.moveTo(points[0].x + offset.x, points[0].y + offset.y);
    if (debug) displaytxt(`(${Math.round(points[0].x + offset.x)}, ${Math.round(points[0].y + offset.y)})`, {x: points[0].x + offset.x, y: points[0].y + offset.y});

    // draw the polygon
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x + offset.x, points[i].y + offset.y);
        if (debug) displaytxt(`(${Math.round(points[i].x + offset.x)}, ${Math.round(points[i].y + offset.y)})`, {x: points[i].x + offset.x, y: points[i].y + offset.y});
    }
    ctx.closePath();

    // colour the polygon
    if (style.fill) {
        ctx.fillStyle = style.fill;
        ctx.fill();
    }
    if (style.stroke) {
        ctx.lineWidth = style.width? style.width : 1;
        ctx.strokeStyle = style.colour;
        ctx.stroke();
    }
}

function drawLine(canvas, pos, r, length, style) {
    var c = document.getElementById(canvas);
    var ctx = c.getContext("2d");
    if (style) {
        ctx.strokeStyle = style.colour;
        ctx.lineWidth = style.width;
    }
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + length * Math.cos(r), pos.y + length * Math.sin(r));
    ctx.stroke();
}

function grid(spacing, start={x: 0, y: 0}, end={x: 800, y: 800}) {
    for (let i = Math.max(start.x, 0); i <= Math.min(end.x, 800); i += spacing) {
        drawLine('game', {x: i, y: 0}, Math.PI/2, 800, {colour:'rgba(220,220,220,1)',width:2});
    }
    for (let i = Math.max(start.y, 0); i <= Math.min(end.y, 800); i += spacing) {
        drawLine('game', {x: 0, y: i}, 0, 800, {colour:'rgba(220,220,220,1)',width:2});
    }
}

function absolutePos(pos) { // convert tiles to pixels
    return {x: pos.x*10, y: pos.y*10};
}

function vMath(v1, v2, opperation) { 
    switch (opperation) {
        case '+': 
            return {x: v1.x+v2.x, y: v1.y+v2.y};
        case '-': 
            return {x: v1.x-v2.x, y: v1.y-v2.y};
        default:
            console.error(`Unknown vertor opperation: ${opperation}`);
    }
}

function generateApple(snake, evil=true) {
    if (evil) {
        let apple = {x: 0, y: 0};
        if (randint(0,5)) {
            if (snake[i].x > 59) apple.x = randint(0,19);
            else if (snake[i].x < 20) apple.x = randint(60,79);
            else apple.x = randint(0,79);
            if (snake[i].y > 59) apple.y = randint(0,19);
            else if (snake[i].y < 20) apple.y = randint(60,79);
            else apple.y = randint(0,79);
        }
        else apple = {x: randint(0,1)*79, y: randint(0,1)*79};
        let success = true;
            for (let i = 0; i < snake.length; i++) {
                if (apple.x == snake[i].x && apple.y == snake[i].y) {
                    success = false
                    break;
                }
            }
            if (success) return apple;
            else return generateApple(snake, false);
            
    }
    return {x: randint(0,79), y: randint(0,79)};
}

async function game() {
    const square = [
        {x: 0, y: 0},
        {x: 10, y: 0},
        {x: 10, y: 10},
        {x: 0, y: 10},
    ];
    const colours = {
        snake: {
            fill: 'rgba(0,255,0,1)',
            stroke: false,
        },
        apple: {
            fill: 'rgba(255,0,0,1)',
            stroke: false,
        },
    };
    let snake = [
        {x: -1, y: 0},
        {x: 0, y: 0},
        {x: 1, y: 0},
    ]; 
    let speed = 7;
    let headding = 'E'; // uses cardinal directions N E S W
    let apple = {x: randint(10,79), y: randint(10,79)}; // apple can't spawn near snake at the start

    // set up game
    document.getElementById('startButton').innerHTML = `<button><h3>Game Started</h3></button>`;
    document.getElementById('gameOver').style.display = 'none';
    clearCanvas('game', {x: 0, y: 0}, {x: 800, y: 800}); 
    drawPolygon('game', square, absolutePos(apple), colours.apple);
    for (let i = 0; i < snake.length; i++) {
        drawPolygon('game', square, absolutePos(snake[i]), colours.snake);
    }
    //grid(10);

    // main game loop
    let t = 0;
    let newHeadding = headding;
    while (true) {
        // handle inputs
        if ((keyboard.w || keyboard.arrowup) && headding != 'S') {
            newHeadding = 'N';
            keyboard.w = false;
            keyboard.arrowup = false;
        } else if ((keyboard.a || keyboard.arrowleft) && headding != 'E') {
            newHeadding = 'W';
            keyboard.a = false;
            keyboard.arrowleft = false;
        } else if ((keyboard.s || keyboard.arrowdown) && headding != 'N') {
            newHeadding = 'S';
            keyboard.s = false;
            keyboard.arrowdown = false;
        } else if ((keyboard.d || keyboard.arrowright) && headding != 'W') {
            newHeadding = 'E';
            keyboard.d = false;
            keyboard.arrowright = false;
        }
        if (t%speed == 0) { // handle physics
            // move snake
            headding = newHeadding;
            let newHead = JSON.parse(JSON.stringify(snake[snake.length-1])); // deep copy the old snake head
            switch (headding) {
                case 'N':
                    newHead.y--;
                    break;
                case 'E':
                    newHead.x++;
                    break;
                case 'S':
                    newHead.y++;
                    break;
                case 'W':
                    newHead.x--;
                    break;
                default:
                    console.error(`Unknown headding: ${headding}`);
                    return;
            }

            // check if dead
            if (newHead.x < 0 || newHead.x > 79) break;
            if (newHead.y < 0 || newHead.y > 79) break;
            let selfCollision = false
            for (let i = 0; i < snake.length; i++) {
                if (newHead.x == snake[i].x && newHead.y == snake[i].y) {
                    selfCollision = true;
                    break;
                }
            }
            if (selfCollision) break;
            // check if apple eaten and shorten snake
            if ((apple.x != newHead.x || apple.y != newHead.y)) {
                // didn't eat apple, remove last snake segment
                let toRemove = snake.shift();
                if (toRemove) {
                    clearCanvas('game', absolutePos(toRemove), {x: 10, y: 10}); 
                    
                }
            } else {
                // did eat apple, create new apple
                apple = generateApple(snake);
                if (snake.length == 4) speed = 6;
                if (snake.length == 9) speed = 5;
                if (snake.length == 19) speed = 4;
                if (snake.length == 29) speed = 3;
                if (snake.length == 49) speed = 2;
                if (snake.length == 99) speed = 1;
                console.log(speed);
                drawPolygon('game', square, absolutePos(apple), colours.apple);
                grid(10, absolutePos(apple), absolutePos(vMath(apple, {x: 1, y: 1}, '+')));
            }

            // Draw grid only around snake
            let start = {x: 79, y: 79};
            let end = {x: 0, y: 0};
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x < start.x) start.x = snake[i].x;
                if (snake[i].y < start.y) start.y = snake[i].y;
                if (snake[i].x > end.x) end.x = snake[i].x;
                if (snake[i].y > end.y) end.y = snake[i].y;
            }
            start = absolutePos(vMath(start, {x: 1, y: 1}, '-'));
            end = absolutePos(vMath(end, {x: 2, y: 2}, '+'));
            grid(10, start, end);

            drawPolygon('game', square, absolutePos(newHead), colours.snake);
            snake.push(newHead);
        }
        t++;
        await sleep(100/6);
    }
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('startButton').innerHTML = `<button onclick="game()"><h3>Start Game</h3></button>`;
}
