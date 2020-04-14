import { memoize } from 'lodash';
import { empty } from 'util/dom';
import BaseVw from './BaseVw';
import Block from './Block';

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

    this._memoizedMeta = memoize(
      (shape, blockWidth, blockHeight) => {
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

        return {
          width: (lastColWithCell - firstColWithCell + 1) * blockWidth,
          height: (lastRowWithCell - firstRowWithCell + 1) * blockHeight,
          x: firstColWithCell * blockWidth,
          y: firstRowWithCell * blockHeight,
        }
      }
    );

    const container = this._el = document.createElement('div');
    container.style.position = 'relative';
    this._blocks = [];
    this.render();
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

  // https://stackoverflow.com/a/42581396
  rotate() {
    const result = [];
    // array.forEach(function (a, i, aa) {
    //     a.forEach(function (b, j, bb) {
    //         result[j] = result[j] || [];
    //         result[j][aa.length - i - 1] = b;
    //     });
    // });
    return result;
  }

  /*
   * Returns functional width, meaning the distance from the start of
   * the furthest left bock to the end of the furthest right one.
   */
  get width() {
    const state = this.getState();
    const { width } = this._memoizedMeta(state.shape, state.blockWidth, state.blockHeight);
    return width;
  }

  /*
   * Returns functional height, meaning the distance from the top of
   * the top-most bock to the bottom of the bottom-most bock.
   */
  get height() {
    const state = this.getState();
    const { height } = this._memoizedMeta(state.shape, state.blockWidth, state.blockHeight);
    return height;
  }

  /*
   * Returns the x and y position of the top-most and left-most block.
   */
  get coords() {
    const state = this.getState();
    const { x, y } = this._memoizedMeta(state.shape, state.blockWidth, state.blockHeight);
    return { x, y };
  }

  render() {
    const state = this.getState();

    empty(this._el);
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
  }
}

export default Piece;