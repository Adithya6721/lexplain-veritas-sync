import React, { useState } from "react";
// Ensure html5-qrcode is installed and available
// npm install html5-qrcode

export function QRCodeVerifier() {
  const [result, setResult] = useState("");
  const [verified, setVerified] = useState<{ authentic: boolean; message: string } | null>(null);

  React.useEffect(() => {
    let scanner: any;
    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: 250 },
        false
      );
      scanner.render(
        async (decodedText: string) => {
          setResult(decodedText);
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-authenticity`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ codeData: decodedText }),
            }
          );
          const data = await res.json();
          setVerified(data);
          scanner.clear();
        },
        () => {}
      );
    });
    return () => scanner?.clear?.();
  }, []);

  return (
    <div>
      <div id="qr-reader" />
      {verified && <div><p>{verified.message}</p></div>}
    </div>
  );
}