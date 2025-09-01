export type Finding = {
  resource: string;
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  recommendation: string;
};

export const findings: Finding[] = [
  { resource: 'S3 Bucket', type: 'Public Access', severity: 'High', recommendation: 'Restrict access' },
  { resource: 'EC2 Instance', type: 'Unattached EBS', severity: 'Medium', recommendation: 'Delete unused EBS' },
  { resource: 'IAM User', type: 'No MFA', severity: 'High', recommendation: 'Enable MFA' },
  { resource: 'RDS', type: 'Old Snapshot', severity: 'Low', recommendation: 'Remove old snapshots' },
];

export const summary = {
  total: findings.length,
  high: findings.filter(f => f.severity === 'High').length,
  savings: 120.5,
};

export const severityData = [
  { name: 'High', value: summary.high, color: '#ef4444' },
  { name: 'Medium', value: findings.filter(f => f.severity === 'Medium').length, color: '#f59e42' },
  { name: 'Low', value: findings.filter(f => f.severity === 'Low').length, color: '#10b981' },
];
