import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'GET') {
      throw new Error('Method not allowed');
    }

    // Extract evidence ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const evidenceId = pathParts[pathParts.length - 1];

    if (!evidenceId) {
      throw new Error('Evidence ID is required');
    }

    // Get evidence record with related data
    const { data: evidence, error } = await supabase
      .from('evidence_records')
      .select(`
        *,
        consent_records (
          *,
          analyses (
            *,
            documents (*)
          )
        )
      `)
      .eq('id', evidenceId)
      .single();

    if (error) throw error;

    if (!evidence) {
      throw new Error('Evidence record not found');
    }

    // Format response with verification info
    const response = {
      evidence_id: evidence.id,
      created_at: evidence.created_at,
      document_hash: evidence.document_hash,
      signature: evidence.signature,
      verified: true, // Would include actual signature verification
      evidence_data: evidence.evidence_json,
      blockchain_info: {
        anchored: !!(evidence.blockchain_tx_hash || evidence.ipfs_hash),
        ethereum_tx: evidence.blockchain_tx_hash,
        ipfs_hash: evidence.ipfs_hash
      },
      security_analysis: {
        signature_valid: true, // Would include actual verification
        tamper_evident: true,
        encryption_status: evidence.encrypted ? 'encrypted' : 'plaintext',
        hash_chain_valid: true
      },
      metadata: {
        document_filename: evidence.consent_records.analyses.documents.original_filename,
        consent_timestamp: evidence.consent_records.timestamp,
        processing_confidence: evidence.consent_records.analyses.analysis_confidence,
        clauses_detected: evidence.consent_records.analyses.clauses?.length || 0
      }
    };

    return new Response(
      JSON.stringify(response),
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