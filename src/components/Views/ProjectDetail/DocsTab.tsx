import { useEffect, useState } from 'react';
import { Folder, Upload } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { UploadDocumentModal } from '../../Modals/UploadDocumentModal';
import type { Database } from '../../../lib/database.types';

type ProjectDoc = Database['public']['Tables']['project_docs']['Row'];

interface DocsTabProps {
  projectId: string;
}

export function DocsTab({ projectId }: DocsTabProps) {
  const [docs, setDocs] = useState<ProjectDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('engineering');

  useEffect(() => {
    loadDocs();
  }, [projectId]);

  async function loadDocs() {
    try {
      const { data, error } = await supabase
        .from('project_docs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocs(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    { id: 'engineering', label: 'Ingeniería', color: 'blue' },
    { id: 'legal', label: 'Legal', color: 'purple' },
    { id: 'hse', label: 'HSE', color: 'green' },
  ];

  const getDocsCountByCategory = (categoryId: string) => {
    return docs.filter((doc) => doc.category === categoryId).length;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      engineering: 'border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-300',
      legal: 'border-purple-100 bg-purple-50/50 hover:bg-purple-50 text-purple-300',
      hse: 'border-green-100 bg-green-50/50 hover:bg-green-50 text-green-300',
    };
    return colors[category] || colors.engineering;
  };

  const getCategoryTextColor = (category: string) => {
    const colors: Record<string, string> = {
      engineering: 'text-blue-900',
      legal: 'text-purple-900',
      hse: 'text-green-900',
    };
    return colors[category] || colors.engineering;
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800">Archivos del Proyecto</h3>
          <button
            onClick={() => {
              setSelectedCategory('engineering');
              setIsModalOpen(true);
            }}
            className="bg-slate-900 text-white px-3 py-1.5 rounded text-sm hover:bg-slate-800 shadow-sm flex items-center gap-2"
          >
            <Upload size={14} />
            Subir
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando documentos...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => {
              const count = getDocsCountByCategory(category.id);
              return (
                <div
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setIsModalOpen(true);
                  }}
                  className={`border rounded-lg p-4 cursor-pointer transition text-center ${getCategoryColor(category.id)}`}
                >
                  <Folder className="mx-auto mb-2" size={40} />
                  <p className={`font-medium text-sm ${getCategoryTextColor(category.id)}`}>
                    {category.label}
                  </p>
                  <p className="text-xs text-gray-400">{count} archivos</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <UploadDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        category={selectedCategory}
        onSuccess={loadDocs}
      />
    </div>
  );
}
