import React, { useRef, useEffect, useState } from 'react';
import Tetris from 'lib/tetris/Tetris';
import './App.css';

function App() {
  const gameContainer = useRef(null);
  const [rows, setRows] = useState(18);
  const [cols, setCols] = useState(10);
  const [blockSize, setBlockSize] = useState(15);
  const [tetris, setTetris] = useState(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const tetris = new Tetris(gameContainer.current, {
      initialState: {
        blockSize,
        rows,
        cols,
      }
    });

    // TODO: remove me on unmount
    tetris.on('updateStats', e => console.dir(e));
    setTetris(tetris);
  }, []);

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
