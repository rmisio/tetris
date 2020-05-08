import { empty } from 'util/dom';
import BaseVw from './BaseVw';
import Piece from './Piece';

class PieceBoard extends BaseVw {
  constructor(options) {
    super({
      initialState: {
        rows: 18,
        cols: 10,
        blockSize: 30,
        position: [0, 0],
        ...options.initialState,
      }
    });

    this._el = document.createElement('div');
  }

  get el() {
    return this._el;
  }

  _checkDim(dim, name) {
    if (
      dim !== undefined &&
      !(
        Number.isInteger(dim) &&
        dim > 0
      )
    ) {
      throw new Error(`The ${name} must be provided as an integer > 0.`);
    }    
  }

  setState(state={}, options) {
    this._checkDim(state.rows);
    this._checkDim(state.cols);
    this._checkDim(state.blockSize);

    if (
      state.piece !== undefined &&
      (
        !(
          state.piece instanceof Piece ||
          state.piece === null
        )
      )
    ) {
      throw new Error('If providing the piece, it must be a Piece instance or null.');
    }

    const newState = {
      ...this.getState(),
      ...state,
    };

    if (
      state.position !== undefined &&
      !(
        Array.isArray(state.position) &&
        state.position.length === 2 &&
        Number.isInteger(state.position[0]) &&
        Math.abs(state.position[0]) <= newState.cols &&
        Number.isInteger(state.position[1]) &&
        Math.abs(state.position[1]) <= newState.rows
      )
    ) {
      // TODO: break up this if for a less ambiguous error messages.
      throw new Error('The position must be a 2 item array, both of which are integers.' +
        'The first integer must be less than or equal to the absolute width. The second must be ' +
        'less than or equal to the absolute height.');
    }

    return super.setState(state, options);
  }

  render() {
    const {
      piece,
      blockSize,
      position,
      cols,
      rows,
    } = this.getState();

    empty(this._el);
    this._el.style.width = `${blockSize * cols}px`;
    this._el.style.height = `${blockSize * rows}px`;    

    if (piece) {
      piece.el.style.position = 'absolute';
      piece.el.style.left = `${position[0] * blockSize}px`;
      piece.el.style.top = `${position[1] * blockSize}px`;
      this._el.appendChild(piece.el);
    }

    return this;
  }
}

export default PieceBoard;