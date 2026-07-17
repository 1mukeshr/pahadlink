Add-Type -AssemblyName System.Drawing

$srcPath = 'e:\mukesh-rawat\pahadlink\public\favicon-source.png'
$public = 'e:\mukesh-rawat\pahadlink\public'
$src = [System.Drawing.Image]::FromFile($srcPath)

function Get-PngBytes([System.Drawing.Image]$img, [int]$size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($img, 0, 0, $size, $size)
  $g.Dispose()
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  $bytes = $ms.ToArray()
  $ms.Dispose()
  return ,$bytes
}

$icoSizes = @(16, 32, 48)
$pngs = New-Object System.Collections.Generic.List[byte[]]
foreach ($s in $icoSizes) {
  $pngs.Add((Get-PngBytes $src $s))
}

$msIco = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $msIco
$bw.Write([UInt16]0)
$bw.Write([UInt16]1)
$bw.Write([UInt16]$icoSizes.Count)

$offset = 6 + (16 * $icoSizes.Count)
for ($i = 0; $i -lt $icoSizes.Count; $i++) {
  $s = $icoSizes[$i]
  $data = $pngs[$i]
  $dim = [byte]$s
  $bw.Write($dim)
  $bw.Write($dim)
  $bw.Write([byte]0)
  $bw.Write([byte]0)
  $bw.Write([UInt16]1)
  $bw.Write([UInt16]32)
  $bw.Write([UInt32]$data.Length)
  $bw.Write([UInt32]$offset)
  $offset += $data.Length
}
foreach ($data in $pngs) {
  $bw.Write($data)
}
$bw.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $public 'favicon.ico'), $msIco.ToArray())
$bw.Dispose()
$msIco.Dispose()
$src.Dispose()
Write-Host 'saved favicon.ico OK'
Get-Item (Join-Path $public 'favicon.ico') | Select-Object Name, Length
