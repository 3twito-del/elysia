[CmdletBinding()]
param(
  [string]$BaseUrl = $(if ($env:SMOKE_BASE_URL) { $env:SMOKE_BASE_URL } else { "http://localhost:3000" }),
  [int]$Port = 9224,
  [string[]]$Routes = @(
    "/",
    "/search",
    "/search?q=zzzz-no-match&maxPrice=1",
    "/category/earrings",
    "/checkout",
    "/account",
    "/product/venus-line-ring",
    "/admin/login",
    "/admin"
  ),
  [string]$ProfilePath = $(Join-Path $env:TEMP "agent-browser-cdp-aphrodite-$Port"),
  [switch]$NoScreenshot,
  [switch]$KeepOpen
)

$ErrorActionPreference = "Stop"

function Invoke-AgentBrowser {
  param([string[]]$CommandArgs)

  $output = & agent-browser @CommandArgs 2>&1
  if ($LASTEXITCODE -ne 0) {
    $message = ($output | Out-String).Trim()
    throw "agent-browser $($CommandArgs -join ' ') failed. $message"
  }

  return ($output | Out-String).Trim()
}

function Normalize-EvalResult {
  param([string]$Value)

  return $Value.Trim().Trim('"')
}

function Test-AgentBrowserReady {
  try {
    Invoke-AgentBrowser -CommandArgs @("get", "url") | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Ensure-AgentBrowserReady {
  $repairScript = Join-Path $PSScriptRoot "repair-agent-browser.ps1"
  if (-not (Test-Path -LiteralPath $repairScript)) {
    throw "agent-browser is not ready and $repairScript was not found."
  }

  & $repairScript -Port $Port -Url $BaseUrl -ProfilePath $ProfilePath

  if (Test-AgentBrowserReady) {
    return
  }

  throw "agent-browser is still not ready after repair."
}

function Stop-CdpProfileProcesses {
  param([string]$TargetProfilePath)

  if (-not $TargetProfilePath) {
    return
  }

  $targets = Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq "chrome.exe" -and $_.CommandLine -like "*$TargetProfilePath*"
  }

  foreach ($target in $targets) {
    Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue
  }
}

function Join-RouteUrl {
  param(
    [string]$Root,
    [string]$Route
  )

  $trimmedRoot = $Root.TrimEnd("/")
  if ($Route.StartsWith("/")) {
    return "$trimmedRoot$Route"
  }

  return "$trimmedRoot/$Route"
}

$results = New-Object System.Collections.Generic.List[object]
$failures = New-Object System.Collections.Generic.List[string]

try {
  Ensure-AgentBrowserReady

  for ($index = 0; $index -lt $Routes.Count; $index++) {
    $route = $Routes[$index]
    $url = Join-RouteUrl -Root $BaseUrl -Route $route

    Invoke-AgentBrowser -CommandArgs @("open", $url) | Out-Null
    Invoke-AgentBrowser -CommandArgs @("wait", "--load", "networkidle") | Out-Null

    $content = Normalize-EvalResult (Invoke-AgentBrowser -CommandArgs @(
      "eval",
      "document.body.innerText.trim().length > 0 ? 'HAS_CONTENT' : 'BLANK'"
    ))

    $overlay = Normalize-EvalResult (Invoke-AgentBrowser -CommandArgs @(
      "eval",
      "document.querySelector('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay') ? 'ERROR_OVERLAY' : 'OK'"
    ))

    $overflow = Normalize-EvalResult (Invoke-AgentBrowser -CommandArgs @(
      "eval",
      "document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 ? 'NO_X_OVERFLOW' : 'X_OVERFLOW'"
    ))

    $title = Invoke-AgentBrowser -CommandArgs @("get", "title")

    if ($index -eq 0 -and -not $NoScreenshot) {
      $screenshotOutput = Invoke-AgentBrowser -CommandArgs @("screenshot", "--annotate")
      Write-Output $screenshotOutput
    }

    $isPass = $content -eq "HAS_CONTENT" -and $overlay -eq "OK" -and $overflow -eq "NO_X_OVERFLOW"
    if (-not $isPass) {
      $failures.Add("$route content=$content overlay=$overlay overflow=$overflow") | Out-Null
    }

    $results.Add([pscustomobject]@{
      Route = $route
      Content = $content
      Overlay = $overlay
      Overflow = $overflow
      Title = $title
      Status = $(if ($isPass) { "PASS" } else { "FAIL" })
    }) | Out-Null
  }
}
finally {
  if (-not $KeepOpen) {
    try {
      & agent-browser close --all | Out-Null
      Stop-CdpProfileProcesses -TargetProfilePath $ProfilePath
    } catch {
      Write-Warning "Failed to close agent-browser: $($_.Exception.Message)"
    }
  }
}

$results | Format-Table -AutoSize

if ($failures.Count -gt 0) {
  Write-Error "Visual QA failed: $($failures -join '; ')"
  exit 1
}

Write-Output "Visual QA passed for $($Routes.Count) route(s)."
