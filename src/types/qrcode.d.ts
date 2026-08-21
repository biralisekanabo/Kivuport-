declare module "qrcode" {
  type QrCodeOptions = {
    type?: string;
    width?: number;
    margin?: number;
  };

  const QRCode: {
    toBuffer(text: string, options?: QrCodeOptions): Promise<Buffer>;
  };

  export default QRCode;
}
