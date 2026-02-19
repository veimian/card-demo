import { supabase } from './supabase'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'
import Tesseract from 'tesseract.js'

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export async function uploadFile(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file)

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function extractText(file: File): Promise<string> {
  const fileType = file.type
  const fileName = file.name.toLowerCase()
  
  if (fileType === 'application/pdf') {
    return extractPdfText(file)
  } else if (fileType.startsWith('text/') || fileName.endsWith('.md') || fileName.endsWith('.txt')) {
    return extractTextFile(file)
  } else if (fileName.endsWith('.docx')) {
    return extractDocxText(file)
  } else if (fileType.startsWith('image/')) {
    return extractImageText(file)
  }
  
  return ''
}

async function extractTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    fullText += pageText + '\n'
  }

  return fullText
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

async function extractImageText(file: File): Promise<string> {
  const result = await Tesseract.recognize(
    file,
    'eng+chi_sim', // Support English and Simplified Chinese
    {
      logger: m => console.log(m)
    }
  )
  return result.data.text
}
