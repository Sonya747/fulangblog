"use strict";
const main = () => {
    "use strict";
    const canvasWrap = document.getElementById("canvas-wrap")
    canvasWrap.setAttribute('tabindex', '0');

    const backgroundCanvas = document.getElementById('background');
    const snakeCanvas = document.getElementById('snake');
    const foodCanvas = document.getElementById('food');
    const gameStateEnum = {
        RUNNING: 0, PAUSE: 1, STOP: 2,//STOP为撞边，PAUSE为鼠标；stop后要刷新
    }
    if (!(backgroundCanvas.getContext)) return;
    let backCtx = backgroundCanvas.getContext('2d');
    let snakeCtx = snakeCanvas.getContext('2d');
    let foodCtx = foodCanvas.getContext('2d');
    let interval;
    let gameState = true; //鼠标控制


    const gridSize = 20;//方格大小
    let cols = null;
    let rows = null;
    // 方向常量
    const DIRECTIONS = {
        LEFT: {x: -1, y: 0},
        RIGHT: {x: 1, y: 0},
        UP: {x: 0, y: -1},
        DOWN: {x: 0, y: 1}
    };

    const awaitRefresh = async (time) => {
        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                if (gameState === gameStateEnum.PAUSE) reject(new Error("game paused"))
                else resolve();
            }, time);
        });
    }

    class Snake {
        length = 5;
        head = {x: 0, y: 0};
        body = [];
        direction = {x: 0, y: 1}

        constructor() {
            this.resetSnake()
        }

        resetSnake() {
            this.head = getRandomGrid(5);
            this.length = 5;
            if (this.body.length > 0) this.body = [];
            //身体向初始化的同侧伸展,方向指向初始化的对侧
            const isXDirection = Math.random() > 0.5; // true: x方向; false: y方向
            if (isXDirection) {
                // 判断蛇头是否在右侧
                const isOnRightSide = this.head.x * 2 > background.width / gridSize;
                this.direction = isOnRightSide ? DIRECTIONS.LEFT : DIRECTIONS.RIGHT;
            } else {
                // 判断蛇头是否在下侧
                const isOnBottomSide = this.head.y * 2 > background.height / gridSize;
                this.direction = isOnBottomSide ? DIRECTIONS.UP : DIRECTIONS.DOWN;
            }
            //身体
            const extendDirection = {x: this.direction.x * (-1), y: this.direction.y * (-1)}
            for (let i = 1; i <= this.length; i++) {
                this.body.push({
                    x: this.head.x + extendDirection.x * i,
                    y: this.head.y + extendDirection.y * i
                });
            }
        }

        setDirection({x: x, y: y}) {
            this.direction = {x: x, y: y};
        }

        //返回尾部坐标
        move() {
            this.body.unshift(this.head)
            this.head = {x: this.head.x + this.direction.x, y: this.head.y + this.direction.y}
            //检查食物坐标与头坐标重合
            return this.body.pop();
        }

        addLength() {
            let tail = this.body[this.length - 1];
            this.body.push({x: tail.x - this.direction.x, y: tail.y - this.direction.y});
            this.length += 1;
        }
    }

    class Food {
        position = {x: 0, y: 0};

        constructor() {
            this.resetFood()

        }

        resetFood() {
            this.position = getRandomGrid(5)
        }
    }

    /**
     * 随机选取一个格子,可用于刷新食物或蛇位置
     * margin: 初始化应排除的四周格子
     */
    const getRandomGrid = (margin = 0) => {
        return ({
            x: Math.floor(Math.random() * (cols - 2 * margin)) + margin,
            y: Math.floor(Math.random() * (rows - 2 * margin)) + margin
        });
    }

    function drawGrid() {
        
        const gradient = backCtx.createLinearGradient(0, 0, backgroundCanvas.width, backgroundCanvas.height);
        gradient.addColorStop(0, '#fff1eb');
        gradient.addColorStop(1, '#ace0f9');
        backCtx.fillStyle = gradient;
        backCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
        // drawBackGround()
        backCtx.strokeStyle = '#444';
        // for (let i = 0; i < cols; i++) {
        //     for (let j = 0; j < rows; j++) {
        //         backCtx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
        //     }
        // }
    }

    const initCanvas = () => {
        // 获取设备像素比
        const devicePixelRatio = window.devicePixelRatio || 1;
        // 获取CSS宽高
        const styleWidth = backgroundCanvas.clientWidth;
        const styleHeight = backgroundCanvas.clientHeight;

        // 设置画布的实际绘图分辨率
        backgroundCanvas.width = styleWidth * devicePixelRatio;
        backgroundCanvas.height = styleHeight * devicePixelRatio;
        snakeCanvas.width = backgroundCanvas.width;
        snakeCanvas.height = backgroundCanvas.height;
        foodCanvas.width = backgroundCanvas.width;
        foodCanvas.height = backgroundCanvas.height;
        // 缩放绘图上下文以适配设备像素比
        backCtx.scale(devicePixelRatio, devicePixelRatio);
        snakeCtx.scale(devicePixelRatio, devicePixelRatio);
        foodCtx.scale(devicePixelRatio, devicePixelRatio);
        cols = Math.floor(styleWidth / gridSize);
        rows = Math.floor(styleHeight / gridSize);

    }

    const drawRect = (ctx, {x: x, y: y}) => {
        ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
    }

    const moveRect = (ctx, {x, y}) => {
        ctx.clearRect(x * gridSize, y * gridSize, gridSize, gridSize);

    }

    const checkEat = () => {
        return snake.head.x === food.position.x && snake.head.y === food.position.y;
    }
    const checkSide = () => {
        return snake.head.x > cols || snake.head.y > rows || snake.head.x < 0 || snake.head.y < 0;
    }

    const handleKeyboardInput = (e) => {
        if (gameState !== gameStateEnum.RUNNING) {
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                snake.setDirection(DIRECTIONS.DOWN);
                break;
            case 'ArrowUp':
                e.preventDefault()
                snake.setDirection(DIRECTIONS.UP);
                break;
            case 'ArrowLeft':
                e.preventDefault()
                snake.setDirection(DIRECTIONS.LEFT);
                break;
            case 'ArrowRight':
                e.preventDefault()
                snake.setDirection(DIRECTIONS.RIGHT);
                break;
        }
    }

    const handleClick = () => {
        if (gameState === gameStateEnum.STOP) {
            gameState = gameStateEnum.PAUSE;
            return;
        }
        if (gameState === gameStateEnum.RUNNING) {
            pauseGame()
        } else {
            reStartGameLoop();
        }
    }


    function startGameLoop() {
        canvasWrap.focus();//聚焦元素，否则无法监听到鼠标事件
        gameState = gameStateEnum.RUNNING;
        canvasWrap.addEventListener('keydown', e => handleKeyboardInput(e));
        canvasWrap.addEventListener('click', e => handleClick());
        interval = setInterval(() => {
            drawMoving();
        }, 100);
    }

    const reStartGameLoop = () => {
        if (gameState === gameStateEnum.RUNNING) {
            console.log("运行时调用了resart！重复挂载");
            return;
        }
        gameState = gameStateEnum.RUNNING;
        interval = setInterval(() => {
            drawMoving();
        }, 100);
    }


    //撞边触发
    async function stopGameLoop() {
        gameState = gameStateEnum.STOP;
        //停顿
        await awaitRefresh(1000).then(() => {
            clearView();
            //重新开始
            resetStatus();
            clearInterval(interval);
            reStartGameLoop();
        }).catch((err) => {
                console.log(err);
                pauseGame();
            }
        )

    }

    //鼠标触发
    function pauseGame() {
        gameState = gameStateEnum.PAUSE;
        clearInterval(interval);
    }


    function clearView() {
        foodCtx.clearRect(0, 0, foodCanvas.width, foodCanvas.height);
        snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    }

    function resetStatus() {
        snake.resetSnake();
        food.resetFood();
    }


    const drawSake = function () {
        snakeCtx.fillStyle = '#6699CC';
        drawRect(snakeCtx, {x: snake.head.x, y: snake.head.y})
        snake.body.forEach(({x: x, y: y}) => {
            drawRect(snakeCtx, {x: x, y: y})
        })
    }
    const drawFood = function () {
        foodCtx.fillStyle = '#FF9999';
        drawRect(foodCtx, {x: food.position.x, y: food.position.y});
    }
    const drawMoving = () => {
        //only draw when the state is running
        if (gameState !== gameStateEnum.RUNNING) return;
        drawSake()
        drawFood()
        let tail = snake.move();
        if (checkSide()) {
            stopGameLoop();
            return;
        }
        if (checkEat()) {
            moveRect(foodCtx, food.position);
            snake.addLength();
            food.resetFood()
        }
        moveRect(snakeCtx, tail)
    }
    let snake = new Snake();
    let food = new Food();
    initCanvas()
    drawGrid()
    startGameLoop();


}

