import { isElement } from 'lodash';
import { randomInt } from 'util/number';
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

class Tetris {
  constructor(el, width = 330) {
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
      blocks: [],
      lineCount: 0,
      points: 0,
      gameOver: false,
      level: 1,
      speedFactor: 10,
      keyMoveIncrement: 10,
      dropMoveIncrement: 20,
    };

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
        const { keyMoveIncrement, dropMoveIncrement } = this._state;
        piece = piece.instance;

        if (e.keyCode === 37) {
          let newLeft =
            parseInt(piece.el.style.left) - keyMoveIncrement || 0;
          newLeft = newLeft < piece.edges.leftEdge * -1 ? piece.edges.leftEdge * -1 : newLeft;
          piece.el.style.left = `${newLeft}px`;
        } else if (e.keyCode === 39) {
          let newLeft =
            parseInt(piece.el.style.left) + keyMoveIncrement || 0;
          const maxLeft = this.dimensions.width - (piece.edges.leftEdge  + piece.width);
          newLeft = newLeft > maxLeft ? maxLeft : newLeft;
          piece.el.style.left = `${newLeft}px`;
        } else if (e.keyCode === 40) {
          const newTop =
            parseInt(piece.el.style.top) + dropMoveIncrement || 0;
          // piece.el.style.right = `${newRight < this.dimensions.width ? 0 : newRight}px`;
          piece.el.style.top = `${newTop}px`;
        } else {
          // up key, let's try and rotate
          this.rotatePiece(piece);
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

  // https://stackoverflow.com/a/42581396
  rotatePiece(piece) {
    const result = [];
    const shape = piece.getState().shape;

    shape.forEach(function (a, i, aa) {
      a.forEach(function (b, j, bb) {
        result[j] = result[j] || [];
        result[j][aa.length - i - 1] = b;
      });
    });

    piece.setState({ shape: result });
  }

  dropNewPiece() {
    const { activePiece } = this._state;

    if (activePiece) {
      this._el.removeChild(activePiece.instance);
      activePiece.instance = null;
    }

    // const newPiece = PIECES[randomInt(0, PIECES.length - 1)];
    const newPiece = PIECES[0];
    const instance = newPiece.instance = new Piece({
      initialState: {
        shape: newPiece.shape,
      },
    });

    instance.el.style.position = 'absolute';
    instance.el.style.left =
      `${Math.floor((this.dimensions.width - instance.width - instance.edges.leftEdge) / 2)}px`;
    instance.el.style.top =
      `${Math.floor((instance.height / 2) * -1)}px`;
    this._el.appendChild(instance.el);
    this._state.activePiece = newPiece;
  }
}

export default Tetris;