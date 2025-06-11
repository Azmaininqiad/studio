import { supabase } from './supabase'

export interface ProcessedFile {
  content: string
  filename: string
  fileType: string
  fileSize: number
}

export async function processFile(file: File): Promise<ProcessedFile> {
  const fileType = file.type
  const filename = file.name
  const fileSize = file.size

  let content = ''

  try {
    if (fileType === 'text/plain') {
      content = await file.text()
    } else if (fileType === 'application/pdf') {
      content = await processPDF(file)
    } else if (fileType.startsWith('image/')) {
      content = await processImage(file)
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      content = await processDocx(file)
    } else {
      throw new Error(`Unsupported file type: ${fileType}`)
    }

    return {
      content,
      filename,
      fileType,
      fileSize
    }
  } catch (error) {
    console.error('Error processing file:', error)
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function processPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
  
  try {
    const response = await fetch('/api/process-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: base64, filename: file.name }),
    })

    if (!response.ok) {
      throw new Error('Failed to process PDF')
    }

    const result = await response.json()
    return result.content || ''
  } catch (error) {
    console.error('PDF processing error:', error)
    return `PDF file: ${file.name} (content extraction failed)`
  }
}

async function processImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
  
  try {
    const response = await fetch('/api/process-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: base64, filename: file.name, mimeType: file.type }),
    })

    if (!response.ok) {
      throw new Error('Failed to process image')
    }

    const result = await response.json()
    return result.content || `Image file: ${file.name}`
  } catch (error) {
    console.error('Image processing error:', error)
    return `Image file: ${file.name} (content extraction failed)`
  }
}

async function processDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
  
  try {
    const response = await fetch('/api/process-docx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: base64, filename: file.name }),
    })

    if (!response.ok) {
      throw new Error('Failed to process DOCX')
    }

    const result = await response.json()
    return result.content || ''
  } catch (error) {
    console.error('DOCX processing error:', error)
    return `DOCX file: ${file.name} (content extraction failed)`
  }
}

export async function uploadFileToStorage(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('quiz-files')
    .upload(fileName, file)

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  return data.path
}