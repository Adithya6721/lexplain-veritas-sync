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

    // Extract analysis ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const analysisId = pathParts[pathParts.length - 1];

    if (!analysisId) {
      throw new Error('Analysis ID is required');
    }

    // Get analysis with document info
    const { data: analysis, error } = await supabase
      .from('analyses')
      .select(`
        *,
        documents (
          id,
          original_filename,
          status,
          created_at
        )
      `)
      .eq('id', analysisId)
      .single();

    if (error) throw error;

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    // Format response
    const response = {
      id: analysis.id,
      document: {
        id: analysis.documents.id,
        filename: analysis.documents.original_filename,
        status: analysis.documents.status,
        created_at: analysis.documents.created_at
      },
      ocr_text: analysis.ocr_text,
      ocr_confidence: analysis.ocr_confidence,
      clauses: analysis.clauses || [],
      auth_flags: analysis.auth_flags || {},
      translation_hi: analysis.translation_hi,
      tts_audio_url: analysis.tts_audio_path ? 
        `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/audio/${analysis.tts_audio_path}` : null,
      analysis_confidence: analysis.analysis_confidence,
      created_at: analysis.created_at,
      processing_steps: [
        { 
          step: 1, 
          name: 'Document Upload', 
          status: 'completed',
          description: 'Document successfully uploaded to secure storage'
        },
        { 
          step: 2, 
          name: 'Image Preprocessing', 
          status: 'completed',
          description: 'Image enhanced for better OCR accuracy'
        },
        { 
          step: 3, 
          name: 'OCR Processing', 
          status: 'completed',
          description: `Text extracted with ${Math.round((analysis.ocr_confidence || 0) * 100)}% confidence`
        },
        { 
          step: 4, 
          name: 'Authentication Check', 
          status: 'completed',
          description: `QR/Barcode verification: ${analysis.auth_flags?.qr_present ? 'Found' : 'Not found'}`
        },
        { 
          step: 5, 
          name: 'Clause Extraction', 
          status: 'completed',
          description: `${analysis.clauses?.length || 0} legal clauses identified and analyzed`
        },
        { 
          step: 6, 
          name: 'Translation & TTS', 
          status: analysis.translation_hi ? 'completed' : 'skipped',
          description: analysis.translation_hi ? 'Hindi translation and audio generated' : 'No translation needed'
        }
      ]
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