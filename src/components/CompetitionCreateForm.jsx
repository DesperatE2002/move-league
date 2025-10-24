import React, { useState } from 'react';
import { authApi } from '@/lib/api-client';
import './CompetitionCreateForm.css';

const CompetitionCreateForm = ({ onBackClick, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    eventDate: '',
    eventTime: '21:00',
    registrationStart: '',
    registrationEnd: '',
    location: '',
    venue: '',
    address: '',
    description: '',
    rules: '',
    minTeamMembers: 4,
    maxTeamMembers: 8,
    maxTeams: 10,
    prizeFirst: '',
    prizeSecond: '',
    prizeThird: '',
    judgeCount: 3
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const calculateDates = () => {
    if (!formData.eventDate) return;

    const eventDate = new Date(formData.eventDate + 'T' + formData.eventTime);
    
    const registrationStart = new Date(eventDate);
    registrationStart.setDate(registrationStart.getDate() - 5);
    
    const registrationEnd = new Date(eventDate);
    registrationEnd.setDate(registrationEnd.getDate() - 1);
    registrationEnd.setHours(23, 59, 59);

    setFormData(prev => ({
      ...prev,
      registrationStart: registrationStart.toISOString().slice(0, 16),
      registrationEnd: registrationEnd.toISOString().slice(0, 16)
    }));
  };

  React.useEffect(() => {
    if (formData.eventDate && formData.eventTime) {
      calculateDates();
    }
  }, [formData.eventDate, formData.eventTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const eventDateTime = new Date(formData.eventDate + 'T' + formData.eventTime);
      const registrationStart = new Date(formData.registrationStart);
      const registrationEnd = new Date(formData.registrationEnd);
      
      const songRevealDate = new Date(eventDateTime);
      songRevealDate.setDate(songRevealDate.getDate() - 1);
      songRevealDate.setHours(12, 0, 0);

      const competitionData = {
        name: formData.name,
        eventDate: eventDateTime.toISOString(),
        registrationStart: registrationStart.toISOString(),
        registrationEnd: registrationEnd.toISOString(),
        songRevealDate: songRevealDate.toISOString(),
        location: formData.location,
        venue: formData.venue,
        address: formData.address,
        description: formData.description,
        rules: formData.rules,
        minTeamMembers: parseInt(formData.minTeamMembers),
        maxTeamMembers: parseInt(formData.maxTeamMembers),
        maxTeams: parseInt(formData.maxTeams),
        prizeFirst: parseFloat(formData.prizeFirst) || 0,
        prizeSecond: parseFloat(formData.prizeSecond) || 0,
        prizeThird: parseFloat(formData.prizeThird) || 0,
        judgeCount: parseInt(formData.judgeCount)
      };

      await authApi.createCompetition(competitionData);
      alert('✅ Yarışma başarıyla oluşturuldu!');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Yarışma oluşturma hatası:', err);
      setError(err.message || 'Yarışma oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="competition-create-form">
      <div className="form-header">
        <button onClick={onBackClick} className="back-button">← Geri</button>
        <h2>🏆 Yeni Yarışma Oluştur</h2>
      </div>

      <form onSubmit={handleSubmit} className="create-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-section">
          <h3>📋 Temel Bilgiler</h3>
          
          <div className="form-group">
            <label>Yarışma Adı *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} 
              placeholder="örn: 2025 Bahar Dance Show" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Etkinlik Tarihi *</label>
              <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange}
                min={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="form-group">
              <label>Etkinlik Saati *</label>
              <input type="time" name="eventTime" value={formData.eventTime} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Mekan Adı *</label>
            <input type="text" name="venue" value={formData.venue} onChange={handleChange}
              placeholder="örn: La Noche" required />
          </div>

          <div className="form-group">
            <label>Konum/Şehir *</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange}
              placeholder="örn: İstanbul" required />
          </div>

          <div className="form-group">
            <label>Adres</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange}
              placeholder="Detaylı adres (opsiyonel)" />
          </div>

          <div className="form-group">
            <label>Açıklama *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="4"
              placeholder="Yarışma hakkında genel bilgi..." required />
          </div>

          <div className="form-group">
            <label>Kurallar</label>
            <textarea name="rules" value={formData.rules} onChange={handleChange} rows="4"
              placeholder="Yarışma kuralları (opsiyonel)" />
          </div>
        </div>

        <div className="form-section">
          <h3>📅 Kayıt Tarihleri</h3>
          <p className="info-text">Etkinlik tarihine göre otomatik hesaplanır</p>
          
          <div className="form-row">
            <div className="form-group">
              <label>Kayıt Başlangıç</label>
              <input type="datetime-local" name="registrationStart" value={formData.registrationStart}
                onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Kayıt Bitiş</label>
              <input type="datetime-local" name="registrationEnd" value={formData.registrationEnd}
                onChange={handleChange} required />
            </div>
          </div>
          <p className="help-text">💡 Şarkı otomatik olarak etkinlikten 1 gün önce açıklanacak</p>
        </div>

        <div className="form-section">
          <h3>👥 Takım Ayarları</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Min. Üye Sayısı</label>
              <input type="number" name="minTeamMembers" value={formData.minTeamMembers}
                onChange={handleChange} min="2" max="20" required />
            </div>
            <div className="form-group">
              <label>Max. Üye Sayısı</label>
              <input type="number" name="maxTeamMembers" value={formData.maxTeamMembers}
                onChange={handleChange} min="2" max="20" required />
            </div>
            <div className="form-group">
              <label>Max. Takım Sayısı *</label>
              <input type="number" name="maxTeams" value={formData.maxTeams}
                onChange={handleChange} min="2" max="50" required />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>🏅 Ödüller</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>1. Ödül (₺)</label>
              <input type="number" name="prizeFirst" value={formData.prizeFirst}
                onChange={handleChange} placeholder="0" min="0" step="100" />
            </div>
            <div className="form-group">
              <label>2. Ödül (₺)</label>
              <input type="number" name="prizeSecond" value={formData.prizeSecond}
                onChange={handleChange} placeholder="0" min="0" step="100" />
            </div>
            <div className="form-group">
              <label>3. Ödül (₺)</label>
              <input type="number" name="prizeThird" value={formData.prizeThird}
                onChange={handleChange} placeholder="0" min="0" step="100" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>⚖️ Jüri</h3>
          <div className="form-group">
            <label>Jüri Sayısı</label>
            <input type="number" name="judgeCount" value={formData.judgeCount}
              onChange={handleChange} min="1" max="10" required />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onBackClick} className="cancel-button">İptal</button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Oluşturuluyor...' : '✅ Yarışmayı Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompetitionCreateForm;
