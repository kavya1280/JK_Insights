import React from 'react';
import './Header.css';

const Header = ({ onBack }) => {
    return (
        <header className="header">
            <div className="header-left">
                {onBack && (
                    <button onClick={onBack} className="header-back-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back
                    </button>
                )}
                <img src="/ajalabs.png" alt="Aja Labs" className="header-logo" />
            </div>
            <div className="header-center">
                <div className="header-title-wrapper">
                    <div className="header-title-accent" />
                    <div>
                        <div className="header-subtitle">PJPA28 · Statistical Analytics</div>
                        <h1 className="header-title">Benford's Law Analysis</h1>
                    </div>
                </div>
            </div>
            <div className="header-right">
                <div className="jk-logo-badge">
                    <img src="/JKCEMENT.NS_BIG.png" alt="JK Cement" className="jk-logo-img" />
                </div>
            </div>
        </header>
    );
};

export default Header;
