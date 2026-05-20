[CmdletBinding()]
param(
  [int]$Port = 9223,
  [string]$Url = "http://localhost:3000",
  [string]$ChromePath = "",
  [string]$ProfilePath = "",
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

function Get-AgentBrowserChromePath {
  param([string]$RequestedPath)

  if ($RequestedPath) {
    if (-not (Test-Path -LiteralPath $RequestedPath)) {
      throw "ChromePath does not exist: $RequestedPath"
    }
    return (Resolve-Path -LiteralPath $RequestedPath).Path
  }

  $agentBrowserChrome = Get-ChildItem -Path (Join-Path $env:USERPROFILE ".agent-browser\browsers") -Filter chrome.exe -Recurse -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($agentBrowserChrome) {
    return $agentBrowserChrome.FullName
  }

  $systemChromeCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
  )

  foreach ($candidate in $systemChromeCandidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  throw "Could not find Chrome. Run 'agent-browser install' or pass -ChromePath."
}

function Stop-AgentBrowserOwnedProcesses {
  param([string]$ProfilePrefix)

  try {
    & agent-browser close --all | Out-Null
  } catch {
    # Stale daemons often fail to close cleanly; process cleanup below handles them.
  }

  $agentBrowserChromeRoot = Join-Path $env:USERPROFILE ".agent-browser\browsers"
  $agentBrowserCliName = "agent-browser-win32-x64.exe"

  for ($attempt = 0; $attempt -lt 5; $attempt++) {
    $targets = Get-CimInstance Win32_Process | Where-Object {
      $_.Name -eq $agentBrowserCliName -or
      ($_.ExecutablePath -like "$agentBrowserChromeRoot*") -or
      ($_.Name -eq "chrome.exe" -and $_.CommandLine -like "*agent-browser-chrome*") -or
      ($ProfilePrefix -and $_.Name -eq "chrome.exe" -and $_.CommandLine -like "*$ProfilePrefix*")
    }

    if (-not $targets) {
      return
    }

    foreach ($target in $targets) {
      Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue
    }

    Start-Sleep -Milliseconds 700
  }
}

function Wait-CdpReady {
  param([int]$CdpPort)

  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$CdpPort/json/version" -TimeoutSec 1
      if ($response.StatusCode -eq 200) {
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  return $false
}

$chrome = Get-AgentBrowserChromePath -RequestedPath $ChromePath

if (-not $ProfilePath) {
  $ProfilePath = Join-Path $env:TEMP "agent-browser-cdp-elysia-$Port"
}

Stop-AgentBrowserOwnedProcesses -ProfilePrefix $ProfilePath

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  throw "Port $Port is already in use by process $($listener.OwningProcess). Pass a different -Port."
}

if (-not (Test-Path -LiteralPath $ProfilePath)) {
  New-Item -ItemType Directory -Path $ProfilePath | Out-Null
}

$chromeArgs = @(
  "--remote-debugging-port=$Port",
  "--remote-allow-origins=*",
  "--headless=new",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-background-networking",
  "--disable-backgrounding-occluded-windows",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-hang-monitor",
  "--disable-popup-blocking",
  "--disable-prompt-on-repost",
  "--disable-sync",
  "--disable-features=Translate",
  "--enable-unsafe-swiftshader",
  "--user-data-dir=$ProfilePath",
  "--window-size=1280,720",
  "about:blank"
)

$process = Start-Process -FilePath $chrome -ArgumentList $chromeArgs -PassThru -WindowStyle Hidden

if (-not (Wait-CdpReady -CdpPort $Port)) {
  Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  throw "Chrome CDP did not become ready on port $Port."
}

& agent-browser connect $Port
if ($LASTEXITCODE -ne 0) {
  throw "agent-browser failed to connect to CDP port $Port."
}

if (-not $NoOpen) {
  & agent-browser open $Url
  if ($LASTEXITCODE -ne 0) {
    throw "agent-browser connected, but failed to open $Url."
  }

  & agent-browser wait --load networkidle
}

Write-Output "agent-browser is connected through CDP on port $Port."
Write-Output "Use normal commands now, for example: agent-browser snapshot -i"
