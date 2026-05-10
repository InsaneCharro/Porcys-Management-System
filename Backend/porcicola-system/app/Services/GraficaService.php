<?php

namespace App\Services;

class GraficaService
{
    public static function generarDashboardGrafica(array $datos)
    {
        $width = 800;
        $height = 400;

        $image = imagecreatetruecolor($width, $height);

        $white = imagecolorallocate($image, 255, 255, 255);
        $blue = imagecolorallocate($image, 33, 150, 243);
        $red = imagecolorallocate($image, 211, 47, 47);
        $green = imagecolorallocate($image, 56, 142, 60);
        $purple = imagecolorallocate($image, 123, 31, 162);
        $black = imagecolorallocate($image, 0, 0, 0);

        imagefill($image, 0, 0, $white);

        $max = max($datos);
        if ($max == 0) {
            $max = 1;
        }

        $barWidth = 100;
        $spacing = 70;
        $startX = 80;
        $baseY = 320;

        $colors = [$blue, $green, $red, $purple];
        $labels = ['Animales', 'Ventas', 'Bajas', 'Sanitario'];

        foreach ($datos as $i => $valor) {
            $barHeight = ($valor / $max) * 200;

            $x1 = $startX + ($i * ($barWidth + $spacing));
            $y1 = $baseY - $barHeight;
            $x2 = $x1 + $barWidth;
            $y2 = $baseY;

            imagefilledrectangle(
                $image,
                $x1,
                $y1,
                $x2,
                $y2,
                $colors[$i]
            );

            imagestring($image, 5, $x1 + 35, $y1 - 25, $valor, $black);
            imagestring($image, 4, $x1 + 15, $baseY + 15, $labels[$i], $black);
        }

        $path = public_path('dashboard_chart.png');

        imagepng($image, $path);
        imagedestroy($image);

        return $path;
    }
}