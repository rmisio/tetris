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

  animateRowPreRemoval(index) {
    if (!Number.isInteger(index)) {
      throw new Error('The index must be provided as an integer.');
    }

    const row = this._el.children[index];

    if (!row) {
      throw new Error('The provided index does not correspond to any rows ' +
        'rendered by this element.');
    }

    let cancel;
    let stop;
    let resume;

    const promise = new Promise((resolve, reject) => {
      const pid = uuid();
      const time = 50; // this times 4 is the total anim time
      const blinkCount = 2;
      let curBlink =  0;
      let start = null;
      let stepOut = true;
      let isStopped = false;
      let stoppedAt = 0;
      let timeStopped = 0;

      const makeAStep = () => {
        isStopped = false;
        this.cancelRowPreRemovalRaf(pid);
        this.setRowPreRemovalVal(pid, window.requestAnimationFrame(step));
      }      

      cancel = () => {
        this.cancelRowPreRemovalRaf(pid);
        row.style.opacity = 1;
        reject('canceled');
      };

      stop = () => {
        isStopped = true;
        stoppedAt = performance.now();
        this.cancelRowPreRemovalRaf(pid);
      };

      resume = () => {
        if (isStopped) {
          timeStopped += performance.now() - stoppedAt;
          makeAStep();
        }
      };

      function step(timestamp) {
        if (!start) {
          start = timestamp;
          timeStopped = 0;
        }
        
        const progress = timestamp - start - timeStopped;

        if (stepOut) {
          row.style.opacity = 1 - easeOutSine(Math.min(progress / time, 1));  
        } else {
          row.style.opacity = easeInSine(progress / time);
        }

        if (progress < time) {
          makeAStep();
        } else if (stepOut) {
          start = null;
          stepOut = false;
          makeAStep();
        } else {
          curBlink += 1;

          if (curBlink < blinkCount) {
            start = null;
            stepOut = true;
            makeAStep();
          } else {
            resolve();
          }
        }
      }

      makeAStep();
    });

    return {
      promise,
      cancel,
      stop,
      resume,
    };
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

      const rowEl = document.createElement('div');

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