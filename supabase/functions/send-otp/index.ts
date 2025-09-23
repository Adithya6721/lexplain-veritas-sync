import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OTP Service with Twilio integration and fallback simulation
class OTPService {
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendViaTwilio(phoneNumber: string, otp: string): Promise<boolean> {
    const twilioSid = Deno.env.get('TWILIO_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = Deno.env.get('TWILIO_FROM');

    if (!twilioSid || !twilioAuthToken || !twilioFrom) {
      console.log('Twilio credentials not configured, using simulation mode');
      return false;
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioSid}:${twilioAuthToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioFrom,
            To: phoneNumber,
            Body: `Your HexaVision verification code is: ${otp}. Valid for 10 minutes.`
          })
        }
      );

      if (response.ok) {
        console.log(`OTP sent via Twilio to ${phoneNumber}`);
        return true;
      } else {
        console.log('Twilio API error, falling back to simulation');
        return false;
      }
    } catch (error) {
      console.log('Twilio request failed, using simulation mode:', error.message);
      return false;
    }
  }

  static simulateSMS(phoneNumber: string, otp: string): void {
    console.log(`=== SIMULATION MODE ===`);
    console.log(`SMS would be sent to: ${phoneNumber}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Message: "Your HexaVision verification code is: ${otp}. Valid for 10 minutes."`);
    console.log(`======================`);
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

    const { phone_number } = await req.json();

    if (!phone_number) {
      throw new Error('Phone number is required');
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(phone_number)) {
      throw new Error('Invalid phone number format');
    }

    // Generate OTP
    const otp = OTPService.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Try to send via Twilio, fallback to simulation
    const sentViaTwilio = await OTPService.sendViaTwilio(phone_number, otp);
    
    if (!sentViaTwilio) {
      // Use simulation mode
      OTPService.simulateSMS(phone_number, otp);
    }

    // Store OTP in database
    const { error: otpError } = await supabase
      .from('otp_verifications')
      .insert({
        phone_number: phone_number,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (otpError) throw otpError;

    // Clean up expired OTPs
    await supabase
      .from('otp_verifications')
      .delete()
      .lt('expires_at', new Date().toISOString());

    return new Response(
      JSON.stringify({ 
        success: true,
        message: sentViaTwilio ? 
          'OTP sent to your phone number' : 
          'OTP generated (simulation mode - check server logs)',
        simulation_mode: !sentViaTwilio,
        expires_in: 600 // 10 minutes in seconds
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