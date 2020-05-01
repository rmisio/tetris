// todo: warn that empy cell must be null

import { v1 as uuid } from 'uuid';
import { empty } from 'util/dom';
import BaseVw from './BaseVw';
import Block from './Block';

// https://easings.net/
function easeInSine(x) {
  return 1 - Math.cos((x * Math.PI) / 2);
}

function easeOutSine(x) {
  return Math.sin((x * Math.PI) / 2);
}

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

    this._el = document.createElement('div');
    // TODO: remove these dubugging IDs
    this._el.id = 'BLOCKS_BOARD';
    this._rowRemovalAnims = {};
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
    this._checkDim(state.rows, 'rows');
    this._checkDim(state.cols, 'cols');
    this._checkDim(state.blockSize, 'blockSize');

    if (
      state.blocks !== undefined &&
      (!Array.isArray(state.blocks))
    ) {
      throw new Error('If providing the blocks, it must be an array.');
    }

    return super.setState(state, options);
  }

  setRowPreRemovalVal(key, val) {
    this._rowPreRemovalRafMap = this._rowPreRemovalRafMap || {};
    this._rowPreRemovalRafMap[key] = val;
  }

  cancelRowPreRemovalRaf(key) {
    if (this._rowPreRemovalRafMap) {
      const raf = this._rowPreRemovalRafMap[key];
      if (raf !== undefined) window.cancelAnimationFrame(raf);
    }
  }  

  // todo: note about startState, only pass in under certain conditions.
  animateRowPreRemoval(index) {
    if (!Number.isInteger(index)) {
      throw new Error('The index must be provided as an integer.');
    }

    const getRow = () => {
      const r = this._el.children[index];

      if (!r) {
        throw new Error(`There is no row element corresponding to index ${index}.`);
      }

      return r;
    };

    let row = getRow();

    const state = {
      time: 100,
      curBlink:  0,
      start: null,
      stepOut: true,
      isStopped: false,
      stoppedAt: 0,
      timeStopped: 0,
    };   

    if (this._rowRemovalAnims[index]) {
      this._rowRemovalAnims[index].cancel();
      delete this._rowRemovalAnims[index];
    }

    let cancel;
    let stop;
    let resume;

    const promise = new Promise((resolve, reject) => {
      const pid = uuid();
      const time = Math.round(state.time / 4);
      const blinkCount = 2;

      const makeAStep = () => {
        state.isStopped = false;
        this.cancelRowPreRemovalRaf(pid);
        this.setRowPreRemovalVal(pid, window.requestAnimationFrame(step));
      }      

      cancel = () => {
        this.cancelRowPreRemovalRaf(pid);
        row.style.opacity = 1;
        delete this._rowRemovalAnims[index];
        reject('canceled');
      };

      stop = () => {
        state.isStopped = true;
        state.stoppedAt = performance.now();
        this.cancelRowPreRemovalRaf(pid);
      };

      resume = (options = {}) => {
        const opts = {
          requeryRow: false,
          ...options,
        };

        if (state.isStopped) {
          if (opts.requeryRow) {
            row = getRow();
          }

          state.timeStopped += performance.now() - state.stoppedAt;
          makeAStep();
        }
      };

      function step(timestamp) {
        if (!state.start) {
          state.start = timestamp;
          state.timeStopped = 0;
        }
        
        const progress = timestamp - state.start - state.timeStopped;

        if (state.stepOut) {
          row.style.opacity = 1 - easeOutSine(Math.min(progress / time, 1));
        } else {
          row.style.opacity = easeInSine(progress / time);
        }

        if (progress < time) {
          makeAStep();
        } else if (state.stepOut) {
          state.start = null;
          state.stepOut = false;
          makeAStep();
        } else {
          state.curBlink += 1;

          if (state.curBlink < blinkCount) {
            state.start = null;
            state.stepOut = true;
            makeAStep();
          } else {
            resolve();
          }
        }
      }

      makeAStep();
    });

    const returnVal = this._rowRemovalAnims[index] = {
      promise,
      cancel,
      stop,
      resume,
    };

    return returnVal;
  }

  render() {
    const {
      blocks,
      blockSize,
      cols,
      rows,
    } = this.getState();

    empty(this._el);
    this._el.style.width = `${blockSize * cols}px`;
    this._el.style.height = `${blockSize * rows}px`;

    Object
      .keys(this._rowRemovalAnims)
      .forEach(rowIndex => this._rowRemovalAnims[rowIndex].stop());

    (blocks || []).forEach((row, rowIndex) => {
      if (!Array.isArray(row)) {
        console.warn(`Skipping row at index ${rowIndex} because it is not an Array.`);
        return;
      }

      const rowEl = document.createElement('div');

      row.forEach((cell, cellIndex) => {
        if (cell && typeof cell === 'object') {
          let block;

          try {
            block = new Block(blockSize, cell.color);
          } catch (e) {
            console.warn(`Unable to create block at [${rowIndex}, ${cellIndex}]:`, e);
            return;
          }

          block.el.style.position = 'absolute';
          block.el.style.left = `${cellIndex * blockSize}px`;
          block.el.style.top = `${rowIndex * blockSize}px`;
          rowEl.appendChild(block.el);
        }
      });

      if (row.length) {
        this._el.appendChild(rowEl);
      }
    });

    return this;
  }
}

export default BlocksBoard;