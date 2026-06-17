import { renewRollBag, setDiceNumber, setIsPlaceholderShowing, setIsVisualRolling, setDiceNumberDirect } from '../slices/diceSlice';
import type { TPlayerColour } from '../../types';
import type { AppDispatch, RootState } from '../store';

const DICE_PLACEHOLDER_DELAY = 300;

export function rollDiceThunk(colour: TPlayerColour, onDiceRoll: (diceNumber: number) => void, forcedNumber?: number) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    if (getState().players.isGameEnded) return;
    dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: true }));
    dispatch(setIsVisualRolling({ colour, isVisualRolling: true }));
    setTimeout(() => {
      const diceState = getState().dice;
      const dice = diceState.dice.find((d) => d.colour === colour);
      if (diceState.rollBag[colour].length === 0) dispatch(renewRollBag(colour));
      const bag = getState().dice.rollBag[colour];
      
      dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: false }));
      
      if (forcedNumber !== undefined && forcedNumber >= 1 && forcedNumber <= 6) {
        dispatch(setDiceNumberDirect({ colour, diceNumber: forcedNumber }));
        if (dice) onDiceRoll(forcedNumber);
      } else {
        const index = Math.floor(Math.random() * bag.length);
        const diceNumber = bag[index];
        dispatch(setDiceNumber({ colour, randomIndex: index }));
        if (dice) onDiceRoll(diceNumber);
      }

      setTimeout(() => {
        dispatch(setIsVisualRolling({ colour, isVisualRolling: false }));
      }, 200);
    }, DICE_PLACEHOLDER_DELAY);
  };
}
