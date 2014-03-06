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
            $this->mysqlAcWsConnectorDB = "trend_acws";
        } else {
            throw new Exception("Not yet implemented.");
        }
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
            mkdir($filename, $recursive = true);
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
    function __construct() {

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

echo str_replace("\\", "/", getcwd());

?>