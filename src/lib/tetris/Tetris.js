// TODO: blockwidth and blockheight condensed into one blocksize
// TODO: ensure shape is always a square (probably beyond this file)
// TODO: remove the debugging el IDs
// TODO: ensure color across app hex

import Events from 'events';
import { isElement, memoize } from 'lodash';
import { randomInt } from 'util/number';
import BaseVw from './BaseVw.js';
import ActivePieceBoard from './PieceBoard';
import BlocksBoard from './BlocksBoard';
import Piece from './Piece';
import shapes from './shapes';

// TODO: take into account rotatable property.

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

// todo: change el to container.
class Tetris extends BaseVw {
  constructor(el, options={}) {
    // todo: switch to rows, cols and blockSize. simple as a pimple dog.

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
      activePieceDropSpeedFactor: 500,
      ...options.initialState,      
    };

    // todo: validate me. Empty cells must be null.
    initialState.initialBlocks = [
      [null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null],
      [null, { color: '#42f557' }, null, null, null, null, null, null, null, null],
      [null, { color: '#42f557' }, null, null, null, null, null, null, null, null],
      [null, { color: '#42f557' }, null, null, null, null, null, null, null, null],
      [null, { color: '#42f557' }, null, null, null, null, null, null, null, null],
      [
        { color: '#42f557' },
        { color: '#42f557' },
        { color: '#42f557' },
        null,
        null, null, null, null, null, null
      ],
      [
        { color: '#42c8f5' },
        { color: '#42c8f5' },
        { color: '#42c8f5' },
        { color: '#42c8f5' },
        null, null, null, null, null, null
      ],
    ];

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

    this._lineRemovals = [];
    this._interruptedLineRemovals = false;

    // this.start();
  }

  get el() {
    return this._el;
  }

  setState(state = {}, options = {}) {
    const prevState = this.getState();

    super.setState(state, {
      ...options,
      // todo: test me
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
    } = this.getState();

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
      if (this._interruptedLineRemovals) this.rafTick();
    }

    // if necessary, fire change events
    if (
      prevState.lines !== lines ||
      prevState.score !== score ||
      prevState.level !== level ||
      prevState.percentToNextLevel !== percentToNextLevel
    ) {
      this.emit('updateStats', {
        lines,
        score,
        level,
        percentToNextLevel,
      });
    }

    return this;
  }

  // TODO: memoize me
  // TODO: write unit test
  // TODO: doc me up
  checkBoard(shape, pos) {
    // console.log(shape);
    // console.log(pos);

    // todo: check shape args
    // todo: is piece meta needed anymore?

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

  onKeyDown(e) {
    const {
      started,
      activePiece,
    } = this.getState();

    if (
      !(
        e.keyCode >= 37 &&
        e.keyCode <= 40 &&
        started &&
        activePiece
      )
    ) {
      return;
    }

    e.preventDefault();

    requestAnimationFrame(() => {
      let piece = activePiece;

      if (piece) {
        piece = piece.instance;
        const curPos = this.activePieceContainer.getState().position;

        if ([37, 39, 40].includes(e.keyCode)) {
          let newPos;

          if (e.keyCode === 37) {
            newPos = [curPos[0] - 1, curPos[1]];
          } else if (e.keyCode === 39) {
            newPos = [curPos[0] + 1, curPos[1]];
          } else {
            // down
            newPos = [curPos[0], curPos[1] + 2];
          }

          const { invalidPos } = this.checkBoard(piece.getState().shape, newPos);

          if (!invalidPos) {
            this.activePieceContainer.setState({ position: newPos });
          }
        } else {
          // up key, let's rotate
          const rotatedShape = Tetris.rotateMatrix(piece.getState().shape);
          
          // todo: switch to blockSize
          const { invalidPos } = this.checkBoard(rotatedShape, curPos);

          if (!invalidPos) {
            piece.setState({ shape: rotatedShape });
          } else {
            // we'll try and move up to 2 blocks in different directions
            // to see if the rotate piece will fit
            // TODO: I suspect there's a more efficient way to get an idea
            // of which direction might fit rather than blindly trying them
            // all.

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

              // todo: switch to blockSize
              const { invalidPos } = this.checkBoard(rotatedShape, adjustedP);

              if (!invalidPos) {  
                this.activePieceContainer.setState({ position: adjustedP });
                piece.setState({ shape: rotatedShape });
                break;
              }
            }
          }
        }
      }
    });
  }

  // todo: I am memoizable
  computeScore(lineCount, level) {
    return (10 * level) + ((lineCount - 1) * (5 * level));
  }

  rafTick() {
    window.cancelAnimationFrame(this._progressPieceRaf);
    this._progressPieceRaf =
      window.requestAnimationFrame(this.tick.bind(this));; 
  }

  tick(timestamp) {
    const {
      started,
      gameOver,
      activePiece,
      level,
      activePieceDropSpeedFactor,
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
      this.activePieceContainer.getState().position
    );

    if (boardGameOver) {
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

          // todo: update level
      } else {
        this.dropNewPiece();
      }

      return;
    }

    this.activePieceContainer.setState({ position: [curPos[0], curPos[1] + 1] });

    window.clearTimeout(this._tickTimeout);
    this._tickTimeout = window.setTimeout(() => {
      window.requestAnimationFrame(this.tick.bind(this));
    }, activePieceDropSpeedFactor - ((level - 1) * 100));
    // TODO: that will be 0 at a high enough level. Prevent it going below 20.    
  }

  clearActivePiece() {
    if (this.activePieceContainer) {
      this.activePieceContainer.setState({ piece: null });
    }
  }

  dropNewPiece() {
    const { blockSize, cols } = this.getState();

    const colors = [
      '#cb42f5',
      '#f5b342',
      '#f5427b',
    ];

    this.clearActivePiece();
    const newPiece = shapes[randomInt(0, shapes.length - 1)];
    const instance = newPiece.instance = new Piece({
      initialState: {
        shape: newPiece.shape,
        blockSize,
        color: colors[randomInt(0, colors.length - 1)],
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
        (Math.floor(fHeight / 2)  + topEdge) * -1
      ],
    });
    this.setState({ activePiece: newPiece });
    this.rafTick();
  }

  start() {
    const {
      started,
      gameOver,
    } = this.getState();

    if (!started && !gameOver) {
      this.setState({ started: true });
      this.rafTick();
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
    this.removeAllListeners();
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