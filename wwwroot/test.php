<?php
/**
 * Created by IntelliJ IDEA.
 * User: zxqdx
 * Date: 3/9/14
 * Time: 3:07 PM
 */
$arr = explode("&", "a=1&c=2&b=3");
$brr = array();
foreach ($arr as $index => $value) {
    echo $index."=>".$value."<br>";
    $arr[$index] = explode("=", $arr[$index]);
    $brr[$arr[$index][0]] = $arr[$index][1];
}
echo "<br><br><br>";
ksort($brr);
print_r($brr);
unset($brr["b"]);
print_r($brr);