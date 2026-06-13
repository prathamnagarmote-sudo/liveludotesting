import { renewRollBag, setDiceNumber, setIsPlaceholderShowing, setIsVisualRolling } from '../slices/diceSlice';
import type { TPlayerColour } from '../../types';
import type { AppDispatch, RootState } from '../store';

const DICE_PLACEHOLDER_DELAY = 400;

export function rollDiceThunk(colour: TPlayerColour, onDiceRoll: (diceNumber: number) => void) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    if (getState().players.isGameEnded) return;
    dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: true }));
    dispatch(setIsVisualRolling({ colour, isVisualRolling: true }));
    setTimeout(() => {
      const diceState = getState().dice;
      const dice = diceState.dice.find((d) => d.colour === colour);
      if (diceState.rollBag[colour].length === 0) dispatch(renewRollBag(colour));
      const bag = getState().dice.rollBag[colour];
      const index = Math.floor(Math.random() * bag.length);
      const diceNumber = bag[index];
      dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: false }));
      dispatch(setDiceNumber({ colour, randomIndex: index }));
      if (dice) onDiceRoll(diceNumber);

      setTimeout(() => {
        dispatch(setIsVisualRolling({ colour, isVisualRolling: false }));
      }, 700);
    }, DICE_PLACEHOLDER_DELAY);
  };
}
