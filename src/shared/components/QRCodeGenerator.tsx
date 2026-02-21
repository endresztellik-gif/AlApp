import { QRCodeSVG } from 'qrcode.react';
import { useRef } from 'react';
import { Download } from 'lucide-react';

interface Props {
    url: string;
    filename?: string;
}

export function QRCodeGenerator({ url, filename = 'qr-code.svg' }: Props) {
    const qrRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        if (!qrRef.current) return;
        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            if (ctx) {
                // Draw white background
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                // Draw SVG
                ctx.drawImage(img, 0, 0);

                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = filename.replace('.svg', '.png');
                downloadLink.href = `${pngFile}`;
                downloadLink.click();
            }
        };

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-2xl border border-border">
            <div
                ref={qrRef}
                className="p-3 bg-white border-2 border-slate-100 rounded-xl shadow-sm"
            >
                <QRCodeSVG
                    value={url}
                    size={200}
                    level="H" // High error correction
                    includeMargin={true}
                    fgColor="#0f172a" // slate-900
                />
            </div>

            <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
            >
                <Download className="w-4 h-4" /> Letöltés PNG-ként
            </button>
            <p className="text-[11px] text-muted-foreground text-center max-w-[200px]">
                Nyomtasd ki ezt a kódot és ragaszd fel az eszközre a gyors bejelentésekhez.
            </p>
        </div>
    );
}
