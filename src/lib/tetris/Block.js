import { shadeColor } from 'util/color';

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

    if (canvas.getContext) {
      const insetWidth = Math.min(
        Math.floor(size * .15),
        25
      );

      const ctx = canvas.getContext('2d');

      // light shade
      ctx.fillStyle = shadeColor(color, 25);
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(insetWidth, size - insetWidth);
      ctx.lineTo(insetWidth, insetWidth);
      ctx.lineTo(size - insetWidth, insetWidth);
      ctx.lineTo(size, 0);
      ctx.fill();

      // dark shade
      ctx.fillStyle = shadeColor(color, -25);
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(size - insetWidth, insetWidth);
      ctx.lineTo(size - insetWidth, size - insetWidth);
      ctx.lineTo(insetWidth, size - insetWidth);
      ctx.lineTo(0, size);
      ctx.lineTo(size, size);
      ctx.lineTo(size, 0);
      ctx.fill();
    }
  }

  get el() {
    return this._el;
  }

  get size() {
    return this._el.width;
  }  
}

export default Block;