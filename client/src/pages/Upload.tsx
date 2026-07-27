import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import {
  Upload, FileSpreadsheet, HelpCircle, CheckCircle, AlertCircle,
  FileText, Clock, Trash2, ArrowRight, Loader2, Sparkles
} from 'lucide-react';

interface CleaningReport {
  rows_before: number;
  rows_after: number;
  duplicates_removed: number;
  missing_values_filled: number;
  invalid_records: number;
  final_usable_records: number;
  columns_mapped: Record<string, string>;
  file_extension?: string;
  mime_type?: string;
}

interface UploadHistoryItem {
  id: number;
  filename: string;
  uploaded_at: string;
  row_count: number;
  cleaning_report: Record<string, any>;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [report, setReport] = useState<CleaningReport | null>(null);
  const [history, setHistory] = useState<UploadHistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUploadHistory = async () => {
    try {
      const res = await api.get('/users/uploads');
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load upload history", err);
    }
  };

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setErrorMsg('');
      setStatus('idle');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg('');
      setStatus('idle');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setErrorMsg('');
    setReport(null);
    setStatus('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Step 1: Upload phase with progress bar
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
            if (pct >= 100) {
              // Switch to backend processing state
              setStatus('processing');
            }
          }
        }
      });

      // Step 2: Processing completed successfully
      setReport(res.data.cleaning_report);
      setStatus('success');
      setFile(null);
      fetchUploadHistory();
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || 'An error occurred while uploading. Ensure required columns are present.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFormatIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />;
    }
    return <FileText className="h-6 w-6 text-blue-500" />;
  };

  const supportedFormats = ['.csv', '.xlsx', '.xls', '.json', '.xml', '.pdf', '.txt', '.zip'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Import Sales Datasets</h1>
        <p className="text-xs text-muted">Upload transaction logs. Supported file types include spreadsheets, documents, archives, and markup trees.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Hand: Upload Dropper & Meta */}
        <div className="md:col-span-2 space-y-6">
          
          <Card>
            <CardContent className="p-6 space-y-4">
              
              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/60 bg-secondary/15 hover:bg-secondary/30'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.json,.xml,.pdf,.txt,.zip"
                />

                <div className="h-10 w-10 bg-secondary/80 text-muted rounded-md flex items-center justify-center border border-border mb-3 shadow-flat">
                  <Upload className="h-5 w-5" />
                </div>

                <p className="text-xs font-bold text-foreground">
                  Drag and drop file here, or <span className="text-primary hover:underline font-extrabold">browse files</span>
                </p>
                <p className="text-[10px] text-muted mt-1 leading-none">Maximum upload size is 10MB</p>

                {/* Formats indicators badges */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-4 max-w-sm">
                  {supportedFormats.map(ext => (
                    <span key={ext} className="text-[9px] font-bold px-2 py-0.5 bg-secondary text-secondary-foreground border border-border/80 rounded uppercase tracking-wider">
                      {ext.substring(1)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Error Callout */}
              {status === 'error' && (
                <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-md text-xs font-semibold text-destructive flex items-start gap-2.5">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* Selected File Card & Actions */}
              {file && (
                <div className="border border-border/80 rounded-md p-4 bg-secondary/10 flex justify-between items-center gap-4 animate-fadeIn">
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 bg-secondary rounded border border-border">
                      {getFormatIcon(file.name)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-foreground truncate">{file.name}</p>
                      <p className="text-[10px] text-muted mt-0.5">{formatBytes(file.size)} &bull; {file.type || 'Document'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setFile(null)}
                      className="p-1.5 rounded hover:bg-secondary text-muted hover:text-destructive transition-colors"
                      title="Clear selection"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {status === 'idle' && (
                      <Button
                        onClick={handleUpload}
                        size="sm"
                        className="text-xs font-bold flex items-center gap-1.5"
                      >
                        Start Upload <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Uploading Progress */}
              {status === 'uploading' && (
                <div className="space-y-2 py-2 border-t border-border/40">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading to server...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Processing Spinner */}
              {status === 'processing' && (
                <div className="py-3 border-t border-border/40 flex items-center justify-center gap-2.5">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  <span className="text-xs font-bold text-muted">Processing file structures & running OLS indices...</span>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Import Summary Card */}
          {status === 'success' && report && (
            <Card className="border border-emerald-500/30 bg-emerald-500/[0.01]">
              <CardHeader className="border-b border-emerald-500/10 p-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <CardTitle className="text-sm font-bold">Import Summary Report</CardTitle>
                </div>
                <Badge variant="success">Completed</Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                
                {/* Stats board */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                  <div className="bg-card border border-border/80 p-3 rounded-md shadow-flat flex flex-col justify-between h-18">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-muted">Total Rows</span>
                    <span className="text-sm font-bold text-foreground mt-1">{report.rows_before.toLocaleString()}</span>
                  </div>
                  <div className="bg-card border border-border/80 p-3 rounded-md shadow-flat flex flex-col justify-between h-18">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-muted">Final Usable</span>
                    <span className="text-sm font-bold text-primary mt-1">{report.final_usable_records.toLocaleString()}</span>
                  </div>
                  <div className="bg-card border border-border/80 p-3 rounded-md shadow-flat flex flex-col justify-between h-18">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-muted">Duplicates Dropped</span>
                    <span className="text-sm font-bold text-destructive mt-1">{report.duplicates_removed.toLocaleString()}</span>
                  </div>
                  <div className="bg-card border border-border/80 p-3 rounded-md shadow-flat flex flex-col justify-between h-18">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-muted">Invalid Discarded</span>
                    <span className="text-sm font-bold text-warning mt-1">{report.invalid_records.toLocaleString()}</span>
                  </div>
                  <div className="bg-card border border-border/80 p-3 rounded-md shadow-flat flex flex-col justify-between h-18">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-muted">Nulls Filled</span>
                    <span className="text-sm font-bold text-foreground mt-1">{report.missing_values_filled.toLocaleString()}</span>
                  </div>
                </div>

                {/* Column Mappings */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Detected Column Alignments</h4>
                  <div className="border border-border/60 rounded-md overflow-hidden bg-card text-xs">
                    <div className="grid grid-cols-2 bg-secondary/40 p-2 border-b border-border/40 font-bold text-muted uppercase text-[9px] tracking-wider">
                      <div>Standard Property</div>
                      <div>Mapped CSV/Document Key</div>
                    </div>
                    <div className="divide-y divide-border/30 max-h-48 overflow-y-auto">
                      {Object.entries(report.columns_mapped).map(([std, csv]) => (
                        <div key={std} className="grid grid-cols-2 p-2.5 font-semibold text-foreground/80 hover:bg-secondary/10 transition-colors">
                          <div className="capitalize">{std.replace('_', ' ')}</div>
                          <div className="font-mono text-primary text-[10px]">{csv}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Hand: Upload Guide & indicators */}
        <div className="col-span-1 space-y-6">
          <Card className="bg-secondary/15 border-border/50">
            <CardHeader>
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-muted flex items-center gap-1">
                <HelpCircle className="h-4.5 w-4.5" /> Parsing Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-secondary-foreground leading-relaxed">
              <p>
                SalesVision AI supports major structured formats. Each format maps directly into the database schema.
              </p>
              <div className="space-y-2 pt-1 border-t border-border/40 text-[11px]">
                <p>
                  <strong>Spreadsheets (CSV, Excel)</strong>: Header synonyms (e.g. <code>Revenue</code> &rarr; <code>Sales</code>) map dynamically.
                </p>
                <p>
                  <strong>Hierarchical (JSON, XML)</strong>: Expects array wrappers containing nested order fields.
                </p>
                <p>
                  <strong>Documents (PDF, TXT)</strong>: Parses tab/comma tabular text lines. Fallbacks to visual OCR mapping grids if no raw tables exist.
                </p>
                <p>
                  <strong>Archives (ZIP)</strong>: Unpacks in-memory and parses the first supported file type found.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload History Table (Full Width) */}
        <div className="md:col-span-3 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-muted" />
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted">Recent Upload History</h3>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Import Date</TableHead>
                  <TableHead>Final Clean Rows</TableHead>
                  <TableHead>Format Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => {
                  let info = "";
                  if (item.cleaning_report) {
                    const r = item.cleaning_report;
                    info = `Parsed: ${r.rows_before} | Discarded: ${r.invalid_records || 0} | Duplicates: ${r.duplicates_removed || 0}`;
                  }
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold flex items-center gap-2.5">
                        {getFormatIcon(item.filename)}
                        <span>{item.filename}</span>
                      </TableCell>
                      <TableCell className="text-muted text-xs">
                        {new Date(item.uploaded_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {item.row_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted text-xs">
                        <span className="px-2 py-0.5 bg-secondary text-secondary-foreground border border-border/60 rounded text-[10px] font-semibold">
                          {info}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {history.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted py-6">
                      No upload history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

      </div>

    </div>
  );
}
