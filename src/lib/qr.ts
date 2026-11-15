import QRCode from "qrcode";

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 520,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#10241b", light: "#ffffff" },
  });
}
