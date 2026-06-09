import { useState } from 'react';
import { reportsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Download, Mail, FileText, Calendar } from 'lucide-react';

export default function Export() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clinicianEmail, setClinicianEmail] = useState(user?.profile?.clinician_email || '');
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validate = () => {
    if (!startDate || !endDate) return 'Please select both a start and end date.';
    if (endDate < startDate) return 'End date must be after start date.';
    return null;
  };

  const handleDownload = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setSuccess(''); setDownloading(true);
    try {
      const res = await reportsAPI.generateReport({ start_date: startDate, end_date: endDate });
      // Create a download link and click it
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `sleep-diary-${startDate}-to-${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Report downloaded successfully.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to generate report.';
      setError(msg);
    } finally {
      setDownloading(false);
    }
  };

  const handleEmail = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (!clinicianEmail) { setError('Please enter a clinician email address.'); return; }
    setError(''); setSuccess(''); setEmailing(true);
    try {
      await reportsAPI.emailReport({
        start_date: startDate,
        end_date: endDate,
        clinician_email: clinicianEmail,
      });
      setSuccess(`Report sent to ${clinicianEmail} successfully.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send email.');
    } finally {
      setEmailing(false);
    }
  };

  // Quick date range presets
  const setPreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: '680px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={18} color="#10b981" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0fdf4' }}>Export Report</h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Generate a PDF of your sleep diary entries</p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '14px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '14px' }}>
          {success}
        </div>
      )}

      {/* Date range */}
      <div style={{ background: 'rgba(15,30,24,0.6)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Calendar size={15} color="#10b981" />
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#d1fae5' }}>Select Date Range</h2>
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { label: 'Last 7 days', days: 7 },
            { label: 'Last 14 days', days: 14 },
            { label: 'Last 30 days', days: 30 },
            { label: 'Last 90 days', days: 90 },
          ].map(({ label, days }) => (
            <button
              key={days}
              onClick={() => setPreset(days)}
              style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
                color: '#10b981', cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Download PDF */}
      <div style={{ background: 'rgba(15,30,24,0.6)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Download size={15} color="#818cf8" />
              <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#d1fae5' }}>Download PDF</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', maxWidth: '340px' }}>
              Generate a formatted PDF report with all your sleep entries, summary statistics, and a complete data table.
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
              background: downloading ? 'rgba(129,140,248,0.3)' : 'rgba(129,140,248,0.2)',
              border: '1px solid rgba(129,140,248,0.3)', color: '#818cf8',
              cursor: downloading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <Download size={15} />
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Email to clinician */}
      <div style={{ background: 'rgba(15,30,24,0.6)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Mail size={15} color="#10b981" />
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#d1fae5' }}>Email to Clinician</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', marginBottom: '16px' }}>
          Send the PDF report directly to your doctor, therapist, or sleep specialist. A copy will be sent from the app's email address.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            label="Clinician's Email Address"
            type="email"
            placeholder="doctor@clinic.com"
            value={clinicianEmail}
            onChange={(e) => setClinicianEmail(e.target.value)}
          />
          <button
            onClick={handleEmail}
            disabled={emailing}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '13px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
              background: emailing ? '#065f46' : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', color: 'white',
              cursor: emailing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(16,185,129,0.25)',
            }}
          >
            <Mail size={15} />
            {emailing ? 'Sending...' : 'Send Report to Clinician'}
          </button>
        </div>
      </div>

      {/* Report content note */}
      <div style={{ marginTop: '16px', padding: '14px 18px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.6' }}>
          The PDF report includes: patient name, date range, summary statistics (avg SE, avg TST, avg latency),
          and a full data table with all 15+ CSD-M fields for each date.
          All metrics are calculated using validated CSD-M formulas.
        </p>
      </div>
    </div>
  );
}