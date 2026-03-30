import Checkbox from '@/components/Checkbox';
import InputError from '@/components/InputError';
import TextInput from '@/components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Iniciar Sesión" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'DM Sans', sans-serif;
                    background: #071409;
                    position: relative;
                    overflow: hidden;
                    padding: 1.5rem;
                }

                .page::before {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background:
                        radial-gradient(ellipse 70% 60% at 20% 100%, rgba(22, 101, 52, 0.5) 0%, transparent 55%),
                        radial-gradient(ellipse 50% 40% at 80% 0%, rgba(234, 179, 8, 0.1) 0%, transparent 50%),
                        radial-gradient(ellipse 80% 80% at 50% 50%, rgba(10, 30, 14, 0.9) 0%, transparent 100%);
                    pointer-events: none;
                }

                .page::after {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(74, 222, 128, 0.035) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(74, 222, 128, 0.035) 1px, transparent 1px);
                    background-size: 56px 56px;
                    pointer-events: none;
                }

                .orb {
                    position: fixed;
                    width: 500px;
                    height: 500px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, transparent 70%);
                    bottom: -100px;
                    left: -100px;
                    pointer-events: none;
                    animation: drift 10s ease-in-out infinite;
                }

                @keyframes drift {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(40px, -40px); }
                }

                .card {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 420px;
                    background: rgba(8, 22, 10, 0.75);
                    backdrop-filter: blur(28px);
                    border: 1px solid rgba(74, 222, 128, 0.12);
                    border-radius: 24px;
                    padding: 2.75rem 2.5rem;
                    box-shadow:
                        0 0 0 1px rgba(0,0,0,0.3),
                        0 32px 64px rgba(0, 0, 0, 0.5),
                        0 0 80px rgba(22, 163, 74, 0.08);
                    animation: appear 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                @keyframes appear {
                    from { opacity: 0; transform: translateY(28px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }

                .logo-wrap {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 2.25rem;
                }

                .logo-box {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 28px rgba(34, 197, 94, 0.45), inset 0 1px 0 rgba(255,255,255,0.15);
                    flex-shrink: 0;
                }

                .logo-letters {
                    font-family: 'Syne', sans-serif;
                    font-weight: 800;
                    font-size: 1.1rem;
                    color: #fff;
                    letter-spacing: -0.02em;
                }

                .logo-text {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.1;
                }

                .logo-name {
                    font-family: 'Syne', sans-serif;
                    font-weight: 800;
                    font-size: 1.15rem;
                    color: #f0fdf4;
                    letter-spacing: -0.02em;
                }

                .logo-sub {
                    font-size: 0.72rem;
                    color: rgba(187, 247, 208, 0.4);
                    font-weight: 400;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                }

                .heading-wrap {
                    margin-bottom: 2rem;
                }

                .heading {
                    font-family: 'Syne', sans-serif;
                    font-size: 1.6rem;
                    font-weight: 800;
                    color: #f0fdf4;
                    letter-spacing: -0.03em;
                    line-height: 1.1;
                    margin-bottom: 0.35rem;
                }

                .subheading {
                    font-size: 0.85rem;
                    color: rgba(187, 247, 208, 0.45);
                    font-weight: 300;
                }

                .status-bar {
                    background: rgba(34, 197, 94, 0.1);
                    border: 1px solid rgba(34, 197, 94, 0.2);
                    border-radius: 10px;
                    padding: 0.7rem 1rem;
                    font-size: 0.83rem;
                    color: #4ade80;
                    font-weight: 500;
                    margin-bottom: 1.5rem;
                }

                .field {
                    margin-bottom: 1.1rem;
                }

                .field-label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: rgba(187, 247, 208, 0.6);
                    margin-bottom: 0.45rem;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }

                .input-wrap {
                    position: relative;
                }

                .input-icon {
                    position: absolute;
                    left: 0.9rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(74, 222, 128, 0.45);
                    pointer-events: none;
                    z-index: 1;
                }

                .input-wrap input {
                    width: 100% !important;
                    background: rgba(255,255,255,0.03) !important;
                    border: 1px solid rgba(74, 222, 128, 0.13) !important;
                    border-radius: 11px !important;
                    padding: 0.8rem 1rem 0.8rem 2.6rem !important;
                    font-size: 0.9rem !important;
                    color: #f0fdf4 !important;
                    font-family: 'DM Sans', sans-serif !important;
                    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s !important;
                    outline: none !important;
                    box-shadow: none !important;
                }

                .input-wrap input:focus {
                    border-color: rgba(74, 222, 128, 0.45) !important;
                    background: rgba(74, 222, 128, 0.04) !important;
                    box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.07) !important;
                }

                .input-wrap input::placeholder {
                    color: rgba(187, 247, 208, 0.18) !important;
                }

                .err {
                    font-size: 0.77rem;
                    color: #f87171;
                    margin-top: 0.35rem;
                }

                .remember-row {
                    display: flex;
                    align-items: center;
                    gap: 0.55rem;
                    margin: 1.25rem 0 1.75rem;
                }

                .remember-text {
                    font-size: 0.83rem;
                    color: rgba(187, 247, 208, 0.45);
                }

                .btn {
                    width: 100%;
                    padding: 0.9rem;
                    background: linear-gradient(160deg, #22c55e 0%, #16a34a 50%, #15803d 100%);
                    border: none;
                    border-radius: 12px;
                    color: #fff;
                    font-family: 'Syne', sans-serif;
                    font-size: 0.95rem;
                    font-weight: 700;
                    letter-spacing: 0.01em;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.15s, box-shadow 0.15s;
                    box-shadow: 0 4px 20px rgba(22, 163, 74, 0.4), inset 0 1px 0 rgba(255,255,255,0.15);
                }

                .btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 50%);
                    pointer-events: none;
                }

                .btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 28px rgba(22, 163, 74, 0.5), inset 0 1px 0 rgba(255,255,255,0.15);
                }

                .btn:active:not(:disabled) { transform: translateY(0); }

                .btn:disabled { opacity: 0.55; cursor: not-allowed; }

                .spinner {
                    display: inline-block;
                    width: 15px;
                    height: 15px;
                    border: 2px solid rgba(255,255,255,0.25);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.65s linear infinite;
                    margin-right: 0.45rem;
                    vertical-align: middle;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                .badge {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.4rem;
                    margin-top: 2rem;
                    padding: 0.55rem 1rem;
                    background: rgba(234, 179, 8, 0.05);
                    border: 1px solid rgba(234, 179, 8, 0.1);
                    border-radius: 8px;
                }

                .badge span {
                    font-size: 0.7rem;
                    color: rgba(234, 179, 8, 0.5);
                    letter-spacing: 0.03em;
                }

                .top-line {
                    position: absolute;
                    top: 0;
                    left: 10%;
                    right: 10%;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(74, 222, 128, 0.4), transparent);
                    border-radius: 100px;
                }
            `}</style>

            <div className="page">
                <div className="orb" />

                <div className="card">
                    <div className="top-line" />

                    <div className="logo-wrap">
                        <div className="logo-box">
                            <span className="logo-letters">TG</span>
                        </div>
                        <div className="logo-text">
                            <span className="logo-name">TG Volquetes</span>
                            <span className="logo-sub">Panel de gestión</span>
                        </div>
                    </div>

                    <div className="heading-wrap">
                        <h1 className="heading">Iniciar sesión</h1>
                        <p className="subheading">Ingresá tus credenciales para continuar</p>
                    </div>

                    {status && <div className="status-bar">{status}</div>}

                    <form onSubmit={submit}>
                        <div className="field">
                            <label className="field-label" htmlFor="email">Correo electrónico</label>
                            <div className="input-wrap">
                                <span className="input-icon">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                                        <path d="m2 7 10 7 10-7"/>
                                    </svg>
                                </span>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-0 block w-full"
                                    autoComplete="username"
                                    isFocused={true}
                                    placeholder="usuario@empresa.com"
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                            </div>
                            <InputError message={errors.email} className="err" />
                        </div>

                        <div className="field">
                            <label className="field-label" htmlFor="password">Contraseña</label>
                            <div className="input-wrap">
                                <span className="input-icon">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                </span>
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-0 block w-full"
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                            </div>
                            <InputError message={errors.password} className="err" />
                        </div>

                        <div className="remember-row">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            <span className="remember-text">Mantener sesión iniciada</span>
                        </div>

                        <button type="submit" className="btn" disabled={processing}>
                            {processing && <span className="spinner" />}
                            {processing ? 'Ingresando...' : 'Ingresar al sistema'}
                        </button>


                    </form>

                    <div className="badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <span>Conexión cifrada · Acceso protegido</span>
                    </div>
                </div>
            </div>
        </>
    );
}