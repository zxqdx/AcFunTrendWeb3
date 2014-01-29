<?php

class Setting {
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

    function __construct() {
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

class Utility {
    public function write_file($filename, $content, $form="json", $append=true,
                                 $end=true, $toConsole=false, $suppress=true) {

    }
}

class Logger {
    public $setting;
    public $previousTime = "";
    public $indent = "  ";
    public $module;
    public $filename;
    public $filenameDebug;
    public $err;

    function __construct($module) {
        $this->setting = new Setting();
        $dateTime = new DateTime();
        $this->module = $module;
        $this->filename = sprintf("%s/debug/%s-%s/%s_%s.%s", $dateTime->format("Y-m-d H:i:s"), $dateTime->format("Y"),
                                  $dateTime->format("m"), $dateTime->format("d"), $module, $this->setting->logFileSuffix);
        $this->filename = sprintf("%s/debug/%s-%s/%s_%s_err.%s", $dateTime->format("Y-m-d H:i:s"), $dateTime->format("Y"),
                                  $dateTime->format("m"), $dateTime->format("d"), $module, $this->setting->logFileSuffix);
    }

    public function add($message, $level="DETAIL", $ex=null) {

    }

    public static function close() {

    }

    private static function _time() {
        $dateTime = new DateTime();
        return $dateTime->format("Y-m-d H:i:s");
    }
}

echo str_replace("\\", "/", getcwd());

?>