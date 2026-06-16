import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import type { TLeaderboardStanding } from '../../../../game/score/logic';
import styles from './LeaderboardScreen.module.css';
import { useDispatch } from 'react-redux';
import { clearPlayersState } from '../../../../state/slices/playersSlice';
import { clearDiceState } from '../../../../state/slices/diceSlice';

// Atlas Assets
import crownImage from '../../../../Atlas_Lobby/images/win crown.png';
import homeBtnImg from '../../../../Atlas_Lobby/images/Playpinkish.png';
import rematchBtnImg from '../../../../Atlas_Lobby/images/Playblue.png';
import TokenImage from '../../../../assets/token.svg?react';

type Props = {
  standings: TLeaderboardStanding[];
  isTie?: boolean;
};

const woodStainColours: Record<string, string> = {
  red: '#ba2b20',
  green: '#26632f',
  blue: '#1b4b8f',
  yellow: '#c28b17',
};

function LeaderboardScreen({ standings, isTie }: Props) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const winner = standings[0];

  const handleRematch = () => {
    // Navigate setup or reset match
    dispatch(clearPlayersState());
    dispatch(clearDiceState());
    navigate('/setup'); // Navigating to setup for rematch for now
  };

  return (
    <motion.div 
      className={styles.leaderboardContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className={styles.title}>Leaderboard</h1>

      {!isTie && winner && (
        <div className={styles.winnerSection}>
          <img src={crownImage} alt="Crown" className={styles.crown} />
          <div className={styles.winnerAvatarContainer}>
            {winner.avatarUrl ? (
              <img src={winner.avatarUrl} alt={winner.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <TokenImage
                style={{ width: '55px', height: '55px', '--fill-colour': woodStainColours[winner.colour] } as React.CSSProperties}
              />
            )}
          </div>
          <h2 className={styles.winnerName}>{winner.name}</h2>
          <p className={styles.winnerScore}>{winner.score}</p>
        </div>
      )}

      {isTie && (
        <div className={styles.winnerSection} style={{ padding: '30px 0', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2 className={styles.winnerName} style={{ fontSize: '1.8rem', color: '#ffeb3b', margin: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Match Tied</h2>
        </div>
      )}

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span>Rank</span>
          <span>User name</span>
          <span>Score</span>
        </div>
        
        <div className={styles.tableBody}>
          {standings.map((standing) => (
            <div key={standing.colour} className={styles.tableRow}>
              <span className={styles.rankCol}>
                {standing.rank}
              </span>
              <div className={styles.nameCol}>
                <div className={styles.rowAvatar}>
                  {standing.avatarUrl ? (
                    <img src={standing.avatarUrl} alt={standing.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <TokenImage
                      style={{ width: '28px', height: '28px', '--fill-colour': woodStainColours[standing.colour] } as React.CSSProperties}
                    />
                  )}
                </div>
                <span className={styles.rowName}>
                  {standing.name}
                </span>
              </div>
              <span className={styles.scoreCol}>{standing.score}</span>
            </div>
          ))}
        </div>

        <div className={styles.buttonGroup}>
          <Link to="/" className={styles.actionButton}>
            <img src={homeBtnImg} alt="Home" />
            <span className={styles.btnText}>Home</span>
          </Link>
          <button type="button" onClick={handleRematch} className={styles.actionButton}>
            <img src={rematchBtnImg} alt="Rematch" />
            <span className={styles.btnText}>Rematch</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default LeaderboardScreen;
