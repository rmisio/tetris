// TODO: blockwidth and blockheight condensed into one blocksize
// TODO: ensure shape is always a square (probably beyond this file)
// TODO: remove the debugging el IDs

import { isElement, memoize } from 'lodash';
import { randomInt } from 'util/number';
import ActivePieceBoard from './PieceBoard';
import BlocksBoard from './BlocksBoard';
import Piece from './Piece';

const PIECES = [
  {
    shape: [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
    rotatable: true,
  },
  {
    shape: [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
    rotatable: true,
  },
  {
    shape: [
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ],
    rotatable: true,
  },
  {
    shape: [
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 0],
    ],
    rotatable: true,
  },
  {
    shape: [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    rotatable: true,
  },
  {
    shape: [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    rotatable: true,
  },
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    rotatable: false,
  },
];

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

class Tetris {
  constructor(el, width = 330) {
    // todo: switch to rows, cols and blockSize. simple as a pimple dog.

    if (!isElement(el)) {
      throw new Error('Please provide a valid dom element.');
    }

    if (typeof width !== 'number' || Number.isNaN(width)) {
      throw new Error('width must be provided as a non NaN number.');
    }

    // todo: warn that width should ideally be divisible by 10, or automatically
    // round...?

    this._dimensions = {
      width,
      height: Math.round(width / Tetris.ASPECT_RATIO),
    };

    const blockWidth = width / 10;
    const blockHeight = blockWidth;
    
    const container = this._el = document.createElement('div');
    container.style.width = `${this._dimensions.width}px`;
    container.style.height = `${this._dimensions.height}px`;
    container.style.position = 'relative';

    document.addEventListener('keydown', this.onKeyDown.bind(this), false);

    el.appendChild(container);

    this._state = {
      started: false,
      activePiece: null,
      lineCount: 0,
      points: 0,
      gameOver: false,
      level: 1,
      blockWidth,
      blockHeight,
      blocks: [
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
        [null, { color: 'yellow', size: blockWidth }, null, null, null, null, null, null, null, null],
        [null, { color: 'yellow', size: blockWidth }, null, null, null, null, null, null, null, null],
        [null, { color: 'yellow', size: blockWidth }, null, null, null, null, null, null, null, null],
        [null, { color: 'yellow', size: blockWidth }, null, null, null, null, null, null, null, null],
        [
          { color: 'yellow', size: blockWidth },
          { color: 'yellow', size: blockWidth },
          { color: 'yellow', size: blockWidth },
          null,
          null, null, null, null, null, null
        ],
        [
          { color: 'red', size: blockWidth },
          { color: 'red', size: blockWidth },
          { color: 'red', size: blockWidth },
          { color: 'red', size: blockWidth },
          null, null, null, null, null, null
        ],
      ],
      rows: 18,
      cols: 10,
      activePiecePos: [0, 0],
      activePieceDropSpeedFactor: 500,
    };

    const { blocks, rows, cols } = this._state;
    
    this.blocksBoard = new BlocksBoard({
      initialState: {
        blocks,
        rows,
        cols,
        blockSize: this._state.blockWidth,
      },
    });
    this.blocksBoard._el.style.position = 'absolute';
    this._el.appendChild(this.blocksBoard.render().el);

    this.start();
  }

  static get ASPECT_RATIO () {
    return 0.555555555555556;
  }

  get el() {
    return this._el;
  }

  // TODO: move to state
  get dimensions() {
    return this._dimensions;
  }

  // todo: memoize me
  // would need blocks passed in.
  willFit(pieceMeta, shape, pos) {
    // check if we are within game boundaries
    if (
      pos[0] < pieceMeta.leftEdge * -1 ||
      pos[0] > this._state.cols - pieceMeta.rightEdge ||
      pos[1] > this._state.rows - pieceMeta.botEdge
    ) {
      return false;
    }

    let foundOverlap = false;

    // ensure we dont overlap with any existing blocks
    // (brute forcing here... perhaps there's a better way?)
    for (let i=0; i < shape.length; i++) {
      for (let j=0; j < shape[i].length; j++) {
        if (
          shape[i][j] &&
          this._state.blocks[pos[1] + i] &&
          this._state.blocks[pos[1] + i][pos[0] + j]
        ) {
          foundOverlap = true;
          break;
        }
      }

      if (foundOverlap) break;
    }

    return !foundOverlap;
  }

  // TODO: memoize if reasonable
  // TODO: check args  
  isGrounded(pieceMeta, shape, pos) {
    if (pos[1] + pieceMeta.botEdge >= this._state.rows) return true;

    // TODO: this won't be needed if checking args.
    const shapeArr = Array.isArray(shape) ? shape : [[]];
    for (let i = 0; i < shapeArr.length; i++) {
      for (let j = 0; j < shapeArr[i].length; j++) {
        const cell = shapeArr[i][j];
        if (
          cell &&
          this._state.blocks[pos[1] + i + 1] &&
          this._state.blocks[pos[1] + i + 1][pos[0] + j]
        ) {
          return true;
        }
      }
    }

    return false;
  }

  onKeyDown(e) {
    if (
      !(
        e.keyCode >= 37 &&
        e.keyCode <= 40 &&
        this._state.started &&
        this._state.activePiece
      )
    ) {
      return;
    }

    e.preventDefault();

    requestAnimationFrame(() => {
      let piece = this._state.activePiece;

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
            newPos = [curPos[0], curPos[1] + 1];
          }

          if (this.willFit(piece.meta, piece.getState().shape, newPos)) {
            this.activePieceContainer.setState({ position: newPos });
          }
        } else {
          // up key, let's rotate
          const rotatedShape = Tetris.rotateMatrix(piece.getState().shape);
          const pieceMeta = Piece.getMeta(
            rotatedShape,
            this._state.blockWidth,
            this._state.blockHeight,
          );
          
          // todo: switch to blockSize
          if (this.willFit(pieceMeta, rotatedShape, curPos)) {
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
              if (this.willFit(pieceMeta, rotatedShape, adjustedP)) {
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

  rafProgressPiece() {
    window.cancelAnimationFrame(this._progressPieceRaf);
    this._progressPieceRaf =
      window.requestAnimationFrame(this.progressPiece.bind(this));; 
  }

  progressPiece(timestamp) {
    const {
      started,
      gameOver,
      activePiece,
      level,
      activePieceDropSpeedFactor,
    } = this._state;

    if (!started || gameOver || !activePiece) return;

    const piece = activePiece.instance;
    const { shape, color } = piece.getState();
    const curPos = this.activePieceContainer.getState().position;

    if (
      this.isGrounded(
        piece.meta,
        piece.getState().shape,
        this.activePieceContainer.getState().position
      )
    ) {
      this._state.blocks = [...this._state.blocks];

      // check for game over

      // Turn the active piece into individual blocks that we can remove
      // if/when they become a line.
      shape.forEach((row, rowIndex) => {
        row.forEach((col, colIndex) => {
          if (col) {
            this._state.blocks[curPos[1] + rowIndex] =
              this._state.blocks[curPos[1] + rowIndex].map((cell, cellIndex) => {
                if (cellIndex === curPos[0] + colIndex) {
                  return {
                    color,
                    size: this._state.blockWidth,
                  }
                }

                return cell;
              });
          }
        });
      });

      this.blocksBoard.setState({ blocks: this._state.blocks }); 
      // window.moo = this.dropNewPiece.bind(this);
      this.clearActivePiece();
      this.dropNewPiece();
      return;
    }

    this.activePieceContainer.setState({ position: [curPos[0], curPos[1] + 1] });

    window.clearTimeout(this._progressPieceTimeout);
    this._progressPieceTimeout = window.setTimeout(() => {
      window.requestAnimationFrame(this.progressPiece.bind(this));
    }, activePieceDropSpeedFactor - ((level - 1) * 100));
    // TODO: that will be 0 at a high enouggh level. Prevent it going below 20.    
  }

  clearActivePiece() {
    if (this.activePieceContainer) {
      this.activePieceContainer.setState({ piece: null });
    }
  }

  dropNewPiece() {
    const {
      blockHeight,
      blockWidth,
    } = this._state;

    this.clearActivePiece();
    const newPiece = PIECES[randomInt(0, PIECES.length - 1)];
    const instance = newPiece.instance = new Piece({
      initialState: {
        shape: newPiece.shape,
        blockHeight,
        blockWidth,
      },
    });

    if (!this.activePieceContainer) {
      const {
        rows,
        cols,
        blockWidth,
      } = this._state;

      this.activePieceContainer = new ActivePieceBoard({
        initialState: {
          width: cols,
          height: rows,
          blockSize: blockWidth,
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
        Math.floor((this._state.cols - fWidth) / 2) - leftEdge,
        (Math.floor(fHeight / 2)  + topEdge) * -1
      ],
    });
    this._state.activePiece = newPiece;
    this.rafProgressPiece();
  }

  start() {
    const {
      started,
      gameOver,
      activePiece,
    } = this._state;

    if (!started && !gameOver) {
      this._state.started = true;

      if (!activePiece) {
        this.dropNewPiece();
      } else {
        this.rafProgressPiece();
      }
    }
  }

  stop() {
    this._state.started = false;
    window.cancelAnimationFrame(this._progressPieceRaf);
    window.clearTimeout(this._progressPieceTimeout);    
  }

  destroy() {
    document.removeEventListener('keydown', this.onKeyDown, false);
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