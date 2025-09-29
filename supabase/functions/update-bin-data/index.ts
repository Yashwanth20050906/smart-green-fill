import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BinData {
  bin_type: string;
  distance_cm: number;
  bin_height_cm?: number;
}

function calculateFillLevel(distance: number, binHeight: number = 30): number {
  const fillLevel = Math.max(0, Math.min(100, ((binHeight - distance) / binHeight) * 100));
  return Math.round(fillLevel * 100) / 100; // Round to 2 decimal places
}

function determineBinStatus(fillLevel: number): string {
  if (fillLevel <= 10) return 'empty';
  if (fillLevel <= 30) return 'low';
  if (fillLevel <= 60) return 'medium';
  if (fillLevel <= 85) return 'high';
  return 'full';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { bin_type, distance_cm, bin_height_cm = 30 }: BinData = await req.json();

      // Validate input
      if (!bin_type || !['dry', 'wet', 'metal'].includes(bin_type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid bin_type. Must be dry, wet, or metal' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (typeof distance_cm !== 'number' || distance_cm < 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid distance_cm. Must be a positive number' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const fill_level = calculateFillLevel(distance_cm, bin_height_cm);
      const status = determineBinStatus(fill_level);

      // Update or insert bin data
      const { data, error } = await supabaseClient
        .from('bins')
        .upsert({
          bin_type,
          fill_level,
          status,
          distance_cm,
          bin_height_cm,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'bin_type'
        })
        .select();

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update bin data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: data[0],
          message: `${bin_type} bin updated: ${fill_level}% full (${status})`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET request - return all bins data
    if (req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('bins')
        .select('*')
        .order('bin_type');

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch bin data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});