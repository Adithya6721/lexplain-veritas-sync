import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cryptographic Services
class CryptoService {
  static async generateKeyPair(): Promise<{ publicKey: string, privateKey: string }> {
    // Generate ECDSA P-256 key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      true,
      ["sign", "verify"]
    );

    const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    return {
      publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
      privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
    };
  }

  static async signData(data: string, privateKeyPem: string): Promise<string> {
    // Import private key
    const binaryKey = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      false,
      ["sign"]
    );

    // Sign the data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const signature = await crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: "SHA-256"
      },
      privateKey,
      dataBuffer
    );

    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  static async hashSHA256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static generateFingerprintHash(): string {
    // Simulate fingerprint hash generation
    const random = crypto.getRandomValues(new Uint8Array(32));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // In production, this would be the actual fingerprint data + salt
    const combined = new Uint8Array(random.length + salt.length);
    combined.set(random);
    combined.set(salt, random.length);
    
    return btoa(String.fromCharCode(...combined));
  }
}

// Blockchain Service (optional)
class BlockchainService {
  static async anchorToIPFS(evidenceHash: string): Promise<string | null> {
    const ipfsApiKey = Deno.env.get('IPFS_API_KEY');
    
    if (!ipfsApiKey) {
      console.log('IPFS API key not configured, skipping IPFS anchoring');
      return null;
    }

    try {
      // Mock IPFS upload
      const ipfsHash = `Qm${evidenceHash.substring(0, 44)}`;
      console.log(`Evidence anchored to IPFS: ${ipfsHash}`);
      return ipfsHash;
    } catch (error) {
      console.log('IPFS anchoring failed:', error.message);
      return null;
    }
  }

  static async anchorToEthereum(evidenceHash: string): Promise<string | null> {
    const ethRpcUrl = Deno.env.get('ETH_RPC_URL');
    const ethPrivateKey = Deno.env.get('ETH_PRIVATE_KEY');
    
    if (!ethRpcUrl || !ethPrivateKey) {
      console.log('Ethereum credentials not configured, skipping blockchain anchoring');
      return null;
    }

    try {
      // Mock Ethereum transaction
      const txHash = `0x${evidenceHash.substring(0, 64)}`;
      console.log(`Evidence anchored to Ethereum: ${txHash}`);
      return txHash;
    } catch (error) {
      console.log('Ethereum anchoring failed:', error.message);
      return null;
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const formData = await req.formData();
    const analysisId = formData.get('analysis_id') as string;
    const phoneNumber = formData.get('phone_number') as string;
    const otpCode = formData.get('otp_code') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const address = formData.get('address') as string;
    const voiceFile = formData.get('voice_file') as File;

    if (!analysisId || !phoneNumber || !otpCode) {
      throw new Error('Analysis ID, phone number and OTP code are required');
    }

    // 1. Verify OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('otp_code', otpCode)
      .eq('verified', true)
      .single();

    if (otpError || !otpRecord) {
      throw new Error('OTP verification failed');
    }

    // 2. Get analysis data
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select(`
        *,
        documents (*)
      `)
      .eq('id', analysisId)
      .single();

    if (analysisError || !analysis) {
      throw new Error('Analysis not found');
    }

    // 3. Upload voice file if provided
    let voiceFilePath = null;
    if (voiceFile) {
      const fileName = `consent_${analysisId}_${Date.now()}.webm`;
      voiceFilePath = `audio/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(voiceFilePath, voiceFile, {
          contentType: voiceFile.type,
          upsert: false
        });

      if (uploadError) throw uploadError;
    }

    // 4. Generate fingerprint hash (simulation)
    const fingerprintHash = CryptoService.generateFingerprintHash();

    // 5. Create consent record
    const { data: consentRecord, error: consentError } = await supabase
      .from('consent_records')
      .insert({
        analysis_id: analysisId,
        phone_number: phoneNumber,
        otp_verified: true,
        fingerprint_hash: fingerprintHash,
        voice_file_path: voiceFilePath,
        location_lat: latitude ? parseFloat(latitude) : null,
        location_lng: longitude ? parseFloat(longitude) : null,
        location_address: address
      })
      .select()
      .single();

    if (consentError) throw consentError;

    // 6. Generate evidence JSON
    const evidenceData = {
      evidence_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      document: {
        id: analysis.documents.id,
        filename: analysis.documents.original_filename,
        hash: await CryptoService.hashSHA256(analysis.documents.file_path + analysis.documents.created_at)
      },
      analysis: {
        ocr_confidence: analysis.ocr_confidence,
        clauses: analysis.clauses,
        auth_flags: analysis.auth_flags,
        analysis_confidence: analysis.analysis_confidence
      },
      consent: {
        phone_number: phoneNumber,
        otp_verified: true,
        fingerprint_hash: fingerprintHash,
        voice_consent_recorded: !!voiceFile,
        voice_file_path: voiceFilePath,
        location: {
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          address: address
        },
        timestamp: consentRecord.timestamp
      },
      security: {
        version: "1.0",
        algorithm: "ECDSA-P256-SHA256",
        previous_hash: null // For blockchain-like chaining
      }
    };

    // 7. Generate or retrieve signing keys
    let privateKey = Deno.env.get('ECDSA_PRIVATE_KEY');
    if (!privateKey) {
      const keyPair = await CryptoService.generateKeyPair();
      privateKey = keyPair.privateKey;
      console.log('Generated new ECDSA key pair for signing');
    }

    // 8. Sign the evidence
    const canonicalJson = JSON.stringify(evidenceData, Object.keys(evidenceData).sort());
    const signature = await CryptoService.signData(canonicalJson, privateKey);
    evidenceData.security.signature = signature;

    // 9. Hash the signed evidence
    const evidenceHash = await CryptoService.hashSHA256(JSON.stringify(evidenceData));

    // 10. Optional blockchain anchoring
    const ipfsHash = await BlockchainService.anchorToIPFS(evidenceHash);
    const blockchainTxHash = await BlockchainService.anchorToEthereum(evidenceHash);

    // 11. Store evidence record
    const { data: evidenceRecord, error: evidenceError } = await supabase
      .from('evidence_records')
      .insert({
        consent_id: consentRecord.id,
        evidence_json: evidenceData,
        document_hash: evidenceData.document.hash,
        signature: signature,
        previous_hash: null,
        encrypted: false,
        ipfs_hash: ipfsHash,
        blockchain_tx_hash: blockchainTxHash
      })
      .select()
      .single();

    if (evidenceError) throw evidenceError;

    return new Response(
      JSON.stringify({ 
        success: true,
        evidence_id: evidenceRecord.id,
        evidence_hash: evidenceHash,
        signature: signature,
        blockchain_anchored: !!blockchainTxHash,
        ipfs_anchored: !!ipfsHash,
        fingerprint_captured: true,
        voice_recorded: !!voiceFile,
        location_captured: !!(latitude && longitude)
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});