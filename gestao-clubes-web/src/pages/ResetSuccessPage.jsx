import React from 'react';
import { Link } from "react-router-dom";
import '../styles.css';

export default function ResetSuccessPage() {
    return (
        <div className="login-page">
            <div className="login-shell">
                <div className="login-card fade-in" style={{ textAlign: 'center' }}>
                    <div className="login-card-top">
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                        <h1 className="login-title">Tudo pronto!</h1>
                        <p className="login-sub">
                            A tua palavra-passe foi alterada com sucesso.
                        </p>
                    </div>

                    <div className="actions login-actions" style={{ marginTop: '24px' }}>
                        <Link to="/login" className="btn btn-primary" style={{ width: '100%', display: 'inline-block' }}>
                            Iniciar Sessão
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}