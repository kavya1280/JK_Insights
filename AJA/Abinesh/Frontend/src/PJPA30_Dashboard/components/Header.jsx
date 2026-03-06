import React from 'react';

const Header = ({ onBack }) => {
    return (
        <header className="header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px', position: 'relative' }}>
            <div className="header-left" style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
                {onBack && (
                    <button onClick={onBack} className="header-back-button" style={{
                        display: 'none',
                    }}>
                        Back
                    </button>
                )}
            </div>

            <div className="header-center" style={{ textAlign: 'center' }}>
                <div className="header-title-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                    <div className="header-title-accent" style={{ width: '4px', height: '32px', background: '#6FAE2C', borderRadius: '4px' }} />
                    <div style={{ textAlign: 'left' }}>
                        <div className="header-subtitle" style={{ fontSize: '12px', color: '#757575', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                            PJPA30 · HR & Travel Analytics
                        </div>
                        <h1 className="header-title" style={{ fontSize: '22px', color: '#212121', margin: 0, fontWeight: 800 }}>
                            Short Trip Frequency Abuse
                        </h1>
                    </div>
                </div>
            </div>

            <div className="header-right" style={{ position: 'absolute', right: 0 }}>
            </div>
        </header>
    );
};

export default Header;
