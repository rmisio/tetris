// TODO: blockwidth and blockheight condensed into one blocksize

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
    };

    
    this.blocksBoard = new BlocksBoard({
      initialState: {
        // todo: pass in rows and cols and blockSize!!!
        blocks: this._state.blocks,
      },
    });
    this._el.appendChild(this.blocksBoard.render().el);

    this.start();
  }

  static get ASPECT_RATIO () {
    return 0.555555555555556;
  }

  get el() {
    return this._el;
  }

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
        // resume auto drop of already active piece
      }
    }
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

  dropNewPiece() {
    const {
      activePiece,
      blockHeight,
      blockWidth,
    } = this._state;

    if (activePiece) {
      // TODO: nullify the piece in the state of the container board
      this._el.removeChild(activePiece.instance);
      activePiece.instance = null;
    }

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
      const {
        fWidth,
        fHeight,
        leftEdge,
        topEdge,
      } = instance.meta;

      this.activePieceContainer = new ActivePieceBoard({
        initialState: {
          width: cols,
          height: rows,
          blockSize: blockWidth,
          position: [
            Math.floor((this._state.cols - fWidth) / 2) - leftEdge,
            (Math.floor(fHeight / 2)  + topEdge) * -1
          ],
        },
      }).render();

      this._el.appendChild(this.activePieceContainer.el);
    }

    this.activePieceContainer.setState({ piece: instance });
    this._state.activePiece = newPiece;
  }
}

export default Tetris;