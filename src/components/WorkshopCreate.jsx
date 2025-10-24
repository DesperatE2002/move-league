"use client";
import React, { useState } from 'react';

const WorkshopCreate = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    level: '',
    description: '',
    requirements: '',
    videoUrl: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    location: '',
    address: '',
    capacity: 20,
    price: 0,
  });

  const [creating, setCreating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Şu anda gerçek upload yok, mock URL kullanıyoruz
      const mockVideoUrl = `https://www.youtube.com/shorts/LlXkjjINyiU?feature=share`;
      setFormData(prev => ({
        ...prev,
        videoUrl: mockVideoUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400'
      }));
      alert(`Video seçildi: ${file.name}\n(Geçici olarak mock URL kullanılıyor)`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.scheduledDate || !formData.scheduledTime || !formData.location) {
      alert('Lütfen zorunlu alanları doldurun');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/workshops', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          duration: parseInt(formData.duration),
          capacity: parseInt(formData.capacity),
          price: parseFloat(formData.price),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Workshop başarıyla oluşturuldu!');
        if (onSuccess) onSuccess();
      } else {
        alert(`❌ Hata: ${data.error}`);
      }
    } catch (error) {
      console.error('Create workshop error:', error);
      alert('Bir hata oluştu.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a0505 100%)',
      fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div className="workshop-create">
      <button className="btn-back" onClick={onBack}>← Geri</button>

      <div className="form-container">
        <h2>🎓 Yeni Workshop Oluştur</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Workshop Başlığı *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Örn: Hip Hop Temel Adımlar"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kategori *</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="">Kategori Seçin</option>
                <option value="hiphop">Hip Hop</option>
                <option value="breaking">Breaking</option>
                <option value="popping">Popping</option>
                <option value="locking">Locking</option>
                <option value="house">House</option>
                <option value="waacking">Waacking</option>
                <option value="krump">Krump</option>
                <option value="contemporary">Contemporary</option>
                <option value="ballet">Ballet</option>
                <option value="jazz">Jazz</option>
                <option value="street">Street Dance</option>
                <option value="latin">Latin</option>
                <option value="salsa">Salsa</option>
                <option value="bachata">Bachata</option>
                <option value="kizomba">Kizomba</option>
              </select>
            </div>

            <div className="form-group">
              <label>Seviye *</label>
              <select name="level" value={formData.level} onChange={handleChange} required>
                <option value="">Seviye Seçin</option>
                <option value="beginner">Başlangıç</option>
                <option value="intermediate">Orta</option>
                <option value="advanced">İleri</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Açıklama *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              required
            />
          </div>

          <div className="form-group">
            <label>Workshop Videosu</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              style={{
                padding: '0.75rem',
                border: '2px dashed rgba(255,255,255,0.3)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                cursor: 'pointer'
              }}
            />
            <small style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', display: 'block' }}>
              Şu anda video dosyası yüklenemez. Geçici olarak Unsplash'tan örnek video kullanılıyor.
            </small>
          </div>

          <div className="form-group">
            <label>Gereksinimler</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows="3"
              placeholder="Bu workshop için gerekli deneyim, ekipman vb."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tarih *</label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Saat *</label>
              <input
                type="time"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Süre (dk) *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="30"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Konum *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kapasite *</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Fiyat (₺) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onBack}>
              İptal
            </button>
            <button type="submit" className="btn-submit" disabled={creating}>
              {creating ? 'Oluşturuluyor...' : 'Workshop Oluştur'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .workshop-create {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .btn-back {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          margin-bottom: 2rem;
        }

        .form-container {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 2rem;
        }

        .form-container h2 {
          margin: 0 0 2rem 0;
          color: white;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          font-family: inherit;
        }

        .form-group select {
          background: rgba(0, 0, 0, 0.5);
        }

        .form-group select option {
          background: #1a1a1a;
          color: white;
          padding: 0.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .btn-cancel,
        .btn-submit {
          padding: 1rem 2rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .btn-submit {
          background: #5856D6;
          color: white;
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
    </div>
  );
};

export default WorkshopCreate;
