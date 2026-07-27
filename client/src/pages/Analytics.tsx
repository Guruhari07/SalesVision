import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Sparkles, AlertCircle, CheckCircle2, Info, ArrowUpRight, TrendingUp,
  Percent, ShoppingBag, Users, Globe2, Award, Zap, HelpCircle
} from 'lucide-react';

interface AnalyticsOverview {
  revenue: number;
  profit: number;
  aov: number;
  margin: number;
  avgDiscount: number;
  bestRegion: string;
  worstRegion: string;
  bestCategory: string;
  worstCategory: string;
  bestProduct: string;
  worstProduct: string;
  clvApproximation: number;
}

interface InsightItem {
  id: string;
  type: 'positive' | 'warning' | 'info';
  text: string;
  category: string;
}

export default function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter for insights
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [overRes, insRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/insights')
      ]);
      setOverview(overRes.data);
      setInsights(insRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Could not retrieve analytics. Ensure you have uploaded data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Calculate unique categories of insights for tabs
  const categories = useMemo(() => {
    const cats = new Set<string>();
    insights.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return ['All', ...Array.from(cats).sort()];
  }, [insights]);

  // 2. Filtered insights
  const filteredInsights = useMemo(() => {
    if (activeCategory === 'All') return insights;
    return insights.filter(item => item.category === activeCategory);
  }, [insights, activeCategory]);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />;
      default:
        return <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-emerald-500/[0.02] border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/[0.02] border-amber-500/20';
      default:
        return 'bg-indigo-500/[0.02] border-indigo-500/20';
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
        <Zap className="h-8 w-8 text-primary animate-pulse" />
        <p className="text-sm text-muted font-medium">Assembling deep metrics summaries...</p>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/80 rounded-2xl bg-card/20 max-w-2xl mx-auto my-8">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 shadow-inner mb-6">
          <Award className="h-8 w-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No Analytics Profile</h2>
        <p className="text-sm text-muted max-w-sm mt-2 mb-6 leading-relaxed">
          Please upload a CSV files containing transaction sheets to compile margins, growth metrics, and generate AI insights.
        </p>
        <Button onClick={fetchData} className="text-xs font-semibold uppercase tracking-wider">
          Retry Sync
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deep Analytics & AI Insights</h1>
        <p className="text-xs text-muted">Advanced performance ratios and programmatically generated business indicators.</p>
      </div>

      {/* 1. Deep Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Core performance ratios */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Core Financial Ratios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2.5 border-b border-border/30">
              <div className="flex items-center gap-2.5 text-xs text-muted font-semibold">
                <Percent className="h-4 w-4 shrink-0 text-muted/80" /> Profit Margin Ratio
              </div>
              <span className="text-sm font-bold text-foreground">{(overview.margin * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-border/30">
              <div className="flex items-center gap-2.5 text-xs text-muted font-semibold">
                <ShoppingBag className="h-4 w-4 shrink-0 text-muted/80" /> Average Transaction (AOV)
              </div>
              <span className="text-sm font-bold text-foreground">{formatter.format(overview.aov)}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-border/30">
              <div className="flex items-center gap-2.5 text-xs text-muted font-semibold">
                <Percent className="h-4 w-4 shrink-0 text-muted/80" /> Average Item Discount
              </div>
              <span className="text-sm font-bold text-foreground">{(overview.avgDiscount * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <div className="flex items-center gap-2.5 text-xs text-muted font-semibold">
                <Users className="h-4 w-4 shrink-0 text-muted/80" /> Buyer Lifetime Value (Avg CLV)
              </div>
              <span className="text-sm font-bold text-primary">{formatter.format(overview.clvApproximation)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Dimension Performance Winners */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Segment Winners & Trailing Zones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-border/30">
              <div>
                <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Top Performing Region</p>
                <p className="text-xs font-bold text-foreground mt-0.5 truncate">{overview.bestRegion}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Lowest Performing Region</p>
                <p className="text-xs font-bold text-foreground/70 mt-0.5 truncate">{overview.worstRegion}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-border/30">
              <div>
                <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Top Sales Category</p>
                <p className="text-xs font-bold text-foreground mt-0.5 truncate">{overview.bestCategory}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Lowest Sales Category</p>
                <p className="text-xs font-bold text-foreground/70 mt-0.5 truncate">{overview.worstCategory}</p>
              </div>
            </div>
            <div className="py-1">
              <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Most Profitable Product Line</p>
              <p className="text-xs font-semibold text-success truncate mt-0.5" title={overview.bestProduct}>{overview.bestProduct}</p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 2. AI Generated Insights Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-border/40">
          <div>
            <CardTitle className="text-md font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" /> AI Business Audit Reports
            </CardTitle>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">10+ programmatically calculated performance logs</span>
          </div>
          
          {/* Insights categories selector tabs */}
          <div className="flex flex-wrap gap-1.5 bg-secondary/60 p-1 rounded-lg">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeCategory === cat
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 border rounded-xl flex gap-3 shadow-premium transition-all hover:-translate-y-0.5 ${getInsightBg(
                  insight.type
                )}`}
              >
                {getInsightIcon(insight.type)}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-foreground/60">{insight.category}</span>
                    <Badge variant={insight.type === 'positive' ? 'success' : (insight.type === 'warning' ? 'warning' : 'primary')}>
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-foreground/90 leading-relaxed pt-0.5">
                    {insight.text}
                  </p>
                </div>
              </div>
            ))}
            {filteredInsights.length === 0 && (
              <div className="col-span-2 text-center text-xs text-muted py-8">
                No insights match this filter category.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
