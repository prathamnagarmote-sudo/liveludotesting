import type { TPlayerColour } from '../../../../types';
import BotIcon from '../../../../assets/icons/bot.svg?react';
import HumanIcon from '../../../../assets/icons/human.svg?react';
import { MAX_PLAYER_NAME_LENGTH, playerColours } from '../../../../game/players/constants';
import 'react-tooltip/dist/react-tooltip.css';
import styles from './PlayerInput.module.css';

type Props = {
  colour: TPlayerColour;
  name: string;
  isBot: boolean;
  onBotStatusChange: (isBot: boolean) => void;
  onNameChange: (name: string) => void;
};

function PlayerInput({ colour, isBot, name, onBotStatusChange, onNameChange }: Props) {
  return (
    <div className={`${styles.playerInput} ${isBot ? styles.isBot : styles.isHuman}`}>
      <span
        className={styles.playerInputColourDot}
        style={{
          backgroundColor: playerColours[colour],
          ['--player-color' as any]: playerColours[colour]
        }}
      />
      <input
        type="text"
        placeholder="Enter player name"
        className={styles.playerNameInput}
        value={name}
        onChange={(e) => onNameChange(e.target.value.slice(0, MAX_PLAYER_NAME_LENGTH))}
      />
      <button
        className={`${styles.botStatusBtn} ${isBot ? styles.botSelected : styles.humanSelected}`}
        data-tooltip-id="bot-status-tooltip"
        data-tooltip-content={isBot ? 'Bot' : 'Human'}
        aria-label="Toggle Ludo bot on or off"
        onClick={() => onBotStatusChange(!isBot)}
      >
        {isBot ? <BotIcon /> : <HumanIcon />}
      </button>
    </div>
  );
}

export default PlayerInput;
