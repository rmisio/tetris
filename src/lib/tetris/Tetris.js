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
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    rotatable: true,
  },
  {
    shape: [
      [0, 1, 1],
      [0, 1, 0],
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
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
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
        const { blockWidth, blockHeight } = this._state;
        piece = piece.instance;
        const {
          leftEdge,
          fWidth
        } = piece.meta;

        if (e.keyCode === 37) {
          // left
          let newLeft =
            (parseInt(piece.el.style.left) || 0) - blockWidth || 0;
          newLeft = newLeft < leftEdge * -1 ? leftEdge * -1 : newLeft;
          piece.el.style.left = `${newLeft}px`;
        } else if (e.keyCode === 39) {
          // right
          let newLeft =
            (parseInt(piece.el.style.left) || 0) + blockWidth || 0;
          const maxLeft = this.dimensions.width - (leftEdge  + fWidth);
          newLeft = newLeft > maxLeft ? maxLeft : newLeft;
          piece.el.style.left = `${newLeft}px`;
        } else if (e.keyCode === 40) {
          // down
          const newTop =
            (parseInt(piece.el.style.top) || 0) + blockHeight || 0;
          piece.el.style.top = `${newTop}px`;
        } else {
          // Up key, let's try and rotate. If the rotation would cause the piece to
          // exceed the game boundaries or overlap another block, we'll try and adjust
          // the position to compensate.
          const {
            shape,
            blockHeight,
            blockWidth,
          } = piece.getState();
          
          const curX = parseInt(piece.el.style.left) || 0;
          const curY = parseInt(piece.el.style.top) || 0;

          const {
            leftEdge,
            fWidth,
          } = Piece.getMeta(Tetris.rotateMatrix(shape), blockWidth, blockHeight);

          Tetris.rotatePiece(piece);

          if (curX + leftEdge + fWidth > this.dimensions.width) {
            // over the right edge
          } else {
            console.log('you good big billz');
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
      // TOdO: nullify the piece in the state of the container board
      this._el.removeChild(activePiece.instance);
      activePiece.instance = null;
    }

    // const newPiece = PIECES[randomInt(0, PIECES.length - 1)];
    const newPiece = PIECES[0];
    const instance = newPiece.instance = new Piece({
      initialState: {
        shape: newPiece.shape,
        blockHeight,
        blockWidth,
      },
    });

    // const {
    //   leftEdge,
    //   fWidth,
    //   fHeight,
    // } = instance.meta;

    // instance.el.style.position = 'absolute';
    // instance.el.style.left =
    //   `${Math.floor(((this.dimensions.width - fWidth) / 2) - leftEdge)}px`;
    // instance.el.style.top =
    //   `${Math.floor((fHeight / 2) * -1)}px`;

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

      this._el.appendChild(this.activePieceContainer.el);
    }

    this.activePieceContainer.setState({ piece: instance });
    this._state.activePiece = newPiece;
  }
}

export default Tetris;