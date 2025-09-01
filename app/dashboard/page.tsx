"use client";
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { BarChart, PieChart, Pie, Cell, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { FileText, ShieldCheck, DollarSign, Zap, BarChart3, AlertTriangle, RefreshCw, Play, CheckCircle, XCircle } from 'lucide-react';
import { scanAPI, ScanSummary, ScanFinding } from '../../lib/api';

export default function DashboardPage() {
  const [tab, setTab] = useState<'overview' | 'findings' | 'reports'>('overview');
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [findings, setFindings] = useState<ScanFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get summary and findings in parallel
      const [summaryData, findingsData] = await Promise.all([
        scanAPI.getSummary(),
        scanAPI.getFindings()
      ]);
      
      setSummary(summaryData.summary);
      setFindings(findingsData);
      setLastScanTime(summaryData.summary.projectStatus.lastScan);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Run new security scan
  const handleRunScan = async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      console.log('🚀 Starting security scan...');
      const result = await scanAPI.runScan();
      
      console.log('✅ Scan completed:', result);
      setLastScanTime(result.timestamp);
      
      // Refresh dashboard data
      await fetchDashboardData();
      
      // Show success message
      alert(`Security scan completed successfully!\nFound ${result.findingsCount} issues.`);
      
    } catch (err) {
      console.error('❌ Scan failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to run security scan');
      alert(`Scan failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Auto-run scan on component mount
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // First check if we have data
        await fetchDashboardData();
        
        // If no recent scan or no data, auto-run scan
        if (!summary || !lastScanTime || isDataStale()) {
          console.log('🔄 No recent data found, auto-running scan...');
          await handleRunScan();
        }
      } catch (err) {
        console.error('Failed to initialize dashboard:', err);
        setError('Failed to initialize dashboard. Please check your AWS connection.');
      }
    };

    initializeDashboard();
  }, []);

  // Check if data is stale (older than 1 hour)
  const isDataStale = () => {
    if (!lastScanTime) return true;
    const lastScan = new Date(lastScanTime);
    const now = new Date();
    const diffHours = (now.getTime() - lastScan.getTime()) / (1000 * 60 * 60);
    return diffHours > 1;
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  // Format next scan time
  const formatNextScan = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 0) {
        return `in ${diffHours}h ${diffMinutes}m`;
      } else if (diffMinutes > 0) {
        return `in ${diffMinutes}m`;
      } else {
        return 'Now';
      }
    } catch {
      return 'Invalid date';
    }
  };

  // Prepare chart data
  const severityData = summary ? [
    { name: 'High', value: summary.high, color: '#ef4444' },
    { name: 'Medium', value: summary.medium, color: '#f59e42' },
    { name: 'Low', value: summary.low, color: '#10b981' },
  ] : [];

  // Loading state
  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-brand-accent animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Loading Dashboard...</h2>
          <p className="text-gray-400">Please wait while we fetch your security data</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-500 mb-2">Failed to Load Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 py-8">
      {/* Sidebar */}
      <aside className="md:w-48 flex md:flex-col gap-4 md:gap-6 mb-4 md:mb-0">
        <button onClick={() => setTab('overview')} className={`px-4 py-2 rounded-xl font-semibold transition-all ${tab === 'overview' ? 'bg-gradient-to-r from-brand-primary to-brand-accent text-white' : 'bg-white/20 text-gray-100'}`}>Overview</button>
        <button onClick={() => setTab('findings')} className={`px-4 py-2 rounded-xl font-semibold transition-all ${tab === 'findings' ? 'bg-gradient-to-r from-brand-primary to-brand-accent text-white' : 'bg-white/20 text-gray-100'}`}>Findings</button>
        <button onClick={() => setTab('reports')} className={`px-4 py-2 rounded-xl font-semibold transition-all ${tab === 'reports' ? 'bg-gradient-to-r from-brand-primary to-brand-accent text-white' : 'bg-white/20 text-gray-100'}`}>Reports</button>
      </aside>

      {/* Main Content */}
      <motion.section
        key={tab}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1"
      >
        {tab === 'overview' && (
          <div className="space-y-8">
            {/* Run New Scan Button */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Security Scanner</h3>
                  <p className="text-gray-400">Run a new security scan to check for sensitive data</p>
                </div>
                <button
                  onClick={handleRunScan}
                  disabled={isScanning}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    isScanning 
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-brand-primary to-brand-accent hover:from-brand-accent hover:to-brand-primary'
                  } text-white shadow-lg`}
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run New Scan
                    </>
                  )}
                </button>
              </div>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="flex flex-col items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-brand-accent" />
                <span className="text-lg font-semibold">Total Issues</span>
                <span className="text-3xl font-bold">{summary?.totalIssues || 0}</span>
              </Card>
              <Card className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-red-500" />
                <span className="text-lg font-semibold">High Severity</span>
                <span className="text-3xl font-bold text-red-500">{summary?.high || 0}</span>
              </Card>
              <Card className="flex flex-col items-center gap-2">
                <DollarSign className="w-8 h-8 text-green-500" />
                <span className="text-lg font-semibold">Est. Savings</span>
                <span className="text-3xl font-bold text-green-500">${summary?.estSavings || 0}</span>
              </Card>
              <Card className="flex flex-col items-center gap-2">
                <BarChart3 className="w-8 h-8 text-blue-500" />
                <span className="text-lg font-semibold">Compliance Score</span>
                <span className="text-3xl font-bold text-blue-500">{summary?.complianceScore || 0}%</span>
              </Card>
            </div>

            {/* Project Status */}
            <Card>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-accent" />
                Project Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-semibold">Last Scan</p>
                    <p className="text-sm text-gray-300">{formatDate(lastScanTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold">Next Scan</p>
                    <p className="text-sm text-gray-300">{formatNextScan(summary?.projectStatus.nextScan || null)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold">Total Scans</p>
                    <p className="text-sm text-gray-300">{summary?.projectStatus.totalScans || 0}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Charts - Only show if we have data */}
            {severityData.length > 0 && (
              <Card className="col-span-1 md:col-span-3">
                <h3 className="text-xl font-bold mb-4">Security & Compliance Overview</h3>
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                  <div className="w-full md:w-1/2 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                          {severityData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={severityData}>
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value">
                          {severityData.map((entry, idx) => (
                            <Cell key={`bar-cell-${idx}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            )}

            {/* No Data Message */}
            {severityData.length === 0 && (
              <Card className="text-center py-12">
                <ShieldCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Security Data</h3>
                <p className="text-gray-500 mb-4">Run a security scan to see your security overview</p>
                <button
                  onClick={handleRunScan}
                  disabled={isScanning}
                  className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
                >
                  {isScanning ? 'Scanning...' : 'Run First Scan'}
                </button>
              </Card>
            )}
          </div>
        )}

        {tab === 'findings' && (
          <Card className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Security Findings
              </h3>
              <button
                onClick={handleRunScan}
                disabled={isScanning}
                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors flex items-center gap-2"
              >
                {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isScanning ? 'Scanning...' : 'New Scan'}
              </button>
            </div>
            
            {findings.length > 0 ? (
              <table className="min-w-full text-left">
                <thead>
                  <tr>
                    <th className="py-2 px-4">Resource</th>
                    <th className="py-2 px-4">Type</th>
                    <th className="py-2 px-4">Severity</th>
                    <th className="py-2 px-4">Description</th>
                    <th className="py-2 px-4">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map((finding, i) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="py-2 px-4">{finding.resource}</td>
                      <td className="py-2 px-4">{finding.type}</td>
                      <td className="py-2 px-4">
                        <Badge color={
                          finding.severity === 'High' ? 'red' :
                          finding.severity === 'Medium' ? 'yellow' : 'green'
                        }>
                          {finding.severity}
                        </Badge>
                      </td>
                      <td className="py-2 px-4">{finding.description || '-'}</td>
                      <td className="py-2 px-4">{finding.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-500 mb-2">No Security Issues Found</h3>
                <p className="text-gray-500 mb-4">Great job! Your AWS resources appear to be secure.</p>
                <button
                  onClick={handleRunScan}
                  disabled={isScanning}
                  className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
                >
                  {isScanning ? 'Scanning...' : 'Run New Scan'}
                </button>
              </div>
            )}
          </Card>
        )}

        {tab === 'reports' && (
          <div className="flex flex-col items-center gap-6">
            <Card className="flex flex-col items-center gap-4">
              <FileText className="w-10 h-10 text-brand-primary" />
              <span className="text-lg font-semibold">Download your latest report</span>
              <button
                onClick={async () => {
                  try {
                    const blob = await scanAPI.downloadPDF();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `safecloud-report-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (e) {
                    alert(`Failed to download report: ${e instanceof Error ? e.message : 'Unknown error'}`);
                  }
                }}
                className="mt-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold shadow-lg transition-all"
              >
                Download Report (PDF)
              </button>
              <span className="text-xs text-gray-500">Generated from your latest scan results.</span>
            </Card>
          </div>
        )}
      </motion.section>
    </div>
  );
}
