Add-Type -AssemblyName System.Drawing

$srcPath = 'e:\mukesh-rawat\pahadlink\public\favicon-source.png'
$public = 'e:\mukesh-rawat\pahadlink\public'
$src = [System.Drawing.Image]::FromFile($srcPath)

function Save-Png($source, $size, $path) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.DrawImage($source, 0, 0, $size, $size)
  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "saved $path ($size)"
}

$sizes = @(16, 32, 48, 180, 192, 512)
foreach ($size in $sizes) {
  if ($size -eq 180) {
    Save-Png $src $size (Join-Path $public 'apple-touch-icon.png')
  } elseif ($size -eq 16) {
    Save-Png $src $size (Join-Path $public 'favicon-16.png')
  } elseif ($size -eq 32) {
    Save-Png $src $size (Join-Path $public 'favicon-32.png')
  } elseif ($size -eq 48) {
    Save-Png $src $size (Join-Path $public 'favicon-48.png')
  } elseif ($size -eq 192) {
    Save-Png $src $size (Join-Path $public 'icons\icon-192.png')
  } elseif ($size -eq 512) {
    Save-Png $src $size (Join-Path $public 'icons\icon-512.png')
  }
}

# Default favicon.png (32)
Copy-Item (Join-Path $public 'favicon-32.png') (Join-Path $public 'favicon.png') -Force

# Build multi-size ICO (16 + 32 + 48)
function Get-PngBytes($img, $size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($img, 0, 0, $size, $size)
  $g.Dispose()
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  $bytes = $ms.ToArray()
  $ms.Dispose()
  return $bytes
}

$icoSizes = @(16, 32, 48)
$pngs = @()
foreach ($s in $icoSizes) { $pngs += ,(Get-PngBytes $src $s) }

$msIco = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $msIco
$bw.Write([UInt16]0)      # reserved
$bw.Write([UInt16]1)      # type icon
$bw.Write([UInt16]$icoSizes.Count)

$offset = 6 + (16 * $icoSizes.Count)
for ($i = 0; $i -lt $icoSizes.Count; $i++) {
  $s = $icoSizes[$i]
  $data = $pngs[$i]
  $sizeByte = if ($s -ge 256) { [byte]0 } else { [byte]$s }
  $bw.Write($sizeByte)
  $bw.Write($sizeByte)
  $bw.Write([byte]0)      # colors
  $bw.Write([byte]0)      # reserved
  $bw.Write([UInt16]1)    # planes
  $bw.Write([UInt16]32)   # bit count
  $bw.Write([UInt32]$data.Length)
  $bw.Write([UInt32]$offset)
  $offset += $data.Length
}
foreach ($data in $pngs) { $bw.Write($data) }
$bw.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $public 'favicon.ico'), $msIco.ToArray())
$bw.Dispose()
$msIco.Dispose()
Write-Host 'saved favicon.ico'

$src.Dispose()
