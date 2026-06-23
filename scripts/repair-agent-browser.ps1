[CmdletBinding()]
param(
  [int]$Port = 9223,
  [string]$Url = "http://localhost:3000",
  [string]$ChromePath = "",
  [string]$ProfilePath = "",
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

$agentBrowserCommand = if ($env:OS -eq "Windows_NT") { "agent-browser.cmd" } else { "agent-browser" }

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
    & $script:agentBrowserCommand close --all | Out-Null
  } catch {
    # Stale daemons often fail to close cleanly; process cleanup below handles them.
  }

  $agentBrowserChromeRoot = Join-Path $env:USERPROFILE ".agent-browser\browsers"
  $agentBrowserCliName = "agent-browser-win32-x64.exe"

  for ($attempt = 0; $attempt -lt 5; $attempt++) {
    try {
      $targets = Get-CimInstance Win32_Process | Where-Object {
        $_.Name -eq $agentBrowserCliName -or
        ($_.ExecutablePath -like "$agentBrowserChromeRoot*") -or
        ($_.Name -eq "chrome.exe" -and $_.CommandLine -like "*agent-browser-chrome*") -or
        ($ProfilePrefix -and $_.Name -eq "chrome.exe" -and $_.CommandLine -like "*$ProfilePrefix*")
      }
    } catch {
      Write-Warning "Could not inspect process command lines through CIM: $($_.Exception.Message). Falling back to process path cleanup."
      $targets = Get-Process chrome,agent-browser-win32-x64 -ErrorAction SilentlyContinue | Where-Object {
        $_.ProcessName -eq "agent-browser-win32-x64" -or
        ($_.Path -and $_.Path -like "$agentBrowserChromeRoot*")
      } | ForEach-Object {
        [pscustomobject]@{
          ProcessId = $_.Id
        }
      }
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

  for ($attempt = 0; $attempt -lt 90; $attempt++) {
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

function Invoke-AgentBrowserWithTimeout {
  param(
    [string[]]$CommandArgs,
    [int]$TimeoutSeconds = 20
  )

  $process = Start-Process -FilePath $script:agentBrowserCommand -ArgumentList $CommandArgs -PassThru -WindowStyle Hidden

  try {
    $completed = Wait-Process -Id $process.Id -Timeout $TimeoutSeconds -ErrorAction SilentlyContinue
    if (-not $completed) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
      return 124
    }

    return $process.ExitCode
  } finally {
    if (-not $process.HasExited) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
  }
}

$chrome = Get-AgentBrowserChromePath -RequestedPath $ChromePath

if (-not $ProfilePath) {
  $ProfilePath = Join-Path $env:TEMP "agent-browser-cdp-elysia-$Port-$PID"
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

$connectExitCode = Invoke-AgentBrowserWithTimeout -CommandArgs @("connect", "http://127.0.0.1:$Port") -TimeoutSeconds 20
if ($connectExitCode -ne 0) {
  throw "agent-browser failed to connect to CDP port $Port."
}

if (-not $NoOpen) {
  $openExitCode = Invoke-AgentBrowserWithTimeout -CommandArgs @("open", $Url) -TimeoutSeconds 20
  if ($openExitCode -ne 0) {
    throw "agent-browser connected, but failed to open $Url."
  }

  $waitExitCode = Invoke-AgentBrowserWithTimeout -CommandArgs @("wait", "--load", "networkidle") -TimeoutSeconds 30
  if ($waitExitCode -ne 0) {
    throw "agent-browser connected and opened $Url, but the page did not become network-idle."
  }
}

Write-Output "agent-browser is connected through CDP on port $Port."
Write-Output "Use normal commands now, for example: agent-browser snapshot -i"
