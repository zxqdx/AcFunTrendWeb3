<?php
/**
 * Created by IntelliJ IDEA.
 * User: zxqdx
 * Date: 3/9/14
 * Time: 9:29 PM
 */
require("../../../Util.php");
$api = new Api($_SERVER['QUERY_STRING'], '1_2_1');
header('Content-type: application/json; Charset=utf-8');
echo $api->execute(true);