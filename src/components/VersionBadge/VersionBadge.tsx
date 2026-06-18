import { useState, useRef, useEffect } from 'react';
import styles from './VersionBadge.module.css';

export const VersionBadge = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReload = () => {
    // Clear caches and perform hard reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  const buildTime = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'Local Dev';
  const version = typeof __LIBRELUDO_VERSION__ !== 'undefined' ? __LIBRELUDO_VERSION__ : '0.0.0';

  return (
    <div className={styles.badgeContainer} ref={containerRef}>
      <button 
        type="button"
        className={styles.badgeButton} 
        onClick={() => setIsOpen(!isOpen)}
        title={`Version: v${version}`}
      >
        v
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.popoverHeader}>
            <span className={styles.title}>BUILD INFO</span>
            <button 
              type="button" 
              className={styles.closeBtn} 
              onClick={() => setIsOpen(false)}
            >
              &times;
            </button>
          </div>
          <div className={styles.content}>
            <div className={styles.row}>
              <span className={styles.label}>Version:</span>
              <span className={styles.value}>v{version}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Build Time:</span>
              <span className={styles.timestampValue}>{buildTime}</span>
            </div>
            <button 
              type="button" 
              className={styles.reloadBtn} 
              onClick={handleReload}
            >
              FORCE UPDATE / RELOAD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
