"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Em preview/local sem Supabase configurado, o cliente fica indisponível e o
// tracking vira no-op silencioso — a apresentação nunca deve travar por isso.
export const supabase = url && key ? createClient(url, key) : null;
