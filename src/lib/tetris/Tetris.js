import isElement from 'lodash';
import Piece from './Piece';

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

    this.piece1 = new Piece({
      initialState: {
        color: 'pink',
        shape: [
          [0, 1, 0],
          [1, 1, 0],
          [0, 1, 0],
        ],        
      }
    });
    this.piece1.el.style.position = 'absolute';
    container.appendChild(this.piece1.el);

    this.piece2 = new Piece({
      initialState: {
        color: 'yellow',
        shape: [
          [0, 1, 0, 0],
          [0, 1, 0, 0],
          [0, 1, 0, 0],
          [0, 1, 0, 0],
        ],        
      }
    });
    this.piece2.el.style.position = 'absolute';
    this.piece2.el.style.left = `${this.piece1.width - this.piece2.coords.x + 15}px`;
    this.piece2.el.style.top = `${this.piece1.height - this.piece2.coords.y + 15}px`;
    container.appendChild(this.piece2.el);

    this.piece3 = new Piece({
      initialState: {
        color: 'orange',
        shape: [
          [0, 0, 1, 1, 0],
          [0, 0, 1, 0, 0],
          [0, 0, 1, 1, 1],
          [0, 0, 1, 0, 0],
          [0, 1, 1, 0, 0],
        ],        
      }
    });
    this.piece3.el.style.position = 'absolute';
    this.piece3.el.style.left = `${this.piece1.width + 15 + this.piece2.width + 15 - this.piece3.coords.x}px`;
    this.piece3.el.style.top = `${this.piece1.height + 15 + this.piece2.height + 15 - this.piece3.coords.y}px`;
    container.appendChild(this.piece3.el);

    document.addEventListener('keydown', this.onKeyDown.bind(this), false);
    document.addEventListener('keyup', this.onKeyUp.bind(this), false);

    el.appendChild(container);

    this._state = {
      started: false,
      // activePiece: null,
      activePiece: this.longPiece,
      blocks: [],
      lineCount: 0,
      points: 0,
      gameOver: false,
    };
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
      [37, 39, 40].includes(e.keyCode)) {      
      // [37, 39, 40].includes(e.keyCode) &&
      // this._state.started &&
      // this._state.activePiece) {
      this.rotatePiece(this.piece2);
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    
  }

  start() {
    if (!this._state.started && ! this._state.gameOver) {
      this._state.started = true;
    }
  }

  destroy() {
    document.removeEventListener('keydown', this.onKeyDown, false);
    document.removeEventListener('keyup', this.onKeyUp, false);    
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
}

export default Tetris;