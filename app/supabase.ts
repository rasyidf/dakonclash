import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vbzblzznemqjdbqpenbi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiemJsenpuZW1xamRicXBlbmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxNzg5MjgsImV4cCI6MjA1Mjc1NDkyOH0.Yt07gc1G-0yp68UWCwINqtvpIRSHJvpNY-OPNbljiDY';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;