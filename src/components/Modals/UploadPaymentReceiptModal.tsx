import { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface UploadPaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId: string;
  milestoneName: string;
  onSuccess: () => void;
}

export function UploadPaymentReceiptModal({
  isOpen,
  onClose,
  milestoneId,
  milestoneName,
  onSuccess,
}: UploadPaymentReceiptModalProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const maxSize = 10 * 1024 * 1024;

      if (selectedFile.size > maxSize) {
        showToast('El archivo es demasiado grande. Máximo 10MB', 'error');
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        showToast('Tipo de archivo no permitido. Solo PDF o imágenes', 'error');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showToast('Por favor selecciona un archivo', 'error');
      return;
    }

    if (!paidDate) {
      showToast('Por favor selecciona la fecha de pago', 'error');
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${milestoneId}_${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('payment_milestones')
        .update({
          payment_receipt_url: publicUrlData.publicUrl,
          paid_date: paidDate,
          paid_by: user.id,
        })
        .eq('id', milestoneId);

      if (updateError) throw updateError;

      showToast('Comprobante subido exitosamente', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error uploading receipt:', error);
      showToast(error.message || 'Error al subir el comprobante', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-green-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Upload size={24} className="text-green-600" />
              Subir Comprobante de Pago
            </h2>
            <p className="text-sm text-gray-600 mt-1">{milestoneName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Pago
            </label>
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprobante (PDF o Imagen)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-400 transition">
              <div className="space-y-1 text-center">
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <FileText size={24} />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none"
                      >
                        <span>Selecciona un archivo</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">o arrastra aquí</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, JPG, PNG hasta 10MB</p>
                  </>
                )}
              </div>
            </div>
            {file && (
              <button
                onClick={() => setFile(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                Eliminar archivo
              </button>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Información importante:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>El comprobante quedará registrado permanentemente</li>
                <li>Solo se permiten archivos PDF o imágenes</li>
                <li>Tamaño máximo: 10MB</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Subiendo...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Subir Comprobante
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
