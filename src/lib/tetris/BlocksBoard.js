import { empty } from 'util/dom';
import BaseVw from './BaseVw';
import Block from './Block';

class BlocksBoard extends BaseVw {
  constructor(options={}) {
    super({
      initialState: {
        rows: 18,
        cols: 10,
        blockSize: 30,
        blocks: [],
        ...options.initialState,
      }
    });

    const {
      rows,
      cols,
      blockSize,
    } = this.getState();

    this._el = document.createElement('div');
    this._el.id = 'BLOCKS_BOARD';
    this._el.style.width = `${blockSize * cols}px`;
    this._el.style.height = `${blockSize * rows}px`;
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
      throw new Error(`The ${name } must be provided as an integer > 0.`);
    }    
  }

  setState(state={}, options) {
    this._checkDim(state.rows);
    this._checkDim(state.cols);
    this._checkDim(state.blockSize);

    if (
      state.blocks !== undefined &&
      (!Array.isArray(state.blocks))
    ) {
      throw new Error('If providing the blocks, it must be an array.');
    }

    return super.setState(state, options);
  }

  render() {
    const {
      blocks,
      blockSize,
    } = this.getState();

    empty(this._el);

    (blocks || []).forEach((row, rowIndex) => {
      if (!Array.isArray(row)) {
        console.warn(`Skipping row at index ${rowIndex} because it is not an Array.`);
        return;
      }

      row.forEach((cell, cellIndex) => {
        if (cell && typeof cell === 'object') {
          let block;

          try {
            block = new Block(cell.size, cell.color);
          } catch (e) {
            console.warn(`Unable to create block at [${rowIndex}, ${cellIndex}]:`, e);
            return;
          }

          block.el.style.position = 'absolute';
          block.el.style.left = `${cellIndex * blockSize}px`;
          block.el.style.top = `${rowIndex * blockSize}px`;
          this._el.appendChild(block.el);
        }
      });
    });

    return this;
  }
}

export default BlocksBoard;