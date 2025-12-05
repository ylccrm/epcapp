/*
  # Crear bucket de Storage para contratos
  
  1. Crear bucket 'contracts'
    - Público para lectura
    - Permite archivos PDF, DOC, DOCX, imágenes
  
  2. Políticas de Seguridad
    - Usuarios autenticados pueden subir archivos
    - Todos pueden ver archivos (público)
    - Solo usuarios autenticados pueden eliminar sus archivos
*/

-- Insertar el bucket en storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Política: Permitir a usuarios autenticados subir archivos
CREATE POLICY "Authenticated users can upload contract files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contracts');

-- Política: Permitir a todos ver los archivos (bucket público)
CREATE POLICY "Anyone can view contract files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contracts');

-- Política: Usuarios autenticados pueden actualizar archivos
CREATE POLICY "Authenticated users can update contract files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contracts')
WITH CHECK (bucket_id = 'contracts');

-- Política: Usuarios autenticados pueden eliminar archivos
CREATE POLICY "Authenticated users can delete contract files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contracts');
