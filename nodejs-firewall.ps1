# 需要以管理員權限執行
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "請以管理員身份執行此腳本！" -ForegroundColor Red
    exit 1
}

# 檢查是否已存在相同規則
$existingRule = Get-NetFirewallRule | Where-Object { $_.DisplayName -eq "Node.js Outbound Allow" }
if ($existingRule) {
    Write-Host "規則已存在，跳過..." -ForegroundColor Yellow
} else {
    # 常見的 Node.js 安裝路徑
    $nodePaths = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe",
        "$env:APPDATA\npm\node.exe",
        "$env:ProgramFiles\nodejs\node.exe"
    )
    
    $nodePath = $nodePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    
    if ($nodePath) {
        New-NetFirewallRule -DisplayName "Node.js Outbound Allow" `
            -Direction Outbound `
            -Program $nodePath `
            -Action Allow `
            -Profile Any `
            -Description "允許 Node.js 外部連線（給 Directus 使用）"
        
        Write-Host "✅ 防火牆規則新增成功！" -ForegroundColor Green
        Write-Host "Node.js 路徑：$nodePath"
    } else {
        Write-Host "❌ 找不到 Node.js，請先安裝 Node.js" -ForegroundColor Red
    }
}

# 暫停讓使用者看到結果
Read-Host "按 Enter 結束"