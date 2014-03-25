<?php
/**
 * Created by IntelliJ IDEA.
 * User: zxqdx
 * Date: 3/9/14
 * Time: 9:29 PM
 */
require("../../../Util.php");
$api = new Api($_SERVER['QUERY_STRING'], '1_2_1');
print_r($api->execute(true));
echo "<br>".$api;