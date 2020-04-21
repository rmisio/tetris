// TODO: blockwidth and blockheight condensed into one blocksize
// TODO: ensure shape is always a square (probably beyond this file)
// TODO: remove the debugging el IDs
// TODO: ensure color across app hex

import Events from 'events';
import { isElement, memoize } from 'lodash';
import { randomInt } from 'util/number';
import BaseVw from './BaseVw.js';
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

// todo: change el to container.
class Tetris extends BaseVw {
  constructor(el, options={}) {
    // todo: switch to rows, cols and blockSize. simple as a pimple dog.

    if (!isElement(el)) {
      throw new Error('Please provide a valid dom element.');
    }

    const initialState = {
      cols: 10,
      rows: 18,
      blockSize: 30,
      started: false,
      gameOver: false,
      activePiece: null,
      lines: 0,
      level: 1,        
      activePieceDropSpeedFactor: 500,
      ...options.initialState,      
    };

    initialState.blocks = [
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
      [null, { color: '#42f557', size: initialState.blockSize }, null, null, null, null, null, null, null, null],
      [null, { color: '#42f557', size: initialState.blockSize }, null, null, null, null, null, null, null, null],
      [null, { color: '#42f557', size: initialState.blockSize }, null, null, null, null, null, null, null, null],
      [null, { color: '#42f557', size: initialState.blockSize }, null, null, null, null, null, null, null, null],
      [
        { color: '#42f557', size: initialState.blockSize },
        { color: '#42f557', size: initialState.blockSize },
        { color: '#42f557', size: initialState.blockSize },
        null,
        null, null, null, null, null, null
      ],
      [
        { color: '#42c8f5', size: initialState.blockSize },
        { color: '#42c8f5', size: initialState.blockSize },
        { color: '#42c8f5', size: initialState.blockSize },
        { color: '#42c8f5', size: initialState.blockSize },
        null, null, null, null, null, null
      ],
    ];

    super({ initialState });

    Object.assign(this, Events.prototype);

    const {
      blockSize,
      rows,
      cols,
      blocks,
    } = this.getState();

    const container = this._el = document.createElement('div');
    container.style.width = `${blockSize * cols}px`;
    container.style.height = `${blockSize * rows}px`;
    container.style.position = 'relative';

    document.addEventListener('keydown', this.onKeyDown.bind(this), false);

    el.appendChild(container);

    this.blocksBoard = new BlocksBoard({
      initialState: {
        blocks,
        rows,
        cols,
        blockSize,
      },
    });
    this.blocksBoard._el.style.position = 'absolute';
    this._el.appendChild(this.blocksBoard.render().el);

    this.start();
  }

  get el() {
    return this._el;
  }

  setState(state = {}, options = {}) {
    const prevState = this.getState();

    super.setState(state, {
      ...options,
      // todo: test me
      renderOnChange: false,
    });

    if (options.beingConstructed) return this;

    const {
      blocks,
      rows,
      cols,
      blockSize,
      lines,
      score,
      level,
    } = this.getState();

    // funnel state to child components

    if (this.blocksBoard) {
      this.blocksBoard.setState({
        blocks, rows, cols, blockSize,
      });
    }

    // if necessary, fire change events
    if (
      prevState.lines !== lines ||
      prevState.score !== score ||
      prevState.level !== level
    ) {
      this.emit('updateStats', { lines, score, level });
    }

    return this;
  }

  // todo: memoize me
  // would need blocks passed in.
  willFit(pieceMeta, shape, pos) {
    const {
      cols,
      rows,
      blocks,
    } = this.getState();

    // check if we are within game boundaries
    if (
      pos[0] < pieceMeta.leftEdge * -1 ||
      pos[0] > cols - pieceMeta.rightEdge ||
      pos[1] > rows - pieceMeta.botEdge
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
          blocks[pos[1] + i] &&
          blocks[pos[1] + i][pos[0] + j]
        ) {
          foundOverlap = true;
          break;
        }
      }

      if (foundOverlap) break;
    }

    return !foundOverlap;
  }

  // TODO: memoize if reasonable
  // TODO: check args  
  isGrounded(pieceMeta, shape, pos) {
    const {
      rows,
      blocks,
    } = this.getState();

    if (pos[1] + pieceMeta.botEdge >= rows) return true;

    // TODO: this won't be needed if checking args.
    const shapeArr = Array.isArray(shape) ? shape : [[]];
    for (let i = 0; i < shapeArr.length; i++) {
      for (let j = 0; j < shapeArr[i].length; j++) {
        const cell = shapeArr[i][j];
        if (
          cell &&
          blocks[pos[1] + i + 1] &&
          blocks[pos[1] + i + 1][pos[0] + j]
        ) {
          return true;
        }
      }
    }

    return false;
  }

  onKeyDown(e) {
    const {
      started,
      activePiece,
    } = this.getState();

    if (
      !(
        e.keyCode >= 37 &&
        e.keyCode <= 40 &&
        started &&
        activePiece
      )
    ) {
      return;
    }

    e.preventDefault();

    requestAnimationFrame(() => {
      let piece = activePiece;

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
            newPos = [curPos[0], curPos[1] + 2];
          }

          if (this.willFit(piece.meta, piece.getState().shape, newPos)) {
            this.activePieceContainer.setState({ position: newPos });
          }
        } else {
          // up key, let's rotate
          const { blockSize } = this.getState();
          const rotatedShape = Tetris.rotateMatrix(piece.getState().shape);
          const pieceMeta = Piece.getMeta(
            rotatedShape,
            blockSize,
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

  // todo: I am memoizable
  computeScore(lineCount, level) {
    return (50 * level) + ((lineCount - 1) * 10);
  }

  rafTick() {
    window.cancelAnimationFrame(this._progressPieceRaf);
    this._progressPieceRaf =
      window.requestAnimationFrame(this.tick.bind(this));; 
  }

  tick(timestamp) {
    const {
      started,
      gameOver,
      activePiece,
      level,
      activePieceDropSpeedFactor,
    } = this.getState();

    if (!started || gameOver || !activePiece) return;

    // check for game over

    const piece = activePiece.instance;
    const { shape, color } = piece.getState();
    const curPos = this.activePieceContainer.getState().position;

    if (
      this.isGrounded(
        piece.meta,
        piece.getState().shape,
        this.activePieceContainer.getState().position
      )
    ) {
      const { blockSize, blocks, cols } = this.getState();
      const lines = [];
      const rowsLineChecked = [];
      let updatedBlocks = [...blocks];

      // Turn the active piece into individual blocks that we can remove
      // if / when they become a line.
      shape.forEach((row, rowIndex) => {
        row.forEach((col, colIndex) => {
          if (col) {
            const blocksRowIndex = curPos[1] + rowIndex;

            updatedBlocks[blocksRowIndex] =
              updatedBlocks[blocksRowIndex].map((cell, cellIndex) => {
                if (cellIndex === curPos[0] + colIndex) {
                  return {
                    color,
                    size: blockSize,
                  }
                }

                return cell;
              });

            
            // identify if we have any full lines
            if (
              !rowsLineChecked.includes(blocksRowIndex) &&
              updatedBlocks[blocksRowIndex].find(block => !block) === undefined
            ) {
              rowsLineChecked.push(blocksRowIndex);
              lines.push(blocksRowIndex);
            }
          }
        });
      });

      const newState = { blocks: updatedBlocks };
      this.clearActivePiece();

      if (lines.length) {
        this._lineRemovals = lines.map(lineIndex =>
          this
            .blocksBoard
            .animateRowPreRemoval(lineIndex)
        );
        
        Promise
          .all(this._lineRemovals.map(l => l.promise))
          .then(() => {
            updatedBlocks = [
              ...lines.map(line => Array(cols).fill(null)),
              ...updatedBlocks.filter((row, rowIndex) => !lines.includes(rowIndex))
            ];
            this.setState({ blocks: updatedBlocks });
            this._lineRemovals = null;
            this.dropNewPiece();
          });

          newState.lines = lines.length;
          newState.score += this.computeScore(lines.length, this.getState().level);
          // todo: update level
      } else {
        this.dropNewPiece();
      }

      this.setState(newState);

      return;
    }

    this.activePieceContainer.setState({ position: [curPos[0], curPos[1] + 1] });

    window.clearTimeout(this._tickTimeout);
    this._tickTimeout = window.setTimeout(() => {
      window.requestAnimationFrame(this.tick.bind(this));
    }, activePieceDropSpeedFactor - ((level - 1) * 100));
    // TODO: that will be 0 at a high enouggh level. Prevent it going below 20.    
  }

  clearActivePiece() {
    if (this.activePieceContainer) {
      this.activePieceContainer.setState({ piece: null });
    }
  }

  dropNewPiece() {
    const { blockSize, cols } = this.getState();

    const colors = [
      '#cb42f5',
      '#f5b342',
      '#f5427b',
    ];

    this.clearActivePiece();
    const newPiece = PIECES[randomInt(0, PIECES.length - 1)];
    const instance = newPiece.instance = new Piece({
      initialState: {
        shape: newPiece.shape,
        blockSize,
        color: colors[randomInt(0, colors.length - 1)],
      },
    });

    if (!this.activePieceContainer) {
      const {
        rows,
        cols,
        blockSize,
      } = this.getState();

      this.activePieceContainer = new ActivePieceBoard({
        initialState: {
          cols,
          rows,
          blockSize,
        },
      }).render();
      this.activePieceContainer._el.style.position = 'absolute';
      this._el.appendChild(this.activePieceContainer.el);
    }

    const {
      fWidth,
      fHeight,
      leftEdge,
      topEdge,
    } = instance.meta;    

    this.activePieceContainer.setState({
      piece: instance,
      position: [
        Math.floor((cols - fWidth) / 2) - leftEdge,
        (Math.floor(fHeight / 2)  + topEdge) * -1
      ],
    });
    this.setState({ activePiece: newPiece });
    this.rafTick();
  }

  start() {
    const {
      started,
      gameOver,
      activePiece,
    } = this.getState();

    if (!started && !gameOver) {
      this.setState({ started: true });

      if (!activePiece) {
        this.dropNewPiece();
      } else {
        this.rafTick();
      }

      // resume any line removal animations
      (this._lineRemovals || [])
        .forEach(l => l.resume());
      }
  }

  stop() {
    this.setState({ started: false });
    window.cancelAnimationFrame(this._progressPieceRaf);
    window.clearTimeout(this._tickTimeout);

    // pause any line removal animations
    (this._lineRemovals || [])
      .forEach(l => l.stop());
  }

  remove() {
    this.stop();
    document.removeEventListener('keydown', this.onKeyDown, false);
    this.removeAllListeners();
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
}

export default Tetris;