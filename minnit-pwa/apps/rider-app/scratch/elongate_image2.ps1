Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path "Instruction image\2.png").Path
$destPath = Join-Path (Get-Location) "public\Instruction image\2.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

$w = $src.Width
$targetH = [int]($w * 1.5) # 1214 * 1.5 = 1821
$deltaH = $targetH - $src.Height # 1821 - 1295 = 526

$topPad = [int]($deltaH * 0.4) # 210px
$bottomPad = $deltaH - $topPad  # 316px

$dest = New-Object System.Drawing.Bitmap($w, $targetH)
$g = [System.Drawing.Graphics]::FromImage($dest)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Background color of 2.png edges
$bgColor = $src.GetPixel(10, 10)
$brush = New-Object System.Drawing.SolidBrush($bgColor)
$g.FillRectangle($brush, 0, 0, $w, $targetH)

# Draw original image centered
$g.DrawImage($src, 0, $topPad, $w, $src.Height)

$dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Successfully elongated public\Instruction image\2.png to $w x $targetH"

$brush.Dispose()
$g.Dispose()
$dest.Dispose()
$src.Dispose()
