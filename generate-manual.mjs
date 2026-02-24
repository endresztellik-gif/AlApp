import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  TableOfContents,
  PageBreak,
  AlignmentType,
  BorderStyle,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to create a heading
const createHeading = (text, level) => {
  const headingLevel = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
  };
  return new Paragraph({
    text,
    heading: headingLevel[level] || HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
};

// Helper function to create a paragraph
const createParagraph = (text, options = {}) => {
  return new Paragraph({
    children: [new TextRun({ text, ...options })],
    spacing: { after: 120 },
  });
};

// Helper function to create a bullet point
const createBullet = (text, level = 0) => {
  return new Paragraph({
    text,
    bullet: { level },
    spacing: { after: 60 },
  });
};

// Helper function to create code block
const createCode = (text) => {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Courier New', size: 20 })],
    shading: { fill: 'F5F5F5' },
    spacing: { before: 100, after: 100 },
  });
};

// Parse markdown and create document content
const parseMarkdown = (markdown) => {
  const lines = markdown.split('\n');
  const children = [];
  let inCodeBlock = false;
  let codeContent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        children.push(createCode(codeContent.trim()));
        codeContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      children.push(createHeading(line.substring(4), 3));
    } else if (line.startsWith('## ')) {
      children.push(createHeading(line.substring(3), 2));
    } else if (line.startsWith('# ')) {
      children.push(createHeading(line.substring(2), 1));
    }
    // Bullet points
    else if (line.match(/^- /)) {
      children.push(createBullet(line.substring(2)));
    } else if (line.match(/^\d+\. /)) {
      const match = line.match(/^\d+\. (.+)$/);
      if (match) children.push(createBullet(match[1]));
    }
    // Horizontal rule
    else if (line === '---') {
      children.push(
        new Paragraph({
          border: {
            bottom: {
              color: 'CCCCCC',
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { before: 200, after: 200 },
        })
      );
    }
    // Bold text
    else if (line.match(/\*\*(.+)\*\*/)) {
      const text = line.replace(/\*\*(.+?)\*\*/g, '$1');
      children.push(createParagraph(text, { bold: true }));
    }
    // Empty lines
    else if (line.trim() === '') {
      // Skip empty lines to reduce spacing
      continue;
    }
    // Regular text
    else if (line.trim() !== '') {
      children.push(createParagraph(line));
    }
  }

  return children;
};

// Read the markdown file
const markdownPath = path.join(process.cwd(), 'FELHASZNALOI_UTMUTATO.md');
const markdown = fs.readFileSync(markdownPath, 'utf-8');

// Parse markdown content
const content = parseMarkdown(markdown);

// Create the document
const doc = new Document({
  creator: 'Dunai Osztály',
  title: 'AlApp - Felhasználói Útmutató',
  description: 'Dunai Osztály Állományi Alkalmazás használati útmutatója',
  styles: {
    default: {
      heading1: {
        run: { size: 32, bold: true, color: '2563eb' },
        paragraph: { spacing: { before: 400, after: 200 } },
      },
      heading2: {
        run: { size: 26, bold: true, color: '334155' },
        paragraph: { spacing: { before: 300, after: 150 } },
      },
      heading3: {
        run: { size: 22, bold: true, color: '64748b' },
        paragraph: { spacing: { before: 200, after: 100 } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: content,
    },
  ],
});

// Generate the document
const outputPath = path.join(process.cwd(), 'FELHASZNALOI_UTMUTATO.docx');

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ DOCX dokumentum elkészült: ${outputPath}`);
  console.log('\nMost konvertáljuk PDF-re...');
});
