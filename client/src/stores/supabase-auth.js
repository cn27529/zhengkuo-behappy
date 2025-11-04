// src/stores/supabase-auth.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "../config/supabase";

export const useSupabaseAuthStore = defineStore("supabaseAuth", () => {
  const user = ref(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(false);

  const lastActivity = ref(null);
  let inactivityTimer = null;
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15分鐘自動登出

  // 重置閒置計時器
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    inactivityTimer = setTimeout(() => {
      console.log("閒置超時，自動登出");
      forceLogout();
    }, INACTIVITY_TIMEOUT);

    lastActivity.value = Date.now();
  };

  // 設置活動監聽器
  const setupActivityListeners = () => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      document.addEventListener(event, resetInactivityTimer, true);
    });
  };

  // 強制登出
  const forceLogout = async () => {
    await supabase.auth.signOut();
    user.value = null;
    isAuthenticated.value = false;

    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    //sessionStorage.removeItem("supabase-auth-user");
    sessionStorage.removeItem("supabase-auth-user");

    console.log("因閒置超時自動登出");
  };

  // 郵箱/密碼登入
  const loginWithEmail = async (email, password) => {
    isLoading.value = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await setUserSession(data.user);
        return {
          success: true,
          message: "登入成功！",
          user: user.value,
        };
      }
    } catch (error) {
      console.error("Supabase 登入錯誤:", error);
      return {
        success: false,
        message: error.message || "登入失敗，請檢查您的憑證",
      };
    } finally {
      isLoading.value = false;
    }
  };

  // 第三方登入
  const loginWithOAuth = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error(`${provider} 登入錯誤:`, error);
      return {
        success: false,
        message: `${provider} 登入失敗: ${error.message}`,
      };
    }
  };

  // 重設密碼
  const resetPassword = async (email) => {
    isLoading.value = true;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return {
        success: true,
        message: "重設密碼郵件已發送，請檢查您的郵箱",
      };
    } catch (error) {
      console.error("重設密碼錯誤:", error);
      return {
        success: false,
        message: error.message || "發送重設密碼郵件失敗",
      };
    } finally {
      isLoading.value = false;
    }
  };

  // 設置用戶會話
  const setUserSession = async (supabaseUser) => {
    const userInfo = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username: supabaseUser.email.split("@")[0],
      displayName:
        supabaseUser.user_metadata?.name || supabaseUser.email.split("@")[0],
      role: supabaseUser.user_metadata?.role || "user",
      permissions: supabaseUser.user_metadata?.permissions || ["read"],
      avatar: supabaseUser.user_metadata?.avatar_url,
    };

    user.value = userInfo;
    isAuthenticated.value = true;

    // sessionStorage（關閉瀏覽器就登出）
    sessionStorage.setItem("supabase-auth-user", JSON.stringify(userInfo));
    //sessionStorage.setItem("supabase-auth-user", JSON.stringify(userInfo));

    // 可選：保存到localStorage
    //sessionStorage.setItem("auth-user", JSON.stringify(userInfo));

    resetInactivityTimer();
    setupActivityListeners();

    console.log("Supabase 用戶登入成功:", userInfo.displayName);
  };

  // 登出
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Supabase 登出錯誤:", error);
    } finally {
      user.value = null;
      isAuthenticated.value = false;

      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }

      sessionStorage.removeItem("supabase-auth-user");
      //sessionStorage.removeItem("supabase-auth-user");

      console.log("Supabase 用戶已退出登入");
    }
  };

  // 初始化認證狀態
  const initializeAuth = async () => {
    try {
      // 獲取當前會話
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await setUserSession(session.user);
        return;
      }

      // 檢查本地存儲的用戶信息
      //const savedUser = sessionStorage.getItem("supabase-auth-user");
      const savedUser = sessionStorage.getItem("supabase-auth-user");

      if (savedUser) {
        try {
          const userInfo = JSON.parse(savedUser);
          user.value = userInfo;
          isAuthenticated.value = true;

          resetInactivityTimer();
          setupActivityListeners();

          console.log(
            "Supabase auth store 從本地存儲恢復用戶會話:",
            userInfo.displayName
          );
        } catch (error) {
          console.error("Supabase auth store 解析保存的用戶數據失敗:", error);
          await logout();
        }
      }
    } catch (error) {
      console.error("Supabase auth 初始化錯誤:", error);
    }
  };

  // 檢查用戶權限
  const hasPermission = (permission) => {
    if (!user.value || !user.value.permissions) return false;
    return user.value.permissions.includes(permission);
  };

  // 檢查用戶角色
  const hasRole = (role) => {
    if (!user.value) return false;
    return user.value.role === role;
  };

  // 監聽認證狀態變化
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Supabase 認證狀態變化:", event, session);

    if (event === "SIGNED_IN" && session?.user) {
      await setUserSession(session.user);
    } else if (event === "SIGNED_OUT") {
      user.value = null;
      isAuthenticated.value = false;
      //sessionStorage.removeItem("supabase-auth-user");
      sessionStorage.removeItem("supabase-auth-user");
    }
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    loginWithEmail,
    loginWithOAuth,
    resetPassword,
    logout,
    hasPermission,
    hasRole,
    initializeAuth,
    resetInactivityTimer,
  };
});
