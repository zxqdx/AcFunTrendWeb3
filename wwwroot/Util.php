<?php

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

    function __construct()
    {
        $this->isDebug = true; // Modify this when necessary.
        $this->wwwPath = str_replace("\\", "/", getcwd());
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
            $folderName = dirname($filename);
            mkdir($folderName, $recursive = true);
            if ($append) {
                $file = fopen($filename, "a");
            } else {
                $file = fopen($filename, "w");
            }
            if (!$form) {
                fwrite($file, $content);
            } else if ($form == "json") {
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

    public function selectDB($mysqlDB)
    {
        if ($mysqlDB == "acws") {
            mysql_select_db($this->setting->mysqlAcWsConnectorDB);
        } else if ($mysqlDB == "api") {
            mysql_select_db($this->setting->mysqlApiDB);
        }
    }

    public function closeCon()
    {
        $this->con->close();
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
        $this->filename = sprintf("%s/debug/%s-%s/%s_%s.%s", $dateTime->format("Y-m-d H:i:s"), $dateTime->format("Y"),
            $dateTime->format("m"), $dateTime->format("d"), $module, $this->setting->logFileSuffix);
        $this->filename = sprintf("%s/debug/%s-%s/%s_%s_err.%s", $dateTime->format("Y-m-d H:i:s"), $dateTime->format("Y"),
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

    function __construct($queryString, $queryOrder)
    {
        $this->queryString = $queryString;
        $this->queryOrder = $queryOrder;
        $this->queryParams = explode("&", $queryString);
        $this->parsedParams = array();
        # Parse parameters.
        foreach ($this->queryParams as $index => $value) {
            $this->queryParams[$index] = explode("=", $this->queryParams[$index]);
            if (in_array($this->queryParams[$index][0], $this::$paramDict)) {
                $this->parsedParams[$this::$paramDict[$this->queryParams[$index][0]]] = $this->queryParams[$index][1];
            } else {
                throw new Exception(sprintf('Unrecognized parameter "%s".', $this->queryParams[$index][0]));
            }
        }
        ksort($this->parsedParams);
        # Remove extra parameters.
        foreach ($this->parsedParams as $eachParam => $value) {
            if (!in_array($eachParam, $this::$expectedParams[$this->$queryOrder])) {
                unset($this->parsedParams[$eachParam]);
            }
        }
    }

    function __toString()
    {
        $gen = $this->queryOrder . "?";
        foreach ($this->parsedParams as $eachParam => $value) {
            $gen .= $eachParam . "=" . $value;
        }
        return $gen;
    }

}

//echo str_replace("\\", "/", getcwd());

?>