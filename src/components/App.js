import React, { useRef, useEffect, useState } from 'react';
import Tetris from 'lib/tetris/Tetris';
import './App.css';

function App() {
  const gameContainer = useRef(null);
  const tetrisWidth = 210;
  // const tetrisWidth = 300;
  const [tetris, setTetris] = useState(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setTetris(new Tetris(gameContainer.current, tetrisWidth));
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
          width: `${tetrisWidth}px`, 
        }}
      />
      {ControlBtn}
    </div>
  );
}

export default App;
