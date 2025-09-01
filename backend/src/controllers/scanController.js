/**
 * Scan Controller
 * Manages security scanning operations and results
 */

const scannerService = require('../services/scanner');
const logger = require('../utils/logger');

class ScanController {
  constructor() {
    // In-memory cache for scan results
    this.cachedResults = {
      summary: null,
      findings: [],
      lastScanTime: null,
      isScanning: false
    };
  }

  /**
   * Run a new security scan
   */
  async runScanNow(req, res) {
    try {
      // Check if scan is already running
      if (this.cachedResults.isScanning) {
        return res.status(409).json({
          error: 'Scan already in progress',
          message: 'A security scan is currently running. Please wait for it to complete.'
        });
      }

      // Check if user has valid session
      if (!req.session || !req.session.awsCredentials) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Valid AWS session credentials required to run scan'
        });
      }

      // Validate session credentials
      if (!req.session.awsCredentials.accessKeyId || 
          !req.session.awsCredentials.secretAccessKey || 
          !req.session.awsCredentials.sessionToken) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Session credentials are incomplete or invalid'
        });
      }

      // Check if credentials are expired
      if (req.session.awsCredentials.expiration && 
          new Date(req.session.awsCredentials.expiration) <= new Date()) {
        return res.status(401).json({
          error: 'Expired credentials',
          message: 'AWS session has expired. Please re-authenticate.'
        });
      }

      // Set scanning flag
      this.cachedResults.isScanning = true;
      logger.info('Starting new security scan...');

      // Run the scan
      const scanResults = await scannerService.runScan(req.session);
      
      // Update cache with results
      this.cachedResults.summary = scanResults.summary;
      this.cachedResults.findings = scanResults.findings;
      this.cachedResults.lastScanTime = new Date().toISOString();
      this.cachedResults.isScanning = false;

      logger.info('Security scan completed successfully', {
        totalIssues: scanResults.summary.totalIssues,
        complianceScore: scanResults.summary.complianceScore,
        scanDuration: scanResults.summary.scanDuration
      });

      res.status(200).json({
        message: 'Security scan completed successfully',
        summary: scanResults.summary,
        findingsCount: scanResults.findings.length,
        timestamp: this.cachedResults.lastScanTime
      });

    } catch (error) {
      // Reset scanning flag on error
      this.cachedResults.isScanning = false;
      
      logger.error('Scan failed:', error.message);
      
      res.status(500).json({
        error: 'Scan failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get scan summary (cached or default)
   */
  getSummary(req, res) {
    try {
      if (!this.cachedResults.summary) {
        // Return default summary if no scan has been run
        const defaultSummary = {
          totalIssues: 0,
          high: 0,
          medium: 0,
          low: 0,
          complianceScore: 100,
          estSavings: 0,
          scanDuration: 0,
          projectStatus: {
            lastScan: null,
            nextScan: null,
            totalScans: 0
          }
        };

        return res.status(200).json({
          summary: defaultSummary,
          message: 'No scan results available. Run a scan to get current security status.',
          timestamp: new Date().toISOString()
        });
      }

      res.status(200).json({
        summary: this.cachedResults.summary,
        timestamp: this.cachedResults.lastScanTime,
        isScanning: this.cachedResults.isScanning
      });

    } catch (error) {
      logger.error('Failed to get scan summary:', error.message);
      
      res.status(500).json({
        error: 'Failed to retrieve scan summary',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get scan findings (cached or empty)
   */
  getFindings(req, res) {
    try {
      if (!this.cachedResults.findings || this.cachedResults.findings.length === 0) {
        return res.status(200).json({
          findings: [],
          message: 'No security findings available. Run a scan to detect potential issues.',
          timestamp: new Date().toISOString()
        });
      }

      res.status(200).json({
        findings: this.cachedResults.findings,
        count: this.cachedResults.findings.length,
        timestamp: this.cachedResults.lastScanTime,
        isScanning: this.cachedResults.isScanning
      });

    } catch (error) {
      logger.error('Failed to get scan findings:', error.message);
      
      res.status(500).json({
        error: 'Failed to retrieve scan findings',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get scan status
   */
  getStatus(req, res) {
    try {
      const status = {
        isScanning: this.cachedResults.isScanning,
        lastScan: this.cachedResults.lastScanTime,
        hasResults: !!this.cachedResults.summary,
        totalFindings: this.cachedResults.findings.length || 0,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(status);

    } catch (error) {
      logger.error('Failed to get scan status:', error.message);
      
      res.status(500).json({
        error: 'Failed to retrieve scan status',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Clear cached scan results
   */
  clearCache(req, res) {
    try {
      this.cachedResults = {
        summary: null,
        findings: [],
        lastScanTime: null,
        isScanning: false
      };

      logger.info('Scan cache cleared');

      res.status(200).json({
        message: 'Scan cache cleared successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to clear scan cache:', error.message);
      
      res.status(500).json({
        error: 'Failed to clear scan cache',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Generate PDF report from cached results
   */
  async downloadReport(req, res) {
    try {
      if (!this.cachedResults.summary) {
        return res.status(400).json({
          error: 'No data',
          message: 'Run a scan to generate a report.'
        });
      }

      let PDFDocument;
      try {
        PDFDocument = require('pdfkit');
      } catch (e) {
        logger.error('pdfkit not installed:', e && e.message);
        return res.status(500).json({
          error: 'Dependency missing',
          message: 'pdfkit is not installed. Run npm install in backend to enable reports.'
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="safecloud-report.pdf"');

      const doc = new PDFDocument({ margin: 40 });

      // Handle stream errors to avoid silent failures
      doc.on('error', (err) => {
        logger.error('PDF stream error:', { message: err && err.message, stack: err && err.stack });
        try { res.end(); } catch (_) {}
      });

      doc.pipe(res);

      // Header
      doc
        .fontSize(22)
        .fillColor('#3B82F6')
        .text('SafeCloud Security Report', { align: 'left' })
        .moveDown(0.2);
      doc
        .fontSize(10)
        .fillColor('#6B7280')
        .text(`Generated: ${new Date().toLocaleString()}`)
        .moveDown(1);

      // Summary
      const s = this.cachedResults.summary;
      doc
        .fontSize(16)
        .fillColor('#111827')
        .text('Summary', { underline: true })
        .moveDown(0.5);
      doc.fontSize(12).fillColor('#111827');
      doc.text(`Total Issues: ${s.totalIssues}`);
      doc.text(`High: ${s.high}  |  Medium: ${s.medium}  |  Low: ${s.low}`);
      doc.text(`Compliance Score: ${s.complianceScore}%`);
      doc.text(`Estimated Savings: $${s.estSavings}`);
      doc.text(`Scan Duration: ${s.scanDuration} ms`).moveDown(1);

      // Findings
      doc
        .fontSize(16)
        .fillColor('#111827')
        .text('Findings', { underline: true })
        .moveDown(0.5);

      if (!this.cachedResults.findings || this.cachedResults.findings.length === 0) {
        doc.fontSize(12).fillColor('#16A34A').text('No issues found.');
      } else {
        this.cachedResults.findings.forEach((f, idx) => {
          const sevColor = f.severity === 'High' ? '#DC2626' : f.severity === 'Medium' ? '#D97706' : '#059669';
          doc
            .fontSize(13)
            .fillColor(sevColor)
            .text(`${idx + 1}. [${f.severity}] ${f.type}`, { continued: false })
            .moveDown(0.2);
          doc.fontSize(11).fillColor('#374151');
          doc.text(`Resource: ${f.resource}`);
          if (f.description) doc.text(`Description: ${f.description}`);
          if (f.recommendation) doc.text(`Recommendation: ${f.recommendation}`);
          doc.moveDown(0.6);
        });
      }

      // Footer
      doc.moveDown(1);
      doc
        .fontSize(10)
        .fillColor('#6B7280')
        .text('Report generated by SafeCloud', { align: 'center' });

      doc.end();
    } catch (error) {
      logger.error('Failed to generate report:', { message: error && error.message, stack: error && error.stack });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate report', message: error && error.message });
      }
    }
  }
}

module.exports = new ScanController();
