import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all fields.');
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Incorrect email or password. Please try again.');
      }
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
          <h2 className="text-sm text-slate-400 mt-1.5">Sign in to manage and predict your business performance</h2>
        </div>

        {/* Card */}
        <Card className="bg-slate-900/50 border-slate-800 shadow-2xl backdrop-blur-md">
          <CardHeader className="border-b border-slate-800/80">
            <CardTitle className="text-lg font-bold text-center text-white">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400">
                  {error}
                </div>
              )}

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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder:text-slate-600"
              />

              <Button
                type="submit"
                isLoading={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Register for free
          </Link>
        </p>
      </div>
    </div>
  );
}
