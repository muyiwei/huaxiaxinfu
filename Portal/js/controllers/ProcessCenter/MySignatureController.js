//签章设置  
app.controller('MySignatureController', ['$scope', "$rootScope", "$translate", "$http", "$state", "$compile", "$modal", "ControllerConfig", "jq.datables",
function ($scope, $rootScope, $translate, $http, $state, $compile, $modal, ControllerConfig, jqdatables) {
    $scope.getLanguage = function () {
        $scope.LanJson = {
            sLengthMenu: $translate.instant("uidataTable.sLengthMenu"),
            sZeroRecords: $translate.instant("uidataTable.sZeroRecords_NoSignature"),
            sInfo: $translate.instant("uidataTable.sInfo"),
            sProcessing: $translate.instant("uidataTable.sProcessing"),

            Confirm_Delete: $translate.instant("WarnOfNotMetCondition.Confirm_Delete"),
            NoSelectSignatures: $translate.instant("WarnOfNotMetCondition.NoSelectSignatures"),
        }
    }
    $scope.getLanguage();
    // 获取语言
    $rootScope.$on('$translateChangeEnd', function () {
        $scope.getLanguage();
        $state.go($state.$current.self.name, {}, { reload: true });
    });

    $scope.getColumns = function () {
        var columns = [];
        columns.push({
            "mData": "ObjectID",
            "mRender": function (data, type, full) {
                return "<input type=\"checkbox\" class=\"SignatureItem\" ng-checked=\"checkAll\" data-id=\"" + data + "\">";
            }
        });
        columns.push({ "mData": "Name" });
        columns.push({
            "mData": "Icon",
            "mRender": function (data, type, full) {
                return "<span><img src='" + data + "' style='width:46px;height:46px'></img></span>";
            }
        });
        columns.push({
            "mData": "SortKey",
            "mRender": function (data, type, full) {
                return "<label>" + data + "</label>";
            }
        });
        columns.push({
            "mData": "IsDefault",
            "mRender": function (data, type, full) {
                var id = full.ObjectID;
                var isDefault = "";
                if (data)
                    isDefault = "IsDefault";
                return "<input type=\"checkbox\" class=\"" + isDefault + "\" data-id=\"" + id + "\" ng-click=\"SetDefault('" + full.ObjectID + "')\"></input>";
            }
        });
        return columns;
    }
    $scope.tabMySignature = {
        "bProcessing": true,
        "bServerSide": false,    // 是否读取服务器分页
        "paging": false,         // 是否启用分页
        "bPaginate": false,      // 分页按钮  
        "bLengthChange": false, // 每页显示多少数据
        "bFilter": false,        // 是否显示搜索栏  
        "searchDelay": 1000,    // 延迟搜索
        "iDisplayLength": 5,   // 每页显示行数  
        "bSort": false,         // 排序  
        "singleSelect": true,
        "bInfo": true,          // Showing 1 to 10 of 23 entries 总记录数没也显示多少等信息  
        "pagingType": "full_numbers",  // 设置分页样式，这个是默认的值
        "language": {           // 语言设置
            "sLengthMenu": $scope.LanJson.sLengthMenu,
            "sZeroRecords": "<i class=\"icon-emoticon-smile\"></i>" + $scope.LanJson.sZeroRecords,
            "sInfo": "",//$scope.LanJson.sInfo,
            "infoEmpty": "",
            "sProcessing": "",//$scope.LanJson.sProcessing,
            "paginate": {
                "first": "<<",
                "last": ">>",
                "previous": "<",
                "next": ">"
            }
        },
        "sAjaxSource": ControllerConfig.PersonalInfo.GetSignaureList,
        "fnServerData": function (sSource, aDataSet, fnCallback) {
            $.ajax({
                "dataType": 'json',
                "type": 'POST',
                "url": sSource,
                "data": aDataSet,
                "success": function (json) {
                    if (json.ExceptionCode == 1 && json.Success == false) {
                        json.Rows = [];
                        json.sEcho = 1;
                        json.Total = 0;
                        json.iTotalDisplayRecords = 0;
                        json.iTotalRecords = 0;
                        $state.go("platform.login");
                    }
                    fnCallback(json);
                }
            });
        },
        "sAjaxDataProp": 'Rows',
        "sDom": "<'row'<'col-sm-6'l><'col-sm-6'f>r>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
        "sPaginationType": "full_numbers",
        "fnServerParams": function (aoData) {  // 增加自定义查询条件
            aoData.push(
                { "name": "userId", "value": $scope.user.ObjectID }
                );
        },
        "aoColumns": $scope.getColumns(), // 字段定义
        "initComplete": function (settings, json) {
            var filter = $(".searchContainer");
            filter.find("button").unbind("click.DT").bind("click.DT", function () {
                $("#tabMySignature").dataTable().fnDraw();
            });
        },
        "fnRowCallback": function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
            //签章名字太长添加鼠标提示
            var nameTd = $(nRow).find("td")[1];
            if (nameTd) {
                $(nameTd).attr("title", $(nameTd).text());
            }
            $compile(nRow)($scope);
        },
        "fnDrawCallback": function () {
            jqdatables.trcss();
            var items = angular.element(document.querySelectorAll(".IsDefault"));
            items.attr("checked", "checked")

        }
    }

    $scope.SetDefault = function (SignatureID) {
        var DefaultItem = angular.element(document.querySelectorAll(".IsDefault"));
        var OldSignatureID = "";
        angular.forEach(DefaultItem, function (data, index, array) {
            OldSignatureID = data.getAttribute("data-id");
        });
        var IsDedault = true;
        if (SignatureID == OldSignatureID) {
            IsDedault = false;
        }
        $http({
            url: ControllerConfig.PersonalInfo.SetDefaultSignature,
            params: {
                signaureId: SignatureID,
                isDefault: IsDedault
            }
        })
        .success(function (result, header, config, status) {
            $state.go($state.$current.self.name, {}, { reload: true });
        })
        .error(function (result, header, config, status) {
            $state.go($state.$current.self.name, {}, { reload: true });
        });
    }

    $scope.btn_removeSignature = function () {
        $scope.selectedSignature = "";
        var items = angular.element(document.querySelectorAll(".SignatureItem"));
        angular.forEach(items, function (data, index, array) {
            if (data.checked) {
                $scope.selectedSignature = $scope.selectedSignature + ";" + data.getAttribute("data-id");
            }
        });
        if (!$scope.selectedSignature.length) {
            $.notify({ message: $scope.LanJson.NoSelectSignatures, status: "danger" });
            return;
        }

        // 弹出模态框
        var modalInstance = $modal.open({
            templateUrl: 'template/ProcessCenter/ConfirmModal.html',
            size: "sm",
            controller: function ($scope, $modalInstance) {
                $scope.Title = $translate.instant("WarnOfNotMetCondition.Tips");
                $scope.Message = $translate.instant("WarnOfNotMetCondition.Confirm_Delete");
                $scope.Button_OK = true;
                $scope.Button_OK_Text = $translate.instant("QueryTableColumn.Button_OK");
                $scope.Button_Cancel = true;
                $scope.Button_Cancel_Text = $translate.instant("QueryTableColumn.Button_Cancel");
                $scope.ok = function () {
                    $modalInstance.close();  // 点击确定按钮
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel'); // 退出
                }
            }
        });
        //弹窗点击确定的回调事件
        modalInstance.result.then(function () {
            //删除
            $http({
                url: ControllerConfig.PersonalInfo.RemoveSignature,
                params: {
                    SignaureIds: $scope.selectedSignature
                }
            })
            .success(function (result, header, config, status) {
                $state.go($state.$current.self.name, {}, { reload: true });
            })
            .error(function (result, header, config, status) {
                $state.go($state.$current.self.name, {}, { reload: true });
            });
        });
    }

    $scope.btn_addEditSignature = function () {
        // 弹出模态框
        var modalInstance = $modal.open({
            templateUrl: 'EditSignature.html',    // 指向上面创建的视图
            controller: 'EditSignatureController',// 初始化模态范围
            size: "md",
            resolve: {
                params: function () {
                    return {
                    };
                },
                deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'WFRes/_Scripts/jquery/ajaxfileupload.js',
                         'js/factory/file-reader.js'
                    ]);
                }]
            }
        });
    }
}]);

app.controller("EditSignatureController", ["$scope", "$http", "$state", "$translate", "$modalInstance", "$timeout", "fileReader", "ControllerConfig", function ($scope, $http, $state, $translate, $modalInstance, $timeout, FileReader, ControllerConfig) {
    $scope.LanJson = {
        EditSignatureDetail_AddFailed: $translate.instant("NotEnoughAuth.EditSignatureDetail_AddFailed"),
    }
    $scope.ok = function (SignatureImage) {
        var SignatureData = {
            Name: $scope.Name,
            Description: $scope.Description,
            SortKeyText: $scope.SortKey,
        }
        $scope.saveData(SignatureData);
        if ($scope.imgover || $scope.NoFile || $scope.ErrorFile) {
            $timeout(function () {
                $scope.imgover = false;
                $scope.NoFile = false;
                $scope.ErrorFile = false;
            }, 1000 * 3);
        }
    };

    $scope.saveData = function (SignatureData) {
        if ($scope.CheckFile($("#pic")[0])) {
            $.ajaxFileUpload({
                url: ControllerConfig.PersonalInfo.AddSignature,
                fileElementId: "pic",
                secureuri: false,
                type: "post",
                data: SignatureData,
                dataType: 'json',
                async: false,
                success: function (result) {
                    if (result.Success) {
                        $modalInstance.close();  // 点击保存按钮
                        $state.go($state.$current.self.name, {}, { reload: true });
                    }
                    else if (result.Message == "EditSignatureDetail_ImgOver") {
                        $scope.imgover = true;
                    }
                    else {
                        $modalInstance.close();  // 点击保存按钮
                        $.notify({ message: $scope.LanJson.EditSignatureDetail_AddFailed, status: "danger" });
                    }
                },
                error: function (result) {
                }
            });
        }
    }
    //检查图片
    $scope.CheckFile = function (obj) {
        var fileTypes = new Array("gif", "jpg", "png", "jpeg", 'bmp');
        if (obj.value == "") {
            $scope.NoFile = true;
            return false;
        }
        else {
            var fileContentType = obj.value.match(/^(.*)(\.)(.{1,8})$/)[3];//取文件类型的正则法则
            var isExists = false;
            for (var i in fileTypes) {
                if (fileContentType.toLocaleLowerCase() == fileTypes[i]) {
                    isExists = true;
                    return true;
                }
            }
            if (!isExists) {
                $scope.ErrorFile = true;
                return false;
            }
        }
        return false;
    }
    $scope.getFile = function () {
        FileReader.readAsDataUrl($scope.file, $scope)
        .then(function (result) {
            $scope.imageSrc = result;
        });
    }
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel'); // 退出
    };
}]);

