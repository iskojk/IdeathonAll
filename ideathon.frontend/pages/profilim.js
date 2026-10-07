/**
 * Profilim (My Profile) Page - V2 with Tabs
 * Kullanıcı profil bilgileri, şifre değiştirme ve takım yönetimi
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ErrorMessage from '@/components/ErrorMessage';
import { useAuth } from '@/context/AuthContext';
import { useIdeathonConfig, useIdeathon } from '@/context/IdeathonContext';
import { authAPI, teamAPI } from '@/lib/api';
import { notify } from '@/components/Notification';
import { validateEmail, validateRequired } from '@/utils/validation';
import { getInitials } from '@/lib/auth';

export default function Profilim() {
  const { user, updateProfile } = useAuth();
  const config = useIdeathonConfig();
  const { slug: ideathonSlug } = useIdeathon();
  const teamEditAllowed = config.loading || config.teamFormOpen;
  const [activeTab, setActiveTab] = useState('profile'); // profile, password, team
  
  // Profile Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  // Team State
  const [team, setTeam] = useState(null);
  const [hasTeam, setHasTeam] = useState(false);
  const [teamLoading, setTeamLoading] = useState(true);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMemberIndex, setEditingMemberIndex] = useState(null);
  
  const [teamForm, setTeamForm] = useState({
    teamName: '',
    teamDescription: '',
    city: '',
  });
  
  const [memberForm, setMemberForm] = useState({
    name: '',
    tcIdentity: '',
    email: '',
    role: '',
  });
  
  const [teamErrors, setTeamErrors] = useState({});
  const [memberErrors, setMemberErrors] = useState({});
  const [teamSubmitting, setTeamSubmitting] = useState(false);
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Load team data when team tab is active
  useEffect(() => {
    if (activeTab === 'team') {
      loadTeam();
    }
  }, [activeTab, ideathonSlug]);

  const hasIdeathonSlug = !!(ideathonSlug || (typeof window !== 'undefined' && localStorage.getItem('ideathon_slug')));

  const loadTeam = async () => {
    if (!hasIdeathonSlug) {
      setTeamLoading(false);
      setHasTeam(false);
      setTeam(null);
      return;
    }
    try {
      setTeamLoading(true);
      const response = await teamAPI.getMyTeam();
      if (response.success && response.data.team) {
        setTeam(response.data.team);
        setHasTeam(true);
      }
    } catch (error) {
      if (error.status === 404) {
        setHasTeam(false);
        setTeam(null);
      } else {
        console.error('Takım yüklenirken hata:', error);
        notify.error(error.message || 'Takım bilgileri yüklenemedi');
      }
    } finally {
      setTeamLoading(false);
    }
  };

  // Profile Form Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const formatPhoneNumber = (value) => {
    let digits = value.replace(/\D/g, '');
    if (digits.length > 0 && !digits.startsWith('0')) digits = '0' + digits;
    if (digits.length > 11) digits = digits.substring(0, 11);
    let formatted = digits;
    if (digits.length > 4) formatted = digits.substring(0, 4) + ' ' + digits.substring(4);
    if (digits.length > 7) formatted = digits.substring(0, 4) + ' ' + digits.substring(4, 7) + ' ' + digits.substring(7);
    return formatted;
  };

  const handlePhoneChange = (e) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formattedValue }));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!validateRequired(formData.name)) {
      newErrors.name = 'Ad Soyad gereklidir';
    } else if (formData.name.trim().split(' ').length < 2) {
      newErrors.name = 'Lütfen adınızı ve soyadınızı giriniz';
    }
    if (!validateRequired(formData.email)) {
      newErrors.email = 'E-posta adresi gereklidir';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }
    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 11) {
        newErrors.phone = 'Geçerli bir telefon numarası giriniz';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        notify.success('Profiliniz başarıyla güncellendi');
      } else {
        notify.error(result.error || 'Profil güncellenirken bir hata oluştu');
      }
    } catch (error) {
      notify.error('Bir hata oluştu. Lütfen tekrar deneyiniz');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password Form Handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) setPasswordErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    if (!validateRequired(passwordForm.currentPassword)) {
      newErrors.currentPassword = 'Mevcut şifre gereklidir';
    }
    if (!validateRequired(passwordForm.newPassword)) {
      newErrors.newPassword = 'Yeni şifre gereklidir';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Yeni şifre en az 6 karakter olmalıdır';
    }
    if (!validateRequired(passwordForm.confirmPassword)) {
      newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    setIsPasswordSubmitting(true);
    try {
      const response = await authAPI.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      if (response.success) {
        notify.success('Şifreniz başarıyla değiştirildi');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      if (error.status !== 401) {
        notify.error(error.message || 'Şifre değiştirilirken bir hata oluştu');
      }
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  // Team Form Handlers
  const handleTeamFormChange = (e) => {
    const { name, value } = e.target;
    setTeamForm(prev => ({ ...prev, [name]: value }));
    if (teamErrors[name]) setTeamErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleMemberFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'tcIdentity') {
      // Only allow numbers and limit to 11 digits
      const sanitized = value.replace(/\D/g, '').slice(0, 11);
      setMemberForm(prev => ({ ...prev, [name]: sanitized }));
    } else {
      setMemberForm(prev => ({ ...prev, [name]: value }));
    }
    if (memberErrors[name]) setMemberErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateTeamForm = () => {
    const newErrors = {};
    if (!teamForm.teamName || teamForm.teamName.trim().length < 2) {
      newErrors.teamName = 'Takım adı en az 2 karakter olmalıdır';
    } else if (teamForm.teamName.length > 100) {
      newErrors.teamName = 'Takım adı en fazla 100 karakter olabilir';
    }
    if (teamForm.teamDescription && teamForm.teamDescription.length > 1000) {
      newErrors.teamDescription = 'Açıklama en fazla 1000 karakter olabilir';
    }
    if (teamForm.city && teamForm.city.length > 100) {
      newErrors.city = 'Şehir en fazla 100 karakter olabilir';
    }
    setTeamErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateMemberForm = () => {
    const newErrors = {};
    if (!memberForm.name || memberForm.name.trim().length < 2) {
      newErrors.name = 'İsim en az 2 karakter olmalıdır';
    }
    if (!memberForm.tcIdentity || !/^[0-9]{11}$/.test(memberForm.tcIdentity)) {
      newErrors.tcIdentity = 'TC Kimlik No 11 haneli sayı olmalıdır';
    }
    if (memberForm.email && !validateEmail(memberForm.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }
    setMemberErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!validateTeamForm()) return;
    setTeamSubmitting(true);
    try {
      const response = await teamAPI.createTeam(teamForm);
      if (response.success) {
        notify.success('Takım başarıyla oluşturuldu');
        setTeam(response.data.team);
        setHasTeam(true);
        setShowTeamForm(false);
        setTeamForm({ teamName: '', teamDescription: '', city: '' });
      } else {
        notify.error(response.message || 'Takım oluşturulurken hata oluştu');
      }
    } catch (error) {
      notify.error(error.message || 'Takım oluşturulurken hata oluştu');
    } finally {
      setTeamSubmitting(false);
    }
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    if (!validateTeamForm()) return;
    setTeamSubmitting(true);
    try {
      const response = await teamAPI.updateTeam(teamForm);
      if (response.success) {
        notify.success('Takım bilgileri güncellendi');
        setTeam(response.data.team);
        setShowTeamForm(false);
      } else {
        notify.error(response.message || 'Takım güncellenirken hata oluştu');
      }
    } catch (error) {
      notify.error(error.message || 'Takım güncellenirken hata oluştu');
    } finally {
      setTeamSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      setDeletingTeam(true);
      const response = await teamAPI.deleteTeam();
      if (response.success) {
        notify.success('Takım başarıyla silindi');
        setTeam(null);
        setHasTeam(false);
        setShowDeleteTeamModal(false);
      }
    } catch (error) {
      notify.error(error.message || 'Takım silinirken hata oluştu');
    } finally {
      setDeletingTeam(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!validateMemberForm()) return;
    if (team?.members?.length >= 4) {
      notify.error('Kendiniz dahil en fazla 5 kişilik takım oluşturabilirsiniz (en fazla 4 üye).');
      return;
    }
    setTeamSubmitting(true);
    try {
      const response = await teamAPI.addMember(memberForm);
      if (response.success) {
        notify.success('Üye başarıyla eklendi');
        setTeam(response.data.team);
        setShowMemberForm(false);
        setMemberForm({ name: '', tcIdentity: '', email: '', role: '' });
      } else {
        notify.error(response.message || 'Üye eklenirken hata oluştu');
      }
    } catch (error) {
      notify.error(error.message || 'Üye eklenirken hata oluştu');
    } finally {
      setTeamSubmitting(false);
    }
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    if (!validateMemberForm()) return;
    setTeamSubmitting(true);
    try {
      const response = await teamAPI.updateMember(editingMemberIndex, memberForm);
      if (response.success) {
        notify.success('Üye güncellendi');
        setTeam(response.data.team);
        setShowMemberForm(false);
        setEditingMemberIndex(null);
        setMemberForm({ name: '', tcIdentity: '', email: '', role: '' });
      } else {
        notify.error(response.message || 'Üye güncellenirken hata oluştu');
      }
    } catch (error) {
      notify.error(error.message || 'Üye güncellenirken hata oluştu');
    } finally {
      setTeamSubmitting(false);
    }
  };

  const handleDeleteMember = async (index) => {
    if ((team?.members?.length || 0) <= 2) {
      notify.error('Kendiniz dahil en az 3 kişilik takım gereklidir. Daha fazla üye silemezsiniz.');
      return;
    }
    if (!confirm('Bu üyeyi silmek istediğinizden emin misiniz?')) return;
    try {
      const response = await teamAPI.deleteMember(index);
      if (response.success) {
        notify.success('Üye silindi');
        setTeam(response.data.team);
      }
    } catch (error) {
      notify.error(error.message || 'Üye silinirken hata oluştu');
    }
  };

  const openEditTeamForm = () => {
    setTeamForm({
      teamName: team.teamName,
      teamDescription: team.teamDescription || '',
      city: team.city || '',
    });
    setShowTeamForm(true);
  };

  const openEditMemberForm = (index) => {
    const member = team.members[index];
    setMemberForm({
      name: member.name,
      tcIdentity: member.tcIdentity,
      email: member.email || '',
      role: member.role || '',
    });
    setEditingMemberIndex(index);
    setShowMemberForm(true);
  };

  const cancelMemberForm = () => {
    setShowMemberForm(false);
    setEditingMemberIndex(null);
    setMemberForm({ name: '', tcIdentity: '', email: '', role: '' });
    setMemberErrors({});
  };

  if (!user) {
    return null;
  }

  return (
    <PrivateRoute>
      <Head>
        <title>Profilim - Emlak Konut Ideathon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <section className="profile-section" style={{ marginTop: '140px', paddingTop: '60px', paddingBottom: '60px' }}>
          <div className="container">
            {/* Profile Header */}
            <div className="profile-header">
              <div className="profile-avatar-display">
                <span className="avatar-initials-large">{getInitials(user.name)}</span>
              </div>
              <h1 className="profile-name">{user.name}</h1>
              <p className="profile-email">{user.email}</p>
              <span className="profile-role-badge">
                <i className="bi bi-shield-check"></i>
                {user.role === 'user' ? 'Kullanıcı' : user.role === 'juri' ? 'Jüri' : 'Yönetici'}
              </span>
            </div>

            {/* Tabs Navigation */}
            <div className="tabs-container">
              <div className="tabs-nav">
                <button
                  className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="bi bi-person"></i>
                  <span>Profil Bilgileri</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
                  onClick={() => setActiveTab('password')}
                >
                  <i className="bi bi-shield-lock"></i>
                  <span>Şifre Değiştir</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
                  onClick={() => setActiveTab('team')}
                >
                  <i className="bi bi-people"></i>
                  <span>Takımım</span>
                  {hasTeam && team && (
                    <span className="team-badge">{team.members?.length || 0}</span>
                  )}
                </button>
              </div>

              <div className="tabs-content">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="tab-panel">
                    <form onSubmit={handleSubmit}>
                      <div className="form-group">
                        <label htmlFor="name">
                          Ad Soyad <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className={errors.name ? 'error' : ''}
                          placeholder="Adınız ve Soyadınız"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={isSubmitting}
                        />
                        {errors.name && <div className="field-error">{errors.name}</div>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">
                          E-posta Adresi <span className="required">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className={errors.email ? 'error' : ''}
                          placeholder="ornek@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={isSubmitting}
                        />
                        {errors.email && <div className="field-error">{errors.email}</div>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="phone">Telefon Numarası</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className={errors.phone ? 'error' : ''}
                          placeholder="05XX XXX XX XX"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          maxLength="16"
                          disabled={isSubmitting}
                        />
                        {errors.phone && <div className="field-error">{errors.phone}</div>}
                      </div>

                      <div className="form-info">
                        <div className="info-row">
                          <span className="info-label">Hesap Durumu:</span>
                          <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Kayıt Tarihi:</span>
                          <span className="info-value">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                          </span>
                        </div>
                      </div>

                      <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <i className="bi bi-arrow-repeat spinning"></i>
                            Güncelleniyor...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle"></i>
                            Değişiklikleri Kaydet
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                  <div className="tab-panel">
                    <form onSubmit={handlePasswordSubmit}>
                      <div className="form-group">
                        <label htmlFor="currentPassword">
                          Mevcut Şifre <span className="required">*</span>
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          autoComplete="current-password"
                          className={passwordErrors.currentPassword ? 'error' : ''}
                          placeholder="Mevcut şifreniz"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          disabled={isPasswordSubmitting}
                        />
                        {passwordErrors.currentPassword && (
                          <div className="field-error">{passwordErrors.currentPassword}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="newPassword">
                          Yeni Şifre <span className="required">*</span>
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          autoComplete="new-password"
                          className={passwordErrors.newPassword ? 'error' : ''}
                          placeholder="En az 6 karakter"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          disabled={isPasswordSubmitting}
                        />
                        {passwordErrors.newPassword && (
                          <div className="field-error">{passwordErrors.newPassword}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="confirmPassword">
                          Yeni Şifre (Tekrar) <span className="required">*</span>
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          autoComplete="new-password"
                          className={passwordErrors.confirmPassword ? 'error' : ''}
                          placeholder="Yeni şifrenizi tekrar girin"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          disabled={isPasswordSubmitting}
                        />
                        {passwordErrors.confirmPassword && (
                          <div className="field-error">{passwordErrors.confirmPassword}</div>
                        )}
                      </div>

                      <button type="submit" className="btn-secondary" disabled={isPasswordSubmitting}>
                        {isPasswordSubmitting ? (
                          <>
                            <i className="bi bi-arrow-repeat spinning"></i>
                            Değiştiriliyor...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-shield-check"></i>
                            Şifreyi Değiştir
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* Team Tab */}
                {activeTab === 'team' && (
                  <div className="tab-panel">
                    {/* İdeathon seçilmemişse uyarı */}
                    {!hasIdeathonSlug && !teamLoading && (
                      <div style={{
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        border: '2px solid #3b82f6',
                        borderRadius: '12px',
                        padding: '24px',
                        textAlign: 'center',
                        color: '#1e3a5f'
                      }}>
                        <i className="bi bi-info-circle-fill" style={{ fontSize: '32px', color: '#3b82f6', display: 'block', marginBottom: '12px' }}></i>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>İdeathon Seçimi Gerekli</h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
                          Takım bilgilerinizi görüntülemek için lütfen önce bir ideathon sayfasını ziyaret edin.
                        </p>
                      </div>
                    )}
                    {/* Takım düzenleme kapalıysa bilgi mesajı */}
                    {hasIdeathonSlug && !config.loading && !config.teamFormOpen && hasTeam && (
                      <div className="team-closed-banner" style={{
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '2px solid #f59e0b',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#78350f'
                      }}>
                        <i className="bi bi-lock-fill" style={{ fontSize: '20px', color: '#f59e0b' }}></i>
                        <div>
                          <strong>Takım düzenleme kapalıdır.</strong>
                          <span style={{ display: 'block', fontSize: '13px', marginTop: '2px' }}>
                            Takım bilgilerinizi görüntüleyebilir ancak düzenleme yapamazsınız.
                          </span>
                        </div>
                      </div>
                    )}
                    {teamLoading ? (
                      <div className="loading-state">
                        <i className="bi bi-arrow-repeat spinning"></i>
                        <p>Takım bilgileri yükleniyor...</p>
                      </div>
                    ) : !hasTeam ? (
                      <div className="empty-team-state">
                        {!showTeamForm ? (
                          <>
                            <div className="empty-icon">
                              <i className="bi bi-people"></i>
                            </div>
                            <h3>Henüz Takımınız Yok</h3>
                            {teamEditAllowed ? (
                              <>
                                <p>Başvuru yapabilmek için önce bir takım oluşturmalısınız.</p>
                                <button
                                  className="btn-primary"
                                  onClick={() => setShowTeamForm(true)}
                                >
                                  <i className="bi bi-plus-circle"></i>
                                  Takım Oluştur
                                </button>
                              </>
                            ) : (
                              <p>Takım oluşturma süreci şu an kapalıdır.</p>
                            )}
                          </>
                        ) : (
                          <form onSubmit={handleCreateTeam} className="team-form">
                            <h3>
                              <i className="bi bi-people"></i>
                              Yeni Takım Oluştur
                            </h3>
                            
                            <div className="form-group">
                              <label htmlFor="teamName">
                                Takım Adı <span className="required">*</span>
                              </label>
                              <input
                                type="text"
                                id="teamName"
                                name="teamName"
                                className={teamErrors.teamName ? 'error' : ''}
                                placeholder="Takımınızın adı (2-100 karakter)"
                                value={teamForm.teamName}
                                onChange={handleTeamFormChange}
                                disabled={teamSubmitting}
                              />
                              {teamErrors.teamName && (
                                <div className="field-error">{teamErrors.teamName}</div>
                              )}
                            </div>

                            <div className="form-group">
                              <label htmlFor="city">Şehir</label>
                              <input
                                type="text"
                                id="city"
                                name="city"
                                className={teamErrors.city ? 'error' : ''}
                                placeholder="Şehir (opsiyonel, max 100 karakter)"
                                value={teamForm.city}
                                onChange={handleTeamFormChange}
                                disabled={teamSubmitting}
                              />
                              {teamErrors.city && (
                                <div className="field-error">{teamErrors.city}</div>
                              )}
                            </div>

                            <div className="form-group">
                              <label htmlFor="teamDescription">Takım Açıklaması</label>
                              <textarea
                                id="teamDescription"
                                name="teamDescription"
                                className={teamErrors.teamDescription ? 'error' : ''}
                                placeholder="Takımınızın açıklaması (opsiyonel, max 1000 karakter)"
                                value={teamForm.teamDescription}
                                onChange={handleTeamFormChange}
                                rows="4"
                                disabled={teamSubmitting}
                              />
                              {teamErrors.teamDescription && (
                                <div className="field-error">{teamErrors.teamDescription}</div>
                              )}
                            </div>

                            <div className="form-info-text" style={{ background: '#dbeafe', border: '1px solid #2563eb', color: '#1e3a5f', flexWrap: 'wrap' }}>
                              <i className="bi bi-people-fill" style={{ color: '#2563eb' }}></i>
                              <div>
                                <strong>Takım Kuralı:</strong> Kendiniz dahil <strong>minimum 3, maksimum 5 kişilik</strong> takım oluşturmanız gerekmektedir. Takımınıza kendiniz dışında en az 2, en fazla 4 üye ekleyiniz.
                                <span style={{ display: 'block', marginTop: '4px', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>
                                  Lütfen kendinizi takım üyesi olarak eklemeyiniz. Siz otomatik olarak takım lideri olarak kaydedilirsiniz.
                                </span>
                              </div>
                            </div>

                            <div className="form-actions">
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                  setShowTeamForm(false);
                                  setTeamForm({ teamName: '', teamDescription: '', city: '' });
                                  setTeamErrors({});
                                }}
                                disabled={teamSubmitting}
                              >
                                İptal
                              </button>
                              <button type="submit" className="btn-primary" disabled={teamSubmitting}>
                                {teamSubmitting ? (
                                  <>
                                    <i className="bi bi-arrow-repeat spinning"></i>
                                    Oluşturuluyor...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-check-circle"></i>
                                    Takımı Oluştur
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    ) : (
                      <div className="team-management">
                        {!showTeamForm && !showMemberForm ? (
                          <>
                            {/* Team Info Card */}
                            <div className="team-card">
                              <div className="team-card-header">
                                <div>
                                  <h3>
                                    <i className="bi bi-people-fill"></i>
                                    {team.teamName}
                                  </h3>
                                  {team.teamDescription && (
                                    <p className="team-description">{team.teamDescription}</p>
                                  )}
                                </div>
                                {teamEditAllowed && (
                                  <button className="btn-edit" onClick={openEditTeamForm}>
                                    <i className="bi bi-pencil"></i>
                                    Düzenle
                                  </button>
                                )}
                              </div>

                              <div className="team-stats">
                                <div className="stat-item">
                                  <i className="bi bi-people"></i>
                                  <div>
                                    <span className="stat-value">{(team.members?.length || 0) + 1}/5</span>
                                    <span className="stat-label">Üye Sayısı</span>
                                  </div>
                                </div>
                                <div className="stat-item">
                                  <i className="bi bi-person-badge"></i>
                                  <div>
                                    <span className="stat-value">{user.name}</span>
                                    <span className="stat-label">Takım Lideri</span>
                                  </div>
                                </div>
                                {team.city && (
                                  <div className="stat-item">
                                    <i className="bi bi-geo-alt"></i>
                                    <div>
                                      <span className="stat-value">{team.city}</span>
                                      <span className="stat-label">Şehir</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Takım kuralı bilgi notu */}
                            <div style={{
                              background: '#dbeafe',
                              border: '1px solid #2563eb',
                              borderRadius: '12px',
                              padding: '14px 20px',
                              marginBottom: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              color: '#1e3a5f',
                              fontSize: '14px'
                            }}>
                              <i className="bi bi-people-fill" style={{ fontSize: '18px', color: '#2563eb', flexShrink: 0 }}></i>
                              <div>
                                <span><strong>Takım Kuralı:</strong> Kendiniz dahil <strong>minimum 3, maksimum 5 kişilik</strong> takım oluşturmanız gerekmektedir.</span>
                                <span style={{ display: 'block', marginTop: '4px', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>
                                  Lütfen kendinizi takım üyesi olarak eklemeyiniz. Siz otomatik olarak takım lideri olarak kaydedilmektesiniz.
                                </span>
                              </div>
                            </div>

                            {/* Min üye uyarısı */}
                            {(team.members?.length || 0) < 2 && teamEditAllowed && (
                              <div style={{
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                border: '2px solid #f59e0b',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                marginBottom: '24px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                color: '#78350f'
                              }}>
                                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '22px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }}></i>
                                <div>
                                  <strong>Lütfen en az 3 takım üyesi ekleyin!</strong>
                                  <span style={{ display: 'block', fontSize: '13px', marginTop: '4px' }}>
                                    Kendiniz dahil minimum 3 kişilik takım oluşturmanız gerekmektedir. Şu an takımınızda kendiniz dahil <strong>{(team.members?.length || 0) + 1} kişi</strong> bulunmaktadır.
                                    {(team.members?.length || 0) === 0 && ' En az 2 üye eklemeniz gerekiyor.'}
                                    {(team.members?.length || 0) === 1 && ' En az 1 üye daha eklemeniz gerekiyor.'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Team Members */}
                            <div className="team-members">
                              <div className="members-header">
                                <h4>
                                  <i className="bi bi-person-lines-fill"></i>
                                  Takım Üyeleri ({team.members?.length || 0})
                                </h4>
                                {teamEditAllowed ? (
                                  <>
                                    {(team.members?.length || 0) < 4 && (
                                      <button
                                        className="btn-add"
                                        onClick={() => setShowMemberForm(true)}
                                      >
                                        <i className="bi bi-plus-circle"></i>
                                        Üye Ekle
                                      </button>
                                    )}
                                    {(team.members?.length || 0) >= 4 && (
                                      <span className="max-members-text">
                                        <i className="bi bi-check-circle"></i>
                                        Maksimum 5 kişi (siz dahil)
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="max-members-text">
                                    <i className="bi bi-lock"></i>
                                    Düzenleme kapalı
                                  </span>
                                )}
                              </div>

                              {team.members && team.members.length > 0 ? (
                                <div className="members-list">
                                  {team.members.map((member, index) => (
                                    <div key={member._id || index} className="member-card">
                                      <div className="member-avatar">
                                        {getInitials(member.name)}
                                      </div>
                                      <div className="member-info">
                                        <h5>{member.name}</h5>
                                        <p className="member-tc">TC: {member.tcIdentity.slice(0, 3)}****{member.tcIdentity.slice(-4)}</p>
                                        {member.email && <p className="member-email">{member.email}</p>}
                                        {member.role && <p className="member-role">{member.role}</p>}
                                      </div>
                                      {teamEditAllowed && (
                                        <div className="member-actions">
                                          <button
                                            className="btn-icon"
                                            onClick={() => openEditMemberForm(index)}
                                            title="Düzenle"
                                          >
                                            <i className="bi bi-pencil"></i>
                                          </button>
                                          <button
                                            className="btn-icon btn-danger"
                                            onClick={() => handleDeleteMember(index)}
                                            title="Sil"
                                          >
                                            <i className="bi bi-trash"></i>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-members">
                                  <i className="bi bi-person-plus"></i>
                                  <p>Henüz takım üyesi eklenmedi</p>
                                  {teamEditAllowed && (
                                    <button
                                      className="btn-primary"
                                      onClick={() => setShowMemberForm(true)}
                                    >
                                      <i className="bi bi-plus-circle"></i>
                                      İlk Üyeyi Ekle
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Delete Team — sadece teamCreationOpen aktifse */}
                            {teamEditAllowed && (
                              <div className="danger-zone">
                                <h4>
                                  <i className="bi bi-exclamation-triangle"></i>
                                  Tehlikeli Alan
                                </h4>
                                <p>Takımınızı silerseniz bu işlem geri alınamaz!</p>
                                <button className="btn-danger" onClick={() => setShowDeleteTeamModal(true)}>
                                  <i className="bi bi-trash"></i>
                                  Takımı Sil
                                </button>
                              </div>
                            )}
                          </>
                        ) : showTeamForm ? (
                          <form onSubmit={handleUpdateTeam} className="team-form">
                            <h3>
                              <i className="bi bi-pencil"></i>
                              Takım Bilgilerini Güncelle
                            </h3>
                            
                            <div className="form-group">
                              <label htmlFor="teamName">
                                Takım Adı <span className="required">*</span>
                              </label>
                              <input
                                type="text"
                                id="teamName"
                                name="teamName"
                                className={teamErrors.teamName ? 'error' : ''}
                                placeholder="Takımınızın adı"
                                value={teamForm.teamName}
                                onChange={handleTeamFormChange}
                                disabled={teamSubmitting}
                              />
                              {teamErrors.teamName && (
                                <div className="field-error">{teamErrors.teamName}</div>
                              )}
                            </div>

                            <div className="form-group">
                              <label htmlFor="city">Şehir</label>
                              <input
                                type="text"
                                id="city"
                                name="city"
                                className={teamErrors.city ? 'error' : ''}
                                placeholder="Şehir (opsiyonel)"
                                value={teamForm.city}
                                onChange={handleTeamFormChange}
                                disabled={teamSubmitting}
                              />
                              {teamErrors.city && (
                                <div className="field-error">{teamErrors.city}</div>
                              )}
                            </div>

                            <div className="form-group">
                              <label htmlFor="teamDescription">Takım Açıklaması</label>
                              <textarea
                                id="teamDescription"
                                name="teamDescription"
                                className={teamErrors.teamDescription ? 'error' : ''}
                                placeholder="Takımınızın açıklaması"
                                value={teamForm.teamDescription}
                                onChange={handleTeamFormChange}
                                rows="4"
                                disabled={teamSubmitting}
                              />
                              {teamErrors.teamDescription && (
                                <div className="field-error">{teamErrors.teamDescription}</div>
                              )}
                            </div>

                            <div className="form-actions">
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                  setShowTeamForm(false);
                                  setTeamForm({ teamName: '', teamDescription: '', city: '' });
                                  setTeamErrors({});
                                }}
                                disabled={teamSubmitting}
                              >
                                İptal
                              </button>
                              <button type="submit" className="btn-primary" disabled={teamSubmitting}>
                                {teamSubmitting ? (
                                  <>
                                    <i className="bi bi-arrow-repeat spinning"></i>
                                    Güncelleniyor...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-check-circle"></i>
                                    Güncelle
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <form
                            onSubmit={editingMemberIndex !== null ? handleUpdateMember : handleAddMember}
                            className="member-form"
                          >
                            <h3>
                              <i className="bi bi-person-plus"></i>
                              {editingMemberIndex !== null ? 'Üye Bilgilerini Güncelle' : 'Yeni Üye Ekle'}
                            </h3>

                            <div className="form-group">
                              <label htmlFor="memberName">
                                Ad Soyad <span className="required">*</span>
                              </label>
                              <input
                                type="text"
                                id="memberName"
                                name="name"
                                className={memberErrors.name ? 'error' : ''}
                                placeholder="Üyenin adı ve soyadı"
                                value={memberForm.name}
                                onChange={handleMemberFormChange}
                                disabled={teamSubmitting}
                              />
                              {memberErrors.name && (
                                <div className="field-error">{memberErrors.name}</div>
                              )}
                            </div>

                            <div className="form-group">
                              <label htmlFor="memberTc">
                                TC Kimlik No <span className="required">*</span>
                              </label>
                              <input
                                type="text"
                                id="memberTc"
                                name="tcIdentity"
                                className={memberErrors.tcIdentity ? 'error' : ''}
                                placeholder="11 haneli TC kimlik numarası"
                                value={memberForm.tcIdentity}
                                onChange={handleMemberFormChange}
                                maxLength="11"
                                disabled={teamSubmitting}
                              />
                              {memberErrors.tcIdentity && (
                                <div className="field-error">{memberErrors.tcIdentity}</div>
                              )}
                            </div>

                            <div className="form-group">
                              <label htmlFor="memberEmail">E-posta (Opsiyonel)</label>
                              <input
                                type="email"
                                id="memberEmail"
                                name="email"
                                className={memberErrors.email ? 'error' : ''}
                                placeholder="ornek@email.com"
                                value={memberForm.email}
                                onChange={handleMemberFormChange}
                                disabled={teamSubmitting}
                              />
                              {memberErrors.email && (
                                <div className="field-error">{memberErrors.email}</div>
                              )}
                            </div>

                            <div className="form-group">
                              <label htmlFor="memberRole">Rol (Opsiyonel)</label>
                              <input
                                type="text"
                                id="memberRole"
                                name="role"
                                placeholder="Örn: Backend Developer"
                                value={memberForm.role}
                                onChange={handleMemberFormChange}
                                disabled={teamSubmitting}
                              />
                            </div>

                            <div className="form-actions">
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={cancelMemberForm}
                                disabled={teamSubmitting}
                              >
                                İptal
                              </button>
                              <button type="submit" className="btn-primary" disabled={teamSubmitting}>
                                {teamSubmitting ? (
                                  <>
                                    <i className="bi bi-arrow-repeat spinning"></i>
                                    {editingMemberIndex !== null ? 'Güncelleniyor...' : 'Ekleniyor...'}
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-check-circle"></i>
                                    {editingMemberIndex !== null ? 'Güncelle' : 'Ekle'}
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </Layout>

      {/* Takım Silme Onay Modal */}
      {showDeleteTeamModal && (
        <div className="delete-team-modal-overlay" onClick={() => !deletingTeam && setShowDeleteTeamModal(false)}>
          <div className="delete-team-modal" onClick={(e) => e.stopPropagation()}>
            <button className="delete-team-modal-close" onClick={() => !deletingTeam && setShowDeleteTeamModal(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
            <div className="delete-team-modal-icon">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h3 className="delete-team-modal-title">Takımı Silmek İstediğinize Emin Misiniz?</h3>
            <p className="delete-team-modal-desc">
              Bu işlem geri alınamaz. Takımınız ve tüm üye bilgileri kalıcı olarak silinecektir.
            </p>
            <div className="delete-team-modal-actions">
              <button
                className="delete-team-modal-btn btn-cancel"
                onClick={() => setShowDeleteTeamModal(false)}
                disabled={deletingTeam}
              >
                Vazgeç
              </button>
              <button
                className="delete-team-modal-btn btn-confirm-delete"
                onClick={handleDeleteTeam}
                disabled={deletingTeam}
              >
                {deletingTeam ? (
                  <>
                    <i className="bi bi-arrow-repeat spinning"></i>
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash"></i>
                    Evet, Takımı Sil
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .profile-section {
          min-height: calc(100vh - 140px);
          background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
        }

        /* Profile Header */
        .profile-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .profile-avatar-display {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #005dad 0%, #0080ff 100%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 8px 24px rgba(0, 93, 173, 0.3);
        }

        .avatar-initials-large {
          color: white;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .profile-name {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
          text-align: center;
          word-wrap: break-word;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .profile-email {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 12px 0;
          text-align: center;
          word-wrap: break-word;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .profile-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        /* Tabs */
        .tabs-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .tabs-nav {
          display: flex;
          border-bottom: 2px solid #f3f4f6;
          background: #fafbfc;
        }

        .tab-btn {
          flex: 1;
          padding: 18px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .tab-btn i {
          font-size: 18px;
        }

        .tab-btn:hover {
          background: white;
          color: #005dad;
        }

        .tab-btn.active {
          background: white;
          color: #005dad;
          border-bottom-color: #005dad;
        }

        .team-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #005dad;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }

        .tabs-content {
          padding: 40px;
        }

        .tab-panel {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Forms */
        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .required {
          color: #ef4444;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #005dad;
          box-shadow: 0 0 0 3px rgba(0, 93, 173, 0.1);
        }

        .form-group input.error,
        .form-group textarea.error {
          border-color: #ef4444;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .field-error {
          color: #ef4444;
          font-size: 13px;
          margin-top: 6px;
        }

        .form-info {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
        }

        .info-row:not(:last-child) {
          border-bottom: 1px solid #e5e7eb;
        }

        .info-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .info-value {
          font-size: 14px;
          color: #111827;
          font-weight: 600;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        /* Buttons */
        .btn-primary,
        .btn-secondary,
        .btn-danger,
        .btn-edit,
        .btn-add,
        .btn-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #005dad 0%, #0080ff 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 93, 173, 0.3);
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
        }

        .btn-edit,
        .btn-add {
          padding: 8px 16px;
          font-size: 14px;
        }

        .btn-edit {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-add {
          background: linear-gradient(135deg, #005dad 0%, #0080ff 100%);
          color: white;
        }

        .btn-icon {
          width: 36px;
          height: 36px;
          padding: 0;
          background: #f3f4f6;
          color: #374151;
        }

        .btn-icon.btn-danger {
          background: #fee2e2;
          color: #ef4444;
        }

        .btn-icon.btn-danger:hover {
          background: #ef4444;
          color: white;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Loading State */
        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .loading-state i {
          font-size: 48px;
          margin-bottom: 16px;
          color: #005dad;
        }

        /* Empty Team State */
        .empty-team-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .empty-icon i {
          font-size: 48px;
          color: #9ca3af;
        }

        .empty-team-state h3 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 12px 0;
        }

        .empty-team-state p {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 24px 0;
        }

        /* Team Card */
        .team-card {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #bae6fd;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .team-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
        }

        .team-card-header > div {
          flex: 1;
          min-width: 0;
        }

        .team-card-header .btn-edit {
          flex-shrink: 0;
        }

        .team-card h3 {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .team-description {
          color: #374151;
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
        }

        .team-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 16px;
          border-radius: 12px;
        }

        .stat-item i {
          font-size: 28px;
          color: #005dad;
        }

        .stat-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        /* Team Members */
        .team-members {
          margin-bottom: 32px;
        }

        .members-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .members-header h4 {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .max-members-text {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
          font-weight: 600;
          padding: 6px 12px;
          background: #f3f4f6;
          border-radius: 8px;
        }

        .form-info-text {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          font-size: 14px;
          color: #1e40af;
          margin-bottom: 24px;
        }

        .form-info-text i {
          font-size: 16px;
          flex-shrink: 0;
        }

        .members-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .member-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }

        .member-card:hover {
          border-color: #005dad;
          box-shadow: 0 4px 12px rgba(0, 93, 173, 0.1);
        }

        .member-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #005dad 0%, #0080ff 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .member-info {
          flex: 1;
          min-width: 0;
        }

        .member-info h5 {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .member-tc,
        .member-email,
        .member-role {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .member-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .empty-members {
          text-align: center;
          padding: 40px 20px;
          background: #f9fafb;
          border: 2px dashed #e5e7eb;
          border-radius: 12px;
        }

        .empty-members i {
          font-size: 48px;
          color: #9ca3af;
          margin-bottom: 16px;
        }

        .empty-members p {
          color: #6b7280;
          margin: 0 0 20px 0;
        }

        /* Team/Member Forms */
        .team-form,
        .member-form {
          max-width: 600px;
          margin: 0 auto;
        }

        .team-form h3,
        .member-form h3 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 24px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        /* Danger Zone */
        .danger-zone {
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 12px;
          padding: 24px;
        }

        .danger-zone h4 {
          font-size: 16px;
          font-weight: 700;
          color: #991b1b;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .danger-zone p {
          color: #7f1d1d;
          font-size: 14px;
          margin: 0 0 16px 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .tabs-content {
            padding: 24px 20px;
          }

          .tab-btn span {
            display: none;
          }

          .tab-btn {
            padding: 14px 12px;
          }

          .team-badge {
            top: 8px;
            right: 8px;
          }

          .profile-avatar-display {
            width: 80px;
            height: 80px;
          }

          .avatar-initials-large {
            font-size: 28px;
          }

          .profile-name {
            font-size: 24px;
          }

          .team-card-header {
            flex-direction: column;
            gap: 16px;
          }

          .members-list {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions button {
            width: 100%;
          }
        }

        /* Takım Silme Modal */
        .delete-team-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .delete-team-modal {
          background: white;
          border-radius: 24px;
          max-width: 460px;
          width: 100%;
          padding: 36px;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
          position: relative;
          text-align: center;
          animation: modalFadeIn 0.25s ease-out;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .delete-team-modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border: none;
          border-radius: 50%;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delete-team-modal-close:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .delete-team-modal-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 36px;
        }

        .delete-team-modal-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 10px;
        }

        .delete-team-modal-desc {
          font-size: 15px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .delete-team-modal-actions {
          display: flex;
          gap: 12px;
        }

        .delete-team-modal-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delete-team-modal-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .delete-team-modal-btn.btn-cancel {
          background: #f3f4f6;
          color: #6b7280;
        }

        .delete-team-modal-btn.btn-cancel:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .delete-team-modal-btn.btn-confirm-delete {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
        }

        .delete-team-modal-btn.btn-confirm-delete:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
        }

        :global(.spinning) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .delete-team-modal {
            padding: 24px;
          }

          .delete-team-modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </PrivateRoute>
  );
}
