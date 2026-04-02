import React from 'react';
import { Link } from "react-router-dom";
import '../styles.css';

export default function EmailFeedbackPage() {
    return (
        <div className="login-page">
            <div className="login-shell">
                <div className="login-card fade-in" style={{ textAlign: 'center' }}>
                    <div className="login-card-top">
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                        <h1 className="login-title">Verifique o seu Email</h1>
                        <p className="login-sub">
                            Se existir uma conta associada a este email, acabámos de enviar um link de recuperação.
                        </p>
                        <p className="login-sub" style={{ fontSize: '13px', marginTop: '10px' }}>
                            Verifica a caixa de entrada e a pasta de Spam. O link expira em 30 minutos.
                        </p>
                    </div>

                    <div className="actions login-actions" style={{ marginTop: '24px' }}>
                        <Link to="/login" className="btn btn-primary" style={{ width: '100%', display: 'inline-block' }}>
                            Voltar ao Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}