import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useState
} from 'react';
import IosPlay from 'react-ionicons/lib/IosPlay';
import IosRefresh from 'react-ionicons/lib/IosRefresh';
import IosPause from 'react-ionicons/lib/IosPause';
import Tetris from 'lib/tetris/Tetris';
import Level from './Level';
import Score from './Score';
import 'styles/main.scss';
import './App.scss';

function App() {
  const mainGrid = useRef(null);
  const [rows] = useState(18);
  const [cols] = useState(10);
  const [tetris, setTetris] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [calcTetrisLayout, setCalcTetrisLayout] = useState(true);
  const [level, setLevel] = useState(1);
  const [percentToNextLevel, setPercentToNextLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(localStorage.getItem('highScore') || 0);
  const [showHelp, setShowHelp] = useState(true);

  // todo: instead of these shennanigans, just remove the inline style
  // to reset it!
  const initialMainGTCMobile = 'repeat(3, 1fr)';
  const initialMainGTCDesktop = 'minmax(82px, 1fr) 2fr minmax(82px, 1fr)';

  const updateStats = e => {
    console.dir(e);
    setLevel(e.level);
    setPercentToNextLevel(e.percentToNextLevel);
    setScore(e.score);

    if (e.score > highScore) {
      setHighScore(e.score);
      localStorage.setItem('highScore', e.score);
    }
  };

  useEffect(() => {
    const onResize = e => {
      setCalcTetrisLayout(true);
    };

    window.addEventListener('resize', onResize);

    return () => {
      if (tetris) tetris.remove();
      setTetris(null);      
      window.removeEventListener('resize', onResize);
    };
    // TODO: disable eslint
  }, []);

  // TODO: is useLayoutEffect needed here
  useLayoutEffect(() => {
    const mainGridEl = mainGrid.current;

    if (calcTetrisLayout) {
      const { matches } = window.matchMedia('(min-width: 48em)');
      const tetrisContainer = mainGrid.current.children[0];

      if (matches) {
        mainGrid.current.style.gridTemplateColumns = initialMainGTCDesktop;
      } else {
        mainGrid.current.style.gridTemplateColumns = initialMainGTCMobile;
      }

      tetrisContainer.style.height = '100%';
      const tetrisGameEl = tetrisContainer.children[0];

      if (tetrisGameEl) {
        tetrisGameEl.style.display = 'none';
      }

      const cWidth = tetrisContainer.clientWidth;
      const cHeight = tetrisContainer.clientHeight;
      let h = cHeight - 5;
      let w = h * .55555;

      if (w > cWidth - 10) {
        w = cWidth - 10;
      }

      const blockSize =  Math.floor(w / 10);

      if (!tetris) {
        const t = new Tetris(tetrisContainer, {
          initialState: {
            blockSize,
            rows,
            cols,
          }
        });

        setTetris(t);
        t.on('updateStats', updateStats);
      } else {
        tetris.setState({ blockSize });  
      }

      tetrisContainer.children[0].style.display = 'block';
      tetrisContainer.style.height = '';
      
      if (matches) {
        mainGridEl.style.gridTemplateColumns =
          `minmax(82px, 1fr) ${blockSize * cols}px minmax(82px, 1fr)`;
      }      

      setCalcTetrisLayout(false);
    }
  }, [tetris, cols, rows, calcTetrisLayout])

  const handlePause = () => {
    if (tetris && playing) {
      setPlaying(false);
      tetris.stop();
    }
  };

  const handlePlay = () => {
    if (tetris && !playing) {
      setPlaying(true);
      tetris.start();
    }
  };

  const PausePlay = playing ?
    <button className="btnPlayPause iconBtn" onClick={handlePause}>
      <IosPause fontSize="1.1rem" />
    </button> :
    <button className="btnPlay btnPlayPause iconBtn" onClick={handlePlay}>
      <IosPlay fontSize="1.1rem" />
    </button>;

  return (
    <div className="App">
      <header id="mainHeader">
        <div className="siteWidth">
          <h1>Tetris</h1>
          <nav>
            {PausePlay}
            <button className="iconBtn">
              <IosRefresh fontSize="1.3rem" />
            </button>
          </nav>          
        </div>
      </header>
      <main className="siteWidth" ref={mainGrid}>
        <div id="tetris" />
        <aside id="tetris-level">
          <Level
            heading='Level'
            level={level}
            progress={percentToNextLevel}
          />
        </aside>
        <aside id="tetris-score">
          <Score
            heading='Score'
            score={score}
            highScore={highScore}
            progress={((score / highScore) || 0) * 100}
          />
        </aside>
        <aside id="tetris-high-score">
          <Score
            heading='High Score'
            score={highScore}
            highScore={highScore}
          />
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