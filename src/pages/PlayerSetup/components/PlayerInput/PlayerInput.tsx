import type { TPlayerColour } from '../../../../types';
import BotIcon from '../../../../assets/icons/bot.svg?react';
import HumanIcon from '../../../../assets/icons/human.svg?react';
import TokenIcon from '../../../../assets/token.svg?react';
import { MAX_PLAYER_NAME_LENGTH, playerColours } from '../../../../game/players/constants';
import 'react-tooltip/dist/react-tooltip.css';
import styles from './PlayerInput.module.css';

type Props = {
  colour: TPlayerColour;
  name: string;
  isBot: boolean;
  playerNum: number;
  onBotStatusChange: (isBot: boolean) => void;
  onNameChange: (name: string) => void;
};

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

function PlayerInput({ colour, isBot, name, playerNum, onBotStatusChange, onNameChange }: Props) {
  return (
    <div className={styles.playerInputRow}>
      {/* Avatar Section */}
      <div className={styles.avatarContainer}>
        <div className={styles.numberBadge}>{playerNum}</div>
        <div className={styles.avatarCircle} style={{ ['--player-color' as any]: playerColours[colour] }}>
          <TokenIcon className={styles.avatarToken} style={{ ['--fill-colour' as any]: playerColours[colour] }} />
        </div>
      </div>

      {/* Input Section */}
      <div className={styles.inputPill}>
        <span className={styles.pencilIcon}>
          <PencilIcon />
        </span>
        <input
          type="text"
          placeholder={`Player ${playerNum}`}
          className={styles.playerNameInput}
          value={name}
          onChange={(e) => onNameChange(e.target.value.slice(0, MAX_PLAYER_NAME_LENGTH))}
        />
      </div>

      {/* Toggle Section */}
      <button
        className={styles.toggleBtn}
        style={{ backgroundColor: playerColours[colour] }}
        data-tooltip-id="bot-status-tooltip"
        data-tooltip-content={isBot ? 'Bot' : 'Human'}
        aria-label="Toggle Ludo bot on or off"
        onClick={() => onBotStatusChange(!isBot)}
      >
        {isBot ? <BotIcon className={styles.toggleIcon} /> : <HumanIcon className={styles.toggleIcon} />}
      </button>
    </div>
  );
}

export default PlayerInput;
