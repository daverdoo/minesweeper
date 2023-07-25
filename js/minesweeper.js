let board = [];
let initialized = false;
let gameover = false;
let flagCount = 0;
let elapsedTime;
let interval;
let visibleCellCount = 0;
let paused = false;
let explodedCell;

const ROW_COUNT = 16;
const COL_COUNT = 30;
const NUM_MINES = 100;
const EMPTY_CELL_COUNT = (COL_COUNT * ROW_COUNT) - NUM_MINES;

window.addEventListener('load', (event) => {
    resetGame();
    const modal = document.querySelector(".modal");
    const overlay = document.querySelector(".overlay");
    const openModalBtn = document.querySelector(".btn-open");
    const closeModalBtn = document.querySelector(".btn-close");

    const openModal = function () {
        generateHighScoreText();
        modal.classList.remove("hidden");
        overlay.classList.remove("hidden");
    };

    openModalBtn.addEventListener("click", openModal);

    const closeModal = function () {
        modal.classList.add("hidden");
        overlay.classList.add("hidden");
    };

    closeModalBtn.addEventListener("click", closeModal);

    initializeAnimation();
});

window.addEventListener("blur", (event) => {
    if (!paused && !gameover && interval) {
        pauseGame();
    }
});

function generateHighScoreText() {
    let thisDiv = document.getElementById("highscore-text");
    thisDiv.innerHTML = "";

    let highScores = getHighScores();

    const center = document.createElement("center");
    const title = document.createElement("h2");
    title.textContent = 'MineSweeper Top Times'
    thisDiv.appendChild(title);
    const tbl = document.createElement("table");
    tbl.className = 'highscore-table';
    const tblBody = document.createElement("tbody");

    for (let i = 0; i < 20; i++) {
        const tblRow = document.createElement("tr");
        const tblCol1 = document.createElement("td");
        const tblCol2 = document.createElement("td");

        tblCol1.textContent = "#" + (i + 1) + "";

        if (!highScores[i]) {
            tblCol2.textContent = "__:__"
        } else {
            tblCol2.textContent = msToTime(highScores[i]);
        }

        tblRow.appendChild(tblCol1);
        tblRow.appendChild(tblCol2);
        tblBody.appendChild(tblRow);
    }

    tbl.appendChild(tblBody);
    center.appendChild(tbl);
    thisDiv.appendChild(center);
}

function resetGame() {
    explodedCell = undefined;
    stopTimer();
    clearMessage();
    resetPauseButton();
    let thisDiv = document.getElementById("minefield");

    thisDiv.innerHTML = "";

    let timerDiv = document.getElementById("timer");

    timerDiv.innerHTML = "";

    let timerText = document.createTextNode("Time: 00:00");

    timerDiv.appendChild(timerText);

    gameover = false;
    initialized = false;
    flagCount = 0;
    visibleCellCount = 0;
    elapsedTime = undefined;

    createBoard();
    generateTable();
    updateFlagCount();
}

function startTimer() {
    updatePauseButton(false);

    let thisDiv = document.getElementById("timer");

    interval = setInterval(() => {
        if (!elapsedTime) {
            elapsedTime = 0;
        }

        elapsedTime += 1000;

        if (gameover) {
            stopTimer();
        }

        thisDiv.innerHTML = "";

        timerText = document.createTextNode(msToTime(elapsedTime, true));

        thisDiv.appendChild(timerText);
    }, 1000);
}

function pauseGame() {
    if (gameover || !initialized) {
        return;
    }

    if (!paused) {
        clearInterval(interval);
        interval = undefined;
        updatePauseButton(true);
        paused = true;
    } else {
        startTimer();
        updatePauseButton(false);
        paused = false;
    }
    generateTable();
}

function updatePauseButton(pause) {
    let thisButton = document.getElementById("pause-button");
    thisButton.addEventListener("onclick", pauseGame);
    if (pause) {
        paused = true;
        thisButton.setAttribute("src","img/play.png");
    } else {
        thisButton.setAttribute("src","img/pause.png");
    }
    thisButton.setAttribute("style","opacity:1; -moz-opacity:1; filter:alpha(opacity=1)");
}

function resetPauseButton() {
    paused = false;
    let thisButton = document.getElementById("pause-button");
    thisButton.setAttribute("style","opacity:0.5; -moz-opacity:0.5; filter:alpha(opacity=50)");
    thisButton.removeEventListener("onclick", pauseGame);
}

function stopTimer() {
    if (interval) {
        clearInterval(interval);
        interval = undefined;
        resetPauseButton();
    }
}

function msToTime(duration, showLabel) {
    var seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor(duration / (1000 * 60));

    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    let retVal = minutes + ":" + seconds;

    if (showLabel) {
        retVal = "Time: " + retVal;
    }

    return retVal;
}

function createBoard() {
    for (let row = 0; row < ROW_COUNT; row++) {
        board[row] = [];
        for (let col = 0; col < COL_COUNT; col++) {
            board[row][col] = { mined: false, nearCount: 0, visible: false, flagged: false, row: row, col: col };
        }
    }
}

function plantMines(row, col, mineCount) {
    let rowStart = row > 0 ? row - 1 : 0;
    let rowEnd = row + 2 < ROW_COUNT ? row + 2 : ROW_COUNT;
    let colStart = col > 0 ? col - 1 : 0;
    let colEnd = col + 2 < COL_COUNT ? col + 2 : COL_COUNT;

    let count = 0;

    while (count < mineCount) {
        let newRow = Math.floor(Math.random() * ROW_COUNT);
        let newCol = Math.floor(Math.random() * COL_COUNT);

        if (!board[newRow][newCol].mined) {
            if (!(newRow >= rowStart && newRow <= rowEnd && newCol >= colStart && newCol <= colEnd)) {
                board[newRow][newCol].mined = true;
                count++;
            }
        }
    }
}

function calculateNearCount() {
    for (let row = 0; row < ROW_COUNT; row++) {
        for (let col = 0; col < COL_COUNT; col++) {
            let cell = board[row][col];
            cell.nearCount = findNearCount(row, col);
        }
    }
}

function findNearCount(row, col) {
    if (board[row][col].mined) {
        return -1;
    }

    let nearCount = 0;
    let rowStart = row > 0 ? row - 1 : 0;
    let rowEnd = row + 2 < ROW_COUNT ? row + 2 : ROW_COUNT;
    let colStart = col > 0 ? col - 1 : 0;
    let colEnd = col + 2 < COL_COUNT ? col + 2 : COL_COUNT;

    let cellCount = 0;
    for (let i = rowStart; i < rowEnd; i++) {
        for (let j = colStart; j < colEnd; j++) {
            cellCount++;
            if (row == i && col == j) {
                continue;
            }
            if (board[i][j].mined) {
                nearCount++;
            }
        }
    }

    return nearCount;
}

function generateTable() {
    let thisDiv = document.getElementById("minefield");

    thisDiv.innerHTML = "";

    const tbl = document.createElement("table");
    const tblBody = document.createElement("tbody");

    tbl.id = 'tbl';
    tbl.addEventListener("contextmenu", function (event) {
        event.preventDefault();
    });

    tblBody.id = 'tblBody';

    for (let i = 0; i < board.length; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < board[i].length; j++) {
            const cell = document.createElement("td");
            cell.className = 'cell';
            if (paused) {
                const image = document.createElement("img");
                image.id = "img_" + i + "_" + j;
                image.setAttribute("src", "img/hidden.png");
                image.setAttribute("draggable", false);
                cell.appendChild(image);
            } else {
                const link = document.createElement("a");
                link.addEventListener("click", function () {
                    handleCellClick(i, j);
                });
                link.addEventListener("contextmenu", function (event) {
                    event.preventDefault();
                    handleRightClick(i, j);
                });
                const image = document.createElement("img");
                image.id = "img_" + i + "_" + j;
                image.setAttribute("draggable", false);
                image.setAttribute("src", getImage(board[i][j]));
                link.appendChild(image);
                cell.appendChild(link);
            }

            row.appendChild(cell);
        }

        tblBody.appendChild(row);
    }

    tbl.appendChild(tblBody);

    thisDiv.appendChild(tbl);

    tbl.setAttribute("border", "0");
}

function handleRightClick(row, col) {
    if (board[row][col].visible) {
        return;
    }

    if (board[row][col].flagged) {
        board[row][col].flagged = false;
        flagCount--;
    } else {
        board[row][col].flagged = true;
        flagCount++;
    }

    generateTable();

    updateFlagCount();
}

function handleCellClick(row, col) {
    if (board[row][col].flagged) {
        return;
    }

    if (board[row][col].visible) {
        if (board[row][col].nearCount > 0) {
            let flagCount = countAdjacentFlags(row, col);

            if (flagCount == board[row][col].nearCount) {
                revealAdjacentCells(row, col, false);
            }
        }
    } else {
        if (!initialized) {
            plantMines(row, col, NUM_MINES);
            calculateNearCount();
            initialized = true;
            startTimer();
        }

        revealCell(row, col);
    }
}

function revealCell(row, col, skipMined, skipSuccessCheck) {
    if (board[row][col].visible) {
        return;
    }

    if (board[row][col].flagged) {
        return;
    }

    board[row][col].visible = true;

    visibleCellCount++;

    if (!gameover) {
        if (!skipMined && board[row][col].mined) {
            stopTimer();
            gameover = true;
            explodedCell = board[row][col];
            showMessage('Game Over! Better luck next time.', false);
            revealBoard();
            let image = document.getElementById("img_" + row + "_" + col);

            var bodyRect = document.body.getBoundingClientRect(),
                elemRect = image.getBoundingClientRect(),
                offsetY = elemRect.top - bodyRect.top,
                offsetX = elemRect.left - bodyRect.left;

            console.log(offsetY);
            console.log(offsetX);
            initializeAnimation(offsetX + 16, offsetY + 8);
            new Audio('mp3/sea-mine-explosion.mp3').play();
        } else if (visibleCellCount == EMPTY_CELL_COUNT && !skipSuccessCheck) {
            stopTimer();
            gameover = true;
            if (registerTime(elapsedTime)) {
                showMessage("You earned a high score with a time of " + msToTime(elapsedTime) + "!", true);
            } else {
                showMessage("You solved it!", true);
            }
            revealBoard();
        }
    }

    const image = document.getElementById("img_" + row + "_" + col);

    image.setAttribute("src", getImage(board[row][col]));

    if (board[row][col].nearCount == 0) {
        revealAdjacentCells(row, col, true);
    }
}

function getImage(cell) {
    if (cell.flagged) {
        if (gameover) {
            if (cell.mined) {
                return "img/flag-correct.png";
            } else {
                return "img/flag-incorrect.png";
            }
        } else {
            return "img/flag.png";
        }
    } else if (!cell.visible && !gameover) {
        return "img/hidden.png";
    } else if (cell.mined) {
        if (cell == explodedCell) {
            return "img/mine-exploded.gif";
        } else {
            return "img/mine.png";
        }
    } else if (cell.nearCount == 0) {
        return "img/empty.png";
    } else if (cell.nearCount == 1) {
        return "img/one.png";
    } else if (cell.nearCount == 2) {
        return "img/two.png";
    } else if (cell.nearCount == 3) {
        return "img/three.png";
    } else if (cell.nearCount == 4) {
        return "img/four.png";
    } else if (cell.nearCount == 5) {
        return "img/five.png";
    } else if (cell.nearCount == 6) {
        return "img/six.png";
    } else if (cell.nearCount == 7) {
        return "img/seven.png";
    } else if (cell.nearCount == 8) {
        return "img/eight.png";
    }

    return "img/hidden.png";
}

function revealAdjacentCells(row, col, hideMined) {
    let rowStart = row > 0 ? row - 1 : 0;
    let rowEnd = row + 2 < ROW_COUNT ? row + 2 : ROW_COUNT;
    let colStart = col > 0 ? col - 1 : 0;
    let colEnd = col + 2 < COL_COUNT ? col + 2 : COL_COUNT;

    for (let i = rowStart; i < rowEnd; i++) {
        for (let j = colStart; j < colEnd; j++) {
            if (board[i][j].flagged) {
                continue;
            }

            if (hideMined && board[i][j].mined) {
                continue;
            }

            revealCell(i, j);
        }
    }
}

function revealBoard() {
    generateTable();
}

function countAdjacentFlags(row, col) {
    let count = 0;

    let rowStart = row > 0 ? row - 1 : 0;
    let rowEnd = row + 2 < ROW_COUNT ? row + 2 : ROW_COUNT;
    let colStart = col > 0 ? col - 1 : 0;
    let colEnd = col + 2 < COL_COUNT ? col + 2 : COL_COUNT;

    for (let i = rowStart; i < rowEnd; i++) {
        for (let j = colStart; j < colEnd; j++) {
            if (board[i][j].flagged) {
                count++;
            }
        }
    }

    return count;
}

function updateFlagCount() {
    const thisDiv = document.getElementById("flagcount");

    thisDiv.textContent = 'Flagged: ' + flagCount + ' of ' + NUM_MINES;
}

function clearMessage() {
    showMessage("", true);
}

function showMessage(message, success) {
    let thisDiv = document.getElementById("message");
    thisDiv.innerHTML = "";

    let thisText = document.createTextNode(message);
    if (success) {
        thisDiv.className = 'success-message';
    } else {
        thisDiv.className = 'error-message';
    }
    thisDiv.appendChild(thisText);
}

function getHighScores() {
    let retVal = [];

    for (let i = 0; i < 20; i++) {
        if (!localStorage.getItem("highscore" + i)) {
            break;
        }
        retVal.push(localStorage.getItem("highscore" + i));
    }

    return retVal;
}

function registerTime(time) {
    let highScores = getHighScores();

    highScores.push(time);
    highScores.sort();
    if (highScores.length > 20) {
        highScores = highScores.slice(0, 20);
    }

    for (let i = 0; i < 20; i++) {
        if (!highScores[i]) {
            break;
        }
        localStorage.setItem("highscore" + i, highScores[i]);
    }

    if (highScores.includes(time)) {
        return true;
    }

    return false;
}
