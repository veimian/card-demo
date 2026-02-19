import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import JSZip from 'jszip';

// Configure PDF.js worker
// Use explicit version to avoid dynamic import issues or cdnjs issues.
// Ideally, we should copy the worker file to public/ during build, but for simplicity:
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs`;

self.onmessage = async (e: MessageEvent) => {
  const { file, type } = e.data;

  try {
    let text = '';

    if (type === 'application/pdf') {
      text = await extractPdfText(file);
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      text = await extractDocxText(file);
    } else if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.name.endsWith('.pptx')) {
      text = await extractPptxText(file);
    } else if (type.startsWith('image/')) {
      text = await extractImageText(file);
    } else if (type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      text = await extractTextFile(file);
    }

    self.postMessage({ status: 'complete', text });
  } catch (error: any) {
    self.postMessage({ status: 'error', error: error.message });
  }
};

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
    
    // Report progress
    self.postMessage({ status: 'progress', progress: (i / pdf.numPages) * 100 });
  }

  return fullText;
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractPptxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  let fullText = '';
  
  // Find all slide files
  const slideFiles = Object.keys(zip.files).filter(fileName => 
    fileName.match(/ppt\/slides\/slide\d+\.xml/)
  );
  
  // Sort slides to extract text in order (slide1, slide2, etc.)
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
    const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
    return numA - numB;
  });

  for (let i = 0; i < slideFiles.length; i++) {
    const slideContent = await zip.files[slideFiles[i]].async('text');
    // Simple XML parsing to extract text content from <a:t> tags
    const slideText = slideContent.match(/<a:t>([^<]*)<\/a:t>/g)
      ?.map(tag => tag.replace(/<\/?a:t>/g, ''))
      .join(' ') || '';
    
    if (slideText.trim()) {
      fullText += `--- Slide ${i + 1} ---\n${slideText}\n\n`;
    }

    // Report progress
    self.postMessage({ status: 'progress', progress: ((i + 1) / slideFiles.length) * 100 });
  }

  return fullText;
}

async function extractImageText(file: File): Promise<string> {
  const result = await Tesseract.recognize(
    file,
    'eng+chi_sim',
    {
      logger: m => {
        if (m.status === 'recognizing text') {
          self.postMessage({ status: 'progress', progress: m.progress * 100 });
        }
      }
    }
  );
  return result.data.text;
}

async function extractTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}
