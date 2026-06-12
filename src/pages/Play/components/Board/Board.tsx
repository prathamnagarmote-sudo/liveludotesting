import boardSvg from '../../../../assets/board.svg';
import Token from '../Token/Token';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import { useCallback, useState, useContext } from 'react';
import { resizeBoard } from '../../../../state/slices/boardSlice';
import { ERRORS } from '../../../../utils/errors';
import Dice from '../Dice/Dice';
import type { TCoordinate, TPlayerColour } from '../../../../types';
import { getTokenDOMId, tokensWithCoord } from '../../../../game/tokens/logic';
import type { TTokenClickData } from '../../../../types/tokens';
import styles from './Board.module.css';
import { useResizeObserver } from '../../../../hooks/useResizeObserver';
import { OnlineGameContext } from '../Game/Game';

type Props = {
  onDiceClick: (colour: TPlayerColour, diceNumber: number) => void;
};

function Board({ onDiceClick: onDiceRoll }: Props) {
  const { players, currentPlayerColour } = useSelector((state: RootState) => state.players);
  const { boardSideLength } = useSelector((state: RootState) => state.board);
  const { dice } = useSelector((state: RootState) => state.dice);
  const [tokenClickData, setTokenClickData] = useState<TTokenClickData | null>(null);
  const [boardNode, setBoardNode] = useState<HTMLDivElement | null>(null);
  const dispatch = useDispatch();

  const onlineContext = useContext(OnlineGameContext);
  const isOnline = !!onlineContext?.isOnline;
  const myPlayerColour = onlineContext?.myPlayerColour || 'blue';

  const onBoardResize = useCallback(() => {
    if (!boardNode) throw new Error(ERRORS.boardDoesNotExist());
    const boardSideLength = boardNode.getBoundingClientRect().width;
    dispatch(resizeBoard(boardSideLength));
  }, [boardNode, dispatch]);

  useResizeObserver(boardNode, onBoardResize);

  const handleBoardClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (players.find((p) => p.colour === currentPlayerColour)?.isBot) return;
    if (!boardNode) throw new Error(ERRORS.boardDoesNotExist());
    const { top, left } = boardNode.getBoundingClientRect();
    const boardX = e.clientX - left;
    const boardY = e.clientY - top;

    if (boardX > boardSideLength || boardY > boardSideLength || boardX < 0 || boardY < 0) return;

    const visualTileSize = 0.05883748 * boardSideLength;
    const visualX = Math.max(0, Math.min(16, Math.floor(boardX / visualTileSize)));
    const visualY = Math.max(0, Math.min(16, Math.floor(boardY / visualTileSize)));

    const visualToLogical = (v: number): number => {
      if (v <= 5) return v;
      if (v === 6) return 5;
      if (v <= 9) return v - 1;
      if (v === 10) return 8;
      return v - 2;
    };

    const coordX = visualToLogical(visualX);
    const coordY = visualToLogical(visualY);

    const coords: TCoordinate = { x: coordX, y: coordY };

    const tokenToMove = tokensWithCoord(coords, players).filter(
      (t) => t.colour === currentPlayerColour
    )[0];

    if (!tokenToMove || tokenToMove.isLocked) return;

    // For online play, block moves if it's not our turn
    if (isOnline && currentPlayerColour !== myPlayerColour) return;

    setTokenClickData({
      timestamp: Date.now(),
      colour: tokenToMove.colour,
      id: tokenToMove.id,
    });
  };

  return (
    <div className={styles.board} ref={setBoardNode} onClick={handleBoardClick}>
      <svg style={{ width: 0, height: 0, position: 'absolute', pointerEvents: 'none', opacity: 0 }}>
        <defs>
          <linearGradient id="token-grad-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#003b73" />
            <stop offset="100%" stopColor="#00a2e8" />
          </linearGradient>
          <linearGradient id="token-grad-red" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#800a00" />
            <stop offset="100%" stopColor="#f24b3f" />
          </linearGradient>
          <linearGradient id="token-grad-green" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#034d19" />
            <stop offset="100%" stopColor="#24d658" />
          </linearGradient>
          <linearGradient id="token-grad-yellow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#996000" />
            <stop offset="100%" stopColor="#ffb700" />
          </linearGradient>
        </defs>
      </svg>
      <img src={boardSvg} className={styles.boardImage} aria-hidden="true" />

      {players.map((p) =>
        p.tokens.map((t) => (
          <Token
            colour={t.colour}
            id={t.id}
            tokenClickData={tokenClickData}
            key={getTokenDOMId(t.colour, t.id)}
          />
        ))
      )}
      {dice.map((d) => (
        <Dice
          colour={d.colour}
          onDiceClick={onDiceRoll}
          playerName={players.find((p) => p.colour === d.colour)?.name as string}
          key={d.colour}
        />
      ))}
    </div>
  );
}

export default Board;

