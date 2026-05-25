[CmdletBinding()]
param(
  [string]$BaseUrl = $(if ($env:SMOKE_BASE_URL) { $env:SMOKE_BASE_URL } else { "http://localhost:3000" }),
  [int]$Port = 9224,
  [string[]]$Routes = @(
    ""
  ),
  [string[]]$Viewports = @("desktop:1440x900", "tablet:768x1024", "mobile:390x844"),
  [string]$ArtifactDir = "",
  [string]$ProfilePath = $(Join-Path $env:TEMP "agent-browser-cdp-elysia-$Port"),
  [switch]$AllProducts,
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

function New-QAArtifactDir {
  $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ssZ")
  $path = Join-Path (Get-Location) "artifacts\qa\$timestamp-agent-browser"
  New-Item -ItemType Directory -Path $path -Force | Out-Null
  return $path
}

function Get-InventoryRoutes {
  $args = @("exec", "tsx", "scripts/qa-route-inventory.ts", "--visual-routes")
  if ($AllProducts) {
    $args += "--all-products"
  }

  $output = & pnpm @args 2>&1
  if ($LASTEXITCODE -ne 0) {
    $message = ($output | Out-String).Trim()
    throw "Failed to load QA route inventory. $message"
  }

  return @($output | Where-Object { $_ -and $_.Trim().Length -gt 0 })
}

function Parse-Viewport {
  param([string]$Value)

  $parts = $Value.Split(":", 2)
  if ($parts.Count -ne 2 -or $parts[1] -notmatch "^(\d+)x(\d+)$") {
    throw "Invalid viewport '$Value'. Expected name:WIDTHxHEIGHT."
  }

  return [pscustomobject]@{
    Name = $parts[0]
    Width = [int]$Matches[1]
    Height = [int]$Matches[2]
  }
}

$explicitRoutes = @($Routes | Where-Object { $_ -and $_.Trim().Length -gt 0 })
if ($explicitRoutes.Count -eq 0) {
  $Routes = Get-InventoryRoutes
}

if (-not $ArtifactDir) {
  $ArtifactDir = New-QAArtifactDir
} else {
  New-Item -ItemType Directory -Path $ArtifactDir -Force | Out-Null
}

$screenshotDir = Join-Path $ArtifactDir "agent-browser-screenshots"
New-Item -ItemType Directory -Path $screenshotDir -Force | Out-Null

$results = New-Object System.Collections.Generic.List[object]
$failures = New-Object System.Collections.Generic.List[string]

try {
  Ensure-AgentBrowserReady

  foreach ($viewportValue in $Viewports) {
    $viewport = Parse-Viewport -Value $viewportValue
    Invoke-AgentBrowser -CommandArgs @("set", "viewport", "$($viewport.Width)", "$($viewport.Height)") | Out-Null
    Invoke-AgentBrowser -CommandArgs @("set", "media", "light", "reduced-motion") | Out-Null

    for ($index = 0; $index -lt $Routes.Count; $index++) {
      $route = $Routes[$index]
      $url = Join-RouteUrl -Root $BaseUrl -Route $route

      for ($routeAttempt = 1; $routeAttempt -le 2; $routeAttempt++) {
        try {
          Invoke-AgentBrowser -CommandArgs @("console", "--clear") | Out-Null
          Invoke-AgentBrowser -CommandArgs @("errors", "--clear") | Out-Null
          Invoke-AgentBrowser -CommandArgs @("network", "requests", "--clear") | Out-Null
          Invoke-AgentBrowser -CommandArgs @("open", $url) | Out-Null
          Invoke-AgentBrowser -CommandArgs @("wait", "--load", "networkidle") | Out-Null

          $content = Normalize-EvalResult (Invoke-AgentBrowser -CommandArgs @(
            "eval",
            "document.body.innerText.trim().length > 0 ? 'HAS_CONTENT' : 'BLANK'"
          ))

          $overlay = Normalize-EvalResult (Invoke-AgentBrowser -CommandArgs @(
            "eval",
            "document.querySelector('[data-nextjs-dialog], [data-nextjs-dialog-overlay], [data-nextjs-error-overlay], .vite-error-overlay, #webpack-dev-server-client-overlay') ? 'ERROR_OVERLAY' : 'OK'"
          ))

          $overflow = Normalize-EvalResult (Invoke-AgentBrowser -CommandArgs @(
            "eval",
            "document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 ? 'NO_X_OVERFLOW' : 'X_OVERFLOW'"
          ))

          $brokenImages = Normalize-EvalResult (Invoke-AgentBrowser -CommandArgs @(
            "eval",
            "String(Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0).length)"
          ))

          $consoleErrors = Invoke-AgentBrowser -CommandArgs @("errors")
          $title = Invoke-AgentBrowser -CommandArgs @("get", "title")

          $isPass = $content -eq "HAS_CONTENT" -and $overlay -eq "OK" -and $overflow -eq "NO_X_OVERFLOW" -and $brokenImages -eq "0" -and (-not $consoleErrors)
          $screenshotPath = ""

          if (-not $NoScreenshot -and (-not $isPass -or ($index -eq 0 -and $viewport.Name -eq "desktop"))) {
            $safeRoute = ($route -replace "[^a-zA-Z0-9._-]+", "-").Trim("-")
            if (-not $safeRoute) {
              $safeRoute = "home"
            }
            $screenshotPath = Join-Path $screenshotDir "$($viewport.Name)-$safeRoute.png"
            Invoke-AgentBrowser -CommandArgs @("screenshot", "--full", $screenshotPath) | Out-Null
          }

          if (-not $isPass) {
            $failures.Add("$($viewport.Name) $route content=$content overlay=$overlay overflow=$overflow brokenImages=$brokenImages errors=$consoleErrors") | Out-Null
          }

          $results.Add([pscustomobject]@{
            Viewport = $viewport.Name
            Route = $route
            Content = $content
            Overlay = $overlay
            Overflow = $overflow
            BrokenImages = $brokenImages
            Errors = $consoleErrors
            Title = $title
            Screenshot = $screenshotPath
            Status = $(if ($isPass) { "PASS" } else { "FAIL" })
          }) | Out-Null

          break
        } catch {
          if ($routeAttempt -ge 2) {
            throw
          }

          Write-Warning "Retrying visual QA for $($viewport.Name) $route after agent-browser failure: $($_.Exception.Message)"
          Ensure-AgentBrowserReady
        }
      }
    }
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

$results | ConvertTo-Json -Depth 4 | Out-File -FilePath (Join-Path $ArtifactDir "agent-browser-visual-qa.json") -Encoding utf8
$results | Format-Table -AutoSize

if ($failures.Count -gt 0) {
  Write-Error "Visual QA failed: $($failures -join '; ')"
  exit 1
}

Write-Output "Visual QA passed for $($Routes.Count) route(s) across $($Viewports.Count) viewport(s). Artifacts: $ArtifactDir"
