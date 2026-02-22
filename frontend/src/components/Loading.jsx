import React from 'react';
import './Loading.css';

export default function Loading({ message = 'Загрузка...' }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner-ring" />
      </div>
      <p className="loading-text">{message}</p>
    </div>
  );
}
