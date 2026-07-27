import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine
} from 'recharts';
import {
  TrendingUp, Sparkles, HelpCircle, ArrowUpRight, ArrowDownRight, AlertCircle
} from 'lucide-react';

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

export default function Predictions() {
  const [data, setData] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [forecastMetric, setForecastMetric] = useState<'Sales' | 'Profit'>('Sales');

  const fetchPredictions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/prediction');
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load predictions. Please make sure you have uploaded sales data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });

  // Calculate prediction details
  const details = React.useMemo(() => {
    if (data.length === 0) return null;
    const predItem = data.find(item => item.isPrediction);
    if (!predItem) return null;

    // Get second-to-last item (latest historical month)
    const lastHist = data[data.length - 2];
    
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
      growth,
      accuracyDesc: "Calculated via Ordinary Least Squares (OLS) regression over monthly sales logs. Residual standard errors define the 95% confidence intervals."
    };
  }, [data, forecastMetric]);

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
        <TrendingUp className="h-8 w-8 text-primary animate-bounce" />
        <p className="text-sm text-muted font-medium">Training Scikit-learn trend models...</p>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/80 rounded-2xl bg-card/20 max-w-2xl mx-auto my-8">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 shadow-inner mb-6">
          <TrendingUp className="h-8 w-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Projections Unavailable</h2>
        <p className="text-sm text-muted max-w-sm mt-2 mb-6 leading-relaxed">
          Upload a transactions spreadsheet to train regression models and project next month's sales trends.
        </p>
        <Button onClick={fetchPredictions} className="text-xs font-semibold uppercase tracking-wider">
          Sync Model
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Predictive Machine Learning</h1>
          <p className="text-xs text-muted">Advanced linear regression models forecasting revenue trends with confidence bounds.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary/80 rounded-md p-0.5 shrink-0">
          <button
            onClick={() => setForecastMetric('Sales')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              forecastMetric === 'Sales' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            Sales Forecast
          </button>
          <button
            onClick={() => setForecastMetric('Profit')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              forecastMetric === 'Profit' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            Profit Forecast
          </button>
        </div>
      </div>

      {/* Main Graph Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-primary" /> Projected Trend Line & Bounding Intervals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--muted), 0.1)" />
                <XAxis dataKey="month" stroke="rgba(var(--muted), 0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(var(--muted), 0.5)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                
                {/* Confidence Bounding Lines */}
                <Line
                  type="monotone"
                  dataKey={forecastMetric === 'Sales' ? 'SalesUpper' : 'ProfitUpper'}
                  stroke="#a78bfa"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Confidence Upper Bound"
                />
                <Line
                  type="monotone"
                  dataKey={forecastMetric === 'Sales' ? 'SalesLower' : 'ProfitLower'}
                  stroke="#a78bfa"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Confidence Lower Bound"
                />
                
                {/* Historical and Predicted Core Trend Line */}
                <Line
                  type="monotone"
                  dataKey={forecastMetric}
                  stroke="#6366f1"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  name={forecastMetric === 'Sales' ? 'Monthly Sales' : 'Monthly Profit'}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.isPrediction) {
                      return (
                        <circle cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} className="animate-ping" />
                      );
                    }
                    return <circle cx={cx} cy={cy} r={3} fill="#6366f1" stroke="none" />;
                  }}
                />

                {/* Highlight vertical divider where history splits with prediction */}
                {data.length > 1 && (
                  <ReferenceLine
                    x={data[data.length - 2]?.month}
                    stroke="rgba(var(--muted), 0.25)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                )}

              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Model Parameters & Forecast Details */}
      {details && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Card className="col-span-1">
            <CardContent className="p-5 flex flex-col justify-between h-36">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">Next Month Target</span>
              <div>
                <h3 className="text-xl font-bold tracking-tight mt-2">{details.month}</h3>
                <p className="text-xs text-muted mt-1">Forecast Period</p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-5 flex flex-col justify-between h-36">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">Projected {forecastMetric}</span>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-primary mt-2">{formatter.format(details.predictedVal)}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  {details.growth >= 0 ? (
                    <span className="flex items-center text-success font-semibold">
                      <ArrowUpRight className="h-4 w-4 shrink-0" /> {details.growth.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="flex items-center text-destructive font-semibold">
                      <ArrowDownRight className="h-4 w-4 shrink-0" /> {details.growth.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-muted">vs latest historical month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-5 flex flex-col justify-between h-36">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">95% confidence bounds</span>
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground/80 mt-2">
                  Min: <span className="font-bold text-foreground">{formatter.format(details.lower)}</span>
                </h3>
                <h3 className="text-sm font-semibold tracking-tight text-foreground/80 mt-1">
                  Max: <span className="font-bold text-foreground">{formatter.format(details.upper)}</span>
                </h3>
                <p className="text-[10px] text-muted mt-1.5 leading-none">residual limits index range</p>
              </div>
            </CardContent>
          </Card>

          {/* Model info banner */}
          <Card className="md:col-span-3 bg-secondary/10 border-secondary/40">
            <CardContent className="p-5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">Scikit-learn Ordinary Least Squares (OLS) Regression Details</h4>
                <p className="text-xs text-muted leading-relaxed">
                  {details.accuracyDesc} If your sales dataset has seasonality fluctuations (e.g. holiday peaks), note that linear trends model the baseline growth vectors rather than high-order polynomial fits, avoiding overfitting on sparse time-series elements.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      )}

    </div>
  );
}
