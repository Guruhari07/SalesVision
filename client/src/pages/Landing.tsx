import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, UploadCloud, TrendingUp, BarChart3, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />

      {/* Top Navbar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 border border-indigo-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            SalesVision
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold hover:text-indigo-400 transition-colors">
            Sign In
          </Link>
          <Link to="/register">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-4">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-6 flex flex-col items-center justify-center text-center mt-12 md:mt-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 max-w-4xl"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" /> Introducing Version 1.0
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight md:leading-none text-white">
            Transform Raw Sales Data into{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Predictive Insights
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto font-normal">
            Upload any standard sales CSV. Automatically map columns, clean data anomalies, generate 10+ AI business insights, and run Scikit-learn trend models instantly.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link to="/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 text-sm font-semibold flex items-center gap-2 group">
                Create Free Account <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-900 px-8 py-3 text-sm font-semibold">
                Access Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* Visual Dashboard Mockup */}
          <motion.div
            variants={itemVariants}
            className="mt-16 md:mt-24 border border-slate-800 bg-slate-900/50 rounded-2xl p-2.5 shadow-2xl shadow-indigo-950/20 backdrop-blur-sm max-w-5xl mx-auto overflow-hidden"
          >
            <div className="border border-slate-800 bg-slate-950 rounded-xl overflow-hidden aspect-[16/9] flex flex-col relative group">
              <div className="h-7 border-b border-slate-800/80 bg-slate-900/40 px-4 flex items-center gap-1.5 shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                <div className="text-[10px] text-slate-500 font-semibold ml-4">salesvision-dashboard.app</div>
              </div>
              <div className="flex-1 flex items-center justify-center p-8 bg-slate-950/80 relative">
                {/* Background overlay graphic */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e1e24_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
                <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                    <UploadCloud className="h-8 w-8 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Interactive Demo Active</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">Register now, drag in your sales transactions sheet, and watch the platform map, structure, and visualize your sales timeline in real-time.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Features Showcase */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-24 border-t border-slate-900 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="p-6 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl space-y-3">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-white">Smart Mapping</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Upload any format sales spreadsheet. Our parser intelligently maps header synonyms into standard tables.</p>
          </div>
          <div className="p-6 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl space-y-3">
            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-white">Dynamic Dashboards</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Instant aggregation of 15+ metrics including Profit Margins, AOV, best regions, and customer values.</p>
          </div>
          <div className="p-6 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl space-y-3">
            <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-white">Scikit-learn forecasts</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Fit ML models to predict next-month revenue with 95% confidence intervals and residuals tracking.</p>
          </div>
          <div className="p-6 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl space-y-3">
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-white">Clean Architecture</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Fully decoupled FastAPI backend and React frontend. JWT protected endpoints and robust rate limiting.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} SalesVision. All rights reserved. Designed for Google DeepMind Coding Challenge.</p>
      </footer>
    </div>
  );
}
