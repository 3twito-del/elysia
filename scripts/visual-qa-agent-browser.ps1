[CmdletBinding()]
param(
  [string]$BaseUrl = $(if ($env:SMOKE_BASE_URL) { $env:SMOKE_BASE_URL } else { "http://localhost:3000" }),
  [int]$Port = 9224,
  [string[]]$Routes = @(
    ""
  ),
  [string[]]$Viewports = @("desktop:1440x900", "tablet:768x1024", "mobile:390x844"),
  [string]$ArtifactDir = "",
  [string]$DeploymentId = $(if ($env:VERCEL_DEPLOYMENT_ID) { $env:VERCEL_DEPLOYMENT_ID } else { "" }),
  [string]$RouteSetName = $(if ($env:QA_ROUTE_SET_NAME) { $env:QA_ROUTE_SET_NAME } else { "representative" }),
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

function Normalize-AgentBrowserErrors {
  param([string]$Value)

  $lines = New-Object System.Collections.Generic.List[string]
  foreach ($line in ($Value -split '\r?\n|\r')) {
    $trimmed = $line.Trim()
    if (-not $trimmed) {
      continue
    }

    if ($trimmed -match '^[\p{P}\p{S}]+$') {
      continue
    }

    $lines.Add($trimmed) | Out-Null
  }

  return ([string]::Join([Environment]::NewLine, $lines)).Trim()
}

function Get-AgentBrowserErrors {
  return Normalize-AgentBrowserErrors (Invoke-AgentBrowser -CommandArgs @("errors"))
}

function Get-BrokenImageCount {
  $script = @'
(async () => {
  const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));
  const getBrokenImages = () =>
    Array.from(document.images).filter((image) => {
      const source = image.currentSrc || image.src;

      return Boolean(source) && image.complete && image.naturalWidth === 0;
    });
  const waitForPendingImages = async () => {
    const pendingImages = Array.from(document.images).filter(
      (image) => !image.complete,
    );

    await Promise.all(
      pendingImages.map(
        (image) =>
          new Promise((resolve) => {
            const done = () => resolve(undefined);

            image.addEventListener("load", done, { once: true });
            image.addEventListener("error", done, { once: true });
            setTimeout(done, 650);
          }),
      ),
    );
  };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const brokenImages = getBrokenImages();

    if (brokenImages.length === 0) return "0";

    await waitForPendingImages();
    await sleep(250);
  }

  return String(getBrokenImages().length);
})()
'@

  return Normalize-EvalResult (Invoke-AgentBrowser -CommandArgs @(
    "eval",
    $script
  ))
}

function Wait-AgentBrowserVisualSettled {
  Invoke-AgentBrowser -CommandArgs @("wait", "900") | Out-Null
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

function ConvertTo-SafeArtifactSegment {
  param(
    [string]$Value,
    [string]$Fallback
  )

  $candidate = $Value
  if (-not $candidate) {
    $candidate = $Fallback
  }

  $safe = ($candidate -replace "[^a-zA-Z0-9._-]+", "-").Trim("-")
  if (-not $safe) {
    return $Fallback
  }

  return $safe
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
  param(
    [string]$DeploymentId,
    [string]$RouteSetName
  )

  $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ssZ")
  $routeSetSegment = ConvertTo-SafeArtifactSegment -Value $RouteSetName -Fallback "representative"
  $deploymentSegment = ConvertTo-SafeArtifactSegment -Value $DeploymentId -Fallback "local"
  $path = Join-Path (Get-Location) "artifacts\qa\$timestamp-$routeSetSegment-$deploymentSegment-agent-browser"
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
  $ArtifactDir = New-QAArtifactDir -DeploymentId $DeploymentId -RouteSetName $(if ($AllProducts) { "all-products" } else { $RouteSetName })
} else {
  New-Item -ItemType Directory -Path $ArtifactDir -Force | Out-Null
}

$screenshotDir = Join-Path $ArtifactDir "agent-browser-screenshots"
New-Item -ItemType Directory -Path $screenshotDir -Force | Out-Null

$runStartedAt = (Get-Date).ToUniversalTime().ToString("o")
$metadata = [pscustomobject]@{
  GeneratedAt = $runStartedAt
  BaseUrl = $BaseUrl
  DeploymentId = $(if ($DeploymentId) { $DeploymentId } else { "local" })
  RouteSetName = $(if ($AllProducts) { "all-products" } else { $RouteSetName })
  Viewports = $Viewports
  Routes = $Routes
  ArtifactNaming = "artifacts/qa/<utc>-<route-set>-<deployment-id>-agent-browser"
  ConsoleErrorBudget = "zero production console errors; known local development-only noise must be documented outside production evidence"
}

$metadata | ConvertTo-Json -Depth 4 | Out-File -FilePath (Join-Path $ArtifactDir "agent-browser-visual-qa-metadata.json") -Encoding utf8

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
          Wait-AgentBrowserVisualSettled

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

          $brokenImages = Get-BrokenImageCount

          $consoleErrors = Get-AgentBrowserErrors
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
