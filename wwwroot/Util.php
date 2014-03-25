<?php
date_default_timezone_set("PRC");

/**
 * Class Setting
 */
class Setting
{
    public $isDebug;
    public $wwwPath;
    public $globalSwitchPath;
    public $logFileSuffix;
    public $lockFileSuffix;
    public $mysqlUser;
    public $mysqlHost;
    public $mysqlPassword;
    public $mysqlPort;
    public $mysqlAcWsConnectorDB;
    public $mysqlApiDB;
    public $mysqlEncoding;
    public $TrendAPIPoolNum;
    public $lp_num;
    public $llp_num;

    function __construct()
    {
        $this->isDebug = true; // Modify this when necessary.
        $this->wwwPath = str_replace("\\", "/", dirname(__FILE__));
        $this->globalSwitchPath = sprintf("%s/GlobalSwitch.trr", $this->wwwPath);
        $this->logFileSuffix = "trendlog";
        $this->lockFileSuffix = "slock";
        if ($this->isDebug) {
            $this->mysqlUser = "root";
            $this->mysqlHost = "127.0.0.1";
            $this->mysqlPassword = "miaowu";
            $this->mysqlPort = 3306;
        } else {
            throw new Exception("Not yet implemented.");
        }
        $this->mysqlAcWsConnectorDB = "trend_acws";
        $this->mysqlApiDB = "trend_api";
        $this->mysqlEncoding = "utf8mb4";

        $this->TrendAPIPoolNum = 10;

        $this->lp_num = 30;
        $this->llp_num = 100;
    }
}

/**
 * Class Utility
 */
class Utility
{
    public static function is_panguine()
    {
        return !(strtoupper(substr(PHP_OS, 0, 3)) === 'WIN');
    }

    public static function write_file($filename, $content, $form = "json", $append = true, $end = true)
    {
        try {
            $folderName = dirname($filename)."/";
            if (!is_dir($folderName)) {
                mkdir($folderName, $recursive = true);
            }
            if ($append) {
                $file = fopen($filename, "a");
            } else {
                $file = fopen($filename, "w");
            }
            if (!$form) {
                fwrite($file, $content);
            } elseif ($form == "json") {
                fwrite($file, json_encode($content));
            }
            if ($end) {
                if (Utility::is_panguine()) {
                    $end_str = "\r";
                } else {
                    $end_str = "\n";
                }
                fwrite($file, $end_str);
            }
            fclose($file);
        } catch (Exception $e) {
            error_log($e->getTraceAsString());
        }
        return true;
    }

    public static function get_ip()
    {
        if (getenv("HTTP_CLIENT_IP")) {
            $ip = getenv("HTTP_CLIENT_IP");
        } elseif (getenv("HTTP_X_FORWARDED_FOR")) {
            $ip = getenv("HTTP_X_FORWARDED_FOR");
        } elseif (getenv("REMOTE_ADDR")) {
            $ip = getenv("REMOTE_ADDR");
        } else {
            $ip = "Unknown";
        }
        return $ip;
    }

    public static function date_to_ac_days($d = null)
    {
        if (!$d) {
            $d = new DateTime('now');
        }
        return $d->diff(new DateTime('2007-06-04'))->days;
    }
}

/**
 * Class Logger
 *
 * Used for logging and debugging.
 */
class Logger
{
    public $setting;
    public $previousTime = "";
    public $indent = "  ";
    public $module;
    public $filename;
    public $filenameDebug;
    public $err;

    function __construct($module)
    {
        $this->setting = new Setting();
        $dateTime = new DateTime();
        $this->module = $module;
        $this->filename = sprintf("%s/debug/%s-%s/%s_%s.%s", $this->setting->wwwPath, $dateTime->format("Y"),
            $dateTime->format("m"), $dateTime->format("d"), $module, $this->setting->logFileSuffix);
        $this->filenameDebug = sprintf("%s/debug/%s-%s/%s_%s_err.%s",$this->setting->wwwPath, $dateTime->format("Y"),
            $dateTime->format("m"), $dateTime->format("d"), $module, $this->setting->logFileSuffix);
    }

    public function add($message, $level = "DETAIL", Exception $ex = null)
    {
        $currentTime = Logger::_time();
        if ($this->previousTime != $currentTime) {
            Utility::write_file($this->filename, sprintf("[%s]", $currentTime), null);
            $this->previousTime = $currentTime;
        }
        if ($ex != null) {
            $message .= $ex->getTraceAsString();
        }
        if ($level == "SEVERE") {
            Utility::write_file($this->filenameDebug, sprintf("[%s]", $currentTime), null);
            Utility::write_file($this->filenameDebug, $this->indent . $message, null);
        }
        Utility::write_file($this->filename, sprintf("%s<%s> %s", $this->indent, $level, $message), null);
    }

    public function close()
    {
        Utility::write_file($this->filename, sprintf("-----End at: %s-----", Logger::_time()), null);
    }

    private static function _time()
    {
        $dateTime = new DateTime();
        return $dateTime->format("Y-m-d H:i:s");
    }
}

/**
 * Class TrendSQL
 *
 * Used for connecting to MySQL.
 * REMINDER: When operating SQL, use escape functions like mysql_real_escape_string().
 */
class TrendSQL
{
    public $setting;
    public $logger;
    public $con;

    function __construct($module)
    {
        $this->setting = new Setting();
        $this->logger = new Logger($module);
        $this->con = new mysqli($this->setting->mysqlHost,
            $this->setting->mysqlUser, $this->setting->mysqlPassword);
        if (!$this->con->connect_errno) {
            $this->con->query(sprintf("set character set '%s'", $this->setting->mysqlEncoding));
            $this->con->set_charset($this->setting->mysqlEncoding);
        }
    }

    public function query($query)
    {
        if ($result = $this->con->query($this->con->real_escape_string($query))) {
            return $result;
        } else {
            $this->logger->add(sprintf("Failed to fetch '%s'", $query));
            return FALSE;
        }
    }

    public function select_db($mysqlDB)
    {
        if ($mysqlDB == "acws") {
            $this->con->select_db($this->setting->mysqlAcWsConnectorDB);
        } elseif ($mysqlDB == "api") {
            $this->con->select_db($this->setting->mysqlApiDB);
        }
    }

    public function close_con()
    {
        $this->con->close();
    }
}

/**
 * Class Api
 *
 * Used for Trend API instances.
 */
class Api
{
    public static $paramDict = array(
        "channel" => "a",
        "from" => "b",
        "to" => "c",
        "sort" => "d",
        "rev" => "e"
    );
    public static $expectedParams = array(
        "1_2_1" => array("a", "b", "c", "d", "e")
    );
    public $queryString;
    public $queryOrder;
    public $queryParams;
    public $parsedParams;
    public $parsedString;
    public $result;
    public $logger;
    public $setting;
    public $mysql;

    function __construct($queryString, $queryOrder)
    {
        $this->queryString = $queryString;
        $this->queryOrder = $queryOrder;
        $this->queryParams = explode("&", $queryString);
        $this->parsedParams = array();
        $this->logger = new Logger("Api_" . $queryOrder);
        $this->setting = new Setting();
        $this->mysql = new TrendSQL("Api_" . $queryOrder);
    }
    private function parse_parameters()
    {
        # Parse.
        foreach ($this->queryParams as $index => $value) {
            $this->queryParams[$index] = explode("=", $this->queryParams[$index]);
            if (in_array($this->queryParams[$index][0], Api::$paramDict)) {
                $this->parsedParams[Api::$paramDict[$this->queryParams[$index][0]]] = $this->queryParams[$index][1];
            } else {
                throw new Exception(sprintf('Unrecognized parameter "%s".', $this->queryParams[$index][0]));
            }
        }
        ksort($this->parsedParams);
        # Remove extra parameters.
        foreach ($this->parsedParams as $eachParam => $value) {
            if (!in_array($eachParam, Api::$expectedParams[$this->$queryOrder])) {
                unset($this->parsedParams[$eachParam]);
            }
        }
        # Generate parameter string.
        $this->parsedString = "";
        $i = 0;
        $paramCount = count($this->parsedParams);
        foreach ($this->parsedParams as $eachParam => $value) {
            $i++;
            $this->parsedString .= $eachParam . "=" . $value;
            if ($i != $paramCount) {
                $this->parsedString .= "&";
            }
        }
    }

    /**
     * This should be called.
     *
     * Returns the result in JSON format by default.
     * REMINDER: json_decode($json, TRUE) will return an array instead of an object.
     */
    public function execute($toString = false)
    {
        $result = array();
        try {
            $this->parse_parameters();
            return 0; # DEBUG...
            # Select Api database.
            $this->mysql->select_db("api");
            $resultCached = false;
            # Check whether in cache.
            $sqlResult = $this->mysql->query(
                sprintf('SELECT result FROM trend_api_cache WHERE query="%s"', $this));
            if ($sqlResult->num_rows > 0) {
                $result = $sqlResult->fetch_array(MYSQLI_ASSOC);
                # Generate result.
                $result = $result["result"];
                $resultCached = true;
            }
            $sqlResult->close();

            if (!$resultCached) {
                $result["success"] = false;
                $result["content"] = array(
                    "query" => true
                );
                # Check ip_table.
                $userIP = Utility::get_ip();
                $newIP = true;
                $sqlResult = $this->mysql->query(
                    sprintf('SELECT "count", ac_day FROM trend_api_ip_table WHERE ip="%s"', $userIP));
                $outdatedIP = false;
                if ($sqlResult->num_rows > 0) {
                    $newIP = false;
                    # Check if not today.
                    $acDayToday = Utility::date_to_ac_days();
                    $ipInfo = $sqlResult->fetch_array(MYSQLI_ASSOC);
                    $outdatedIP = intval($ipInfo["ac_day"]) != $acDayToday;
                    if (!$outdatedIP) {
                        if ($ipInfo["count"] > $this->setting->llp_num) {
                            $ipPriority = 3;
                        } elseif ($ipInfo["count"] > $this->setting->lp_num) {
                            $ipPriority = 2;
                        } else {
                            $ipPriority = 1;
                        }
                    }
                }
                $sqlResult->close();

                # Check whether in queue.
                $sqlResult = $this->mysql->query(
                    sprintf('SELECT pool_id, priority FROM trend_api_queue WHERE query="%s"', $this));
                if ($sqlResult->num_rows > 0) {
                    # >> If yes, refresh priority if previous one is lower than current one.
                    $queryInfo = $sqlResult->fetch_array(MYSQLI_ASSOC);
                    if ($ipPriority < intval($queryInfo["priority"])) {
                        $this->mysql->query(
                            sprintf('UPDATE trend_api_queue SET priority=%d WHERE query="%s"', $ipPriority, $this));
                        $ipPriority = intval($queryInfo["priority"]);
                    }
                    $sqlResult2 = $this->mysql->query(
                        sprintf('SELECT count(query) FROM trend_api_queue WHERE pool_id=%d AND priority<=%d',
                            $queryInfo["pool_id"], $ipPriority));
                    $posInfo = $sqlResult2->fetch_array();
                    $posInfo = $posInfo[0];
                    # Generate result.
                    $result["content"]["status"] = array(
                        "pos" => $posInfo,
                        "pool" => $queryInfo["pool_id"]
                    );
                } else {
                    # >> If no, add into the queue and refresh ip_table.
                    $poolId = mt_rand(1, $this->setting->TrendAPIPoolNum);
                    $sqlResult2 = $this->mysql->query(
                        sprintf('INSERT INTO trend_api_queue(query, pool_id, priority) VALUES ("%s", %d, %d)',
                        $this, $poolId, $ipPriority));
                    if (!$sqlResult2===true) {
                        throw new Exception("Query added failed.");
                    }
                    $sqlResult2->close();
                    # Generate result.
                    $sqlResult2 = $this->mysql->query(
                        sprintf('SELECT count(query) FROM trend_api_queue WHERE pool_id=%d AND priority<=%d',
                            $poolId, $ipPriority));
                    $posInfo = $sqlResult2->fetch_array();
                    $posInfo = $posInfo[0];
                    $result["content"]["status"] = array(
                        "pos" => $posInfo,
                        "pool" => $poolId
                    );
                    # Refresh ip_table.
                    if ($newIP) {
                        $this->mysql->query(
                            sprintf('INSERT INTO trend_api_ip_table(ip, "count", ac_day) VALUES ("%s", 1, %d)',
                            $userIP, Utility::date_to_ac_days()));
                    } else {
                        if ($outdatedIP) {
                            $this->mysql->query(
                                sprintf('UPDATE trend_api_ip_table SET "count"=1, ac_day=%d WHERE ip="%s"',
                                Utility::date_to_ac_days(), $userIP));
                        } else {
                            $this->mysql->query(
                                sprintf('UPDATE trend_api_ip_table SET "count"="count"+1 WHERE ip="%s"', $userIP));
                        }
                    }
                }
                $sqlResult->close();
            }
        } catch (Exception $e) {
            $this->logger->add("Error occurred during api execution.", "SEVERE", $e);
            # Generate result.
            $result["success"] = false;
            $result["content"] = array(
                "query" => false,
                "reason" => "请求数据库过程中出现异常，请重试或反馈错误。"
            );
        }
        $this->result = $result;
        if ($toString) {
            $result = json_encode($result);
        }
        return $result;
    }

    function __toString()
    {
        return $this->queryOrder . "?" . $this->parsedString;
    }

}

//echo str_replace("\\", "/", getcwd());
