// src/config/supabase.js
import { createClient } from "@supabase/supabase-js";

// 这些变量会自动被 Vite 注入
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 检查环境变量是否設置
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase 环境变量未設置！");
  console.log("请检查 .env 文件是否包含：");
  console.log("VITE_SUPABASE_URL=" + supabaseUrl);
  console.log("VITE_SUPABASE_ANON_KEY=" + supabaseAnonKey);
  console.log("当前使用的默认值，请尽快配置正确的环境变量");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
