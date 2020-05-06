import React from 'react';
import MdArrowDropleftCircle from 'react-ionicons/lib/MdArrowDropleftCircle';
import MdArrowDroprightCircle from 'react-ionicons/lib/MdArrowDroprightCircle';
import MdArrowDropdownCircle from 'react-ionicons/lib/MdArrowDropdownCircle';
import MdArrowDropupCircle from 'react-ionicons/lib/MdArrowDropupCircle';
import './Help.scss';

function Help(props) {
  let Instructions = (
    <React.Fragment>
      <div className="Help-instructions">
        <p>Using your keyboard:</p>
        <ul className="unstyled">
          <li>
            <div>
              <MdArrowDropleftCircle fontSize="1.1rem" />
            </div>
            <div>Move piece left</div>
          </li>

          <li>
            <div>
              <MdArrowDroprightCircle fontSize="1.1rem" />
            </div>
            <div>Move piece right</div>
          </li>

          <li>
            <div>
              <MdArrowDropdownCircle fontSize="1.1rem" />
            </div>
            <div>Move piece down</div>
          </li>

          <li>
            <div>
              <MdArrowDropupCircle fontSize="1.1rem" />
            </div>
            <div>Rotate piece</div>
          </li>
        </ul>
      </div>
    </React.Fragment>  
  );

  if (props.touchDevice) {
    Instructions = (
      <React.Fragment>
        <div className="Help-instructions">
          <ul className="unstyled">
            <li>
              <div>
                Drag left:
              </div>
              <div>Move piece left</div>
            </li>

            <li>
              <div>
                Drag right:
              </div>
              <div>Move piece right</div>
            </li>

            <li>
              <div>
                Drag down:
              </div>
              <div>Move piece down</div>
            </li>

            <li>
              <div>
                Tap:
              </div>
              <div>Rotate Piece</div>
            </li>
          </ul>
        </div>
      </React.Fragment>  
    );
  }

  return (
    <section className="Help">
      <h1>How To Play</h1>
      {Instructions}
      <button className="btn" onClick={props.onStartClick}>
        Play Game
      </button>
    </section>
  );
}

export default Help;