import { useState } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface UploadMilestoneEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId: string;
  milestoneName: string;
  onSuccess: () => void;
}

export function UploadMilestoneEvidenceModal({
  isOpen,
  onClose,
  milestoneId,
  milestoneName,
  onSuccess,
}: UploadMilestoneEvidenceModalProps) {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      const maxSize = 50 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        showToast('El archivo es demasiado grande. Máximo 50MB', 'error');
        return;
      }

      setFile(selectedFile);
    }
  };

  const getFileType = (mimeType: string): 'photo' | 'document' | 'video' => {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      showToast('Por favor selecciona un archivo', 'error');
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${milestoneId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('milestone-evidence')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('milestone-evidence')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('milestone_evidence')
        .insert({
          milestone_id: milestoneId,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: getFileType(file.type),
          description: description || null,
          uploaded_by: 'Usuario',
        });

      if (dbError) throw dbError;

      showToast('Evidencia subida exitosamente', 'success');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error uploading evidence:', error);
      showToast('Error al subir la evidencia', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setDescription('');
    onClose();
  };

  const getFileIcon = () => {
    if (!file) return <Upload size={48} />;

    if (file.type.startsWith('image/')) return <ImageIcon size={48} />;
    if (file.type.startsWith('video/')) return <Video size={48} />;
    return <FileText size={48} />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Subir Evidencia</h2>
            <p className="text-sm text-gray-500 mt-1">{milestoneName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,video/*,.pdf,.doc,.docx"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="text-gray-400 mb-2">
                  {getFileIcon()}
                </div>
                {file ? (
                  <div className="text-sm">
                    <p className="font-medium text-slate-800">{file.name}</p>
                    <p className="text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p className="font-medium text-slate-800">
                      Click para seleccionar archivo
                    </p>
                    <p className="text-gray-500">
                      Fotos, videos o documentos (máx. 50MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Agrega una descripción de esta evidencia..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {uploading ? 'Subiendo...' : 'Subir Evidencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
