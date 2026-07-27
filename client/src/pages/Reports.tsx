import React, { useState } from 'react';
import api from '../utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet, Download, Printer, FileText, CheckCircle2,
  AlertCircle, ShieldCheck
} from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState<'csv' | 'excel' | null>(null);
  const [error, setError] = useState('');

  const handleDownload = async (format: 'csv' | 'excel') => {
    setDownloading(format);
    setError('');
    try {
      const endpoint = format === 'csv' ? '/reports/export/csv' : '/reports/export/excel';
      // Fetch as blob
      const res = await api.get(endpoint, { responseType: 'blob' });
      
      // Create download link
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salesvision_report_${new Date().toISOString().substring(0, 10)}.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setError('Could not export report. Please ensure you have uploaded sales data first.');
    } finally {
      setDownloading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto print-page">
      
      {/* Title (hidden during print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print-hide">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Export Control</h1>
          <p className="text-xs text-muted">Export clean spreadsheets or compile printer-friendly vector PDFs.</p>
        </div>
      </div>

      {/* Export Controls Cards (hidden during print) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print-hide">
        
        {/* CSV Card */}
        <Card>
          <CardContent className="p-5 flex flex-col justify-between h-48">
            <div className="space-y-2">
              <div className="h-10 w-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-sm">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold mt-3">Comma-Separated (CSV)</h3>
              <p className="text-[11px] text-muted leading-normal">Download structured, cleaned rows in raw flat-file format, ready for BI tools.</p>
            </div>
            <Button
              onClick={() => handleDownload('csv')}
              isLoading={downloading === 'csv'}
              variant="outline"
              className="w-full flex items-center gap-2 mt-4 text-xs font-semibold"
            >
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </CardContent>
        </Card>

        {/* Excel Card */}
        <Card>
          <CardContent className="p-5 flex flex-col justify-between h-48">
            <div className="space-y-2">
              <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-sm">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold mt-3">Microsoft Excel (XLSX)</h3>
              <p className="text-[11px] text-muted leading-normal">Export a structured sheet workbook with headers formatted for spreadsheet analysis.</p>
            </div>
            <Button
              onClick={() => handleDownload('excel')}
              isLoading={downloading === 'excel'}
              variant="outline"
              className="w-full flex items-center gap-2 mt-4 text-xs font-semibold"
            >
              <Download className="h-4 w-4" /> Download Excel
            </Button>
          </CardContent>
        </Card>

        {/* PDF Card */}
        <Card>
          <CardContent className="p-5 flex flex-col justify-between h-48">
            <div className="space-y-2">
              <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-sm">
                <Printer className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold mt-3">Export to PDF</h3>
              <p className="text-[11px] text-muted leading-normal">Generate a vector-perfect printable page of your active metrics, mapped for standard A4 reports.</p>
            </div>
            <Button
              onClick={handlePrint}
              className="w-full flex items-center gap-2 mt-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <Printer className="h-4 w-4" /> Print PDF Report
            </Button>
          </CardContent>
        </Card>

      </div>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 flex items-start gap-2.5 print-hide">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* 4. Report Print Preview Frame (Beautifully customized vector layout visible during print and preview) */}
      <Card className="border border-border/80 shadow-lg bg-card">
        <CardContent className="p-8 space-y-8">
          
          {/* Header block */}
          <div className="flex justify-between items-start border-b border-border/50 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-foreground">SalesVision AI Report</span>
                <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider print-hide">Live Preview</span>
              </div>
              <p className="text-xs text-muted">Generated by operator {user?.full_name || 'N/A'} ({user?.email})</p>
            </div>
            <div className="text-right text-xs text-muted">
              <p>Date: {new Date().toLocaleDateString()}</p>
              <p>System Status: Active Clean</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase text-muted tracking-wider">Report Statement</h3>
            <p className="text-xs text-foreground/80 leading-relaxed">
              This dossier summarizes transactional performance metrics aggregated from the active database records associated with this account. All records have been audited through the database-level Pandas cleaning script, discarding duplicates and reconciling data types.
            </p>
          </div>

          {/* System Signoff */}
          <div className="pt-6 border-t border-border/40 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Compliance Registry</h4>
              <div className="flex items-center gap-1.5 text-xs text-foreground/70 font-semibold">
                <ShieldCheck className="h-4.5 w-4.5 text-success shrink-0" />
                Data Integrity Sign-off
              </div>
            </div>
            <div className="space-y-1 text-right">
              <div className="inline-block border-b border-border/80 w-36 h-6" />
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Authorized Signature</p>
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
