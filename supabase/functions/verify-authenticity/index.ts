import { serve } from 'std/server';

serve(async (req) => {
  const { codeData } = await req.json();

  // Example: validate codeData against your records/database
  // Replace with real logic
  const isAuthentic = codeData === 'VALID_QR_OR_BARCODE';
  let message = isAuthentic ? 'Document is authentic!' : 'Document authenticity could not be verified.';

  return new Response(JSON.stringify({ authentic: isAuthentic, message }), {
    headers: { 'Content-Type': 'application/json' },
  });
});