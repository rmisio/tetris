class Block {
  constructor(size = 30, color = 'yellow') {
    if (typeof size !== 'number' || Number.isNaN(size)) {
      throw new Error('size must be provided as a non NaN number.');
    }
    
    if (typeof color !== 'string' || !color.length) {
      throw new Error('color must be provided as a non-empty string.');
    }

    const canvas = this._el = document.createElement('canvas');
    canvas.width = canvas.height = size;
    canvas.style.backgroundColor = color;
  }

  get el() {
    return this._el;
  }

  get size() {
    return this._el.width;
  }  
}

export default Block;