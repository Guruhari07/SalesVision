import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      return setError('Please fill in all fields.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    setError('');
    setLoading(true);
    try {
      // 1. Create User
      await register(email, password, fullName);
      // 2. Auto Login
      await login(email, password);
      // 3. Go to Dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Registration failed. Email might already be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-[20%] left-[20%] w-[35%] h-[35%] bg-indigo-500/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-[20%] right-[20%] w-[35%] h-[35%] bg-emerald-500/10 rounded-full blur-[80px]" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="h-9 w-9 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              SalesVision
            </span>
          </Link>
          <h2 className="text-sm text-slate-400 mt-1.5">Create your workspace to structure sales sheets instantly</h2>
        </div>

        {/* Card */}
        <Card className="bg-slate-900/50 border-slate-800 shadow-2xl backdrop-blur-md">
          <CardHeader className="border-b border-slate-800/80">
            <CardTitle className="text-lg font-bold text-center text-white">Create Account</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400">
                  {error}
                </div>
              )}

              <Input
                label="Full Name"
                type="text"
                id="fullName"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder:text-slate-600"
              />

              <Input
                label="Email Address"
                type="email"
                id="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder:text-slate-600"
              />

              <Input
                label="Password"
                type="password"
                id="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder:text-slate-600"
              />

              <Button
                type="submit"
                isLoading={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5"
              >
                Sign Up
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
