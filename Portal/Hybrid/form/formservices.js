angular.module("formApp.services", [])

.service("fcommonJS", function ($ionicModal, $http, $ionicLoading, $cordovaToast,
                                 $ionicPopup, $cordovaFileTransfer, $cordovaFileOpener2, $timeout, $cordovaNetwork) {
      this.loadingShow = function (msg) {
          if (!msg) msg = "<ion-spinner icon=\"bubbles\" class=\"centerscreen spinner-balanced\"></ion-spinner>";
          $ionicLoading.show({
              template: msg,
              duration: 6 * 1000
          }); // ionic内置插件，显示等待框
      };
      this.loadingHide = function () {
          $ionicLoading.hide();
      };

      // 从 JSON 字符串转换为 JS 日期
      this.getDateFromJOSN = function (value) {
          value = value.replace(/\/Date\((\d+)\)\//gi, '$1');

          var date = new Date();
          date.setTime(value);
          return date;
      };
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
      // 检查是否在线
        this.checkOnline = function () {
            if (window.plugins) {
                if (!$cordovaNetwork.isOnline()) {
                    this.showShortTop("您处理离线状态，请检查网络！");
                    return false;
                }
                ;
            }
            return true;
        };
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
          debugger;
          var storagePath = "";
          if (platform.toLowerCase().indexOf("android") > -1) {
              storagePath = "file:///storage/sdcard0/Download/H3.apk";
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
                console.log(ex.Message);
                $scope.$broadcast("scroll.refreshComplete");
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
              title: "检测到新版本",
              template: msg,
              cancelText: cancelText,
              okText: okText
          });
          confirmPopup.then(function (result) {
              if (result) {
                  callback.call(this);
              }
              else {
                  cancel.call(this);
              }
          })
      };
      // 处理微信单点登录
      this.getUrlParam = function (name) {
          var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
          var r = window.location.search.substr(1).match(reg);
          if (r != null) return unescape(r[2]); return null;
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

