import Block from './Block';

class LongPiece {
  constructor(blockWidth, blockHeight, color = 'yellow') {
    if (typeof blockWidth !== 'number' || Number.isNaN(blockWidth)) {
      throw new Error('blockWidth must be provided as a non NaN number.');
    }
    
    if (typeof blockHeight !== 'number' || Number.isNaN(blockHeight)) {
      throw new Error('blockHeight must be provided as a non NaN number.');
    }

    if (typeof color !== 'string' || !color.length) {
      throw new Error('color must be provided as a non-empty string.');
    }

    const container = this._el = document.createElement('div');
    container.style.position = 'relative';

    this._blocks = [
      new Block(blockWidth, blockHeight, color),
      new Block(blockWidth, blockHeight, color),
      new Block(blockWidth, blockHeight, color),
      new Block(blockWidth, blockHeight, color),
    ];


    this._blocks.forEach((block, index) => {
      block.el.style.position = 'absolute';
      block.el.style.top = `${index * blockHeight}px`;
      container.appendChild(block.el);
    });
  }

  get el() {
    return this._el;
  }
}

export default LongPiece;