import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useCleanup } from '../../hooks/useCleanup';
import styles from './HomePage.module.css';
import clsx from 'clsx';

function HomePage() {
  const cleanup = useCleanup();

  useEffect(() => {
    document.title = 'LOOSER LUDO';
    cleanup();
  }, [cleanup]);
  return (
    <div className={styles.pageContainer}>
      <main className={styles.homePage} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <section className={styles.welcome}>
          <h1 style={{ fontSize: '4rem', marginBottom: '2rem' }}>
            LOOSER LUDO
          </h1>
          <nav className={styles.ctaButtons}>
            <Link className={clsx(styles.ctaButton, styles.playNowBtn)} to="/setup" style={{ fontSize: '1.5rem', padding: '1rem 2rem' }}>
              Start Gaming
            </Link>
          </nav>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
