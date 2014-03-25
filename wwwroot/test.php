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
$api_1_2 = true;
//echo "defined: ". array_key_exists("api_1_3", $GLOBALS);
$variable_variable = "api_1_2";
echo "isset: " . isset($$variable_variable);
function throw_ex($msg) {
    throw new Exception($msg);
}
try {
    throw_ex("wtf");
} catch (Exception $e) {
//    echo $e->getMessage();
    echo ($e->getTraceAsString());
//    echo ($e->getFile().", ".$e->getLine().": ".$e->getMessage());
}
echo count($brr);
require("./Util.php");
echo "<br><br><br>";
print_r(Utility::date_to_ac_days());
echo "<br><br>" . $_SERVER['QUERY_STRING'];
echo dirname(__FILE__);
$testArr = array(
    "from" => "a"
);
echo "<br><br>in_array = " . in_array("from", array_keys($testArr));