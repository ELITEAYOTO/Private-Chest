param(
    [ValidateSet("Chrome", "Firefox", "All")]
    [string]$Browser = "All",

    [string]$NativeHostExePath = (Join-Path $PSScriptRoot "..\..\..\target\release\native_host.exe"),

    [string]$ChromeExtensionId,
    [string]$FirefoxExtensionId,

    [string]$ManifestOutputDir = (Join-Path $env:LOCALAPPDATA "PrivateChest\native-messaging")
)

$ErrorActionPreference = "Stop"

function Resolve-AbsolutePath {
    param([string]$PathValue)

    $resolved = Resolve-Path -Path $PathValue -ErrorAction Stop
    return $resolved.Path
}

function Ensure-Directory {
    param([string]$PathValue)

    if (-not (Test-Path -Path $PathValue)) {
        New-Item -ItemType Directory -Path $PathValue -Force | Out-Null
    }
}

function Write-TemplatedManifest {
    param(
        [string]$TemplatePath,
        [string]$OutputPath,
        [hashtable]$Replacements
    )

    $content = Get-Content -Raw -Path $TemplatePath
    foreach ($key in $Replacements.Keys) {
        $content = $content.Replace($key, $Replacements[$key])
    }

    Set-Content -Path $OutputPath -Value $content -NoNewline
}

function Register-NativeHostKey {
    param(
        [string]$RegistryPath,
        [string]$ManifestPath
    )

    New-Item -Path $RegistryPath -Force | Out-Null
    Set-Item -Path $RegistryPath -Value $ManifestPath
}

$nativeHostExe = Resolve-AbsolutePath -PathValue $NativeHostExePath
if (-not (Test-Path -Path $nativeHostExe -PathType Leaf)) {
    throw "Native host executable not found: $nativeHostExe"
}

$jsonEscapedHostPath = $nativeHostExe -replace "\\", "\\\\"

Ensure-Directory -PathValue $ManifestOutputDir
$manifestOutputDirAbs = Resolve-AbsolutePath -PathValue $ManifestOutputDir

$chromeTemplate = Join-Path $PSScriptRoot "io.privatechest.native.chrome.json"
$firefoxTemplate = Join-Path $PSScriptRoot "io.privatechest.native.firefox.json"

$chromeManifestOut = Join-Path $manifestOutputDirAbs "io.privatechest.native.chrome.json"
$firefoxManifestOut = Join-Path $manifestOutputDirAbs "io.privatechest.native.firefox.json"

$installChrome = $Browser -eq "Chrome" -or $Browser -eq "All"
$installFirefox = $Browser -eq "Firefox" -or $Browser -eq "All"

if ($installChrome -and [string]::IsNullOrWhiteSpace($ChromeExtensionId)) {
    throw "ChromeExtensionId is required for Chrome install."
}

if ($installFirefox -and [string]::IsNullOrWhiteSpace($FirefoxExtensionId)) {
    throw "FirefoxExtensionId is required for Firefox install."
}

if ($installChrome) {
    Write-TemplatedManifest -TemplatePath $chromeTemplate -OutputPath $chromeManifestOut -Replacements @{
        "__PRIVATE_CHEST_NATIVE_HOST_PATH__" = $jsonEscapedHostPath
        "__CHROME_EXTENSION_ID__" = $ChromeExtensionId.Trim()
    }

    Register-NativeHostKey -RegistryPath "HKCU:\Software\Google\Chrome\NativeMessagingHosts\io.privatechest.native" -ManifestPath $chromeManifestOut
    Write-Host "[OK] Chrome manifest written: $chromeManifestOut"
}

if ($installFirefox) {
    Write-TemplatedManifest -TemplatePath $firefoxTemplate -OutputPath $firefoxManifestOut -Replacements @{
        "__PRIVATE_CHEST_NATIVE_HOST_PATH__" = $jsonEscapedHostPath
        "__FIREFOX_EXTENSION_ID__" = $FirefoxExtensionId.Trim()
    }

    Register-NativeHostKey -RegistryPath "HKCU:\Software\Mozilla\NativeMessagingHosts\io.privatechest.native" -ManifestPath $firefoxManifestOut
    Write-Host "[OK] Firefox manifest written: $firefoxManifestOut"
}

Write-Host "[DONE] Native host registration completed."