import { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UploadEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId: string;
  milestoneName: string;
  onSuccess: () => void;
}

interface PhotoFile {
  file: File;
  preview: string;
  description: string;
}

export function UploadEvidenceModal({
  isOpen,
  onClose,
  milestoneId,
  milestoneName,
  onSuccess,
}: UploadEvidenceModalProps) {
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} no es una imagen válida`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} supera el tamaño máximo de 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [
          ...prev,
          {
            file,
            preview: reader.result as string,
            description: '',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const updatePhotoDescription = (index: number, description: string) => {
    setPhotos((prev) =>
      prev.map((photo, i) => (i === index ? { ...photo, description } : photo))
    );
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (photos.length === 0) {
      alert('Por favor agregue al menos una foto');
      return;
    }

    setLoading(true);

    try {
      const uploadPromises = photos.map(async (photo) => {
        const fileExt = photo.file.name.split('.').pop();
        const fileName = `${milestoneId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('milestone-evidence')
          .upload(fileName, photo.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('milestone-evidence')
          .getPublicUrl(fileName);

        return {
          milestone_id: milestoneId,
          file_url: urlData.publicUrl,
          file_name: photo.file.name,
          file_type: photo.file.type,
          description: photo.description || null,
          uploaded_by: 'user',
        };
      });

      const evidenceData = await Promise.all(uploadPromises);

      const { error: dbError } = await supabase
        .from('milestone_evidence')
        .insert(evidenceData);

      if (dbError) throw dbError;

      setPhotos([]);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error uploading evidence:', error);
      alert('Error al subir las fotos. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center fade-in"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden m-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-900 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-lg text-white">Subir Evidencia</h3>
            <p className="text-xs text-gray-400 mt-0.5">{milestoneName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotos de Evidencia
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-600">
                    Haga clic para seleccionar fotos
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, HEIC (máximo 5MB por foto)
                  </p>
                </label>
              </div>
            </div>

            {photos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Fotos Seleccionadas ({photos.length})
                </h4>
                <div className="space-y-3">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 flex gap-3"
                    >
                      <img
                        src={photo.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {photo.file.name}
                        </p>
                        <input
                          type="text"
                          value={photo.description}
                          onChange={(e) =>
                            updatePhotoDescription(index, e.target.value)
                          }
                          placeholder="Descripción de la foto (opcional)"
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="text-red-500 hover:text-red-700 self-start"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || photos.length === 0}
              className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ImageIcon size={16} />
              {loading ? 'Subiendo...' : `Subir ${photos.length} foto${photos.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
