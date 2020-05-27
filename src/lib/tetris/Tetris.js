import Events from 'events';
import { isElement, memoize, throttle } from 'lodash';
import { randomInt } from 'util/number';
import BaseVw from './BaseVw.js';
import ActivePieceBoard from './PieceBoard';
import BlocksBoard from './BlocksBoard';
import Piece from './Piece';
import shapes from './shapes';

const memoizedRotateMatrix = memoize(matrix => {
  const result = [];

  matrix.forEach(function (a, i, aa) {
    a.forEach(function (b, j, bb) {
      result[j] = result[j] || [];
      result[j][aa.length - i - 1] = b;
    });
  });

  return result;
});

class Tetris extends BaseVw {
  constructor(el, options={}) {
    if (!isElement(el)) {
      throw new Error('Please provide a valid dom element.');
    }

    const initialState = {
      cols: 10,
      rows: 18,
      blockSize: 30,
      started: false,
      gameOver: false,
      activePiece: null,
      lines: 0,
      level: 1,
      score: 0,
      percentToNextLevel: 0,
      tickSpeed: 1000,
      ...options.initialState,      
    };

    // Example initial blocks
    // initialState.initialBlocks = [
    //   [null, null, null, null, null, null, null, null, null, null],
    //   ... (length needs to match rows and cols)
    //   [null, { color: '#42f557' }, null, null, null, null, null, null, null, null],
    // ];

    initialState.initialBlocks =
      Array(initialState.rows)
        .fill(
          Array(initialState.cols).fill(null)
        );

    super({ initialState });

    Object.assign(this, Events.prototype);

    const {
      blockSize,
      rows,
      cols,
      initialBlocks: blocks,
    } = this.getState();

    const container = this._el = document.createElement('div');
    container.style.width = `${blockSize * cols}px`;
    container.style.height = `${blockSize * rows}px`;
    container.style.position = 'relative';

    document.addEventListener('keydown', this.onKeyDown.bind(this), false);

    this.activeTouch = false;
    this.throttledOnTouchMove = throttle(this.onTouchMove.bind(this), 30);

    document.addEventListener('touchstart', this.onTouchStart.bind(this), false);
    document.addEventListener('touchend', this.onTouchEnd.bind(this), false);
    document.addEventListener('touchmove', this.throttledOnTouchMove, false);    

    el.appendChild(container);

    this.blocksBoard = new BlocksBoard({
      initialState: {
        blocks,
        rows,
        cols,
        blockSize,
      },
    });
    this.blocksBoard._el.style.position = 'absolute';
    this._el.appendChild(this.blocksBoard.render().el);

    this._tickStart = null;
    this._lineRemovals = [];
    this._interruptedLineRemovals = false;
  }

  get el() {
    return this._el;
  }

  setState(state = {}, options = {}) {
    const prevState = this.getState();
    const updatedState = state;

    if (updatedState.gameOver === true) {
      updatedState.started = false;
    }

    if (
      !options.beingConstructed &&
      updatedState.level !== undefined &&
      updatedState.level !== prevState.level
    ) {
      const fps = 1000 / 60;
      // TODO: on higher levels increase speed by smaller increments?
      updatedState.tickSpeed = 1000 - ((updatedState.level - 1) * 100);
      updatedState.tickSpeed = Math.max(fps, updatedState.tickSpeed);
    }

    super.setState(updatedState, {
      ...options,
      renderOnChange: false,
    });

    if (options.beingConstructed) return this;

    const {
      rows,
      cols,
      blockSize,
      lines,
      score,
      level,
      activePiece,
      percentToNextLevel,
      gameOver,
      started,
    } = this.getState();

    if (prevState.started && !started) {
      this.cancelTick();
    }

    // Although not enforced, blockSize is the only state we're potentially
    // expecting to be changed from the outside after initialization.
    if (prevState.blockSize !== blockSize) {
      this._el.style.width = `${blockSize * cols}px`;
      this._el.style.height = `${blockSize * rows}px`;

      if (this.blocksBoard) {
        this.blocksBoard.setState({ blockSize });
      }

      if (activePiece) {
        activePiece
          .instance
          .setState({ blockSize });
      }

      if (this.activePieceContainer) {
        this.activePieceContainer.setState({ blockSize });
      }

      // Updating the blocksBoard with a new blocksize will
      // cause it to re-render and lose the dom element of
      // any in-flight row removal animation. If there were any
      // active animations, we'll set a flag, so they could be
      // resumed in a way where they requery the dom for a new
      // element and resume where they left off.
      this._interruptedLineRemovals = !!this._lineRemovals.length;
      if (this._interruptedLineRemovals) this.startTick();
    }

    // if necessary, fire change events
    if (
      prevState.lines !== lines ||
      prevState.score !== score ||
      prevState.level !== level ||
      prevState.percentToNextLevel !== percentToNextLevel ||
      prevState.gameOver !== gameOver ||
      prevState.started !== started
    ) {
      this.emit('change', {
        lines,
        score,
        level,
        percentToNextLevel,
        gameOver,
        started,
      });
    }

    return this;
  }

  // TODO: memoize me
  // TODO: write unit test
  // TODO: doc me up
  checkBoard(shape, pos) {
    // todo: check shape args
    if (
      !Array.isArray(pos) ||
      !Number.isInteger(pos[0]) ||
      !Number.isInteger(pos[1])
    ) {
      throw new Error('The position must be provided as a 2 ' +
        'element array of integers.');
    }

    const { blocks } = this.blocksBoard.getState();    
    const { rows, cols } = this.getState();
    let grounded = false;
    let invalidPos = false;
    let gameOver = false;
    let lines = [];
    let topCellPos = null;
    let botCellPos = null;

    for (let rowI = 0; rowI < shape.length; rowI++) {
      for (let colI = 0; colI < shape[rowI].length; colI++) {
        if (!shape[rowI][colI]) continue;

        const cellRow = pos[1] + rowI;
        const cellCol = pos[0] + colI;

        if (!topCellPos) {
          topCellPos = [cellRow, cellCol];
        }

        botCellPos = [cellRow, cellCol];

        if (cellRow < 0) continue;

        if (
          cellRow > rows - 1 ||
          cellCol < 0 ||
          cellCol > cols - 1 ||
          blocks[cellRow][cellCol]
        ) {
          invalidPos = true;
          break;
        }

        if (cellRow >= rows - 1 || blocks[cellRow + 1][cellCol]) {
          grounded = true;
        }
      }

      if (invalidPos) break;
    }

    if (!invalidPos && grounded) {
      // TODO: doc what I'm doing here
      blocks
        .slice(topCellPos[0], botCellPos[0] + 1)
        .forEach((row, index) => {
          const absRowIndex = index + topCellPos[0];
          const emptyCell =
            row.find((cell, cellIndex) => {
              const shapeFillsCell =
                shape[absRowIndex - pos[1]] &&
                shape[absRowIndex - pos[1]][cellIndex - pos[0]];

              return !cell && !shapeFillsCell;
            });

          if (emptyCell === undefined) {
            lines.push(absRowIndex);
          }
        });

      if (!lines.length && topCellPos[0] <= 0) {
        gameOver = true;

        // Even with lines it might still be game over, but
        // the board would need to be analayzed without the lines.
        // The expectation is the lines will be removed outside of
        // this function and this function will be recalled with a
        // new board.
      }
    }
    
    return {
      grounded,
      invalidPos,
      gameOver,
      lines,
    };
  }

  movePiece(direction) {
    const validDirs = ['left', 'right', 'down'];

    if (!validDirs.includes(direction)) {
      throw new Error(`direction must be one of [${validDirs.join(', ')}]`);
    }

    const {
      started,
      activePiece,
    } = this.getState();

    if (!started || !activePiece) return;

    const piece = activePiece.instance;
    const curPos = this.activePieceContainer.getState().position;
    let newPos;

    if (direction === 'left') {
      newPos = [curPos[0] - 1, curPos[1]];
    } else if (direction === 'right') {
      newPos = [curPos[0] + 1, curPos[1]];
    } else {
      // down
      newPos = [curPos[0], curPos[1] + 2];
    }

    let {
      invalidPos,
      grounded,
    } = this.checkBoard(piece.getState().shape, newPos);

    if (invalidPos && direction === 'down') {
      newPos = [curPos[0], curPos[1] + 1];
      (
        {
          invalidPos,
          grounded
        } = this.checkBoard(piece.getState().shape, newPos)
      );
    }

    if (!invalidPos) {
      this.activePieceContainer.setState({ position: newPos });
      if (grounded) {
        this.startTick();
      }
    }    
  }

  rotatePiece() {
    const {
      started,
      activePiece,
    } = this.getState();

    if (!started || !activePiece) return;

    const piece = activePiece.instance;
    const curPos = this.activePieceContainer.getState().position;
    const rotatedShape = Tetris.rotateMatrix(piece.getState().shape);
    
    // todo: switch to blockSize
    const { invalidPos } = this.checkBoard(rotatedShape, curPos);

    if (!invalidPos) {
      piece.setState({ shape: rotatedShape });
    } else {
      // we'll try and move up to 2 blocks in different directions
      // to see if the rotate piece will fit

      const adjustments = [
        [-1,  0],   // one spot left
        [1, 0],     // one spot right
        [0, -1],    // one spot up
        [0, 1],     // etc...
        [-2,  0],   // one spot left
        [2, 0],     // one spot right
        [0, -2],    // one spot up
        [0, 2],     // etc...
      ];

      for (let i = 0; i < adjustments.length; i++) {
        const adjustedP = [
          curPos[0] + adjustments[i][0],
          curPos[1] + adjustments[i][1]
        ]

        const { invalidPos } = this.checkBoard(rotatedShape, adjustedP);

        if (!invalidPos) {  
          this.activePieceContainer.setState({ position: adjustedP });
          piece.setState({ shape: rotatedShape });
          break;
        }
      }
    }
  }  

  onTouchStart(e) {
    this.activeTouch = true;
    this.touchTap = true; 
    this.lastTouchX = e.touches[0].clientX;
    this.lastTouchY = e.touches[0].clientY;
  }

  onTouchEnd(e) {
    this.activeTouch = false;

    if (this.touchTap && this.el.contains(e.target)) {
      this.rotatePiece();
      this.touchTap = false;
    }
  }

  onTouchMove(e) {
    if (!this.activeTouch) return;
    this.touchTap = false;

    const { blockSize } = this.getState();
    const curX = e.touches[0].clientX;
    const curY = e.touches[0].clientY;
    const changeX = curX - this.lastTouchX;
    const changeY = curY - this.lastTouchY;
    let direction = 'down';

    if (Math.abs(changeX) > Math.abs(changeY)) {
      direction = changeX > 0 ? 'right' : 'left';

      if (Math.abs(changeX) < blockSize) return;
    } else if (changeY < blockSize) {
      return;
    }

    this.lastTouchX = curX;
    this.lastTouchY = curY;
    this.movePiece(direction);
  };

  onKeyDown(e) {
    if (
      !(
        e.keyCode >= 37 &&
        e.keyCode <= 40
      )
    ) {
      return;
    }

    e.preventDefault();

    if ([37, 39, 40].includes(e.keyCode)) {
      let direction;

      switch (e.keyCode) {
        case 37:
          direction = 'left';
          break;
        case 39:
          direction = 'right';
          break;
        default:
          direction = 'down';
      };

      this.movePiece(direction);
    } else {
      this.rotatePiece();
    }
  }

  // todo: I am memoizable
  computeScore(lineCount, level) {
    return (10 * level) + ((lineCount - 1) * (5 * level));
  }

  startTick() {
    this.cancelTick();
    this.rafTick();
  }

  rafTick() {
    this._progressPieceRaf =
      window.requestAnimationFrame(this.tick.bind(this));
  }
  
  cancelTick() {
    this._tickStart = null;
    window.cancelAnimationFrame(this._progressPieceRaf);
  }

  tick(timestamp) {
    const { tickSpeed } = this.getState();

    if (this._tickStart) {
      if (timestamp - this._tickStart < tickSpeed) {
        this.rafTick();
        return;
      }
    }

    this._tickStart = timestamp;

    const {
      started,
      gameOver,
      activePiece,
    } = this.getState();

    if (!started || gameOver) return;

    if (this._lineRemovals.length) {
      this._lineRemovals
        .forEach(l => l.resume({ requeryRow: this._interruptedLineRemovals }));
      this._interruptedLineRemovals = false;
      return;
    } else if (!activePiece) {
      this.dropNewPiece();
      return;
    }

    // TODO: test if full lines on initialBlocks would be properly
    // recognized

    const piece = activePiece.instance;
    const { shape, color } = piece.getState();
    const curPos = this.activePieceContainer.getState().position;
    const {
      grounded,
      lines,
      gameOver: boardGameOver,
    } = this.checkBoard(
      piece.getState().shape,
      curPos
    );

    if (boardGameOver) {
      this.setState({ gameOver: boardGameOver });
      return;
    }

    if (grounded) {
      const { blockSize, cols } = this.getState();
      const { blocks } = this.blocksBoard.getState();
      let updatedBlocks = [...blocks];

      // Turn the active piece into individual blocks that we can remove
      // if / when they become a line.
      shape.forEach((row, rowIndex) => {
        row.forEach((col, colIndex) => {
          if (col) {
            const blocksRowIndex = curPos[1] + rowIndex;

            // todo: this really shouldn't be needed
            // todo: this really shouldn't be needed
            // todo: this really shouldn't be needed
            // if (!updatedBlocks[blocksRowIndex]) return;

          updatedBlocks[blocksRowIndex] =
            updatedBlocks[blocksRowIndex].map((cell, cellIndex) => {
              if (cellIndex === curPos[0] + colIndex) {
                return {
                  color,
                  size: blockSize,
                }
              }

              return cell;
            });
          }
        });
      });

      this
        .blocksBoard
        .setState({ blocks: updatedBlocks });
      this.clearActivePiece();

      if (lines.length) {
        this._lineRemovals = lines.map(lineIndex =>
          this
            .blocksBoard
            .animateRowPreRemoval(lineIndex)
        );
        
        Promise
          .all(this._lineRemovals.map(l => l.promise))
          .then(() => {
            const {
              level,
              score,
              lines: prevLineCount,
            } = this.getState();
            updatedBlocks = [
              ...lines.map(line => Array(cols).fill(null)),
              ...updatedBlocks.filter((row, rowIndex) => !lines.includes(rowIndex))
            ];
            this
              .blocksBoard
              .setState({ blocks: updatedBlocks });
            const newLineCount = (prevLineCount || 0) + lines.length;
            this.setState({
              lines: newLineCount,
              score: score + this.computeScore(lines.length, level),
              level: Math.floor(newLineCount / 10) + 1,
              percentToNextLevel: (newLineCount % 10) * 10,
            });
            this._lineRemovals = [];
            this.dropNewPiece();
          }).catch(() => {
            (this._lineRemovals || []).forEach(l => l.cancel());
            this._lineRemovals = [];
          });
      } else {
        this.dropNewPiece();
      }

      return;
    }

    this.activePieceContainer.setState({ position: [curPos[0], curPos[1] + 1] });

    this.rafTick();
  }

  clearActivePiece() {
    if (this.activePieceContainer) {
      this.activePieceContainer.setState({ piece: null });
    }
  }

  dropNewPiece() {
    const { blockSize, cols } = this.getState();

    let colors = [
      '#cb42f5',
      '#f5b342',
      '#f5427b',
      '#f2e3aa',
    ];

    this.clearActivePiece();

    if (colors.length > 1 && this._prevPieceColor) {
      colors = colors.filter(c => c !== this._prevPieceColor);
    }

    const color = this._prevPieceColor = colors[randomInt(0, colors.length - 1)];
    const newPiece = shapes[randomInt(0, shapes.length - 1)];
    const instance = newPiece.instance = new Piece({
      initialState: {
        shape: newPiece.shape,
        blockSize,
        color,
      },
    });

    if (!this.activePieceContainer) {
      const {
        rows,
        cols,
        blockSize,
      } = this.getState();

      this.activePieceContainer = new ActivePieceBoard({
        initialState: {
          cols,
          rows,
          blockSize,
        },
      }).render();
      this.activePieceContainer._el.style.position = 'absolute';
      this._el.appendChild(this.activePieceContainer.el);
    }

    const {
      fWidth,
      fHeight,
      leftEdge,
      topEdge,
    } = instance.meta;

    this.activePieceContainer.setState({
      piece: instance,
      position: [
        Math.floor((cols - fWidth) / 2) - leftEdge,
        (fHeight + topEdge) * -1
      ],
    });
    this.setState({ activePiece: newPiece });
    this.rafTick();
  }

  restart() {
    const {
      rows,
      cols,
    } = this.getState();

    this.setState({
      started: true,
      lines: 0,
      score: 0,
      level: 1,
      percentToNextLevel: 0,
      gameOver: false,
      activePiece: null,
    });

    this
      .blocksBoard
      .setState({ blocks:  Array(rows).fill(Array(cols).fill(null)) });

    this.startTick();
  }

  start() {
    const {
      started,
      gameOver,
    } = this.getState();

    if (started) return;

    if (gameOver) {
      this.restart();
    } else {
      this.setState({ started: true });
      this.startTick();
    }
  }

  stop() {
    this.setState({ started: false });
    window.cancelAnimationFrame(this._progressPieceRaf);
    window.clearTimeout(this._tickTimeout);

    // pause any line removal animations
    (this._lineRemovals || [])
      .forEach(l => l.stop());
  }

  remove() {
    this.stop();
    document.removeEventListener('keydown', this.onKeyDown, false);
    document.removeEventListener('touchstart', this.onTouchStart, false);
    document.removeEventListener('touchend', this.onTouchEnd, false);
    document.removeEventListener('touchmove', this.throttledOnTouchMove, false);
  }

  /*
   * For optimization, this function has been memoized so if you
   * mutate a previously used matrix, be sure to send in a new instance.
   *
   * https://stackoverflow.com/a/42581396
   */
  static rotateMatrix(matrix) {
    return memoizedRotateMatrix(matrix);
  }

  static rotatePiece(piece) {
    piece.setState({ shape: Tetris.rotateMatrix(piece.getState().shape) })
  }
}

export default Tetris;