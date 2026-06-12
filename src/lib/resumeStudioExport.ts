import { wrapResumeStudioHtmlDocument } from '@/lib/resumeStudioBrand';

/** Client-side PDF export when server Puppeteer/Chrome is unavailable. */
export async function exportResumeHtmlToPdfBlob(html: string, title = 'CV'): Promise<Blob> {
  const docHtml = wrapResumeStudioHtmlDocument(html, title);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '794px';
  iframe.style.height = '1123px';
  iframe.style.border = '0';
  iframe.srcdoc = docHtml;
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('CV preview timed out')), 20000);
      iframe.onload = () => {
        window.clearTimeout(timer);
        resolve();
      };
    });

    await new Promise((resolve) => window.setTimeout(resolve, 900));

    const doc = iframe.contentDocument;
    const target =
      (doc?.querySelector('.resume-studio-preview-root') as HTMLElement | null) ||
      (doc?.body as HTMLElement | null);
    if (!target) {
      throw new Error('Could not render CV for PDF export');
    }

    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: target.scrollWidth || 794,
      height: target.scrollHeight || 1123,
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;
    const imageData = canvas.toDataURL('image/png');

    pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  } finally {
    iframe.remove();
  }
}
