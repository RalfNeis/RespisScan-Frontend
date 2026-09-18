import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileDown, ScanHeart, CheckCircle, AlertTriangle, Play, RefreshCw, ZoomIn } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { api } from '../utils/api';

export function Diagnosis() {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete' | 'failed'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState<{ id: number; patient_id: string; name: string }[]>([]);
  const [currentScanId, setCurrentScanId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch patient list on mount
  useEffect(() => {
    api.get('/patients/')
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res.results ?? [];
        setPatients(list);
        if (list.length > 0) setPatientId(String(list[0].id));
      })
      .catch(() => {});
  }, []);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setStatus('idle');
      setScanResult(null);
    }
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const pollResults = (scanId: number) => {
    setCurrentScanId(scanId);
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/diagnostics/${scanId}/`);
        if (res.status === 'Failed') {
          clearInterval(interval);
          pollIntervalRef.current = null;
          setScanResult(res);
          setStatus('failed');
        } else if (res.status !== 'Pending') {
          clearInterval(interval);
          pollIntervalRef.current = null;
          setScanResult(res);
          setStatus('complete');
        }
      } catch (err) {
        console.error("Error polling scan result", err);
        clearInterval(interval);
        pollIntervalRef.current = null;
        setStatus('failed');
      }
    }, 2000);
    pollIntervalRef.current = interval;
  };

  const runAnalysis = async () => {
    if (!selectedFile) return;
    setStatus('analyzing');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('patient_id', patientId);

    try {
      const response = await api.post('/diagnostics/upload/', formData);
      
      const scanId = response.scan_id;
      // Start polling for result
      pollResults(scanId);

    } catch (err) {
      console.error("Upload failed", err);
      setStatus('idle');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setSelectedFile(null);
    setScanResult(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">AI Diagnosis Workspace</h2>
          <p className="text-slate-500">DenseNet-121 / Grad-CAM Pneumonia Detection</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 px-4 py-2 rounded-md border border-slate-200 flex items-center gap-2">
            <span className="text-sm text-slate-500">Patient:</span>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="bg-transparent font-medium text-slate-900 outline-none text-sm"
            >
              {patients.length === 0 && <option value="">No patients registered</option>}
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.patient_id})</option>
              ))}
            </select>
          </div>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" /> Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Sidebar Controls & Info */}
        <div className="xl:col-span-1 space-y-6 overflow-y-auto pr-2">
          <Card>
            <CardHeader>
              <CardTitle>Image Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg" 
              />
              <div 
                onClick={handleBoxClick}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 text-center hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Upload className="h-8 w-8 text-teal-600 mb-3" />
                <p className="text-sm font-medium text-slate-900">
                  {selectedFile ? selectedFile.name : "Click to Upload Chest X-Ray"}
                </p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG (Max 15MB)</p>
              </div>

              {status === 'idle' && selectedFile && (
                <Button className="w-full" size="lg" onClick={runAnalysis}>
                  <Play className="h-5 w-5 mr-2" /> Run Analysis
                </Button>
              )}

              {status === 'analyzing' && (
                <Button className="w-full" size="lg" disabled>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" /> Analyzing Image...
                </Button>
              )}

              {status === 'complete' && scanResult && (
                <div className={`border rounded-lg p-4 flex flex-col gap-2 ${scanResult.status === 'Positive' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <div className={`flex items-center gap-2 font-semibold ${scanResult.status === 'Positive' ? 'text-red-700' : 'text-green-700'}`}>
                    {scanResult.status === 'Positive' ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                    Detection: {scanResult.status}
                  </div>
                  <p className={`text-sm ${scanResult.status === 'Positive' ? 'text-red-600' : 'text-green-600'}`}>
                    {scanResult.status === 'Positive' ? 'Bacterial Pneumonia detected by the model.' : 'No signs of bacterial pneumonia detected.'}
                  </p>
                  <div className={`mt-2 bg-white rounded-md border p-3 ${scanResult.status === 'Positive' ? 'border-red-100' : 'border-green-100'}`}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Model Confidence</span>
                      <span className="font-medium text-slate-900">{(scanResult.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${scanResult.status === 'Positive' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${scanResult.confidence * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {status === 'failed' && (
            <Card>
              <CardContent className="p-6">
                <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex items-center gap-2 font-semibold text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Analysis Failed
                  </div>
                  <p className="text-sm text-red-600 mt-1">The AI model could not process this image. Please try again or contact support.</p>
                  <Button variant="outline" className="mt-3" onClick={handleReset}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {status === 'complete' && (
            <Card>
              <CardHeader>
                <CardTitle>Generate Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Radiologist Notes</label>
                  <textarea
                    className="w-full h-24 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    placeholder="Add clinical observations here..."
                    defaultValue={scanResult?.status === 'Positive' ? "Consolidation observed consistent with bacterial pneumonia. Grad-CAM confirms model focus." : "Clear lungs, no visible consolidation."}
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    if (currentScanId) {
                      window.open(`/api/diagnostics/${currentScanId}/export/`, '_blank');
                    }
                  }}
                >
                  <FileDown className="h-4 w-4" /> Export PDF Report
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Visualizer Area */}
        <div className="xl:col-span-2 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden relative shadow-lg">
          <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 shrink-0">
            <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <ScanHeart className="h-4 w-4 text-teal-400" /> Image Viewer
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-slate-300 hover:text-white hover:bg-slate-700">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[500px]">
            {status === 'idle' || status === 'analyzing' ? (
              <div className="col-span-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
                <ScanHeart className={`h-16 w-16 mb-4 ${status === 'analyzing' ? 'animate-pulse text-teal-500' : 'text-slate-600'}`} />
                <p>{status === 'analyzing' ? 'Processing image via API...' : 'Select an image and run analysis to view results'}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <div className="bg-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-t-md font-medium text-center tracking-wide uppercase">
                    Original CXR Input
                  </div>
                  <div className="flex-1 bg-black rounded-b-md overflow-hidden relative border border-slate-700 group">
                    <img 
                      src={scanResult?.original_image_url || ''} 
                      alt="Original Chest X-Ray" 
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="bg-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-t-md font-medium flex justify-between items-center tracking-wide uppercase">
                    <span>Grad-CAM Heatmap</span>
                    <span className="text-teal-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Processed</span>
                  </div>
                  <div className="flex-1 bg-black rounded-b-md overflow-hidden relative border border-slate-700 group">
                    {/* Background original image for context */}
                    <img 
                      src={scanResult?.original_image_url || ''} 
                      alt="Background Context" 
                      className="absolute inset-0 w-full h-full object-contain opacity-50 mix-blend-luminosity grayscale"
                    />
                    {/* Heatmap overlay returned from Supabase */}
                    <img 
                      src={scanResult?.heatmap_image_url || ''} 
                      alt="Grad-CAM Overlay" 
                      className="absolute inset-0 w-full h-full object-cover mix-blend-color-dodge opacity-70"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
