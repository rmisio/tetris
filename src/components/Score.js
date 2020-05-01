import React from 'react';
import AsideBox from './AsideBox';
import './Score.scss';

function Score(props) {
  const scoreTextLen = (props.score).toString().length; 
  const highScoreTextLen = (props.highScore).toString().length;
  let scoreTextClass = 'Score-score';
  let highScoreTextClass = 'Score-highScoreWrap';

  if (scoreTextLen >= 13) {
    scoreTextClass += ' Score-scoreLenCrazyAssLong';
  } else if (scoreTextLen >= 9) {
    scoreTextClass += ' Score-scoreLenSuperLong';
  } else if (scoreTextLen >= 7) {
    scoreTextClass += ' Score-scoreLenLong';    
  }

  if (highScoreTextLen >= 13) {
    highScoreTextClass += ' Score-highScoreLenSuperLong';
  } else if (highScoreTextLen >= 9) {
    highScoreTextClass += ' Score-highScoreLenLong';
  }  

  return (
    <AsideBox
      className="Score"
      { ...props}
    >
      <div className={scoreTextClass}>{props.score}</div>
      <div className={highScoreTextClass}>
        <div>High Score:</div>
        <div>{props.highScore}</div>
      </div>
    </AsideBox>
  );
}

export default Score;