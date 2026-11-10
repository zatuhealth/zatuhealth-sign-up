import { useState } from 'react';
import { Camera, LoaderCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Vaccine } from '@/lib/vaccines';

type Row = { id: number; found: string; key: string; date: string };

async function toDataUrl(file: File) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export function CardScanner({ catalog, scan, onSave }: {
  catalog: Vaccine[];
  scan: (image: string) => Promise<{ entries: { name: string; date: string | null; matchedKey: string | null }[]; error: string }>;
  onSave: (items: { key: string; date: string }[]) => Promise<string>;
}) {
  const [preview, setPreview] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  async function pick(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Choose a photo of the card.');
    setError(''); setRows(null); setBusy(true);
    try {
      const url = await toDataUrl(file);
      setPreview(url);
      const res = await scan(url);
      if (res.error) setError(res.error);
      else if (!res.entries.length) setError('No vaccines could be read from this photo. Try a clearer, well-lit picture.');
      setRows(res.entries.map((e, i) => ({ id: i, found: e.name, key: e.matchedKey ?? '', date: e.date ?? '' })));
    } catch { setError('The photo could not be read. Please try again.'); }
    setBusy(false);
  }
  const update = (id: number, patch: Partial<Row>) => setRows(rs => rs!.map(r => r.id === id ? { ...r, ...patch } : r));
  const ready = rows?.filter(r => r.key && r.date && r.date <= today) ?? [];

  return <div className="space-y-4">
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
      {preview ? <img src={preview} alt="Vaccination card" className="max-h-56 rounded-lg object-contain" /> : <Camera className="text-primary" size={32} />}
      <span>{preview ? 'Use a different photo' : 'Take or upload a photo of the vaccination card'}</span>
      <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={busy} onChange={e => void pick(e.target.files?.[0])} />
    </label>
    {busy && <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" size={16} />Reading the card…</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {rows && rows.length > 0 && <>
      <p className="text-sm text-muted-foreground">Check each entry against the card. Only rows with a vaccine and date are saved.</p>
      {rows.map(r => <div key={r.id} className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2"><span className="text-xs text-muted-foreground">On card: <strong className="text-foreground">{r.found}</strong></span>
          <button aria-label="Remove entry" onClick={() => setRows(rs => rs!.filter(x => x.id !== r.id))} className="text-muted-foreground"><Trash2 size={15} /></button></div>
        <Select value={r.key} onValueChange={key => update(r.id, { key })}><SelectTrigger aria-label="Vaccine" className="h-11 rounded-xl"><SelectValue placeholder="Choose matching vaccine" /></SelectTrigger>
          <SelectContent>{catalog.map(v => <SelectItem key={v.key} value={v.key}>{v.short} — {v.name}</SelectItem>)}</SelectContent></Select>
        <input type="date" aria-label="Date given" value={r.date} max={today} onChange={e => update(r.id, { date: e.target.value })} className="h-11 w-full rounded-xl border border-border bg-transparent px-3 text-sm" />
      </div>)}
      <Button className="vacc-save w-full" disabled={busy || !ready.length} onClick={async () => { setBusy(true); const e = await onSave(ready.map(r => ({ key: r.key, date: r.date }))); setBusy(false); if (e) setError(e); }}>
        Save {ready.length} record{ready.length === 1 ? '' : 's'}
      </Button>
    </>}
  </div>;
}
