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
var __ = (function () {
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
        this.constant = {
            TICK_INTERVAL: 50,
            BROADCAST_COOLDOWN: 30000,
            BROADCAST_INTERVAL: 8000,
            LOG_INTERVAL: 6000,
            LOG_INTERRUPT: 500
        }
        this.utility = {
            getCurrentDatetime: function () {
                var d = new Date();
                return "" +
                    (d.getFullYear()) + "-" +
                    (d.getMonth() > 9 ? "" : "0") + d.getMonth() + "-" +
                    (d.getDate() > 9 ? "" : "0") + d.getDate() + " " +
                    (d.getHours() > 9 ? "" : "0") + d.getHours() + ":" +
                    (d.getMinutes() > 9 ? "" : "0") + d.getMinutes() + ":" +
                    (d.getSeconds() > 9 ? "" : "0") + d.getSeconds();
            },
            indexOfArray: function (arr, needle) {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] === needle) {
                        return i;
                    }
                }
                return -1;
            },
            getHtmlLevel: function () {
                var htmlWidth = document.documentElement.offsetWidth;
                return htmlWidth <= 480 ? 1 : (htmlWidth <= 1024 ? 2 : (htmlWidth <= 1440 ? 3 : 4))
            },
            textHidden: function(div) {
                $(div).wrapInner("<div></div>");
                var hidden = $(div).height() < $(div).children('div').height();
                $(div).children('div').replaceWith($(div).children('div').html());
                return hidden;
            }
        }
        var parameterList = {
            siteName: {},
            siteVersion: {},
            siteLocation: {
                default: "未知位置"
            },
            lastUpdateText: {
                default: "更新于"
            },
            colorScheme: {
                default: "blue"
            },
            zIntl: {
                default: false
            },
            toggleList: {
                default: {}
            },
            toggleChosen: {
                default: null
            },
            notification: {
                default: {
                    broadcastList: [],
                    logList: []
                }
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
        this.notification.broadcastIndex = 0;
        this.notification.broadcastTime = 0;
        this.notification.broadcastCooldown = this.constant.BROADCAST_COOLDOWN;
        this.notification.logIndex = 0;
        this.notification.logTime = 0;
        this.lastUpdate = "尚未更新";
        this.initialized = false;

        // Getter and Setter.
        this.getColor = function (type) {
            return colorDict[this.colorScheme][type];
        };
        this.refreshLastUpdate = function () {
            this.lastUpdate = this.utility.getCurrentDatetime();
        };
        this.addBroadcast = function (content, link) {
            var newBroadcast = {content: content};
            if (link != undefined) {
                newBroadcast.link = link;
            } else {
                newBroadcast.link = "";
            }
            this.notification.broadcastList.push(newBroadcast);
            this.notification.broadcastCooldown = 0;
        };
        this.addLog = function (content, type) { // type = DEBUG / WARNING / SEVERE
            var newLog = {content: content};
            if (type != undefined) {
                newLog.type = type;
            } else {
                newLog.type = "DEBUG";
            }
            this.notification.logList.push(newLog);
        }
        this.isBroadcast = function () {
            return _this.notification.broadcastList.length > 0 && _this.notification.broadcastCooldown == 0
                && ((_this.notification.broadcastIndex < _this.notification.broadcastList.length - 1) ||
                (_this.notification.broadcastIndex == _this.notification.broadcastList.length - 1
                    && _this.notification.broadcastTime < _this.constant.BROADCAST_INTERVAL) ||
                (_this.notification.broadcastCooldown < _this.constant.BROADCAST_COOLDOWN));
        }
        this.isLog = function () {
            return _this.notification.logList.length > 0 &&
                ((_this.notification.logIndex < _this.notification.logList.length - 1) ||
                    (_this.notification.logIndex == _this.notification.logList.length - 1
                        && _this.notification.logTime < _this.constant.LOG_INTERVAL));
        }
        this.isNotify = function () {
            return this.isBroadcast() || this.isLog();
        };

        var _this = this;
        $(document).ready(function () {
            // Draw UI
            // >> Initialize.
            var getDiv = function (parent, id, title) {
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
            var enableBtn = function (div, fn) {
                $(div).addClass("zBtn");
                if (fn != undefined) {
                    if (typeof fn === "function") {
                        div.callback = fn;
                    } else {
                        div.callback = function () {
                        };
                        console.warn("Invalid function parameter:");
                        console.dir(fn);
                    }
                } else {
                    div.callback = function () {
                    };
                }
            }
            var disableeBtn = function (div, css) {
                $(div).removeClass("zBtn");
                if (div.hasOwnProperty("callback")) {
                    delete div.callback;
                }
                if (css != undefined) {
                    $(div).css(css);
                }
            }
            var addIcon = function (div, type) {
                var icon = getDiv(div, div.id + "Icon");
                div.icon = icon;
                $(icon).addClass("icon " + type);
            }
            _this.dom = {
                container: {},
                base: {},
                left: {},
                right: {toggle: {btnList: {}}},
                notification: {},
                progressBar: {},
                gadget: {}
            }
            _this.dom.container = getDiv(document.body, "zFrame");
            _this.dom.base = getDiv(_this.dom.container, "zFrameBase");
            _this.dom.left.container = getDiv(_this.dom.base, "zFrameLeft");
            _this.dom.left.homepageBtn = getDiv(_this.dom.left.container, "zFrameHomepageBtn");
            _this.dom.left.siteName = getDiv(_this.dom.left.container, "zFrameSiteName");
            _this.dom.left.siteVersion = getDiv(_this.dom.left.container, "zFrameSiteVersion");
            _this.dom.left.lastUpdate = getDiv(_this.dom.left.container, "zFrameLastUpdate");
            _this.dom.left.miniBtn = getDiv(_this.dom.left.container, "zFrameLeftMiniBtn", "详细");
            _this.dom.right.container = getDiv(_this.dom.base, "zFrameRight");
            _this.dom.right.toggle.container = getDiv(_this.dom.right.container, "zFrameToggle");
            _this.dom.right.location = getDiv(_this.dom.right.container, "zFrameRightLocation");
            _this.dom.right.setting = getDiv(_this.dom.right.container, "zFrameRightSetting", "设置");
            _this.dom.right.feedback = getDiv(_this.dom.right.container, "zFrameRightFeedback", "反馈");
            _this.dom.notification.container = getDiv(_this.dom.container, "zFrameNotification");
            _this.dom.notification.content = getDiv(_this.dom.notification.container, "zFrameNotificationContent");
            _this.dom.progressBar = getDiv(_this.dom.container, "zFrameProgressBar");
            _this.dom.gadget.container = getDiv(_this.dom.container, "zFrameGadget");
            _this.dom.gadget.items = {};
            enableBtn(_this.dom.left.homepageBtn);
            enableBtn(_this.dom.left.siteName);
            enableBtn(_this.dom.left.siteVersion);
            enableBtn(_this.dom.left.miniBtn);
            enableBtn(_this.dom.right.setting);
            enableBtn(_this.dom.right.feedback);
            addIcon(_this.dom.left.homepageBtn, "homepage");
            addIcon(_this.dom.left.miniBtn, "more-info");
            addIcon(_this.dom.right.setting, "setting");
            addIcon(_this.dom.right.feedback, "feedback");
            // >> Bind Actions.
            var isToggleChosen = function (item) {
                if ($(item).parent().is($(_this.dom.right.toggle.container))) {
                    if (item.toggleName == _this.toggleChosen) {
                        return true;
                    }
                }
                return false;
            };
            $(".zBtn").live("mouseenter",function () {
                if (isToggleChosen(this)) {
                    return;
                }
                $(this).css({
                    background: _this.getColor("light")
                })
            }).live("mouseleave",function () {
                if (isToggleChosen(this)) {
                    return;
                }
                $(this).css({
                    background: this.hasOwnProperty("originalColor") ? this.originalColor : "transparent"
                })
            }).live("mousedown touchstart",function () {
                $(this).css({
                    background: _this.getColor("dark")
                });
            }).live("mouseup touchend", function () {
                if (isToggleChosen(this)) {
                    return;
                }
                this.callback();
                $(this).css({
                    background: _this.getColor("light")
                });
            });
            // >> Static styles.
            $(_this.dom.container).css({
                "user-select": "none",
                "-webkit-user-select": "none",
                "-moz-user-select": "none",
                "-ms-user-select": "none",
                "-khtml-user-select": "none",
                "-webkit-touch-callout": "none",
                fontFamily: "'Microsoft YaHei', 微软雅黑, tahoma, arial, simsun, 宋体",
                fontSize: "12px",
                color: _this.getColor("text"),
                cursor: "default"
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
            $(_this.dom.left.siteName).html(_this.siteName);
            $(_this.dom.left.siteVersion).html(_this.siteVersion);

            $(_this.dom.right.container).css({
                float: "right"
            });
            $(_this.dom.notification.container).css({
                position: "fixed",
                height: "30px",
                display: "none"
            });
            $(_this.dom.notification.content).css({
                height: "16px",
                lineHeight: "16px",
                padding: "0 5px",
                marginTop: "5px",
                wordWrap: "break-word",
                overflow: "hidden",
                zIndex: 2
            });

            // >> Repaint.
            _this.repaint = function () {
                // TODO: implement.
                // >> >> Calculation
                // NOTE: offsetDimensions do not include scrollbar.
                var htmlWidth = document.documentElement.offsetWidth;
                var htmlHeight = document.documentElement.offsetHeight;
                var htmlLevel = _this.utility.getHtmlLevel();
                // >> >> zFrameBase.
                $(_this.dom.base).css({
                    width: htmlWidth,
                    background: _this.getColor("pure")
                });

                // >> >> zFrameLastUpdate.
                $(_this.dom.left.lastUpdate).html(_this.lastUpdateText + ": " + _this.lastUpdate);
                // >> >> zFrameToggle.
                // >> >> >> Hide toggle container if no toggle exist.
                if (_this.toggleList.length == 0) {
                    $(_this.dom.right.toggle.container).css({display: "none"});
                }
                // >> >> >> Delete all toggles that no longer exist.
                for (var eachToggleBtnName in _this.dom.right.toggle.btnList) {
                    var eachToggleBtn = _this.dom.right.toggle.btnList[eachToggleBtnName];
                    if (!_this.toggleList.hasOwnProperty(eachToggleBtnName)) {
                        $(eachToggleBtn).remove();
                        delete _this.dom.right.toggle.btnList[eachToggleBtnName];
                    }
                }
                // >> >> >> Insert all toggles that is not yet displayed.
                for (var eachToggleBtnName in _this.toggleList) {
                    var eachToggleBtn = _this.toggleList[eachToggleBtnName];
                    if (!_this.dom.right.toggle.btnList.hasOwnProperty(eachToggleBtnName)) {
                        var newBtn = getDiv(_this.dom.right.toggle.container,
                            "zFrameToggleBtn-" + eachToggleBtnName, eachToggleBtn.title);
                        newBtn.toggleName = eachToggleBtnName;
                        if (eachToggleBtn.hasOwnProperty("hideLevel")) {
                            newBtn.hideLevel = eachToggleBtn.hideLevel;
                        } else {
                            newBtn.hideLevel = [];
                        }
                        $(newBtn).css({
                            float: "left",
                            height: "30px",
                            padding: "5px"
                        });
                        if (eachToggleBtn.hasOwnProperty("func")) {
                            enableBtn(newBtn, eachToggleBtn.func);
                        } else {
                            enableBtn(newBtn);
                        }
                        addIcon(newBtn, eachToggleBtnName);
                        _this.dom.right.toggle.btnList[eachToggleBtnName] = newBtn;
                    }
                }
                // >> >> >> Highlight the chosen toggle.
                if (_this.toggleChosen != undefined) {
                    if (_this.dom.right.toggle.btnList.hasOwnProperty(_this.toggleChosen)) {
                        $(_this.dom.right.toggle.btnList[_this.toggleChosen]).css({
                            background: _this.getColor("dark")
                        });
                    }
                }
                // >> >> zFrameRightLocation.
                $(_this.dom.right.location).html(_this.siteLocation);

                // >> >> Stylize for dom.left and dom.right
                $(_this.dom.left.container).add(_this.dom.right.container).children().css({
                    float: "left",
                    height: "20px",
                    padding: "5px",
                    lineHeight: "16px"
                });
                $(_this.dom.right.toggle.container).css({
                    padding: 0
                });
                // >> >> Responsive.
                // >> >> >> Hide or show toggle buttons.
                for (eachToggleBtnName in _this.dom.right.toggle.btnList) {
                    var eachToggleBtn = _this.dom.right.toggle.btnList[eachToggleBtnName];
                    if (_this.utility.indexOfArray(eachToggleBtn.hideLevel, htmlLevel) > -1) {
                        $(eachToggleBtn).css({display: "none"});
                    } else {
                        $(eachToggleBtn).css({display: "block"});
                    }
                }
                // >> >> >> Deal with dom.left part.
                var domLeftText = $(_this.dom.left.siteName)
                    .add(_this.dom.left.siteVersion)
                    .add(_this.dom.left.lastUpdate);
                if (htmlLevel == 4 || htmlLevel == 2) {
                    domLeftText.css({display: "block"});
                    if (htmlLevel == 2) {
                        $(_this.dom.left.lastUpdate).css({display: "none"});
                    }
                    $(_this.dom.left.miniBtn).css({display: "none"});
                } else {
                    domLeftText.css({display: "none"});
                    $(_this.dom.left.miniBtn).css({display: "block"});
                }
                // >> >> >> Deal with dom.notification part.
                if (htmlLevel <= 2) {
                    $(_this.dom.notification.container).css({
                        bottom: "30px",
                        left: 0,
                        width: htmlWidth,
                        textAlign: "center",
                        background: _this.getColor("gray"),
                        "-webkit-box-shadow": "0 0 2px 2px rgba(0,0,0,.2)",
                        "box-shadow": "0 0 2px 2px rgba(0,0,0,.2)",
                        zIndex: -1
                    });
                    _this.dom.notification.container.originalColor = _this.getColor("gray");
                } else {
                    $(_this.dom.notification.container).css({
                        bottom: 0,
                        left: $(_this.dom.left.container).width(),
                        width: htmlWidth - 10 -
                            $(_this.dom.left.container).width() - $(_this.dom.right.container).width(),
                        textAlign: "right",
                        background: "transparent",
                        "-webkit-box-shadow": "none",
                        "box-shadow": "none",
                        zIndex: 1
                    });
                    _this.dom.notification.container.originalColor = "transparent";
                }

            };
            _this.repaint();
            $(window).resize(function () {
                _this.repaint();
            });

            // >> Tick.
            // >> >> Task tick.

            // >> >> Notification tick.
            var prevNotify = false;
            window.setInterval(function () {
                if (_this.isNotify()) {
                    var notificationText = "";
                    // >> >> >> Animate in.
                    if (!prevNotify) {
                        $(_this.dom.notification.container).stop().fadeIn(400, function() {
                            $(this).css({opacity: 1, display: "block"});
                        });
                    }
                    // >> >> >> Logs.
                    if (_this.isLog()) {
                        // TODO: Deal with log.type
                        notificationText += _this.notification.logList[_this.notification.logIndex].content;
                        if ((_this.notification.logIndex < _this.notification.logList.length - 1 &&
                            _this.notification.logTime > _this.constant.LOG_INTERRUPT) ||
                            _this.notification.logTime >= _this.constant.LOG_INTERVAL) {
                            _this.notification.logIndex++;
                            _this.notification.logTime = 0;
                        } else {
                            _this.notification.logTime += _this.constant.TICK_INTERVAL;
                        }
                        if (_this.isBroadcast()) {
                            notificationText += " - ";
                        }
                    }
                    // >> >> >> Broadcasts.
                    if (_this.isBroadcast()) {
                        // TODO: Deal with broadcast.link
                        notificationText += _this.notification.broadcastList[_this.notification.broadcastIndex].content;
                        if (_this.notification.broadcastTime >= _this.constant.BROADCAST_INTERVAL) {
                            _this.notification.broadcastIndex++;
                            _this.notification.broadcastTime = 0;
                        } else {
                            _this.notification.broadcastTime += _this.constant.TICK_INTERVAL;
                        }
                        if (_this.notification.broadcastIndex == _this.notification.broadcastList.length) {
                            _this.notification.broadcastCooldown = _this.constant.BROADCAST_COOLDOWN;
                            _this.notification.broadcastIndex = 0;
                            _this.notification.broadcastTime = 0;
                        }
                    }
                    // >> >> >> Change html.
                    $(_this.dom.notification.content).html(notificationText);
                    if (_this.utility.textHidden(_this.dom.notification.content)) {
                        enableBtn(_this.dom.notification.container, function() {
                            alert(notificationText);
                        });
                    } else {
                        disableeBtn(_this.dom.notification.container);
                    }
                    // >> >> >> Change prevNotify.
                    prevNotify = true;
                } else {
                    // >> >> >> Animate out.
                    if (prevNotify) {
                        $(_this.dom.notification.container).stop().fadeOut(200);
                    }
                    // >> >> >> Broadcasts.
                    _this.notification.broadcastCooldown -= _this.constant.TICK_INTERVAL;
                    // >> >> >> Change prevNotify.
                    prevNotify = false;
                }
            }, _this.constant.TICK_INTERVAL);
            // Set initialized signal.
            _this.initialized = true;
            console.log("zFrame object initialized.");
        });
    };
    var newFrame = new zFrame({ // MODIFY: Change settings here.
        siteName: "AcFun趋势",
        siteVersion: "Ver 3.0.0",
        lastUpdateText: "数据更新于",
        toggleList: {
            // TODO: Use func property to bind functions.
            "view-card": {title: "摘要模式"},
            "view-list": {title: "列表模式", hideLevel: [1]},
            "view-grid": {title: "网格模式"}
        },
        toggleChosen: "view-card"
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
__.addLog("WELCOME TO THE ACFUN TREND!WELCOME TO THE ACFUN TREND!WELCOME TO THE ACFUN TREND!");
window.setTimeout(function() {
    __.addLog("ABCDEFGHIJKLMNOPQ");
    window.setTimeout(function() {
        __.addLog("测试一下中文看是看不到的应该是看不到的应该是看不该是看不到的");
    }, 1000);
    window.setTimeout(function() {
        __.addBroadcast("TestItOut!!!")
    }, 500);
}, 6550)
console.log(__.isNotify());
console.log(__.lastUpdate);
