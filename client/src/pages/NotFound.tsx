import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-[30%] left-[30%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[90px]" />

      <div className="text-center space-y-6 relative z-10 max-w-md">
        
        <div className="flex justify-center">
          <div className="h-14 w-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">404</h1>
          <h2 className="text-lg font-bold text-foreground">Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            The page you are looking for does not exist or has been shifted.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/dashboard">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 text-xs font-semibold uppercase tracking-wider">
              Back to Dashboard
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
