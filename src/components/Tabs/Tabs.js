'use client'
import React from 'react';
import styles from './Tabs.module.css';

const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsWrapper}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className={styles.divider} />
    </div>
  );
};

export default Tabs;