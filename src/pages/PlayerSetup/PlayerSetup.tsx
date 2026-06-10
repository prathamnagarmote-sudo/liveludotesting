import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TPlayerInitData } from '../../types';
import { useCleanup } from '../../hooks/useCleanup';
import styles from './PlayerSetup.module.css';

import profileBg from '../../Atlas_Lobby/images/profile_bg_blue.png';
import profileRound from '../../Atlas_Lobby/images/profile_round_blue.png';
import avatarImg from '../../Atlas_Lobby/images/5340497.png';
import logoImg from '../../Atlas_Lobby/images/logo.png';
import playBtnImg from '../../Atlas_Lobby/images/Playblue.png';
import loadingBarBg from '../../Atlas_Lobby/images/lodding_bar_bg.png';
import loadingBarFill from '../../Atlas_Lobby/images/lodding_bar.png';

const INITIAL_PLAYER_DATA: TPlayerInitData[] = [
  { name: 'Player 1', isBot: false },
  { name: 'Player 2', isBot: true },
  { name: 'Player 3', isBot: true },
  { name: 'Player 4', isBot: true },
];

function PlayerSetup() {
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [matchFound, setMatchFound] = useState(false);

  const navigate = useNavigate();
  const cleanup = useCleanup();

  useEffect(() => {
    document.title = 'LOOSER LUDO - Player Setup';
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    if (isSearching && !matchFound) {
      const interval = setInterval(() => {
        setSearchProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsSearching(false);
            setMatchFound(true); // Activate play button
            return 100;
          }
          return prev + 2; // Adjust speed as needed
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isSearching, matchFound]);

  const handleSelectMode = (count: number) => {
    if (isSearching || matchFound) return; // Don't allow changing during or after search
    setPlayerCount(count);
    setIsSearching(true);
    setSearchProgress(0);
    setMatchFound(false);
  };

  const handlePlayBtnClick = () => {
    if (!matchFound || playerCount === null) return;
    const playerInitData = INITIAL_PLAYER_DATA.slice(0, playerCount);
    navigate('/play', { state: { initData: playerInitData } });
  };

  return (
    <div className={styles.playerSetup}>
      {/* Background Spotlight */}
      <div className={styles.spotlight}></div>

      <main className={styles.playerSetupDialog}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <img src={logoImg} alt="Looser Ludo Logo" className={styles.logoImage} />
        </div>

        {/* Profile Container */}
        <div className={styles.profileContainer}>
          <img src={profileBg} alt="Profile Background" className={styles.profileBgImage} />
          <div className={styles.profileContent}>
            <span className={styles.playerName}>Player1</span>

            <div className={styles.avatarWrapper}>
              <div className={styles.avatarCircle}>
                <img src={profileRound} alt="Round Ring" className={styles.avatarRing} />
                <img src={avatarImg} alt="Avatar" className={styles.avatarImage} />
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section (Centered) */}
        <div className={styles.middleSection}>
          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.diamond}></span>
            <span className={styles.dividerText}>SELECT PLAYER</span>
            <span className={styles.diamond}></span>
          </div>

          {/* Player Count Options */}
          <div className={styles.playerCountOptions}>
            <button
              className={`${styles.playerBtn} ${playerCount === 2 ? styles.active : ''}`}
              onClick={() => handleSelectMode(2)}
            >
              <div className={styles.playerBtnInner}>
                <span className={styles.btnNumber}>2</span>
                <span className={styles.btnText}>PLAYERS</span>
              </div>
            </button>

            <button
              className={`${styles.playerBtn} ${playerCount === 4 ? styles.active : ''}`}
              onClick={() => handleSelectMode(4)}
            >
              <div className={styles.playerBtnInner}>
                <span className={styles.btnNumber}>4</span>
                <span className={styles.btnText}>PLAYERS</span>
              </div>
            </button>
          </div>
        </div>

        {/* Play Button */}
        <button className={styles.playButtonWrapper} onClick={handlePlayBtnClick} disabled={!matchFound}>
          <img src={playBtnImg} alt="Play" className={styles.playBtnImage} />
          <span className={styles.playText}>PLAY</span>
          <div className={styles.shiningEffect}></div>
        </button>

        {/* Loading Bar (Matchmaking Scope) */}
        {(isSearching || matchFound) && (
          <div className={styles.loadingContainer}>
            <img src={loadingBarBg} alt="Loading Track" className={styles.loadingTrack} />
            <div className={styles.loadingFillWrapper} style={{ width: `${searchProgress}%` }}>
              <img src={loadingBarFill} alt="Loading Fill" className={styles.loadingFill} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PlayerSetup;
