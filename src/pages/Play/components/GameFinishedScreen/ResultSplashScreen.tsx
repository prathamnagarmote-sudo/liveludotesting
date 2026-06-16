
import { motion } from 'framer-motion';
import styles from './GameFinishedScreen.module.css';

type Props = {
  text: string;
};

function ResultSplashScreen({ text }: Props) {
  return (
    <motion.div
      className={styles.splashScreen}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className={styles.splashText}>{text}</h1>
    </motion.div>
  );
}

export default ResultSplashScreen;
