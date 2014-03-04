/**
 * Created by zxqdx on 3/1/14.
 *
 * You may modify the lines commented by "MODIFY".
 *
 * Author: zxqdx
 * Email: zxq001zxq001@gmail.com
 * Version: 0.0.2
 * Reference: jQuery 1.8.3
 *            jQuery UI 1.10.4
 *            Color Scheme Designer #3v11Tw0w0w0w0
 */

"use strict";
var __ = (function() {
    function zFrame(settings) {
        // Check whether jQuery has been imported.
        this.failed = false;
        if (typeof jQuery === "undefined") {
            console.error("jQuery is not imported.");
            this.failed = true;
            return;
        } else if (typeof jQuery.ui === "undefined") {
            console.error("jQuery ui is not imported.");
            this.failed = true;
            return;
        }

        // Parse parameters and initialization.
        this.utility = {
            getCurrentDatetime: function() {
                var d = new Date();
                return "" +
                    (d.getFullYear()) + "-" +
                    (d.getMonth() > 9 ? "" : "0") + d.getMonth() + "-" +
                    (d.getDate() > 9 ? "" : "0") + d.getDate() + " " +
                    (d.getHours() > 9 ? "" : "0") + d.getHours() + ":" +
                    (d.getMinutes() > 9 ? "" : "0") + d.getMinutes() + ":" +
                    (d.getSeconds() > 9 ? "" : "0") + d.getSeconds();
            }
        }
        var parameterList = {
            siteName: {},
            siteVersion: {},
            colorScheme: {
                default: "blue"
            },
            zIntl: {
                default: false
            }
        }
        var colorDict = {
            blue: {
                dark: "#03426A",
                pure: "#0A67A3",
                gray: "#24587A",
                light: "#3E97D1",
                bright: "#65A6D1",
                text: "white"
            }
        }
        for (var eachParameter in parameterList) {
            // Check default.
            var eachValue = null;
            if (settings.hasOwnProperty(eachParameter)) { // Found in parameters.
                eachValue = settings[eachParameter];
            } else {
                if (parameterList[eachParameter].hasOwnProperty("default")) { // Fall back to default value.
                    eachValue = parameterList[eachParameter]["default"];
                } else { // Value not found.
                    console.error(eachParameter + " not found.");
                    this.failed = true;
                    return;
                }
            }
            // Check and store value as public.
            var publicVariable = true;
            if (parameterList[eachParameter].hasOwnProperty("public")) {
                if (!parameterList[eachParameter]) {
                    publicVariable = false;
                }
            }
            if (publicVariable) {
                this[eachParameter] = eachValue;
            }
            // Check callback.
            if (parameterList[eachParameter].hasOwnProperty("callback")) {
                if (typeof(parameterList[eachParameter].callback) === "function") {
                    parameterList[eachParameter].callback();
                }
            }
        }
        if (!colorDict.hasOwnProperty(this.colorScheme)) {
            console.warn('Color scheme "' + this.colorScheme + '" not found. Falling back to default scheme.');
            this.colorScheme = "blue";
        }
        this.initialized = false;

        // Getter and Setter.
        this.getColor = function(type) {
            return colorDict[this.colorScheme][type];
        };
        this.refreshLastUpdate = function() {
            this.lastUpdate = this.utility.getCurrentDatetime();
        }

        var _this = this;
        $(document).ready(function() {
            // Draw UI
            // >> Initialize.
            var getDiv = function(parent, id, title) {
                var newDiv = document.createElement("div");
                newDiv.id = id;
                if (title != undefined) {
                    newDiv.title = title;
                }
                newDiv.style.padding = "0px";
                newDiv.style.margin = "0px";
                parent.appendChild(newDiv);
                return newDiv;
            };
            var enableBtn = function(div, fn) {
                $(div).addClass("zBtn");
                $(div).css({
                    padding: "5px"
                })
                if (fn != undefined) {
                    if (typeof fn === "function") {
                        div.callback = fn;
                    } else {
                        div.callback = function() {};
                        console.warn("Invalid function parameter:");
                        console.dir(fn);
                    }
                } else {
                    div.callback = function() {};
                }
            }
            var disableeBtn = function(div, css) {
                $(div).removeClass("zBtn");
                if (div.hasOwnProperty("callback")) {
                    delete div.callback;
                }
                if (css != undefined) {
                    $(div).css(css);
                }
            }
            _this.dom = {
                container: {},
                base: {},
                left: {},
                right: {},
                notification: {},
                progressBar: {},
                gadget: {}
            }
            _this.dom.container = getDiv(document.body, "zFrame");
            $(_this.dom.container).css({
                "user-select": "none"
            })
            _this.dom.base = getDiv(_this.dom.container, "zFrameBase");
            _this.dom.left.container = getDiv(_this.dom.base, "zFrameLeft");
            _this.dom.left.siteName = getDiv(_this.dom.left.container, "zFrameSiteName");
            _this.dom.left.siteVersion = getDiv(_this.dom.left.container, "zFrameSiteVersion");
            _this.dom.left.lastUpdate = getDiv(_this.dom.left.container, "zFrameLastUpdate");
            _this.dom.left.miniBtn = getDiv(_this.dom.left.container, "zFrameLeftMiniBtn", "详细");
            _this.dom.left.miniBtn.icon = getDiv(_this.dom.left.miniBtn, "zFrameLeftMiniBtnIcon");
            $(_this.dom.left.miniBtn.icon).addClass("icon more-info");
            _this.dom.right.container = getDiv(_this.dom.base, "zFrameRight");
            _this.dom.right.toggles = [];
            _this.dom.right.setting = getDiv(_this.dom.right.container, "zFrameRightSetting", "设置");
            _this.dom.right.feedback = getDiv(_this.dom.right.container, "zFrameRightFeedback", "反馈");
            _this.dom.right.location = getDiv(_this.dom.right.container, "zFrameRightLocation");
            _this.dom.notification.container = getDiv(_this.dom.container, "zFrameNotification");
            _this.dom.notification.items = {};
            _this.dom.progressBar = getDiv(_this.dom.container, "zFrameProgressBar");
            _this.dom.gadget.container = getDiv(_this.dom.container, "zFrameGadget");
            _this.dom.gadget.items = {};
            enableBtn(_this.dom.left.siteName);
            enableBtn(_this.dom.left.siteVersion);
            enableBtn(_this.dom.left.miniBtn);
            enableBtn(_this.dom.right.setting);
            enableBtn(_this.dom.right.feedback);
            // >> Static styles.
            $(".zBtn").live("mouseenter", function() {
                $(this).css({
                    background: _this.getColor("light")
                })
            }).live("mouseleave", function() {
                $(this).css({
                    background: _this.getColor("pure")
                })
            }).live("mousedown touchstart", function() {
                $(this).css({
                    background: _this.getColor("dark")
                });
            }).live("mouseup touchend", function() {
                $(this).css({
                    background: _this.getColor("light")
                });
            });
            $(_this.dom.base).css({
                height: "30px",
                position: "fixed",
                bottom: "0",
                left: 0,
                "-webkit-box-shadow": "0 0 2px 2px rgba(0,0,0,.2)",
                "box-shadow": "0 0 2px 2px rgba(0,0,0,.2)"
            });
            $(_this.dom.left.container).css({
                float: "left"
            });
            $(_this.dom.left.container).add(_this.dom.right.container).children().css({
                float: "left",
                height: "20px",
                lineHeight: "16px",
                fontFamily: "'Microsoft YaHei', 微软雅黑, tahoma, arial, simsun, 宋体",
                fontSize: "12px",
                color: _this.getColor("text"),
                cursor: "default"
            })
            $(_this.dom.left.miniBtn).css({

            });
            $(_this.dom.left.siteName).html(_this.siteName);
            $(_this.dom.left.siteVersion).html(_this.siteVersion);

            $(_this.dom.right.container).css({
                float: "right"
            });

            // >> Repaint.
            _this.repaint = function() {
                // TODO: implement.
                // Calculation
                // NOTE: offsetDimensions do not include scrollbar.
                var htmlWidth = document.documentElement.offsetWidth;
                var htmlHeight = document.documentElement.offsetHeight;
                // >> zFrameBase.
                $(_this.dom.base).css({
                    width: htmlWidth,
                    background: _this.getColor("pure")
                });
            };
            _this.repaint();
            $(window).resize(function() {_this.repaint();});

            // Set initialized signal.
            _this.initialized = true;
        });
    };
    var newFrame = new zFrame({ // MODIFY: Change settings here.
        siteName: "AcFun趋势",
        siteVersion: "Ver 3.0.0"
    });
    if (newFrame.failed) {
        console.log("zFrame object failed to create.");
        return null;
    } else {
        delete newFrame.failed;
        console.log("zFrame object created.");
        console.dir(newFrame);
        return newFrame;
    }
})();

// Tests
__.refreshLastUpdate();
console.log(__.lastUpdate);
