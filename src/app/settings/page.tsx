"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { 
  ArrowLeft, Bell, KeyRound, LogOut, Moon, Save, Ship, Sun, 
  UserRound, Shield, Mail, User, Camera, Lock, Eye, EyeOff,
  Trash2, AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  
  // État utilisateur
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  
  // État sécurité
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  
  // État préférences
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // État UI
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  // Gestion des toasts
  useEffect(() => {
    const handleToast = (message: string) => {
      if (!message) return;
      const lower = message.toLowerCase();
      if (lower.includes("incorrect") || lower.includes("erreur") || lower.includes("invalid")) {
        toast.error(message);
      } else if (lower.includes("saisissez") || lower.includes("choisissez") || lower.includes("minimum")) {
        toast.warning(message);
      } else {
        toast.success(message);
      }
    };
    
    // Attacher l'écouteur d'événements pour les messages
    const originalSetMessage = setMessage;
    // Nous allons gérer les messages via un état
  }, []);

  // Chargement des données utilisateur
  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/");
        return;
      }
      
      setUser(user);
      setEmail(user.email || "");
      setName(user.user_metadata?.name || "");
      
      // Charger la photo de profil
      if (user.user_metadata?.photo) {
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(user.user_metadata.photo);
        setPhotoUrl(data.publicUrl);
      }
      
      // Charger les préférences
      setNotifications(localStorage.getItem("kivuport-notifications") !== "false");
      setDarkMode(localStorage.getItem("kivuport-theme") === "dark");
      
      // Vérifier la 2FA
      const factors = await supabase.auth.mfa.listFactors();
      const verifiedFactor = factors.data?.totp?.find(f => f.status === "verified");
      if (verifiedFactor) {
        setMfaEnabled(true);
        setMfaFactorId(verifiedFactor.id);
      }
    }
    
    loadUserData();
  }, [router]);

  // Gestion des messages
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const lower = message.toLowerCase();
    if (lower.includes("incorrect") || lower.includes("erreur") || lower.includes("invalid")) {
      toast.error(message);
    } else if (lower.includes("saisissez") || lower.includes("choisissez") || lower.includes("minimum")) {
      toast.warning(message);
    } else {
      toast.success(message);
    }
  }, [message]);

  // Mise à jour du profil
  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setMessage("Le nom est requis.");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { name: name.trim() }
    });
    setLoading(false);
    setMessage(error ? error.message : "Profil mis à jour avec succès.");
  }

  // Changement de mot de passe
  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    
    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword
    });
    
    if (loginError) {
      setLoading(false);
      setMessage("Mot de passe actuel incorrect.");
      return;
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    setLoading(false);
    setCurrentPassword("");
    setNewPassword("");
    setMessage(error ? error.message : "Mot de passe modifié avec succès.");
  }

  // Activation 2FA
  async function enableMfa() {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "KivuPort"
    });
    setLoading(false);
    
    if (error || !data?.totp) {
      setMessage(error?.message || "Impossible d'activer la double authentification.");
      return;
    }
    
    setMfaFactorId(data.id);
    setMfaQrCode(data.totp.qr_code);
    setMessage("Scannez le QR code avec votre application d'authentification.");
  }

  // Vérification 2FA
  async function verifyMfa(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mfaFactorId || !/^\d{6}$/.test(mfaCode)) {
      setMessage("Entrez un code à 6 chiffres.");
      return;
    }
    
    setLoading(true);
    const challenge = await supabase.auth.mfa.challenge({
      factorId: mfaFactorId
    });
    
    if (!challenge.data?.id) {
      setLoading(false);
      setMessage("Erreur lors du challenge 2FA.");
      return;
    }
    
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.data.id,
      code: mfaCode
    });
    
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMfaEnabled(true);
      setMfaCode("");
      setMfaQrCode("");
      setMessage("Double authentification activée avec succès.");
    }
  }

  // Upload photo de profil
  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setMessage("Choisissez une image de 2 Mo maximum.");
      return;
    }
    
    setLoading(true);
    const path = `${user.id}/profile-${Date.now()}.${file.name.split(".").pop() || "jpg"}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    
    if (uploadError) {
      setLoading(false);
      setMessage(uploadError.message);
      return;
    }
    
    const { error: updateError } = await supabase.auth.updateUser({
      data: { photo: path }
    });
    
    setLoading(false);
    if (updateError) {
      setMessage(updateError.message);
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
      setMessage("Photo de profil mise à jour.");
    }
  }

  // Suppression du compte
  async function deleteAccount() {
    if (!confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      return;
    }
    
    setIsDeleting(true);
    // Note: La suppression d'un compte doit être gérée côté serveur
    // avec une fonction Edge ou une politique RLS
    try {
      // Simuler la suppression
      await supabase.auth.signOut();
      router.replace("/");
    } catch (error) {
      setMessage("Erreur lors de la suppression du compte.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Sauvegarde des préférences
  function savePreferences(nextNotifications: boolean, nextDarkMode: boolean) {
    setNotifications(nextNotifications);
    setDarkMode(nextDarkMode);
    localStorage.setItem("kivuport-notifications", String(nextNotifications));
    localStorage.setItem("kivuport-theme", nextDarkMode ? "dark" : "light");
    setMessage("Préférences enregistrées.");
  }

  // Déconnexion
  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  // Sections de navigation
  const sections = [
    { id: "profile", label: "Profil", icon: UserRound },
    { id: "security", label: "Sécurité", icon: Shield },
    { id: "preferences", label: "Préférences", icon: Bell },
  ];

  return (
    <main className="settings-page">
      {/* Header */}
      <header className="dashboard-header">
        <Link href="/dashboard" className="brand">
          <span className="brand-symbol"><Ship size={20} /></span>
          <span>KivuPort</span>
        </Link>
        <button className="dashboard-logout" type="button" onClick={logout}>
          <LogOut size={16} /> Déconnexion
        </button>
      </header>

      {/* Content */}
      <section className="settings-content">
        <Link className="booking-back" href="/dashboard">
          <ArrowLeft size={15} /> Mon espace
        </Link>
        
        <div className="settings-header">
          <div>
            <p className="kicker">
              <span className="kicker-line" />
              Paramètres
            </p>
            <h1>Personnalisez votre expérience.</h1>
            <p className="dashboard-intro">
              Gérez votre profil, votre sécurité et vos préférences en un seul endroit.
            </p>
          </div>
        </div>

        {/* Navigation des sections */}
        <nav className="settings-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`settings-nav-item ${activeSection === section.id ? "active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              <section.icon size={16} />
              {section.label}
            </button>
          ))}
        </nav>

        {/* Section Profil */}
        {activeSection === "profile" && (
          <div className="settings-section">
            <div className="settings-profile-card">
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      {name ? name.charAt(0).toUpperCase() : <UserRound size={32} />}
                    </div>
                  )}
                  <label className="avatar-upload-btn">
                    <Camera size={14} />
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={uploadPhoto}
                    />
                  </label>
                </div>
                <div>
                  <h3>{name || "Utilisateur"}</h3>
                  <p>{email}</p>
                </div>
              </div>

              <form onSubmit={saveProfile} className="settings-form">
                <div className="form-group">
                  <label>
                    <User size={16} />
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Votre nom"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Mail size={16} />
                    Email
                  </label>
                  <input type="email" value={email} disabled className="readonly-field" />
                </div>
                <button className="dashboard-button primary" type="submit" disabled={loading}>
                  <Save size={16} /> Enregistrer
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Section Sécurité */}
        {activeSection === "security" && (
          <div className="settings-section">
            <div className="settings-grid">
              {/* Changement de mot de passe */}
              <div className="dashboard-card settings-form-card">
                <div className="dashboard-card-title">
                  <span><KeyRound size={18} /></span>
                  <div>
                    <p>Mot de passe</p>
                    <small>Modifiez votre mot de passe</small>
                  </div>
                </div>
                <form onSubmit={changePassword}>
                  <div className="form-group">
                    <label>Mot de passe actuel</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Nouveau mot de passe</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                      />
                    </div>
                    <small className="helper-text">Minimum 8 caractères</small>
                  </div>
                  <button className="dashboard-button primary" type="submit" disabled={loading}>
                    <Lock size={16} /> Modifier
                  </button>
                </form>
              </div>

              {/* Double authentification */}
              <div className="dashboard-card settings-form-card">
                <div className="dashboard-card-title">
                  <span><Shield size={18} /></span>
                  <div>
                    <p>Double authentification</p>
                    <small>Sécurisez votre compte</small>
                  </div>
                </div>
                <div className="mfa-status">
                  <span className={`status-badge ${mfaEnabled ? "enabled" : "disabled"}`}>
                    {mfaEnabled ? "✓ Activée" : "✕ Désactivée"}
                  </span>
                </div>
                
                {mfaQrCode && (
                  <div className="mfa-qr-wrapper">
                    <img src={mfaQrCode} alt="QR code 2FA" width={160} height={160} />
                    <p className="helper-text">Scannez avec Google Authenticator ou similaire</p>
                  </div>
                )}
                
                {!mfaEnabled ? (
                  <button
                    className="dashboard-button primary"
                    type="button"
                    onClick={enableMfa}
                    disabled={loading}
                  >
                    <Shield size={16} /> Activer la 2FA
                  </button>
                ) : (
                  <p className="mfa-active-message">
                    <Shield size={16} />
                    La double authentification est activée sur votre compte.
                  </p>
                )}
                
                {!mfaEnabled && mfaFactorId && (
                  <form onSubmit={verifyMfa} className="mfa-verify-form">
                    <div className="form-group">
                      <label>Code de vérification</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        placeholder="123456"
                        required
                      />
                    </div>
                    <button className="dashboard-button primary" type="submit" disabled={loading}>
                      Vérifier
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Zone de danger */}
            <div className="dashboard-card danger-zone">
              <div className="dashboard-card-title">
                <span><AlertTriangle size={18} /></span>
                <div>
                  <p>Zone de danger</p>
                  <small>Actions irréversibles</small>
                </div>
              </div>
              <button
                className="dashboard-button danger"
                type="button"
                onClick={deleteAccount}
                disabled={isDeleting}
              >
                <Trash2 size={16} /> Supprimer mon compte
              </button>
            </div>
          </div>
        )}

        {/* Section Préférences */}
        {activeSection === "preferences" && (
          <div className="settings-section">
            <div className="dashboard-card preferences-card">
              <div className="dashboard-card-title">
                <span><Bell size={18} /></span>
                <div>
                  <p>Préférences</p>
                  <small>Personnalisez votre expérience</small>
                </div>
              </div>
              
              <div className="preferences-list">
                <label className="preference-item">
                  <div className="preference-info">
                    <Bell size={16} />
                    <span>Notifications par email</span>
                  </div>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => savePreferences(e.target.checked, darkMode)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
                
                <label className="preference-item">
                  <div className="preference-info">
                    {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                    <span>Mode sombre</span>
                  </div>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => savePreferences(notifications, e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </section>

      <style jsx>{`
        .settings-page {
          min-height: 100vh;
          background: #f8fafc;
        }
        
        .settings-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .settings-header {
          margin-bottom: 2rem;
        }
        
        .settings-nav {
          display: flex;
          gap: 0.5rem;
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          margin-bottom: 2rem;
        }
        
        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .settings-nav-item:hover {
          background: #f1f5f9;
        }
        
        .settings-nav-item.active {
          background: #1e293b;
          color: white;
        }
        
        .settings-section {
          animation: fadeIn 0.3s ease;
        }
        
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .settings-profile-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        
        .profile-avatar-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .profile-avatar {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          background: #e2e8f0;
        }
        
        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          font-size: 2rem;
          font-weight: 600;
        }
        
        .avatar-upload-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1e293b;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 2px solid white;
          transition: background 0.2s;
        }
        
        .avatar-upload-btn:hover {
          background: #0f172a;
        }
        
        .avatar-upload-btn input {
          display: none;
        }
        
        .settings-form-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        
        .form-group {
          margin-bottom: 1.25rem;
        }
        
        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 0.4rem;
        }
        
        .form-group input {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: border-color 0.2s;
          background: #f8fafc;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        
        .form-group input.readonly-field {
          background: #f1f5f9;
          color: #64748b;
          cursor: not-allowed;
        }
        
        .password-input-wrapper {
          position: relative;
        }
        
        .password-input-wrapper input {
          padding-right: 2.5rem;
        }
        
        .toggle-password {
          position: absolute;
          right: 0.6rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
        }
        
        .toggle-password:hover {
          color: #64748b;
        }
        
        .helper-text {
          display: block;
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.3rem;
        }
        
        .dashboard-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: #f1f5f9;
          color: #1e293b;
        }
        
        .dashboard-button:hover:not(:disabled) {
          background: #e2e8f0;
        }
        
        .dashboard-button.primary {
          background: #1e293b;
          color: white;
        }
        
        .dashboard-button.primary:hover:not(:disabled) {
          background: #0f172a;
        }
        
        .dashboard-button.danger {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .dashboard-button.danger:hover:not(:disabled) {
          background: #fecaca;
        }
        
        .dashboard-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .mfa-status {
          margin-bottom: 1.25rem;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .status-badge.enabled {
          background: #dcfce7;
          color: #16a34a;
        }
        
        .status-badge.disabled {
          background: #fef3c7;
          color: #d97706;
        }
        
        .mfa-qr-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin: 1rem 0;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
        }
        
        .mfa-qr-wrapper img {
          border-radius: 8px;
          background: white;
          padding: 4px;
        }
        
        .mfa-verify-form {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }
        
        .mfa-active-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #16a34a;
          font-size: 0.9rem;
          padding: 0.75rem;
          background: #f0fdf4;
          border-radius: 8px;
        }
        
        .danger-zone {
          border: 1px solid #fca5a5;
          background: #fef2f2;
        }
        
        .danger-zone .dashboard-card-title span {
          color: #dc2626;
        }
        
        .preferences-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        
        .preferences-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .preference-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .preference-item:hover {
          background: #f8fafc;
        }
        
        .preference-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #1e293b;
          font-size: 0.9rem;
        }
        
        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #cbd5e1;
          border-radius: 24px;
          transition: 0.3s;
        }
        
        .toggle-slider::before {
          content: "";
          position: absolute;
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background: white;
          border-radius: 50%;
          transition: 0.3s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        
        .toggle-switch input:checked + .toggle-slider {
          background: #3b82f6;
        }
        
        .toggle-switch input:checked + .toggle-slider::before {
          transform: translateX(20px);
        }
        
        .dashboard-card-title {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        
        .dashboard-card-title span:first-child {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #f1f5f9;
          color: #1e293b;
          flex-shrink: 0;
        }
        
        .dashboard-card-title p {
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .dashboard-card-title small {
          color: #94a3b8;
          font-size: 0.8rem;
        }
        
        .kicker {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #3b82f6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }
        
        .kicker-line {
          display: inline-block;
          width: 24px;
          height: 2px;
          background: #3b82f6;
          border-radius: 2px;
        }
        
        h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem;
        }
        
        .dashboard-intro {
          color: #64748b;
          margin: 0;
        }
        
        .booking-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          transition: color 0.2s;
        }
        
        .booking-back:hover {
          color: #1e293b;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 768px) {
          .settings-content {
            padding: 1rem;
          }
          
          .settings-grid {
            grid-template-columns: 1fr;
          }
          
          .settings-nav {
            overflow-x: auto;
            gap: 0.25rem;
          }
          
          .settings-nav-item {
            padding: 0.5rem 0.8rem;
            font-size: 0.8rem;
            white-space: nowrap;
          }
          
          .profile-avatar-section {
            flex-direction: column;
            text-align: center;
          }
          
          .preference-item {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
        }
      `}</style>
    </main>
  );
}