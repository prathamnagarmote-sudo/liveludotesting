import { useEffect, useMemo, useState } from 'react';
import PlayerInput from './components/PlayerInput/PlayerInput';
import { Link, useNavigate } from 'react-router-dom';
import type { TPlayerInitData } from '../../types';
import { ToastContainer, toast } from 'react-toastify';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import { useCleanup } from '../../hooks/useCleanup';
import { playerCountToWord } from '../../game/players/logic';
import { playerSequences } from '../../game/players/constants';
import TokenIcon from '../../assets/token.svg?react';
import styles from './PlayerSetup.module.css';
import { Tooltip } from 'react-tooltip';

const ALL_BOT_PLAYER_TOAST_ID = 'all-bot-player';
const PLAYER_NAME_EMPTY_TOAST_ID = 'player-name-empty';

const INITIAL_PLAYER_DATA: TPlayerInitData[] = [
  { name: 'Player 1', isBot: false },
  { name: 'Player 2', isBot: false },
  { name: 'Player 3', isBot: false },
  { name: 'Player 4', isBot: false },
];

const CrownIcon = () => (
  <svg viewBox="0 0 100 60" width="100%" height="100%" fill="#ffca28">
    <path d="M10 50 L20 10 L40 30 L50 5 L60 30 L80 10 L90 50 Z" stroke="#ff8f00" strokeWidth="4" strokeLinejoin="round" />
    <circle cx="20" cy="8" r="6" fill="#ffb300" />
    <circle cx="50" cy="3" r="6" fill="#ffb300" />
    <circle cx="80" cy="8" r="6" fill="#ffb300" />
    <path d="M15 50 L85 50 L80 58 L20 58 Z" fill="#ff8f00" />
  </svg>
);

const DieIcon = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <rect x="10" y="10" width="80" height="80" rx="15" fill="#f5f5f5" stroke="#ccc" strokeWidth="2" />
    <circle cx="30" cy="30" r="8" fill="#333" />
    <circle cx="70" cy="70" r="8" fill="#333" />
    <circle cx="30" cy="70" r="8" fill="#333" />
    <circle cx="70" cy="30" r="8" fill="#333" />
    <circle cx="50" cy="50" r="8" fill="#e53935" />
    <path d="M10 25 Q10 10 25 10 L75 10 Q90 10 90 25" fill="#fff" opacity="0.6" />
  </svg>
);

const GroupTwoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05.02.01.03.03.04.04 1.14.83 1.93 1.94 1.93 3.41V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const GroupThreeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    <circle cx="20" cy="9" r="3" />
    <circle cx="4" cy="9" r="3" />
    <path d="M24 19v-2.5c0-1.47-.79-2.58-1.93-3.41-.35.43-.8.8-1.31 1.1.72.63 1.24 1.45 1.24 2.31V19h2zM4 19v-2.5c0-.86.52-1.68 1.24-2.31-.51-.3-.96-.67-1.31-1.1C2.79 13.92 2 15.03 2 16.5V19h2z" />
  </svg>
);

const GroupFourIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="8" r="3" />
    <circle cx="15" cy="8" r="3" />
    <path d="M9 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    <path d="M15 13c-.29 0-.62.02-.97.05 1.14.83 1.97 2.11 1.97 3.45V19h8v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    <circle cx="12" cy="4" r="2.5" opacity="0.6" />
    <path d="M12 8c-1.33 0-4 .67-4 2v1h8v-1c0-1.33-2.67-2-4-2z" opacity="0.6" />
  </svg>
);

const BackgroundWatermarks = () => (
  <div className={styles.watermarksContainer}>
    <div className={styles.watermarkToken1}>
      <TokenIcon style={{ ['--fill-colour' as any]: '#ffffff' }} />
    </div>
    <div className={styles.watermarkToken2}>
      <TokenIcon style={{ ['--fill-colour' as any]: '#ffffff' }} />
    </div>
    <div className={styles.watermarkDie1}>
      <DieIcon />
    </div>
    <div className={styles.watermarkDie2}>
      <DieIcon />
    </div>
  </div>
);

function PlayerSetup() {
  const [playerCount, setPlayerCount] = useState(2);
  const [playersData, setPlayersData] = useState<TPlayerInitData[]>(INITIAL_PLAYER_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const cleanup = useCleanup();
  const playerSequence = useMemo(
    () => playerSequences[playerCountToWord(playerCount)],
    [playerCount]
  );

  useEffect(() => {
    document.title = 'LOOSER LUDO - Player Setup';
    cleanup();
  }, [cleanup]);

  const handlePlayBtnClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const playerInitData = playersData.slice(0, playerCount);
    const isAnyNameEmpty = playerInitData.some(
      (d) => d.name === '' || [...d.name].every((c) => c === ' ')
    );
    if (isAnyNameEmpty)
      return toast('Player name must not be empty', {
        type: 'error',
        toastId: PLAYER_NAME_EMPTY_TOAST_ID,
      });
    const areAllPlayersBot = playerInitData.every((d) => d.isBot);
    if (areAllPlayersBot)
      return toast('There must be at least one human player', {
        type: 'error',
        toastId: ALL_BOT_PLAYER_TOAST_ID,
      });
    setIsLoading(true);
    navigate('/play', { state: { initData: playerInitData } });
  };

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <div className={styles.playerSetup}>
      <BackgroundWatermarks />
      <Link to="/" className={styles.backBtn}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>

      <main className={styles.playerSetupDialog}>
        <div className={styles.logoHeader}>
          <div className={styles.crown}>
            <CrownIcon />
          </div>
          <div className={styles.looserBanner}>
            <span>LOOSER</span>
          </div>
          <div className={styles.ludoTextContainer}>
            <div className={styles.pawnLeft}>
              <TokenIcon style={{ ['--fill-colour' as any]: '#1e88e5' }} />
            </div>
            <h1 className={styles.ludoText}>
              <span className={styles.letterL}>L</span>
              <span className={styles.letterU}>U</span>
              <span className={styles.letterD}>D</span>
              <span className={styles.letterO}>O</span>
            </h1>
            <div className={styles.pawnRight}>
              <TokenIcon style={{ ['--fill-colour' as any]: '#e53935' }} />
            </div>
            <div className={styles.dieRight}>
              <DieIcon />
            </div>
          </div>
        </div>

        <div className={styles.sectionHeader}>
          <div className={styles.headerLine}>
            <span className={styles.lineBar} />
            <span className={styles.diamond} />
          </div>
          <h2>PLAYER SETUP</h2>
          <div className={styles.headerLine}>
            <span className={styles.diamond} />
            <span className={styles.lineBar} />
          </div>
        </div>
        <p className={styles.subText}>Choose number of players and enter their names</p>

        <div className={styles.subSectionHeader}>
          <span className={styles.diamondSmall} />
          <span className={styles.dashLine} />
          <h3>CHOOSE PLAYERS</h3>
          <span className={styles.dashLine} />
          <span className={styles.diamondSmall} />
        </div>

        <div className={styles.playerCountGrid}>
          <button
            className={`${styles.playerCountCard} ${styles.card2} ${playerCount === 2 ? styles.active : ''}`}
            onClick={() => setPlayerCount(2)}
          >
            <div className={styles.cardIconCircle}>
              <GroupTwoIcon />
            </div>
            <span className={styles.cardNum}>2</span>
            <span className={styles.cardText}>PLAYERS</span>
          </button>
          <button
            className={`${styles.playerCountCard} ${styles.card3} ${playerCount === 3 ? styles.active : ''}`}
            onClick={() => setPlayerCount(3)}
          >
            <div className={styles.cardIconCircle}>
              <GroupThreeIcon />
            </div>
            <span className={styles.cardNum}>3</span>
            <span className={styles.cardText}>PLAYERS</span>
          </button>
          <button
            className={`${styles.playerCountCard} ${styles.card4} ${playerCount === 4 ? styles.active : ''}`}
            onClick={() => setPlayerCount(4)}
          >
            <div className={styles.cardIconCircle}>
              <GroupFourIcon />
            </div>
            <span className={styles.cardNum}>4</span>
            <span className={styles.cardText}>PLAYERS</span>
          </button>
        </div>

        <div className={styles.subSectionHeader}>
          <span className={styles.diamondSmall} />
          <span className={styles.dashLine} />
          <h3>ENTER PLAYER NAMES</h3>
          <span className={styles.dashLine} />
          <span className={styles.diamondSmall} />
        </div>

        <div className={styles.playerInputsContainer}>
          <div className={styles.playerInputsList}>
            {playerSequence.map((c, index) => (
              <div key={index} className={styles.playerInputRowWrapper}>
                {index > 0 && (
                  <div className={styles.rowDivider}>
                    <span className={styles.diamondSmallCenter} />
                  </div>
                )}
                <PlayerInput
                  colour={c}
                  name={playersData[index].name}
                  isBot={playersData[index].isBot}
                  playerNum={index + 1}
                  onBotStatusChange={(isBot) =>
                    setPlayersData(playersData.map((d, i) => (i === index ? { ...d, isBot } : d)))
                  }
                  onNameChange={(name) =>
                    setPlayersData(playersData.map((d, i) => (i === index ? { ...d, name } : d)))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <Link className={styles.playBtn} to="/play" onClick={handlePlayBtnClick}>
          <span className={styles.chevron}>&raquo;</span>
          <span className={styles.playText}>PLAY</span>
          <span className={styles.chevron}>&laquo;</span>
        </Link>
      </main>

      <ToastContainer position="top-center" />
      <Tooltip
        id="bot-status-tooltip"
        className="tooltip"
        openEvents={{ focus: false, mouseover: true }}
        place="bottom-start"
      />
    </div>
  );
}

export default PlayerSetup;
