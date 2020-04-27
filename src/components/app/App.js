import React, { useRef, useEffect, useState } from 'react';
import Tetris from 'lib/tetris/Tetris';
import 'styles/main.scss';
import './App.scss';

function App() {
  const gameContainer = useRef(null);
  const [rows] = useState(18);
  const [cols] = useState(10);
  const [blockSize, setBlockSize] = useState(0);
  const [tetris, setTetris] = useState(null);
  const [paused, setPaused] = useState(false);

  const calcBlockSize = el => {
    const cWidth = el.clientWidth;
    const cHeight = el.clientHeight;
    let h = cHeight - 5;
    let w = h * .55555;

    if (w > cWidth - 10) {
      w = cWidth - 10;
    }

    return Math.floor(w / 10);
  };

  useEffect(() => {
    const tetrisEl = document.getElementById('tetris');
    // const tetrisCellEl = document.querySelector('html');
    const blockSize = calcBlockSize(tetrisEl);

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
      setBlockSize(calcBlockSize(tetrisEl));
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
      <header id="mainHeader">
        <div className="siteWidth">
          <h1>Tetris</h1>
        </div>
      </header>
      <main className="siteWidth">
        <div id="tetris">
          <div
            ref={gameContainer}
            style={{
              margin: '0 auto',
              backgroundColor: 'black',
              width: `${cols * blockSize}px`,
              height: `${rows * blockSize}px`,
            }}
          />
        </div>
        <aside id="tetris-level">
          <h1>Level</h1>
          <p>3</p>
        </aside>
        <aside id="tetris-score">
          <h1>Score</h1>
          <p>1,367</p>
        </aside>
        <aside id="tetris-high-score">
          <h1>High Score</h1>
          <p>9,843</p>
        </aside>
        <nav>
          <p style={{ width: '50%', height: '100%', backgroundColor: 'orange', float: 'left' }}></p>
          <p style={{ width: '50%', height: '100%', backgroundColor: 'green', float: 'left' }}></p>
        </nav>
      </main>
    </div>
  );
}

export default App;
