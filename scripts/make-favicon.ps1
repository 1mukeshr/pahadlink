Add-Type -AssemblyName System.Drawing
$srcPath = 'e:\mukesh-rawat\pahadlink\src\assets\images\logo.png'
$src = [System.Drawing.Image]::FromFile($srcPath)

# Tight crop: only the green P mark (logo is 428x96)
$cropW = 70
$cropH = $src.Height
$cropX = 2
$cropY = 0

$bmp = New-Object System.Drawing.Bitmap $cropW, $cropH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $cropW, $cropH), $cropX, $cropY, $cropW, $cropH, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

function Save-Square($sourceBmp, $size, $path, $bg) {
  $square = New-Object System.Drawing.Bitmap $size, $size
  $sg = [System.Drawing.Graphics]::FromImage($square)
  $sg.Clear($bg)
  $sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $pad = [int]($size * 0.1)
  $box = $size - (2 * $pad)
  $scale = [Math]::Min($box / $sourceBmp.Width, $box / $sourceBmp.Height)
  $dw = [int]($sourceBmp.Width * $scale)
  $dh = [int]($sourceBmp.Height * $scale)
  $dx = [int](($size - $dw) / 2)
  $dy = [int](($size - $dh) / 2)
  $sg.DrawImage($sourceBmp, $dx, $dy, $dw, $dh)
  $sg.Dispose()
  $square.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $square.Dispose()
  Write-Host ("saved $path")
}

$white = [System.Drawing.Color]::White
Save-Square $bmp 32 'e:\mukesh-rawat\pahadlink\public\favicon-32.png' $white
Save-Square $bmp 48 'e:\mukesh-rawat\pahadlink\public\favicon-48.png' $white
Save-Square $bmp 180 'e:\mukesh-rawat\pahadlink\public\apple-touch-icon.png' $white

# Also copy as favicon.png for simple browsers
Copy-Item 'e:\mukesh-rawat\pahadlink\public\favicon-32.png' 'e:\mukesh-rawat\pahadlink\public\favicon.png' -Force

$bmp.Dispose()
$src.Dispose()
