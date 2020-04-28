import React, { useRef, useEffect, useState } from 'react';
import Tetris from 'lib/tetris/Tetris';
import 'styles/main.scss';
import './App.scss';

function App() {
  const mainGrid = useRef(null);
  const [rows] = useState(18);
  const [cols] = useState(10);
  const [blockSize, setBlockSize] = useState(0);
  const [tetris, setTetris] = useState(null);
  const [paused, setPaused] = useState(false);
  const initialMainGTCMobile = 'repeat(6, 1fr)';
  const initialMainGTCDesktop = 'minmax(82px, 1fr) 2fr minmax(82px, 1fr);';

  const calcBlockSize = () => {
    const el = mainGrid.current;
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
    const tetrisEl = mainGrid.current.children[0];
    const blockSize = calcBlockSize();

    const t = new Tetris(tetrisEl, {
      initialState: {
        blockSize,
        rows,
        cols,
      }
    });

    // tetrisEl.style.alignSelf = 'end';

    // t.on('updateStats', e => console.dir(e));
    
    setTetris(t);
    setBlockSize(blockSize);

    const onResize = e => {
      setBlockSize(calcBlockSize());
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
      // this got fugly :(
      const { matches } = window.matchMedia('(min-width: 48em)');
      const tetrisEl = mainGrid.current.children[0];

      if (matches) {
        mainGrid.current.style.gridTemplateColumns = initialMainGTCDesktop;
      } else {
        // mainGrid.current.style.gridTemplateColumns = initialMainGTCMobile;
      }

      tetrisEl.style.alignSelf = 'stretch';
      tetris.setState({ blockSize });
      tetrisEl.style.alignSelf = 'end';
      
      if (matches) {
        mainGrid.current.style.gridTemplateColumns =
          `minmax(82px, 1fr) ${blockSize * cols}px minmax(82px, 1fr)`;
      }
    }
  }, [tetris, blockSize, cols])

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
      <main className="siteWidth" ref={mainGrid}>
        <div id="tetris" />
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
