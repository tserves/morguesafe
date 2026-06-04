import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Package, Camera, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PersonalEffectsSection({ effects, onChange }) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const set = (field, value) => onChange({ ...effects, [field]: value });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('photo_url', file_url);
    setUploadingPhoto(false);
  };

  return (
    <div className="border rounded-xl p-5 space-y-4 bg-card">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Personal Effects</p>
      </div>

      <div>
        <Label>Personal Effects Present?</Label>
        <Select value={effects.present} onValueChange={v => set('present', v)}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {effects.present === 'yes' && (
        <>
          <div>
            <Label>Item Description</Label>
            <Textarea
              className="mt-1.5"
              rows={2}
              value={effects.description || ''}
              onChange={e => set('description', e.target.value)}
              placeholder="e.g. Gold ring, watch, wallet..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                className="mt-1.5"
                value={effects.quantity || ''}
                onChange={e => set('quantity', e.target.value)}
                placeholder="e.g. 3"
              />
            </div>
            <div>
              <Label>Condition</Label>
              <Input
                className="mt-1.5"
                value={effects.condition || ''}
                onChange={e => set('condition', e.target.value)}
                placeholder="Good / Fair / Poor"
              />
            </div>
          </div>
          <div>
            <Label>Bag Number / Tag Number</Label>
            <Input
              className="mt-1.5"
              value={effects.bag_number || ''}
              onChange={e => set('bag_number', e.target.value)}
              placeholder="e.g. BAG-001"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Received By</Label>
              <Input
                className="mt-1.5"
                value={effects.received_by || ''}
                onChange={e => set('received_by', e.target.value)}
                placeholder="Name / ID"
              />
            </div>
            <div>
              <Label>Witness (optional)</Label>
              <Input
                className="mt-1.5"
                value={effects.witness || ''}
                onChange={e => set('witness', e.target.value)}
                placeholder="Name"
              />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              className="mt-1.5"
              rows={2}
              value={effects.notes || ''}
              onChange={e => set('notes', e.target.value)}
              placeholder="Additional notes..."
            />
          </div>
          <div>
            <Label>Attach Photo (optional)</Label>
            <div className="mt-1.5">
              {effects.photo_url ? (
                <div className="relative inline-block">
                  <img src={effects.photo_url} alt="Effects" className="h-24 rounded-lg object-cover border" />
                  <button
                    onClick={() => set('photo_url', null)}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <div className="flex items-center gap-2 border border-dashed rounded-lg p-3 hover:bg-muted transition-colors text-sm text-muted-foreground">
                    {uploadingPhoto ? (
                      <span>Uploading...</span>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>Tap to attach photo</span>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}