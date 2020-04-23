import React, { useRef, useEffect, useState } from 'react';
import Tetris from 'lib/tetris/Tetris';
import './App.css';

function App() {
  const gameContainer = useRef(null);
  const [rows] = useState(18);
  const [cols] = useState(10);
  const [blockSize, setBlockSize] = useState(0);
  const [tetris, setTetris] = useState(null);
  const [paused, setPaused] = useState(false);

  const calcBlockSize = htmlEl => {
    const cWidth = htmlEl.clientWidth;
    const cHeight = htmlEl.clientHeight;
    let h = cHeight * .85;
    let w = h * .55555;

    if (w > cWidth - 10) {
      w = cWidth - 10;
    }

    return Math.floor(w / 10);
  };

  useEffect(() => {
    const htmlEl = document.querySelector('html');
    const blockSize = calcBlockSize(htmlEl);

    const t = new Tetris(gameContainer.current, {
      initialState: {
        blockSize,
        rows,
        cols,
      }
    });

    // t.on('updateStats', e => console.dir(e));
    
    setTetris(t);
    setBlockSize(blockSize);

    const onResize = e => {
      setBlockSize(calcBlockSize(htmlEl));
    };

    window.addEventListener('resize', onResize);

    return () => {
      t.remove();
      setTetris(null);
      window.removeEventListener('resize', onResize);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tetris) {
      tetris.setState({ blockSize });
    }
  }, [tetris, blockSize])

  const handlePause = () => {
    if (!paused) {
      setPaused(true);
      tetris.stop();
    }
  };

  const handleStart = () => {
    if (paused) {
      setPaused(false);
      tetris.start();
    }
  };

  const ControlBtn =
    paused ?
      <button onClick={handleStart}>Start</button> :
      <button onClick={handlePause}>Pause</button>;

  return (
    <div className="App">
      <div
        ref={gameContainer}
        style={{
          margin: '0 auto',
          backgroundColor: 'black',
          width: `${cols * blockSize}px`,
          height: `${rows * blockSize}px`,
        }}
      />
      {ControlBtn}
    </div>
  );
}

export default App;
