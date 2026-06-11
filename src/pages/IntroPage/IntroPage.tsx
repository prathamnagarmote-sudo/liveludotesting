import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCleanup } from '../../hooks/useCleanup';
import styles from './IntroPage.module.css';

// Import assets from the project
import boardSvg from '../../assets/board.svg';
import tokenSvg from '../../assets/token.svg';

import TokenIcon from '../../assets/token.svg?react';

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

export default function IntroPage() {
  const cleanup = useCleanup();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    document.title = 'LOOSER LUDO';
    cleanup();

    let isMounted = true;
    let chunkReady = false;
    
    const startTime = Date.now();
    const minDuration = 500; // 0.5 seconds minimum visual loading time

    // PlayerSetup is now statically bundled, so we just wait for the visual timer
    chunkReady = true;

    // Smoothly animate the progress bar over minDuration
    const progressInterval = setInterval(() => {
      if (!isMounted) return;

      const elapsed = Date.now() - startTime;
      let calculatedProgress = (elapsed / minDuration) * 100;

      // If we haven't finished loading the chunk in the background, hold at 90%
      if (!chunkReady && calculatedProgress > 90) {
        calculatedProgress = 90 + Math.sin(elapsed / 500) * 2; // subtle pulse
      }

      // When we hit 100% AND chunk is ready, navigate
      if (calculatedProgress >= 100 && chunkReady) {
        setProgress(100);
        clearInterval(progressInterval);
        setTimeout(() => {
          if (isMounted) navigate('/setup');
        }, 200); // Tiny pause at 100% so user sees full bar
      } else {
        setProgress(calculatedProgress);
      }
    }, 30);

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, [cleanup, navigate]);

  return (
    <div className={styles.introContainer}>
      <BackgroundWatermarks />
      
      {/* Logo Header */}
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

      {/* Main Ludo Graphic Area */}
      <div className={styles.graphicArea}>
        <div className={styles.boardWrapper}>
          <img src={boardSvg} alt="Ludo Board" className={styles.boardImg} />
          
          {/* Animated Tokens hopping on the board */}
          <img src={tokenSvg} alt="Green Token" className={`${styles.token} ${styles.tokenGreen}`} />
          <img src={tokenSvg} alt="Blue Token" className={`${styles.token} ${styles.tokenBlue}`} />
          <img src={tokenSvg} alt="Red Token" className={`${styles.token} ${styles.tokenRed}`} />
          <img src={tokenSvg} alt="Yellow Token" className={`${styles.token} ${styles.tokenYellow}`} />
        </div>
      </div>

      {/* Loading Option with Progress Bar */}
      <div className={styles.loadingSection}>
        <div className={styles.progressBarWrapper}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <p className={styles.progressText}>LOADING... {Math.round(progress)}%</p>
      </div>
    </div>
  );
}
