import React, { useRef, useEffect } from 'react';
import Tetris from 'lib/tetris/Tetris';
import './App.css';

function App() {
  const gameContainer = useRef(null);
  const tetrisWidth = 210;
  // const tetrisWidth = 300;
  let tetris;

  useEffect(() => {
    tetris = new Tetris(gameContainer.current, tetrisWidth);
  });

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
    </div>
  );
}

export default App;
