/**
 * 簡單的假資料接口（mock）
 * - login({username, password}) => resolves with { token }
 * - submitContact(payload) => resolves after short delay
 */

function delay(ms){ return new Promise(r=>setTimeout(r,ms)) }

export default {
  async login({username, password}) {
    await delay(600)
    // Demo credentials
    if (username === 'admin' && password === 'password') {
      return { token: 'demo-token-12345' }
    }
    const err = new Error('帳號或密碼錯誤')
    throw err
  },

  async submitContact(payload) {
    await delay(700)
    // Basic simulation: fail when message contains "fail"
    if (payload.message && payload.message.toLowerCase().includes('fail')) {
      throw new Error('伺服器模擬錯誤：內容包含禁止字')
    }
    // success - echo back
    return { ok:true, received: payload }
  }
}
