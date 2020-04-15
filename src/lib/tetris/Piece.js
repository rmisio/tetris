import { memoize } from 'lodash';
import BaseVw from './BaseVw';
import Block from './Block';

/*
 * !! Be sure to treat the shape array as immutable otherwise the momoization
 * could return old results.
 */
const memoizedMeta = memoize(
  (shape, blockWidth, blockHeight) => {
    if (!Array.isArray(shape)) {
      throw new Error('The shape must be provided as an array.');
    }

    let firstColWithCell;
    let lastColWithCell;        
    let firstRowWithCell;
    let lastRowWithCell;

    shape.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        firstRowWithCell = !!cell && firstRowWithCell === undefined ?
          rowIndex : firstRowWithCell;
        lastRowWithCell = !!cell ?
          rowIndex : lastRowWithCell;
        firstColWithCell = !!cell &&
          (
            cellIndex < firstColWithCell ||
            firstColWithCell === undefined
          ) ?
          cellIndex : firstColWithCell;
        lastColWithCell = !!cell &&
          (
            cellIndex > lastColWithCell ||
            lastColWithCell === undefined                
          ) ?
          cellIndex : lastColWithCell;              
      });
    });

    // width and height include spacer blocks. fWidth and fHeight are
    // "functional" width and heights and don't include the spacer blocks.
    // For example, the fWidth would be the distance from the start of
    // the furthest left bock to the end of the furthest right one.
    const fWidth = (lastColWithCell - firstColWithCell + 1) * blockWidth;
    const fHeight = (lastRowWithCell - firstRowWithCell + 1) * blockHeight;
    const leftEdge = firstColWithCell * blockWidth;
    const topEdge = firstRowWithCell * blockHeight;

    return {
      width: (shape[0] || 0) * blockWidth,
      height: shape.length * blockHeight,
      fWidth,
      fHeight,
      leftEdge,
      rightEdge: leftEdge + fWidth,
      topEdge,
      botEdge: topEdge + fHeight,
    }
  }
);

class Piece extends BaseVw {
  constructor(options = {}) {
    const shape = options.initialState && options.initialState.shape;

    if (!Array.isArray(shape)) {
      throw new Error('A shape must be provided in the initialState as a 2d array of integers.');
    }

    super({
      ...options,
      initialState: {
        color: 'yellow',
        blockWidth: 30,
        blockHeight: 30,
        ...options.initialState,
      },
    });

    const container = this._el = document.createElement('div');
    container.style.position = 'relative';
    // container.style.backgroundColor = '#FFF';
    this._blocks = [];
    this.render();
  }

  static getMeta(shape, blockWidth, blockHeight) {
    return memoizedMeta(shape, blockWidth, blockHeight);
  }

  get meta() {
    const {
      shape,
      blockWidth,
      blockHeight,
    } = this.getState();
    return memoizedMeta(shape, blockWidth, blockHeight);
  }

  setState(state={}, options) {
    if (state.shape !== undefined && !Array.isArray(state.shape)) {
      throw new Error('The shape must be provided as an array.');
    } else if (state.shape === this.getState().shape) {
      // Let's ensure the shape is treating as an immutable so that we could
      // optimize certain methods which process it.
      throw new Error('Please only provide the shape if you are modifying it and if ' +
        'you are modifying it, please provide a new instance.')
    }

    return super.setState(state, options);
  }

  get el() {
    return this._el;
  }

  render() {
    const state = this.getState();

    let shape = state.shape;
    shape = Array.isArray(shape) ? shape : [];

    let blockIndex = 0;

    shape.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        if (!cell) return;

        let block = this._blocks[blockIndex];

        if (!block) {
          block = new Block(state.blockWidth, state.blockHeight, state.color);
          block.el.style.position = 'absolute';
          this._el.appendChild(block.el);
          this._blocks.push(block);
        }

        block.el.style.top = `${rowIndex * state.blockHeight}px`;
        block.el.style.left = `${cellIndex * state.blockWidth}px`;
        blockIndex++;
      });
    });

    // this._el.style.width = `${shape[0].length * state.blockWidth}px`;
    // this._el.style.height = `${shape.length * state.blockHeight}px`;
  }
}

export default Piece;