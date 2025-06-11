'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { processFile, uploadFileToStorage, type ProcessedFile } from '@/lib/file-processor'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, Image, FileSpreadsheet, Loader2, CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileProcessed: (fileData: { fileId: string; content: string; filename: string }) => void
}

const ACCEPTED_FILE_TYPES = {
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp']
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function FileUpload({ onFileProcessed }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to upload files',
        variant: 'destructive',
      })
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: 'Please select a file smaller than 10MB',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      setProgress(20)
      const processedFile = await processFile(file)
      
      setProgress(50)
      const storagePath = await uploadFileToStorage(file, user.id)
      
      setProgress(80)
      const { data: fileRecord, error } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          filename: processedFile.filename,
          file_type: processedFile.fileType,
          file_size: processedFile.fileSize,
          storage_path: storagePath,
          extracted_content: processedFile.content,
        })
        .select()
        .single()

      if (error) throw error

      setProgress(100)
      setUploadedFile(processedFile.filename)
      
      toast({
        title: 'File Uploaded Successfully',
        description: `${processedFile.filename} has been processed and is ready for quiz generation`,
      })

      onFileProcessed({
        fileId: fileRecord.id,
        content: processedFile.content,
        filename: processedFile.filename,
      })

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [user, toast, onFileProcessed])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    disabled: uploading,
  })

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />
      case 'docx':
        return <FileSpreadsheet className="h-8 w-8 text-blue-500" />
      case 'txt':
        return <FileText className="h-8 w-8 text-gray-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className="h-8 w-8 text-green-500" />
      default:
        return <FileText className="h-8 w-8 text-gray-500" />
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setProgress(0)
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {uploadedFile ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="flex items-center space-x-2">
                {getFileIcon(uploadedFile)}
                <span className="font-medium">{uploadedFile}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              File uploaded successfully! You can now generate a quiz.
            </p>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive && !isDragReject && "border-primary bg-primary/5",
              isDragReject && "border-destructive bg-destructive/5",
              uploading && "cursor-not-allowed opacity-50"
            )}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              {uploading ? (
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              ) : (
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              )}
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {uploading ? 'Processing File...' : 'Upload Your File'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {uploading
                    ? 'Please wait while we process your file'
                    : isDragActive
                    ? 'Drop your file here'
                    : 'Drag & drop a file here, or click to select'}
                </p>
              </div>

              {progress > 0 && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    {progress < 30 ? 'Reading file...' :
                     progress < 60 ? 'Processing content...' :
                     progress < 90 ? 'Uploading...' : 'Finalizing...'}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <span className="bg-muted px-2 py-1 rounded">.txt</span>
                <span className="bg-muted px-2 py-1 rounded">.pdf</span>
                <span className="bg-muted px-2 py-1 rounded">.docx</span>
                <span className="bg-muted px-2 py-1 rounded">.jpg</span>
                <span className="bg-muted px-2 py-1 rounded">.png</span>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Maximum file size: 10MB
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}