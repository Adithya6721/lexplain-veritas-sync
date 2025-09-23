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

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { document_id } = await req.json();

    if (!document_id) {
      throw new Error('No document_id provided');
    }

    // Fetch analysis data
    const { data: analysisData, error: analysisError } = await supabase
      .from('analyses')
      .select(`
        *,
        documents!inner(*)
      `)
      .eq('document_id', document_id)
      .single();

    if (analysisError && analysisError.code !== 'PGRST116') {
      throw analysisError;
    }

    // If no analysis found, return empty result
    if (!analysisData) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Analysis not found or still processing'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Format response
    const response = {
      success: true,
      id: analysisData.id,
      document_id: analysisData.document_id,
      ocr_text: analysisData.ocr_text,
      ocr_confidence: analysisData.ocr_confidence,
      clauses: analysisData.clauses || [],
      auth_flags: analysisData.auth_flags || {},
      tts_audio_path: analysisData.tts_audio_path,
      translation_hi: analysisData.translation_hi,
      analysis_confidence: analysisData.analysis_confidence,
      created_at: analysisData.created_at
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
    console.error('Get analysis error:', error);
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