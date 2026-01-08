"use client";

import React from 'react';
import { UserButton } from '@clerk/nextjs';

const PendingApprovalPage = ({ user }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b0b0b 0%, #1a0000 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem'
      }}>
        <UserButton afterSignOutUrl="/" />
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(50,10,10,0.95) 100%)',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'rgba(255,165,0,0.1)',
          border: '3px solid #FFA500',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: '40px'
        }}>
          ⏳
        </div>

        <h2 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.75rem' }}>
          Hesabınız Onay Bekliyor
        </h2>

        <p style={{ color: '#9aa0a6', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Merhaba <strong style={{ color: '#fff' }}>{user.name}</strong>,
        </p>

        <div style={{
          background: 'rgba(255,165,0,0.1)',
          border: '1px solid rgba(255,165,0,0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <p style={{ color: '#FFA500', marginBottom: '0.75rem', fontWeight: '600' }}>
            📋 Hesap Durumu
          </p>
          <p style={{ color: '#9aa0a6', fontSize: '14px', lineHeight: '1.6' }}>
            <strong style={{ color: '#fff' }}>{user.role === 'INSTRUCTOR' ? 'Eğitmen' : 'Hakem'}</strong> hesabınız admin onayı bekliyor. 
            Admin ekibimiz başvurunuzu en kısa sürede inceleyecektir.
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <p style={{ color: '#fff', marginBottom: '0.75rem', fontWeight: '600' }}>
            ⚠️ Onay Süreci
          </p>
          <ul style={{ color: '#9aa0a6', fontSize: '14px', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
            <li>Sistemi görüntüleyebilirsiniz</li>
            <li>Ancak işlem yapma yetkiniz şu an kısıtlıdır</li>
            <li>Onay aldıktan sonra tüm özelliklere erişebileceksiniz</li>
            <li>Onay süresi: <strong style={{ color: '#FFA500' }}>24-48 saat</strong></li>
          </ul>
        </div>

        <p style={{ color: '#666', fontSize: '13px' }}>
          Sorularınız için: <a href="mailto:support@moveleague.com" style={{ color: '#FF3B30', textDecoration: 'none' }}>support@moveleague.com</a>
        </p>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
