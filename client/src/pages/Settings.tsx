import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  User, Lock, Sun, Moon, ShieldCheck, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function Settings() {
  const { user, updateProfileState } = useAuth();
  
  // Profile state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [password, setPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Theme settings
  const [theme, setTheme] = useState(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });
    setProfileLoading(true);
    
    try {
      const params: any = { full_name: fullName };
      if (password) {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        params.password = password;
      }
      
      const res = await api.put('/users/profile', null, { params });
      updateProfileState(res.data.full_name);
      setPassword('');
      setProfileMsg({ text: 'Profile updated successfully.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setProfileMsg({
        text: err.message || err.response?.data?.detail || 'Failed to update profile.',
        type: 'error'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-xs text-muted">Manage profile details, change security passwords, and customize theme options.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Navigation Sidebar-like menu inside page */}
        <div className="col-span-1 space-y-2">
          <Card className="p-4 bg-card/60">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted mb-3.5">Categories</h3>
            <div className="space-y-1 font-semibold text-xs text-foreground/80">
              <div className="px-3 py-2 rounded-lg bg-secondary text-primary cursor-pointer">
                General Settings
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          
          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-primary" /> Profile Credentials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                
                {profileMsg.text && (
                  <div className={`p-3.5 border rounded-lg text-xs font-semibold flex items-start gap-2.5 ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {profileMsg.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" /> : <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />}
                    <div>{profileMsg.text}</div>
                  </div>
                )}

                <Input
                  label="Registered Email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-secondary/40 text-muted border-border/40 select-none"
                />

                <Input
                  label="Display Full Name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                <Input
                  label="Change Password"
                  type="password"
                  placeholder="Enter new password (optional)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="flex justify-end pt-2">
                  <Button type="submit" isLoading={profileLoading} className="text-xs font-semibold py-2 px-5">
                    Save Changes
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>

          {/* Theme card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sun className="h-4.5 w-4.5 text-primary" /> Display Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                Configure your display options. Toggle between dark and light themes dynamically.
              </p>
              
              <div className="flex items-center gap-3 bg-secondary/40 p-1.5 rounded-lg w-max border border-border/40">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                    theme === 'light'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <Sun className="h-4 w-4" /> Light Mode
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                    theme === 'dark'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <Moon className="h-4 w-4" /> Dark Mode
                </button>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
