import Block from './Block';

class LeftL {
  constructor(blockWidth, blockHeight, options) {
    if (typeof blockWidth !== 'number' || Number.isNaN(blockWidth)) {
      throw new Error('blockWidth must be provided as a non NaN number.');
    }
    
    if (typeof blockHeight !== 'number' || Number.isNaN(blockHeight)) {
      throw new Error('blockHeight must be provided as a non NaN number.');
    }

    const options = this._options = {
      color: 'yellow',
      orientation: 0,
    };

    if (typeof options.color !== 'string' || !options.color.length) {
      throw new Error('The color options must be a non-empty string.');
    }

    if (
      !Number.isInteger(options.orientation) ||
      options.orientation < 0 ||
      options.orientation < 3
    ) {
      throw new Error('The orientation option must be an integer between 0 and 3.');
    }

    this.blockHeight = blockHeight;
    this.blockWidth = blockWidth;

    this._blocks = [
      new Block(blockWidth, blockHeight, options.color),
      new Block(blockWidth, blockHeight, options.color),
      new Block(blockWidth, blockHeight, options.color),
      new Block(blockWidth, blockHeight, options.color),
    ];

    const container = this._el = document.createElement('div');
    container.style.position = 'relative';

    this._blocks.forEach((block, index) => {
      block.el.style.position = 'absolute';
      this._el.appendChild(block.el);
    });

    this.render();
  }

  get el() {
    return this._el;
  }

  render() {
    this._blocks.forEach((block, index) => {
      block.el.style.top = `${index * this.blockHeight}px`;
    });
  }
}