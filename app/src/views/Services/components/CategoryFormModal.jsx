import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';

export default function CategoryFormModal({ isOpen, editTarget, onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      // 🌟 FULL FIELD MULTI-PARAM SLOTS PRE-POPULATION
      setName(editTarget ? editTarget.name : '');
      setDescription(editTarget ? (editTarget.description || '') : '');
      setImageUrl(editTarget ? (editTarget.image_url || '') : '');
    }
  }, [isOpen, editTarget]);

  const handleTriggerWordPressMediaLibrary = (e) => {
    e.preventDefault();
    if (!window.wp || !window.wp.media) {
      alert("WordPress Media Core not enqueued. Input external link directly!");
      return;
    }
    const mediaFrame = window.wp.media({
      title: 'Select Folder Icon Category Image',
      button: { text: 'Assign Icon Image' },
      multiple: false
    });
    mediaFrame.on('select', () => {
      const attachment = mediaFrame.state().get('selection').first().toJSON();
      setImageUrl(attachment.url || '');
    });
    mediaFrame.open();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 relative text-left animate-scale-up" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider leading-none">
          {editTarget ? 'Edit Folder Category' : 'Create Catalog Folder'}
        </h3>
        
        <div className="space-y-3.5 pt-1 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Folder Title Name</label>
            <input 
              type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Barbering Cuts"
              className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Description Summary</label>
            <textarea 
              value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief summary notes..."
              className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg h-14 outline-none resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Category Display Image Asset</label>
            <div className="flex gap-2 w-full">
              <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg outline-none flex-1 min-w-0" />
              <button onClick={handleTriggerWordPressMediaLibrary} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shrink-0 transition-colors">Choose Image</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" className="px-4 font-bold" onClick={() => name.trim() && onSave({ name, description, image_url: imageUrl })}>Save Card Data</Button>
        </div>
      </div>
    </div>
  );
}
