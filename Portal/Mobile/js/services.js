services.service("commonJS", function ($rootScope, $ionicModal, $http, $ionicLoading, $cordovaToast, $state,
                                 $ionicPopup, $cordovaFileTransfer, $cordovaFileOpener2,$ionicPickerI18n, $timeout, $cordovaNetwork, $ionicPopover) {
    this.loadingShow = function (msg) {
        if (!msg) msg = "<span class=\"lodingspan f13\"><ion-spinner icon=\"ios\" class=\"centerscreen spinner-light  \"></ion-spinner><span>{{languages.moreData}}</span></span>";
        $ionicLoading.show({
            template: msg,
            //duration: 6 * 1000,
        }); // ionic内置插件，显示等待框
    };
    this.loadingHide = function () {
        $ionicLoading.hide();
    };
    //语言切换
    this.setLanguages = function () {
        var lang = window.localStorage.getItem('H3.Language') || 'zh_cn';
        console.log(lang);
        if (lang == 'en_us') {
            $rootScope.languages = config.languages.en;
            $ionicPickerI18n.weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            $ionicPickerI18n.months = ["Jan", "Fed", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Otc", "Nov", "Dec"];
            $ionicPickerI18n.ok = "OK";
            $ionicPickerI18n.cancel = "Clear";
            $ionicPickerI18n.okClass = "button-balanced";
            // $ionicPickerI18n.cancelClass = "button-balanced";

        } else if (lang == 'zh_cn') {
            $rootScope.languages = config.languages.zh;
            $ionicPickerI18n.weekdays = ["日", "一", "二", "三", "四", "五", "六"];
            $ionicPickerI18n.months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
            $ionicPickerI18n.ok = "确定";
            $ionicPickerI18n.cancel = "取消";
            $ionicPickerI18n.okClass = "button-balanced";
            // $ionicPickerI18n.cancelClass = "button-balanced";
        }
       
    }
    //时间比较
    this.timeCheck = function (time1, time2) {
        return new Date(time1).getTime() > new Date(time2).getTime();
    }
    this.getHttpData = function (url, params) {
        if (params) {
            return $http({ url: url, params: params });
        }
        return $http.jsonp(url);
    }
    //打开任务表单
    this.GetWorkItemSheetUrl = function ($scope, url, workItemId) { 
        var that = this;
        // that.loadingShow();
        var paramString = JSON.stringify(this.getUrlVars(url));
        $http({
            url: url.split("WorkItemSheets.html")[0] + "/WorkItemSheets/WorkItemSheets",
            params: { paramString: paramString }
        })
        .success(function (data) {
            if (data.Success) {
                var url = $scope.setting.httpUrl.toLocaleLowerCase().split(config.portalroot.toLocaleLowerCase())[0] + data.Message;
                that.openWorkItem($scope, url, workItemId)
            } else {
                that.TimeoutHandler(data);
            }
        })
        .error(function (data) { })
    }
    //打开发起流程表单
    this.OpenStartInstanceSheet = function ($scope, url) {
        var that = this;
        // that.loadingShow();
        var paramString = JSON.stringify(this.getUrlVars(url));
        $http({
            url: url.split("StartInstance.html")[0] + "/StartInstance/StartInstance",
            params: { paramString: paramString }
        })
        .success(function (data) {
            if (data.Success) {
                var url = $scope.setting.httpUrl.toLocaleLowerCase().split(config.portalroot.toLocaleLowerCase())[0] + data.Message;
                that.openWorkItem($scope, url)
            } else {
                that.TimeoutHandler(data);
            }
        })
        .error(function (data) { })
    }
    //objs代表obj.WorkItems
    this.checkTinmeSpan = function (objs) {
        if (objs && !angular.equals([], objs)) {
            objs.forEach(function (n, i) {
                if (n.Summary && !angular.equals([], n.Summary)) {
                    n.Summary.forEach(function (x, y) {
                        if (x.Type == "TimeSpan") {
                            var timespan = {};
                            var text = x.Value;
                            if (text) {
                                var pointIndex = text.indexOf("$");
                                var time = text;
                                if (pointIndex > -1) {
                                    timespan.day = parseInt(text.substring(0, pointIndex));
                                    time = text.substring(pointIndex + 1);
                                }
                                var timeArray = time.split(":");
                                if (timeArray && timeArray.length == 3) {
                                    if (timeArray[0].split(".").length == 2) {
                                        timespan.day = parseInt(timeArray[0].split(".")[0]);
                                        timespan.hour = parseInt(timeArray[0].split(".")[1]);
                                    } else {
                                        timespan.hour = parseInt(timeArray[0]);
                                    }
                                    timespan.minute = parseInt(timeArray[1]);
                                    timespan.second = parseInt(timeArray[2]);
                                }
                            }
                            if (!timespan.day) { timespan.day = 0; }
                            if (!timespan.hour) { timespan.hour = 0; }
                            if (!timespan.minute) { timespan.minute = 0; }
                            if (!timespan.second) { timespan.second = 0; }
                            x.Value = timespan.day + $rootScope.languages.Time.Day + timespan.hour + $rootScope.languages.Time.Hour + timespan.minute + $rootScope.languages.Time.Minute + timespan.second + $rootScope.languages.Time.Second;
                          //  console.log("x.value...." + x.Value);
                        }
                    });
                }
            });
        }
        return objs;
    }
    //打开流程表单
    this.OpenInstanceSheet = function ($scope, url, InstanceId) {
        var that = this;
        // that.loadingShow();
        var paramString = JSON.stringify(this.getUrlVars(url));
        $http({
            url: url.split("InstanceSheets.html")[0] + "/InstanceSheets/InstanceSheets",
            params: { paramString: paramString }
        })
        .success(function (data) {
            if (data.Success) {
                if (data.Extend == "Redirect") {
                    var url = $scope.setting.httpUrl.toLocaleLowerCase().split(config.portalroot.toLocaleLowerCase())[0] + data.Message;
                    that.openWorkItem($scope, url);
                } else {
                    $rootScope.mulSheets = data.Extend;
                    $state.go("mulSheets", {}, { reload: true });
                }
            } else {
                that.TimeoutHandler(data);
            }
        })
        .error(function (data) { })
    }
    //打开业务对象表单
    this.OpenBizObjectUrl = function ($scope, url) {
        //TODO:增加跨域请求
        var that = this;
        // that.loadingShow();
        $http({
            url: url
        })
        .success(function (data) {
            if (data.Success) {
                var url = $scope.setting.httpUrl.toLocaleLowerCase().split(config.portalroot.toLocaleLowerCase())[0] + data.Extend;
                that.openWorkItem($scope, url)
            } else {
                that.TimeoutHandler(data);
            }
        })
        .error(function (data) { })
    }

    //登陆超时处理
    this.TimeoutHandler = function (data) {
        $ionicLoading.hide();//隐藏前操作带来的提示
        if (dd && dd.version) {
            if (data.Message != undefined&&data.Message != "" && data.Message != null) {
                alert($rootScope.languages.loginValidate);
            } else { 
                alert($rootScope.languages.loginExit);
            }
            $timeout(function () {
                dd.biz.navigation.close({});
            }, 1000)
        } else if (typeof (WeixinJSBridge) != "undefined") {
            if (data.Message != undefined && data.Message != "" && data.Message != null) {
                alert($rootScope.languages.loginValidate);
            } else {
                alert($rootScope.languages.loginExit);
            } 
            $timeout(function () {
                WeixinJSBridge.call("closeWindow");
            }, 1000)
        } else if ($rootScope.loginfrom == "app" ||!$rootScope.loginfrom) {
            if (data.Message != undefined && data.Message != "" && data.Message != null) {
                alert($rootScope.languages.loginValidate);
            } else {
                alert($rootScope.languages.loginExit);
            }
            $state.go("login");
        }
    }
    //单点登录失败处理
    this.MsgErrorHandler = function (stetus) {
        //提示信息
        $ionicLoading.show({
            template: '<span class="setcommon f15">' + stetus + '</span>',
            duration: 2 * 1000,
            animation: 'fade-in',
            showBackdrop: false,
        });
        if ($rootScope.loginfrom == "dingtalk" && dd) {
            $timeout(function () {
                dd.biz.navigation.close({});
            }, 1000)
        } else if ($rootScope.loginfrom == "wechat" && typeof (WeixinJSBridge) != "undefined") {
            $timeout(function () {
                WeixinJSBridge.call("closeWindow");
            }, 1000)
        } else if ($rootScope.loginfrom == "app" ||!$rootScope.loginfrom) {
            $state.go("login");
        }
    }
    //获取url参数
    this.getUrlVars = function (url) {
        var vars = {};
        var hash;
        var hashs = url.slice(url.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashs.length; i++) {
            hash = hashs[i].split('=');
            vars[hash[0]] = hash[1];
        }
        return vars;
    }
    // 从 JSON 字符串转换为 JS 日期
    this.getDateFromJOSN = function (value) {
        value = value.replace(/\/Date\((\d+)\)\//gi, '$1');
        var date = new Date();
        date.setTime(value);
        return date;
    };
    //
    this.showShortTop = function (msg) {
        if (window.plugins) {
            $cordovaToast.showShortTop(msg);
        }
        else {
            $ionicLoading.show({
                template: msg,
                duration: 2 * 1000
            });
        }
    },
     this.showShortMsg = function (style,msg,time) {
         $ionicLoading.show({
             template: '<span class="' + style + '">' + msg + '</span>',
             duration: time,
             animation: 'fade-in',
             showBackdrop: false,
         });
     },
    // 检查是否在线
    this.checkOnline = function () {
        if (window.plugins) {
            if (!$cordovaNetwork.isOnline()) {
                this.showShortTop($rootScope.languages.checkNetWork);//("您处理离线状态，请检查网络！");
                return false;
            }
        }
        return true;
    };
    // 打开当前待办
    this.openWorkItem = function ($scope, worksheetUrl, workItemId, transitionstyle) {
        // 如果是App端，那么使用 InAppBrowser 方式打开
        var sourceUrl = window.location.hash.slice(1);
        worksheetUrl = worksheetUrl + "&sourceUrl=" + sourceUrl + "&loginfrom=" + $rootScope.loginfrom + "&T=" + new Date().getTime();
        console.log("WorkItemUrl: "+worksheetUrl);
        var that = this;
        if (window.plugins) {
            // 离线检测
            console.log("check online...");
            if (!this.checkOnline()) {
                $scope.clientInfo.isOffline = true;
                return;
            }
            var hidden = "yes";
            if (!transitionstyle) {
                transitionstyle = "coververtical";
                hidden = "no";
            }
            that.loadingShow();
            var errorUrl = "";
            console.log("open url,errorUrl=" + errorUrl);
            $scope.ref = window.open(worksheetUrl, "_blank",
              "location=no,closebuttoncaption=关闭,hidden=" + hidden + ",hardwareback=yes,EnableViewPortScale=yes,transitionstyle=" + transitionstyle);
            var isSheetView = true;
            $scope.ref.addEventListener("loadstart", function (event) {
                // 监测回到原移动办公主页时，立即关闭当前页
                if (event.url.toLowerCase().indexOf("index.html") > 0) {
                    that.loadingHide();
                    $scope.ref.close();
                    if (workItemId && $scope.refreshUnfinishedWorkItem) {
                        $scope.refreshUnfinishedWorkItem();
                    } else if (workItemId && $scope.RefreshCirculateItem) {
                        $scope.RefreshCirculateItem();
                    }
                } else if (event.url.toLowerCase().indexOf("readattachment/read?") > 0) {
                    that.openAttachment($scope, event.url, worksheetUrl, workItemId, transitionstyle);
                } else if (event.url.toLowerCase().indexOf("tempimages") > 0) {
                    that.openAttachment($scope, event.url);
                }
                console.log("InAppBrowser.loadstart->" + event.url);
            });
            $scope.ref.addEventListener("loadstop", function (event) {
                that.loadingHide();
                $scope.ref.show();
                console.log("InAppBrowser.loadstop->" + event.url);
            });
            $scope.ref.addEventListener("loaderror", function (event) {
                that.loadingHide();
                var url = event.url.toLocaleLowerCase();
                if (url.indexOf("zherp.") > -1) return;
                console.log("InAppBrowser.loaderror->" + event.url);
            });
            $scope.ref.addEventListener("exit", function (event) {
                that.loadingHide();
                if (!isSheetView) {
                    that.openWorkItem($scope, worksheetUrl, workItemId, "crossdissolve");
                } else {
                    //$state.go($state.$current.self.name, {}, { reload: true });
                }
                $scope.refresh();
                console.log("InAppBrowser.exit");
            });
        }
        else if ($rootScope.dingMobile.isDingMobile && dd) {
            document.addEventListener('resume', function () {
                //if ($scope.hasOwnProperty("refreshUnfinishedWorkItem")) {
                //    $scope.refreshUnfinishedWorkItem();
                //} else if ($scope.hasOwnProperty("RefreshCirculateItem")) {
                //    $scope.RefreshCirculateItem();
                //}
                if ($scope.hasOwnProperty("refresh"))
                {
                    $scope.refresh();
                }
                $scope.GetBadge();
            })
            dd.biz.util.openLink({
                url: worksheetUrl + "&loginfrom=dingtalk",
                onSuccess: function (result) { },
                onFail: function (err) { }
            });
        }
        else {
            //微信
            var url = worksheetUrl + "&loginfrom=wechat";
            window.location.href = url;
        }
        that.loadingHide();
    };

    this.openAttachment = function ($scope, attachmentUrl, worksheetUrl, workItemId, transitionstyle) {
        console.log("下载附件");
        var that = this;
        if (window.cordova.InAppBrowser) { 
            if (!this.checkOnline()) {
                $scope.clientInfo.isOffline = true;
                return;
            }
            var hidden = "yes";
            if (!transitionstyle) {
                transitionstyle = "coververtical";
                hidden = "no";
            }
            that.loadingShow();
            $scope.ref = window.open(attachmentUrl, "_system",
              "location=no,closebuttoncaption=关闭,hidden=" + hidden + ",hardwareback=yes,EnableViewPortScale=yes,transitionstyle=" + transitionstyle);
            var isSheetView = true;
            $scope.ref.addEventListener("loadstart", function (event) {
                // 监测回到原移动办公主页时，立即关闭当前页
                if (event.url.toLowerCase().indexOf("index.html") > 0) {
                    that.loadingHide();
                    $scope.ref.close();
                    if (workItemId && $scope.refreshWorkItemId) {
                        $scope.refreshWorkItemId(workItemId);
                    }
                }
                else if (event.url.toLowerCase().indexOf("readattachment/read?") > 0) {
                    that.openAttachment($scope, event.url, worksheetUrl, workItemId, transitionstyle);
                } else if (event.url.toLowerCase().indexOf("tempimages") > 0) {
                    that.openAttachment($scope, event.url);
                }
            });
            $scope.ref.addEventListener("loadstop", function (event) {
                that.loadingHide();
                $scope.ref.show();
                console.log("InAppBrowser.loadstop->" + event.url);
            });
            $scope.ref.addEventListener("exit", function (event) {
                that.loadingHide();
            });
        }
    }

    this.openDateSearch = function ($scope) {
        var templateUrl = "templates/home/dateSpanSearch.html";
        $ionicModal.fromTemplateUrl(templateUrl,
          {
              scope: $scope,
              width: "100%",
              height: "100%",
              animation: "slide-in-up"
          }).then(function (modal) {
              $scope.datemodal = modal;
              window._scope = $scope;
              $scope.datemodal.show();
          });
    }

    this.openDateRangeSelectModal = function ($scope) {
        var templateUrl = "templates/home/dateRangeSelect.html";
        $ionicModal.fromTemplateUrl(templateUrl,
          {
              scope: $scope,
              width: "100%",
              height: "100%",
              animation: "slide-in-up"
          }).then(function (modal) {
              $scope.dateselectmodal = modal;
              window._scope = $scope;
              $scope.dateselectmodal.show();
          });
    }

    // 弹出对话框
    this.alert = function (msg) {
        var alertPopup = $ionicPopup.alert({
            title: "系统提示",
            okText: "确认",
            template: msg
        });
        alertPopup.then(function (res) {
        });
    };
    // 检查升级(入口函数)
    this.checkVersion = function (serviceUrl, platform, version) {
        this.checkVersionFromServer(serviceUrl, platform, version, this.upgrade);
    };
    // 升级动作
    this.upgrade = function (platform, result) {
        var storagePath = "";
        if (platform.toLowerCase().indexOf("android") > -1) {
            storagePath = "file:///storage/sdcard0/Download/H3.apk";
            storagePath = cordova.file.externalRootDirectory + "H3.apk";
        }
        var msg = result.Description;
        var that = this;
        if (result.Confirm) {
            this.confirm("系统提示", msg, "下次再说", "立即升级",
              function () {
                  that.download(result.Url, storagePath, true);
              });
        }
        else {
            this.download(result.Url, storagePath, true);
        }
    };
    // 下载文件
    this.download = function (url, storagePath, open) {
        if (!storagePath) {
            // iOS 直接弹出浏览器转向链接
            console.log("ios upgrade url=" + url);
            window.open(url, "_system", "location=yes");
        }
        else {  // Android 直接下载再打开
            try {
                $cordovaFileTransfer.download(url, storagePath, {}, true)
                  .then(function (result) {
                      // 直接打开下载的文件
                      $ionicLoading.show({
                          template: "已经下载：100%"
                      });

                      $cordovaFileOpener2.open(storagePath, "application/vnd.android.package-archive").then(
                        function () {
                            console.log("open complete");
                        },
                        function (err) {
                            console.log("open error->" + err);
                        }
                      );
                      $ionicLoading.hide();
                  },
                    function (err) {
                        $ionicLoading.hide();
                        console.log("download error->" + err);
                    },
                    function (progress) {
                        //进度，这里使用文字显示下载百分比
                        $timeout(function () {
                            var downloadProgress = (progress.loaded / progress.total) * 100;
                            $ionicLoading.show({
                                template: "已经下载：" + Math.floor(downloadProgress) + "%"
                            });
                            if (downloadProgress > 99) {
                                $ionicLoading.hide();
                            }
                        })
                    });
            }
            catch (e) {
                console.log(e.message);
            }
        }
    };
    // 从服务器检查新的版本
    this.checkVersionFromServer = function (serviceUrl, platform, version) {
        var param = { platform: platform, version: version };
        var that = this;

        var url = serviceUrl + "/CheckVersion?callback=JSON_CALLBACK&platform=" + platform + "&version=" + version;
        $http.jsonp(url)
          .success(function (result) {
              if (that.isNewVersion(version, result.Version)) {
                  that.upgrade(platform, result);
              }
          })
          .error(function (ex) {
              $rootScope.$broadcast("scroll.refreshComplete");
          });
    }
    this.isNewVersion = function (oldVersion, newVersion) {
        var oldArr = oldVersion.split(".");
        var newArr = newVersion.split(".");

        for (var i = 0; i < newArr.length; i++) {
            if (i >= oldArr.length) return true;
            if (parseInt(newArr[i]) > parseInt(oldArr[i])) {
                return true;
            }
            else if (parseInt(newArr[i]) < parseInt(oldArr[i])) {
                return false;
            }
        }
        return newArr.length > oldArr.length;
    };
    // 弹出确认对话框
    this.confirm = function (title, msg, cancelText, okText, callback, cancel) {
        var confirmPopup = $ionicPopup.confirm({
            title: $rootScope.languages.checkNewVersion,
            template: msg,
            cancelText: cancelText,
            okText: okText
        });
        confirmPopup.then(function (result) {
            if (result) {
                if (callback)
                    callback.call(this);
            }
            else {
                if (cancel)
                    cancel.call(this);
            }
        })
    };
    // 获取浏览器参数
    this.getUrlParam = function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]); return null;
    };

    // sideSlip侧滑框
    this.sideSlip = function ($scope, templates,mes,flag) {
        $rootScope.searchItem = true;
        // .fromTemplateUrl() 方法
        var promise;
        promise=$ionicPopover.fromTemplateUrl(templates, {
            scope: $scope
        }).then(function (popover) {
            $scope.popover = popover;
            //初始化筛选页面，以便可以获取页面内的元素
            if (mes) {
               $scope.popover.show();
               $scope.popover.hide();
            }
        });
        $scope.openPopover = function ($event) {
            $scope.popover.show($event);
        };
        $scope.closePopover = function () {
            $scope.popover.hide();
        };
        // 清除浮动框
        $scope.$on('$destroy', function () {
            if ($scope.popover) {
                $scope.popover.remove();
            }
        });
        $scope.$on('popover.shown', function ($event) {
            if ($scope._filterArray) {
                if ($scope._filterArray[$event.currentScope.slectIndex]) $scope._filterArray[$event.currentScope.slectIndex].filterUsers = $event.currentScope.filterUsers;
                $event.currentScope.searchKeyArry = $scope._filterArray;
                $event.currentScope.filter = $event.currentScope.searchKeyArry[$event.currentScope.slectIndex] || {};

            }
            // $event.currentScope.filter = $scope._filter;
            // $scope._filter = {};
        });
        // 在隐藏浮动框后执行
        $scope.$on('popover.hidden', function ($event) {
            // 执行代码
            if ($event.currentScope.filter) {
                if (!$scope._filterArray) {
                    $scope._filterArray = [];
                }
                $scope._filterArray[$event.currentScope.slectIndex] = $event.currentScope.filter;
            }
        });
        // 移除浮动框后执行
        $scope.$on('popover.removed', function ($event) {
            // 执行代码
       
        });
        $scope.stateUser = function (event) {
            $state.go("sheetUser", { displayName: config.languages.current.Filter.originator });
            $scope.filterFlag = true;//判断是否点击过选人控件
            $scope.popover.hide();
        };
 
        if (flag) {
            return promise;
        }
    };

})
  .directive('focusOn', function () {
      return function (scope, elem, attr) {
          scope.$on('focusOn', function (e, name) {
              if (name === attr.focusOn) {
                  elem[0].focus();
              }
          });
      };
  })
  .factory('focus', function ($rootScope, $timeout) {
      return function (name) {
          $timeout(function () {
              $rootScope.$broadcast('focusOn', name);
          });
      }
  });

Date.prototype.Format = function (fmt) { //author: meizz
    var str = fmt;
    var Week = ['日', '一', '二', '三', '四', '五', '六'];
    var month = parseInt(this.getMonth()) + 1;
    str = str.replace(/yyyy|YYYY/, this.getFullYear());
    str = str.replace(/yy|YY/, (this.getYear() % 100) > 9 ? (this.getYear() % 100).toString() : '0' + (this.getYear() % 100));
    str = str.replace(/MM/, month > 9 ? month.toString() : '0' + month);
    str = str.replace(/M/g, month);
    str = str.replace(/w|W/g, Week[this.getDay()]);
    str = str.replace(/dd|DD/, this.getDate() > 9 ? this.getDate().toString() : '0' + this.getDate());
    str = str.replace(/d|D/g, this.getDate());
    str = str.replace(/hh|HH/, this.getHours() > 9 ? this.getHours().toString() : '0' + this.getHours());
    str = str.replace(/h|H/g, this.getHours());
    str = str.replace(/mm/, this.getMinutes() > 9 ? this.getMinutes().toString() : '0' + this.getMinutes());
    str = str.replace(/m/g, this.getMinutes());
    str = str.replace(/ss|SS/, this.getSeconds() > 9 ? this.getSeconds().toString() : '0' + this.getSeconds());
    str = str.replace(/s|S/g, this.getSeconds());

    return str;
}
