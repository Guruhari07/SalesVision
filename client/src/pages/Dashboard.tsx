import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ReferenceLine
} from 'recharts';
import {
  Search, Calendar, MapPin, Grid, Layers, User, Package,
  TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, Sparkles,
  Percent, ShoppingBag, Users, Award, Zap, HelpCircle, CheckCircle2,
  AlertCircle, Info, ChevronDown, FileSpreadsheet, FileText, Printer,
  Download, UploadCloud
} from 'lucide-react';

interface SalesRecord {
  order_id: string;
  order_date: string;
  customer_name: string;
  region: string;
  state: string;
  city: string;
  category: string;
  subcategory: string;
  product_name: string;
  sales: number;
  profit: number;
  quantity: number;
  discount: number;
}

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

interface PredictionItem {
  month: string;
  Sales: number;
  Profit: number;
  SalesLower: number;
  SalesUpper: number;
  ProfitLower: number;
  ProfitUpper: number;
  isPrediction: boolean;
}

export default function Dashboard() {
  // 1. Data & Navigation States
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'predictions'>('overview');
  const [rawRecords, setRawRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // 2. Filter States (Overview)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [trendMetric, setTrendMetric] = useState<'sales' | 'profit'>('sales');

  // 3. Tab-Specific Data (Lazy Loaded)
  const [overviewData, setOverviewData] = useState<AnalyticsOverview | null>(null);
  const [insightsData, setInsightsData] = useState<InsightItem[]>([]);
  const [activeInsightCat, setActiveInsightCat] = useState('All');
  const [ratiosLoading, setRatiosLoading] = useState(false);
  const [ratiosError, setRatiosError] = useState('');

  const [predictionsData, setPredictionsData] = useState<PredictionItem[]>([]);
  const [forecastMetric, setForecastMetric] = useState<'Sales' | 'Profit'>('Sales');
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [predictionsError, setPredictionsError] = useState('');

  // Indian Rupee currency formatter (₹ symbol, lakhs/crores groupings)
  const formatter = useMemo(() => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  }, []);

  // Fetch core records
  const fetchRawRecords = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/raw');
      setRawRecords(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Could not load dashboard metrics. Ensure database has data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Lazy-load Deep Ratios & Insights
  const fetchRatiosAndInsights = async () => {
    setRatiosLoading(true);
    setRatiosError('');
    try {
      const [overRes, insRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/insights')
      ]);
      setOverviewData(overRes.data);
      setInsightsData(insRes.data);
    } catch (err: any) {
      console.error(err);
      setRatiosError('Failed to fetch analytics profiles.');
    } finally {
      setRatiosLoading(false);
    }
  };

  // Lazy-load ML Predictions
  const fetchPredictions = async () => {
    setPredictionsLoading(true);
    setPredictionsError('');
    try {
      const res = await api.get('/prediction');
      setPredictionsData(res.data);
    } catch (err: any) {
      console.error(err);
      setPredictionsError('Failed to train linear regression forecasting models.');
    } finally {
      setPredictionsLoading(false);
    }
  };

  useEffect(() => {
    fetchRawRecords();
    
    // Close export dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load tab data on selection
  useEffect(() => {
    if (activeTab === 'analytics' && !overviewData && rawRecords.length > 0) {
      fetchRatiosAndInsights();
    } else if (activeTab === 'predictions' && predictionsData.length === 0 && rawRecords.length > 0) {
      fetchPredictions();
    }
  }, [activeTab, rawRecords]);

  // Generate Filter options
  const filterOptions = useMemo(() => {
    const regions = new Set<string>();
    const categories = new Set<string>();
    const subcategories = new Set<string>();

    rawRecords.forEach((r) => {
      if (r.region) regions.add(r.region);
      if (r.category) categories.add(r.category);
      if (r.category === selectedCategory || !selectedCategory) {
        if (r.subcategory) subcategories.add(r.subcategory);
      }
    });

    return {
      regions: Array.from(regions).sort(),
      categories: Array.from(categories).sort(),
      subcategories: Array.from(subcategories).sort()
    };
  }, [rawRecords, selectedCategory]);

  useEffect(() => {
    setSelectedSubcategory('');
  }, [selectedCategory]);

  // Perform Filters
  const filteredRecords = useMemo(() => {
    return rawRecords.filter((r) => {
      if (startDate && r.order_date < startDate) return false;
      if (endDate && r.order_date > endDate) return false;
      if (selectedRegion && r.region !== selectedRegion) return false;
      if (selectedCategory && r.category !== selectedCategory) return false;
      if (selectedSubcategory && r.subcategory !== selectedSubcategory) return false;
      if (searchCustomer && !r.customer_name.toLowerCase().includes(searchCustomer.toLowerCase())) return false;
      if (searchProduct && !r.product_name.toLowerCase().includes(searchProduct.toLowerCase())) return false;
      if (globalSearch) {
        const query = globalSearch.toLowerCase();
        return (
          r.order_id.toLowerCase().includes(query) ||
          r.customer_name.toLowerCase().includes(query) ||
          r.product_name.toLowerCase().includes(query) ||
          r.city.toLowerCase().includes(query) ||
          r.state.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [rawRecords, startDate, endDate, selectedRegion, selectedCategory, selectedSubcategory, searchCustomer, searchProduct, globalSearch]);

  // Reset Filters
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedRegion('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSearchCustomer('');
    setSearchProduct('');
    setGlobalSearch('');
  };

  // Realtime KPIs
  const kpis = useMemo(() => {
    if (filteredRecords.length === 0) {
      return { sales: 0, profit: 0, orders: 0, customers: 0, margin: 0 };
    }
    const sales = filteredRecords.reduce((sum, r) => sum + r.sales, 0);
    const profit = filteredRecords.reduce((sum, r) => sum + r.profit, 0);
    const uniqueOrders = new Set(filteredRecords.map((r) => r.order_id)).size;
    const uniqueCustomers = new Set(filteredRecords.map((r) => r.customer_name)).size;
    const margin = sales > 0 ? (profit / sales) * 100 : 0;
    
    return { sales, profit, orders: uniqueOrders, customers: uniqueCustomers, margin };
  }, [filteredRecords]);

  // Aggregate Chart Values
  const chartsData = useMemo(() => {
    if (filteredRecords.length === 0) {
      return { monthlyTrends: [], regionSales: [], categorySales: [], topProducts: [], topCustomers: [] };
    }

    const monthMap: Record<string, { sales: number; profit: number }> = {};
    filteredRecords.forEach((r) => {
      const month = r.order_date.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { sales: 0, profit: 0 };
      monthMap[month].sales += r.sales;
      monthMap[month].profit += r.profit;
    });
    const monthlyTrends = Object.entries(monthMap)
      .map(([month, val]) => ({ month, Sales: val.sales, Profit: val.profit }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const regionMap: Record<string, { sales: number; profit: number }> = {};
    filteredRecords.forEach((r) => {
      if (!regionMap[r.region]) regionMap[r.region] = { sales: 0, profit: 0 };
      regionMap[r.region].sales += r.sales;
      regionMap[r.region].profit += r.profit;
    });
    const regionSales = Object.entries(regionMap).map(([region, val]) => ({
      region,
      sales: val.sales,
      profit: val.profit
    }));

    const catMap: Record<string, { sales: number; profit: number }> = {};
    filteredRecords.forEach((r) => {
      if (!catMap[r.category]) catMap[r.category] = { sales: 0, profit: 0 };
      catMap[r.category].sales += r.sales;
      catMap[r.category].profit += r.profit;
    });
    const categorySales = Object.entries(catMap).map(([category, val]) => ({
      category,
      sales: val.sales,
      profit: val.profit
    }));

    const prodMap: Record<string, { sales: number; profit: number; quantity: number }> = {};
    filteredRecords.forEach((r) => {
      if (!prodMap[r.product_name]) prodMap[r.product_name] = { sales: 0, profit: 0, quantity: 0 };
      prodMap[r.product_name].sales += r.sales;
      prodMap[r.product_name].profit += r.profit;
      prodMap[r.product_name].quantity += r.quantity;
    });
    const topProducts = Object.entries(prodMap)
      .map(([product_name, val]) => ({ product_name, sales: val.sales, profit: val.profit, quantity: val.quantity }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    const custMap: Record<string, { sales: number; profit: number; orders: Set<string> }> = {};
    filteredRecords.forEach((r) => {
      if (!custMap[r.customer_name]) custMap[r.customer_name] = { sales: 0, profit: 0, orders: new Set() };
      custMap[r.customer_name].sales += r.sales;
      custMap[r.customer_name].profit += r.profit;
      custMap[r.customer_name].orders.add(r.order_id);
    });
    const topCustomers = Object.entries(custMap)
      .map(([customer_name, val]) => ({ customer_name, sales: val.sales, profit: val.profit, orders: val.orders.size }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return { monthlyTrends, regionSales, categorySales, topProducts, topCustomers };
  }, [filteredRecords]);

  // Insight Categories
  const insightCategories = useMemo(() => {
    const cats = new Set<string>();
    insightsData.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return ['All', ...Array.from(cats).sort()];
  }, [insightsData]);

  const filteredInsights = useMemo(() => {
    if (activeInsightCat === 'All') return insightsData;
    return insightsData.filter(item => item.category === activeInsightCat);
  }, [insightsData, activeInsightCat]);

  // Predictions Growth Calculations
  const predictionsDetails = useMemo(() => {
    if (predictionsData.length === 0) return null;
    const predItem = predictionsData.find(item => item.isPrediction);
    if (!predItem) return null;

    const lastHist = predictionsData[predictionsData.length - 2];
    let growth = 0;
    if (lastHist) {
      const histVal = forecastMetric === 'Sales' ? lastHist.Sales : lastHist.Profit;
      const predVal = forecastMetric === 'Sales' ? predItem.Sales : predItem.Profit;
      growth = histVal > 0 ? ((predVal - histVal) / histVal) * 100 : 0;
    }

    return {
      predictedVal: forecastMetric === 'Sales' ? predItem.Sales : predItem.Profit,
      lower: forecastMetric === 'Sales' ? predItem.SalesLower : predItem.ProfitLower,
      upper: forecastMetric === 'Sales' ? predItem.SalesUpper : predItem.ProfitUpper,
      month: predItem.month,
      growth
    };
  }, [predictionsData, forecastMetric]);

  // Export handlers
  const handleExport = async (type: 'excel' | 'csv') => {
    setIsExportOpen(false);
    try {
      const response = await api.get(`/reports/${type}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] as string | undefined });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salesvision_export_${Date.now()}.${type === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(`Export to ${type} failed`, err);
      alert(`Could not download the ${type.toUpperCase()} file. Ensure data exists.`);
    }
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  if (loading) {
    return (
      <div className="h-[65vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <p className="text-xs text-muted font-bold uppercase tracking-wider">Syncing dashboard values...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION (Unified Dashboard Control) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-4 no-print">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Analytics Workspace</h1>
          <p className="text-xs text-muted">Monitor key financial results, inspect AI summaries, and predict trends.</p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 relative">
          
          {/* Export Dropdown */}
          {rawRecords.length > 0 && (
            <div className="relative" ref={exportRef}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Export <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border/80 rounded-lg shadow-lg py-1.5 z-50 text-xs">
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center gap-2 text-foreground/80 hover:text-foreground font-semibold"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Excel Workbook
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center gap-2 text-foreground/80 hover:text-foreground font-semibold"
                  >
                    <FileText className="h-4 w-4 text-blue-500" /> CSV Ledger
                  </button>
                  <button
                    onClick={() => {
                      setIsExportOpen(false);
                      window.print();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center gap-2 text-foreground/80 hover:text-foreground font-semibold"
                  >
                    <Printer className="h-4 w-4 text-slate-500" /> Print PDF Report
                  </button>
                </div>
              )}
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchRawRecords(true)}
            isLoading={refreshing}
            className="text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {rawRecords.length === 0 ? (
        /* Empty State */
        <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/80 rounded-lg bg-secondary/10 max-w-lg mx-auto">
          <div className="h-14 w-14 bg-primary/10 rounded-md flex items-center justify-center text-primary border border-primary/20 mb-4 shadow-sm">
            <UploadCloud className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold text-foreground">No Dataset Found</h2>
          <p className="text-xs text-muted max-w-sm mt-1.5 mb-5 leading-relaxed">
            Please import a CSV, Excel, XML, JSON, TXT, or ZIP transaction file first to configure the dashboard aggregates.
          </p>
          <Link to="/upload">
            <Button size="sm" className="text-xs font-bold uppercase tracking-wider">Upload File</Button>
          </Link>
        </div>
      ) : (
        /* Unified Content View */
        <div className="space-y-6">
          
          {/* TAB SYSTEM TABS */}
          <div className="flex border-b border-border/80 pb-0.5 gap-6 no-print">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Overview Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Deep Ratios & Insights
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`pb-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'predictions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              ML Projections
            </button>
          </div>

          {/* ====================================
              TAB 1: OVERVIEW DASHBOARD
              ==================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Filters Block */}
              <Card className="no-print">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    
                    {/* Search */}
                    <div className="md:col-span-2 relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted/50" />
                      <Input
                        placeholder="Search IDs, customers, products, locations..."
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        className="pl-9 text-xs"
                      />
                    </div>

                    {/* Date picker start */}
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted/50" />
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-9 text-xs"
                      />
                    </div>

                    {/* Date picker end */}
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted/50" />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-9 text-xs"
                      />
                    </div>

                  </div>

                  {/* Dropdowns */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3.5 border-t border-border/40">
                    <div className="flex items-center gap-2 bg-secondary/50 border border-border/80 px-2.5 py-1.5 rounded-md text-xs">
                      <MapPin className="h-3.5 w-3.5 text-muted/50 shrink-0" />
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full bg-transparent text-foreground focus:outline-none font-bold"
                      >
                        <option value="">All Regions</option>
                        {filterOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 bg-secondary/50 border border-border/80 px-2.5 py-1.5 rounded-md text-xs">
                      <Grid className="h-3.5 w-3.5 text-muted/50 shrink-0" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-transparent text-foreground focus:outline-none font-bold"
                      >
                        <option value="">All Categories</option>
                        {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 bg-secondary/50 border border-border/80 px-2.5 py-1.5 rounded-md text-xs">
                      <Layers className="h-3.5 w-3.5 text-muted/50 shrink-0" />
                      <select
                        value={selectedSubcategory}
                        disabled={!selectedCategory}
                        onChange={(e) => setSelectedSubcategory(e.target.value)}
                        className="w-full bg-transparent text-foreground focus:outline-none font-bold disabled:opacity-50"
                      >
                        <option value="">All Subcategories</option>
                        {filterOptions.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 bg-secondary/50 border border-border/80 px-2.5 py-1.5 rounded-md text-xs">
                      <User className="h-3.5 w-3.5 text-muted/50 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search Customer"
                        value={searchCustomer}
                        onChange={(e) => setSearchCustomer(e.target.value)}
                        className="w-full bg-transparent focus:outline-none placeholder:text-muted/50"
                      />
                    </div>

                    <div className="flex items-center gap-2 bg-secondary/50 border border-border/80 px-2.5 py-1.5 rounded-md text-xs col-span-2 md:col-span-1">
                      <Package className="h-3.5 w-3.5 text-muted/50 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search Product"
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        className="w-full bg-transparent focus:outline-none placeholder:text-muted/50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KPIs Board */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4 flex flex-col justify-between h-22">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-muted">Total Sales</span>
                    <h3 className="text-md font-bold text-foreground mt-1 truncate">{formatter.format(kpis.sales)}</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col justify-between h-22">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-muted">Total Profit</span>
                    <h3 className="text-md font-bold text-emerald-500 mt-1 truncate">{formatter.format(kpis.profit)}</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col justify-between h-22">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-muted">Total Orders</span>
                    <h3 className="text-md font-bold text-foreground mt-1">{kpis.orders.toLocaleString()}</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col justify-between h-22">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-muted">Total Buyers</span>
                    <h3 className="text-md font-bold text-foreground mt-1">{kpis.customers.toLocaleString()}</h3>
                  </CardContent>
                </Card>
                <Card className="col-span-2 md:col-span-1">
                  <CardContent className="p-4 flex flex-col justify-between h-22">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-muted">Profit Margin</span>
                    <h3 className="text-md font-bold text-primary mt-1">{kpis.margin.toFixed(1)}%</h3>
                  </CardContent>
                </Card>
              </div>

              {filteredRecords.length === 0 ? (
                <Card className="p-8 text-center text-muted text-xs border border-dashed border-border/80">
                  No records match the active filter criteria.
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Timeline Chart */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3.5">
                      <div>
                        <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-muted">Monthly Timeline Trends</CardTitle>
                      </div>
                      <div className="flex items-center gap-1 bg-secondary/80 rounded-md p-0.5 no-print">
                        <button
                          onClick={() => setTrendMetric('sales')}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${trendMetric === 'sales' ? 'bg-card text-foreground shadow-sm' : 'text-muted'}`}
                        >
                          Sales
                        </button>
                        <button
                          onClick={() => setTrendMetric('profit')}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${trendMetric === 'profit' ? 'bg-card text-foreground shadow-sm' : 'text-muted'}`}
                        >
                          Profit
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartsData.monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorSalesINR" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorProfitINR" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--muted), 0.1)" />
                            <XAxis dataKey="month" stroke="rgba(var(--muted), 0.5)" fontSize={9} tickLine={false} />
                            <YAxis stroke="rgba(var(--muted), 0.5)" fontSize={9} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                            <Tooltip
                              formatter={(value: any) => [formatter.format(value), trendMetric === 'sales' ? 'Sales' : 'Profit']}
                              contentStyle={{ background: 'var(--color-card)', border: '1px solid rgba(var(--border), 0.8)', borderRadius: '6px' }}
                              labelStyle={{ fontWeight: 'bold', fontSize: '10px' }}
                            />
                            {trendMetric === 'sales' ? (
                              <Area type="monotone" dataKey="Sales" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorSalesINR)" />
                            ) : (
                              <Area type="monotone" dataKey="Profit" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorProfitINR)" />
                            )}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Distributions bar & donut charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-muted">Category Contribution</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center">
                        <div className="h-44 w-full relative flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartsData.categorySales}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={3}
                                dataKey="sales"
                              >
                                {chartsData.categorySales.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v: any) => formatter.format(v)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3.5 mt-3 text-[10px] font-bold">
                          {chartsData.categorySales.map((entry: any, index) => (
                            <div key={entry.category} className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-muted">{entry.category}:</span>
                              <span>{formatter.format(entry.sales)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-muted">Region Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartsData.regionSales} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--muted), 0.1)" />
                              <XAxis dataKey="region" stroke="rgba(var(--muted), 0.5)" fontSize={9} tickLine={false} />
                              <YAxis stroke="rgba(var(--muted), 0.5)" fontSize={9} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                              <Tooltip formatter={(v: any) => formatter.format(v)} />
                              <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Leaderboards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-muted">Top 5 Products by Sales</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-border/30 text-xs">
                          {chartsData.topProducts.map((p: any, idx) => (
                            <div key={p.product_name} className="flex justify-between items-center p-3 hover:bg-secondary/10">
                              <div className="truncate pr-4 flex items-center gap-2">
                                <span className="font-bold text-muted w-4">{idx + 1}</span>
                                <span className="font-semibold text-foreground truncate">{p.product_name}</span>
                              </div>
                              <span className="font-bold text-foreground shrink-0">{formatter.format(p.sales)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-muted">Top 5 Customers by Value</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-border/30 text-xs">
                          {chartsData.topCustomers.map((c: any, idx) => (
                            <div key={c.customer_name} className="flex justify-between items-center p-3 hover:bg-secondary/10">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-muted w-4">{idx + 1}</span>
                                <span className="font-semibold text-foreground">{c.customer_name}</span>
                              </div>
                              <span className="font-bold text-foreground shrink-0">{formatter.format(c.sales)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ====================================
              TAB 2: DEEP RATIOS & AI INSIGHTS
              ==================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fadeIn">
              {ratiosLoading ? (
                <div className="h-[40vh] flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                  <span className="text-xs text-muted font-semibold">Running statistical ratios...</span>
                </div>
              ) : ratiosError || !overviewData ? (
                <div className="p-4 text-center text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {ratiosError || "No analytics data compiler logs found."}
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Financial Metrics Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-muted flex items-center gap-1.5">
                          <Percent className="h-4 w-4 text-primary" /> Key Financial Ratios
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-xs font-semibold text-foreground/80">
                        <div className="flex justify-between items-center py-2.5 border-b border-border/30">
                          <span className="text-muted">Net Profit Margin</span>
                          <span>{(overviewData.margin * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-border/30">
                          <span className="text-muted">Average Order Value (AOV)</span>
                          <span>{formatter.format(overviewData.aov)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-border/30">
                          <span className="text-muted">Avg Applied Discount</span>
                          <span>{(overviewData.avgDiscount * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5">
                          <span className="text-muted">Buyer Lifetime Value approximation</span>
                          <span className="text-primary">{formatter.format(overviewData.clvApproximation)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-muted flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-primary" /> Segment Winners & Trailing Zones
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3.5 text-xs">
                        <div className="grid grid-cols-2 gap-4 py-2 border-b border-border/30">
                          <div>
                            <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Top Performing Region</p>
                            <p className="font-bold text-foreground mt-0.5 truncate">{overviewData.bestRegion}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Trailing Region</p>
                            <p className="font-bold text-foreground mt-0.5 truncate">{overviewData.worstRegion}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-2 border-b border-border/30">
                          <div>
                            <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Top Sales Category</p>
                            <p className="font-bold text-foreground mt-0.5 truncate">{overviewData.bestCategory}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Trailing Category</p>
                            <p className="font-bold text-foreground mt-0.5 truncate">{overviewData.worstCategory}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-2">
                          <div className="col-span-2">
                            <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Top Product by net profit</p>
                            <p className="font-bold text-foreground mt-0.5 truncate">{overviewData.bestProduct}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* AI Insights Card Deck */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 no-print">
                      <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted">AI-Powered Business Insights</h3>
                      <div className="flex flex-wrap gap-1">
                        {insightCategories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setActiveInsightCat(cat)}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${
                              activeInsightCat === cat
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-secondary text-muted border-border/80 hover:text-foreground'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredInsights.map(item => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-md border flex items-start gap-3 text-xs leading-relaxed ${
                            item.type === 'positive'
                              ? 'bg-emerald-500/[0.02] border-emerald-500/20'
                              : item.type === 'warning'
                              ? 'bg-amber-500/[0.02] border-amber-500/20'
                              : 'bg-blue-500/[0.02] border-blue-500/20'
                          }`}
                        >
                          {item.type === 'positive' ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-success shrink-0 mt-0.5" />
                          ) : item.type === 'warning' ? (
                            <AlertCircle className="h-4.5 w-4.5 text-warning shrink-0 mt-0.5" />
                          ) : (
                            <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-semibold text-foreground/90">{item.text}</p>
                            <Badge variant="secondary" className="mt-2 text-[9px] tracking-wider uppercase font-bold">
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {filteredInsights.length === 0 && (
                        <div className="col-span-2 text-center py-6 text-xs text-muted border border-dashed border-border/60 rounded-md">
                          No insights match the selected filter category.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ====================================
              TAB 3: ML PROJECTIONS
              ==================================== */}
          {activeTab === 'predictions' && (
            <div className="space-y-6 animate-fadeIn">
              {predictionsLoading ? (
                <div className="h-[40vh] flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                  <span className="text-xs text-muted font-semibold">Running Scikit-learn trend forecasts...</span>
                </div>
              ) : predictionsError || predictionsData.length === 0 ? (
                <div className="p-4 text-center text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {predictionsError || "Could not retrieve trend projections models."}
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* ML Controls Header */}
                  <div className="flex justify-between items-center border-b border-border/40 pb-3 no-print">
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted">OLS Regression Trend Lines</h3>
                    <div className="flex bg-secondary/80 rounded p-0.5 text-[10px]">
                      <button
                        onClick={() => setForecastMetric('Sales')}
                        className={`px-3 py-1 font-bold rounded ${forecastMetric === 'Sales' ? 'bg-card text-foreground shadow-sm' : 'text-muted'}`}
                      >
                        Sales
                      </button>
                      <button
                        onClick={() => setForecastMetric('Profit')}
                        className={`px-3 py-1 font-bold rounded ${forecastMetric === 'Profit' ? 'bg-card text-foreground shadow-sm' : 'text-muted'}`}
                      >
                        Profit
                      </button>
                    </div>
                  </div>

                  {/* ML Forecast area chart */}
                  <Card>
                    <CardContent className="p-5">
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={predictionsData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--muted), 0.1)" />
                            <XAxis dataKey="month" stroke="rgba(var(--muted), 0.5)" fontSize={9} tickLine={false} />
                            <YAxis stroke="rgba(var(--muted), 0.5)" fontSize={9} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                            <Tooltip
                              formatter={(value: any) => [formatter.format(value), forecastMetric]}
                              contentStyle={{ background: 'var(--color-card)', border: '1px solid rgba(var(--border), 0.8)', borderRadius: '6px' }}
                              labelStyle={{ fontWeight: 'bold', fontSize: '10px' }}
                            />
                            
                            {/* Bounding Lines */}
                            <Line
                              type="monotone"
                              dataKey={forecastMetric === 'Sales' ? 'SalesUpper' : 'ProfitUpper'}
                              stroke="#6366f1"
                              strokeWidth={1}
                              strokeDasharray="4 4"
                              dot={false}
                              name="95% Upper Bound"
                            />
                            <Line
                              type="monotone"
                              dataKey={forecastMetric === 'Sales' ? 'SalesLower' : 'ProfitLower'}
                              stroke="#6366f1"
                              strokeWidth={1}
                              strokeDasharray="4 4"
                              dot={false}
                              name="95% Lower Bound"
                            />
                            
                            {/* Predictions Line */}
                            <Line
                              type="monotone"
                              dataKey={forecastMetric}
                              stroke="#2563eb"
                              strokeWidth={2.5}
                              activeDot={{ r: 5 }}
                              dot={(props) => {
                                const { cx, cy, payload } = props;
                                if (payload.isPrediction) {
                                  return (
                                    <circle cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
                                  );
                                }
                                return <circle cx={cx} cy={cy} r={2.5} fill="#2563eb" stroke="none" />;
                              }}
                            />
                            
                            {predictionsData.length > 1 && (
                              <ReferenceLine
                                x={predictionsData[predictionsData.length - 2]?.month}
                                stroke="rgba(var(--muted), 0.3)"
                                strokeWidth={1}
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prediction Statistics */}
                  {predictionsDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="col-span-1 md:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-muted">Next Month projection metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-xs">
                          <div className="grid grid-cols-2 gap-4 pb-3.5 border-b border-border/30">
                            <div>
                              <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Forecast Month</p>
                              <p className="text-sm font-bold text-foreground mt-0.5">{predictionsDetails.month} <Badge className="text-[8px] tracking-wider uppercase font-bold bg-amber-500/10 text-amber-500 hover:bg-amber-500/25 border-none">Model</Badge></p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Predicted value ({forecastMetric})</p>
                              <p className="text-sm font-bold text-foreground mt-0.5">{formatter.format(predictionsDetails.predictedVal)}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 pb-3.5 border-b border-border/30">
                            <div>
                              <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Estimated Growth Trend</p>
                              <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${predictionsDetails.growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {predictionsDetails.growth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                {predictionsDetails.growth.toFixed(1)}% {predictionsDetails.growth >= 0 ? 'Expansion' : 'Contraction'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted uppercase font-bold tracking-wider">95% Confidence range</p>
                              <p className="text-xs font-bold text-foreground mt-1">
                                {formatter.format(predictionsDetails.lower)} &mdash; {formatter.format(predictionsDetails.upper)}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 items-start text-muted text-[10px] leading-tight">
                            <Info className="h-4 w-4 shrink-0 text-primary" />
                            <span>Calculated via Ordinary Least Squares (OLS) regression over historical monthly aggregates. Bounding brackets reflect residuals variance standard errors.</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-secondary/15 border-border/50">
                        <CardHeader>
                          <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-muted flex items-center gap-1">
                            <HelpCircle className="h-4 w-4" /> Linear Forecasting
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3.5 text-xs text-secondary-foreground leading-relaxed">
                          <p>
                            The model estimates the linear baseline slope: 
                            <code className="block bg-secondary p-1.5 rounded font-mono text-[10px] text-foreground mt-1 select-all font-bold">
                              y = β₀ + β₁(Month) + ε
                            </code>
                          </p>
                          <p>
                            A dashed band represents the statistical uncertainty threshold. Inliers denote steady seasonal trajectories; outliers warn of supply chain bottlenecks or customer churn indices.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
