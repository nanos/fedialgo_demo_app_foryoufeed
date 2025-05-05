import React, { CSSProperties } from "react";
import { Buffer } from 'buffer'; // Required for class-transformer to work
(window as any).Buffer = Buffer;

import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, BrowserRouter } from "react-router-dom";
// import { inject } from '@vercel/analytics';

import "./birdUI.css";
import "./default.css";
import AuthProvider from './hooks/useAuth';
import CallbackPage from './pages/CallbackPage';
import Feed from './pages/Feed';
import Footer from './components/Footer';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { logLocaleInfo, logMsg } from "./helpers/string_helpers";


export default function App(): React.ReactElement {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js');
        });
    }

    logMsg(`process.env.NODE_ENV: ${process.env.NODE_ENV}, process.env.DEBUG: ${process.env.DEBUG}`);
    logLocaleInfo();

    return (
        <BrowserRouter>
            <AuthProvider>
                <div className='container-fluid min-vh-100' style={containerStyle}>
                    <Header />

                    <Routes>
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Feed />
                            </ProtectedRoute>
                        } />
                        <Route path="/callback" element={<CallbackPage />} />
                        <Route path="/login" element={<LoginPage />} />
                    </Routes>

                    <Footer />
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
};


const containerStyle: CSSProperties = {
    alignItems: 'center',
    backgroundColor: 'black',
    display: 'flex',
    flexDirection: 'column',
    height: 'auto',
};
