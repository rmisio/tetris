import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useState
} from 'react';
import IosPlay from 'react-ionicons/lib/IosPlay';
import IosRefresh from 'react-ionicons/lib/IosRefresh';
import IosPause from 'react-ionicons/lib/IosPause';
import IosHelp from 'react-ionicons/lib/IosHelp';
import Tetris from 'lib/tetris/Tetris';
import MyModal from 'components/MyModal';
import TextOverlay from './TextOverlay';
import Level from './Level';
import Score from './Score';
import Help from './Help';
import 'styles/main.scss';
import './App.scss';

function App() {
  const mainWrap = useRef(null);
  const mainGrid = useRef(null);
  const [rows] = useState(18);
  const [cols] = useState(10);
  const [tetris, setTetris] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [calcTetrisLayout, setCalcTetrisLayout] = useState(true);
  const [level, setLevel] = useState(1);
  const [percentToNextLevel, setPercentToNextLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(localStorage.getItem('highScore') || 0);
  const [showHelp, setShowHelp] = useState(true);

  const touchEnabled = 'ontouchstart' in document.documentElement;

  const tetrisChange = e => {
    setLevel(e.level);
    setPercentToNextLevel(e.percentToNextLevel);
    setScore(e.score);
    setGameOver(e.gameOver);
    setPlaying(e.started);

    if (e.score > highScore) {
      setHighScore(e.score);
      localStorage.setItem('highScore', e.score);
    }
  };

  useEffect(() => {
    const handleResize = e => {
      setCalcTetrisLayout(true);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (tetris) tetris.remove();
      setTetris(null);      
      window.removeEventListener('resize', handleResize);
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
        mainGrid.current.style.gridTemplateColumns = '';
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
        t.on('change', tetrisChange);
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
  }, [tetris, cols, rows, calcTetrisLayout]);

  useEffect(() => {
    if (playing) {
      setShowHelp(false);
    }
  }, [playing]);

  useEffect(() => {
    if (tetris && showHelp) {
      tetris.stop();
    }
  }, [showHelp, tetris]);

  useEffect(() => {
    if (gameOver) {
    }
  }, [gameOver]);

  const startTetris = () => {
    if (tetris && !playing) {
      tetris.start();
    }
  }

  const handlePause = () => {
    if (tetris && playing) {
      tetris.stop();
    }
  };

  const PausePlay = playing ?
    <button className="iconBtn btnPause" onClick={handlePause}>
      <IosPause />
    </button> :
    <button
      className="iconBtn btnPlay"
      onClick={() => startTetris()}
    >
      <IosPlay />
    </button>;

  const handleRestart = () => {
    if (tetris) {
      tetris.restart();
    }
  };

  const HelpScreen = (
    <MyModal
      isOpen={showHelp}
      parentSelector={() => mainWrap.current}
      shouldCloseOnEsc={true}
      onAfterClose={() => setShowHelp(false)}
    >
      <Help
        activeGame={playing}
        touchDevice={touchEnabled}
        onStartClick={() => startTetris()}
      ></Help>      
    </MyModal>
  );

  const GameOver = gameOver ?
    (
      <TextOverlay
        isOpen={true}
        parentSelector={() => mainWrap.current}
      >
        Game Over
      </TextOverlay>
    ) : null;

  return (
    <div className={`App ${touchEnabled ? 'touchEnabled' : ''}`}>
      <header id="mainHeader">
        <div className="siteWidth">
          <h1>Tetris</h1>
          <nav>
            {PausePlay}
            <button
              className="iconBtn btnRestart"
              onClick={handleRestart}
            >
              <IosRefresh fontSize="1.5rem" />
            </button>
            <button
              className={`iconBtn btnHelp ${showHelp ? 'active' : ''}`}
              onClick={() => setShowHelp(true)}
            >
              <IosHelp fontSize="1.8rem" />
            </button>
          </nav>          
        </div>
      </header>
      <div id="mainWrap" ref={mainWrap}>
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
      {GameOver}
      {HelpScreen}      
    </div>
  );
}

export default App;