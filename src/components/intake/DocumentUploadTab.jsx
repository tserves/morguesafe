import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Scan, FileText, X, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';

const FILE_TYPES = [
  { value: 'photo', label: 'Photo' },
  { value: 'id_document', label: 'ID Document' },
  { value: 'hospital_form', label: 'Hospital Form' },
  { value: 'referral_doc', label: 'Referral Document' },
  { value: 'death_paperwork', label: 'Death Paperwork' },
  { value: 'effects_photo', label: 'Personal Effects Photo' },
  { value: 'other', label: 'Other' },
];

export default function DocumentUploadTab({ files, onFilesChange, onScanResult, intakeType }) {
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const handleUpload = async (e) => {
    const fileList = Array.from(e.target.files);
    if (!fileList.length) return;
    setUploading(true);
    const newFiles = [];
    for (const file of fileList) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newFiles.push({
        id: Date.now() + Math.random(),
        url: file_url,
        name: file.name,
        tag: file.type.startsWith('image/') ? 'photo' : 'other',
        notes: '',
        uploaded_by: currentUser?.full_name || 'Staff',
        uploaded_at: new Date().toISOString(),
        is_image: file.type.startsWith('image/'),
      });
    }
    onFilesChange([...files, ...newFiles]);
    setUploading(false);
    e.target.value = '';
  };

  const updateFile = (id, field, value) => {
    onFilesChange(files.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFile = (id) => onFilesChange(files.filter(f => f.id !== id));

  const handleScanAll = async () => {
    if (!files.length) return;
    setScanning(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an intake system for a hospital morgue. Analyze the provided document(s)/image(s) for a ${intakeType} intake.
Extract ALL visible patient/deceased information. Return N/A for fields not found.
Fields to extract: full_name, baby_name, age, sex, date_of_birth (YYYY-MM-DD), mrn, arrival_datetime (YYYY-MM-DDTHH:mm), ward, referral_source, referral_contact, mother_name, mother_mrn, mother_dob (YYYY-MM-DD), delivery_unit, transported_by, reference_number, contact_details, notes, effects_description, attending_staff, brought_in_by, received_by, gestational_age.
Only include fields with confidence > 20. Assign confidence 0-100 per field.`,
      file_urls: files.map(f => f.url),
      response_json_schema: {
        type: 'object',
        properties: {
          extracted_fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                label: { type: 'string' },
                value: { type: 'string' },
                confidence: { type: 'number' },
                source_note: { type: 'string' },
              },
            },
          },
          summary: { type: 'string' },
        },
      },
    });
    setScanning(false);
    const valid = (result.extracted_fields || []).filter(f => f.value && f.value !== 'N/A' && f.value.trim() !== '');
    onScanResult(valid, result.summary || '');
  };

  return (
    <div className="space-y-4">
      <label className="cursor-pointer block">
        <input type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleUpload} disabled={uploading} />
        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/50 transition-colors">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-7 h-7 text-muted-foreground" />
              <p className="text-sm font-medium">Tap to upload files</p>
              <p className="text-xs text-muted-foreground">Photos, PDFs, ID documents, hospital forms</p>
            </div>
          )}
        </div>
      </label>

      {files.length > 0 && (
        <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/5" onClick={handleScanAll} disabled={scanning}>
          {scanning
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning & extracting data...</>
            : <><Scan className="w-4 h-4 mr-2" />Scan & Autofill from {files.length} file{files.length > 1 ? 's' : ''}</>}
        </Button>
      )}

      {files.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">No files uploaded yet. Upload documents to enable auto-fill.</p>
      )}

      {files.map((file) => (
        <div key={file.id} className="border rounded-xl overflow-hidden bg-card">
          {file.is_image ? (
            <div className="relative">
              <img src={file.url} alt={file.name} className="w-full h-32 object-cover" />
              <button onClick={() => setPreviewFile(file)} className="absolute bottom-2 right-2 bg-black/60 text-white rounded-lg px-2 py-1 text-xs flex items-center gap-1">
                <Eye className="w-3 h-3" /> View
              </button>
            </div>
          ) : (
            <div className="bg-muted/50 p-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm truncate flex-1">{file.name}</span>
              <a href={file.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline shrink-0">Open</a>
            </div>
          )}
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Document Type</Label>
                <Select value={file.tag} onValueChange={v => updateFile(file.id, 'tag', v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col justify-end">
                <p className="text-[10px] text-muted-foreground">By: {file.uploaded_by}</p>
                <p className="text-[10px] text-muted-foreground">{format(new Date(file.uploaded_at), 'dd/MM/yy HH:mm')}</p>
              </div>
            </div>
            <div>
              <Input className="h-7 text-xs" value={file.notes} onChange={e => updateFile(file.id, 'notes', e.target.value)} placeholder="Notes about this file..." />
            </div>
            <div className="flex justify-end">
              <button onClick={() => removeFile(file.id)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
          <div className="relative">
            <img src={previewFile.url} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" />
            <button className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center" onClick={() => setPreviewFile(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}