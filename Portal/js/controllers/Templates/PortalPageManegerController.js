app.controller('PortalPageManegerController', ['$rootScope', '$scope', '$state', "$compile", '$http', '$modal', '$translate', 'ControllerConfig', "jq.datables",
    function ($rootScope, $scope, $state, $compile, $http, $modal, $translate, ControllerConfig, jqdatables) {
       
        $scope.searchKey = "";
        //进入视图触发
        $scope.$on('$viewContentLoaded', function (event) {
            $scope.searchKey = "";
        });
        // 获取语言
        $rootScope.$on('$translateChangeEnd', function () {
            $scope.getLanguage();
            $state.go($state.$current.self.name, {}, { reload: true });
        });

        $scope.getLanguage = function () {
            $scope.LanJson = {
                search: $translate.instant("uidataTable.search"),
                sLengthMenu: $translate.instant("uidataTable.sLengthMenu"),
                sZeroRecords: $translate.instant("uidataTable.sZeroRecords_NoRecords"),
                sInfo: $translate.instant("uidataTable.sInfo"),
                sProcessing: $translate.instant("uidataTable.sProcessing")
            }
        }
        $scope.getLanguage();

        // 获取列定义
        $scope.getColumns = function () {
            var columns = [];
            columns.push({ "mData": "RowNumber", "sClass": "center hide414" });
            columns.push({
                "mData": "Title",
                "sClass": "center hide414",
                "mRender": function (data, type, full) {
                    return "<td ><span  title=\"" + full.Title + "\">" + full.Title + "</span></td>";
                }
            });
            columns.push({
                "mData": "OrgName",
                "sClass": "center hide414",
                "mRender": function (data, type, full) {
                    return "<td ><span  title=\"" + full.OrgName + "\">" + full.OrgName + "</span></td>";
                }
            });
            columns.push({
                "mData": "CreatedName",
                "mRender": function (data, type, full) {
                    return "<td ><span  title=\"" + full.CreatedName + "\">" + full.CreatedName + "</span></td>";
                }
            });
            columns.push({
                "mData": "CreatedTime",
                "sClass": "center hide414",
                "mRender": function (data, type, full) {
                    return "<td ><span  title=\"" + full.CreatedTime + "\">" + full.CreatedTime + "</span></td>";
                }
            });
            columns.push({
                "mData": "LastModifiedTime",
                "sClass": "center hide414",
                "mRender": function (data, type, full) {
                    return "<td ><span  title=\"" + full.LastModifiedTime + "\">" + full.LastModifiedTime + "</span></td>";
                }
            });
            columns.push({
                "mData": "TemplateName",
                "sClass": "center hide414",
                "mRender": function (data, type, full) {
                    return "<td ><span  title=\"" + full.TemplateName + "\">" + full.TemplateName + "</span></td>";
                }
            });
            columns.push({
                "mData": "ObjectID",
                "sClass": "dodgerblue",
                "mRender": function (data, type, full) {
                    return "<td ><a ng-click=\"EditPage('" + full.ObjectID + "')\"><span translate=\"GlobalButton.Update\">修改</span></a> <a ng-click=\"Design('" + full.ObjectID + "')\"><span translate=\"SheetDesigner.SheetDesigner_Design\">设计</span></a> <a ng-click=\"ManageWebParts('" + full.ObjectID + "')\"><span translate=\"PortalTemplates.WebPart\">部件</span></a> <a ng-click=\"RemovePage('" + full.ObjectID + "')\"><span translate=\"EditGlobalData.Delete\">删除</span></a></td>";
                }
            });
           
            return columns;
        }

        $scope.options = function () {
            var options = {
                "bProcessing": true,
                "bServerSide": true,    // 是否读取服务器分页
                "paging": true,         // 是否启用分页
                "bPaginate": true,      // 分页按钮  
                "bLengthChange": false, // 每页显示多少数据
                "bFilter": false,        // 是否显示搜索栏  
                "searchDelay": 1000,    // 延迟搜索
                "iDisplayLength": 10,   // 每页显示行数  
                "bSort": false,         // 排序
                "singleSelect": true,
                "bInfo": true,          // Showing 1 to 10 of 23 entries 总记录数没也显示多少等信息  
                "pagingType": "full_numbers",  // 设置分页样式，这个是默认的值
                "language": {           // 语言设置
                    "sLengthMenu": $scope.LanJson.sLengthMenu,
                    "sInfo": $scope.LanJson.sInfo,
                    "sZeroRecords": "<i class=\"icon-emoticon-smile\"></i>" + $scope.LanJson.sZeroRecords,
                    "infoEmpty": "",
                    "sProcessing": $scope.LanJson.sProcessing,
                    "paginate": {
                        "first": "<<",
                        "last": ">>",
                        "previous": "<",
                        "next": ">"
                    }
                },
                "sAjaxSource": ControllerConfig.WebParts.QuerySitePages,
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
                        },
                        "error": function (XMLHttpRequest, textStatus, errorThrown) {
                            if (XMLHttpRequest.status == 401) {
                                window.location = window.localStorage.getItem('H3.PortalRoot') + "/index.html#/platform/login";
                            }
                        }
                    });
                },
                "sAjaxDataProp": 'Rows',
                "sDom": "<'row'<'col-sm-6'l><'col-sm-6'f>r>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
                "sPaginationType": "full_numbers",
                "fnServerParams": function (aoData) {  // 增加自定义查询条件
                    aoData.push({ "name": "keyWord", "value": $scope.searchKey });
                },
                "aoColumns": $scope.getColumns(), // 字段定义
                // 初始化完成事件,这里需要用到 JQuery ，因为当前表格是 JQuery 的插件
                "initComplete": function (settings, json) {
                    var filter = $(".searchContainer");
                    filter.find("button").unbind("click.DT").bind("click.DT", function () {
                        $("#tabPortalPage").dataTable().fnDraw();
                    });
                },
                //创建行，未绘画到屏幕上时调用
                "fnRowCallback": function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                    //将添加的angular事件添加到作用域中
                    if (aData.ItemSummary != "") {
                        $(nRow).attr("title", aData.ItemSummary);
                    }
                },
                //datables被draw完后调用
                "fnDrawCallback": function () {
                    jqdatables.trcss();
                    $compile($("#tabPortalPage"))($scope);
                }
            }
            return options;
        }

        $scope.searchKeyChange = function () {
            if ($scope.searchKey == "")
                $("#tabPortalPage").dataTable().fnDraw();
        }

        $scope.AddTemplate = function () {
            $scope.EditPage();
        }

        //修改  编辑、添加
        $scope.EditPage = function (PageId) {
            var modalInstance = $modal.open({
                templateUrl: "EditPage.html",// 指向上面创建的视图
                controller: 'EditPageController',// 初始化模态范围
                size: "md",
                resolve: {
                    params: function () {
                        return {
                            PageId: PageId || ""
                        };
                    }
                }
            });
            // 弹窗点击确定的回调事件
            modalInstance.result.then(function (arg) {
                //reload
            });
        }
        //设计
        $scope.Design = function (PageId) {
            window.open("index.html#/home/" + PageId + "/Design", "_blank");
        }
        //部件
        $scope.ManageWebParts = function (PageId) {
            var modalInstance = $modal.open({
                templateUrl: "ManageWebParts.html",// 指向上面创建的视图
                controller: 'ManageWebPartsController',// 初始化模态范围
                size: "md",
                resolve: {
                    params: function () {
                        return {
                            PageId: PageId
                        };
                    }
                }
            });
            // 弹窗点击确定的回调事件
            modalInstance.result.then(function (arg) {

            });
        }
        //删除
        $scope.RemovePage = function (PageId) {
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
                    url: window.localStorage.getItem("H3.PortalRoot") + "/PortalAdminHandler/RemoveManagedPage",
                    params: {
                        PageId: PageId
                    }
                })
                .success(function (data) {
                    console.log(data);
                    $scope.searchKeyChange();
                    if (data.Message != "") {
                        $.notify({ message: data.Message, status: "danger" });
                    }
                })
            });
        }
    }]);

//修改Controller
app.controller('EditPageController', ['$scope', '$modalInstance', '$http', '$state', 'params', function ($scope, $modalInstance, $http, $state, params) {
    $scope.PageId = params.PageId;
    if ($scope.PageId != "") {
        //编辑
    }
    $scope.init = function () {
        //LoadTemplate、LoadPage
        $http({
            url: window.localStorage.getItem("H3.PortalRoot") + "/PortalAdminHandler/LoadPage",
            params: {
                PageId: $scope.PageId
            }
        })
        .success(function (data) {
            console.log(data)
            if (data.ExceptionCode == -1 && data.Success == true) {
                $scope.Templates = data.Extend.Templates;
                $scope.Page = data.Extend.Page;
                if ($scope.Page) {
                    $scope.UserOptions.V = $scope.Page.OrgId;
                }
            }
        })
    }

    $scope.init();

    $scope.UserOptions = {
        Editable: true, Visiable: true, OrgUnitVisible: true, UserVisible: false
    }

    $scope.canClick = false;

    $scope.canClickFn = function (el) {
        debugger
        if ($("#sheetUser").SheetUIManager().GetValue()) {
            $scope.Page.OrgId = $("#sheetUser").SheetUIManager().GetValue();
        } else {
            $scope.Page.OrgId = "";
        }
       
        if (($scope.Page.OrgId !== "" || $scope.Page.OrgId !== undefined) && ($scope.Page.PageTitle !== "" || $scope.Page.PageTitle !== undefined) && ($scope.Page.TempId !== "" || $scope.Page.TempId !== undefined)) {
            $scope.invalid = false;
            $scope.canClick = false;
        }
    };
 
    $scope.invalid = false;
    $scope.ok = function () {
        debugger
        if ($scope.Page == null) {
            $scope.invalid = true;
            return
        }
        
        if ($("#sheetUser").SheetUIManager().GetValue()) {
            $scope.Page.OrgId = $("#sheetUser").SheetUIManager().GetValue();
        } else {
            $scope.Page.OrgId = "";
        }
       
        if ($scope.Page.OrgId == "" || $scope.Page.OrgId == undefined || $scope.Page.PageTitle == "" || $scope.Page.PageTitle == undefined || $scope.Page.TempId == "" || $scope.Page.TempId == undefined) {
            $scope.invalid = true;
            return
        }
        $scope.canClick = true;
        $scope.invalid = false;
        $http({
            url: window.localStorage.getItem("H3.PortalRoot") + "/PortalAdminHandler/SavePage",
            params: {
                PageId: $scope.PageId,
                PageTitle: $scope.Page.PageTitle,
                TempId: $scope.Page.TempId,
                OrgId: $scope.Page.OrgId
            }
        })
        .success(function (data) {
            $modalInstance.close();
            $state.go($state.$current.self.name, {}, { reload: true });   
        }).error(function (data) {
            $scope.canClick = false;
        })
    }
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel'); // 退出
    };
}]);

//部件管理
app.controller('ManageWebPartsController', ['$scope', '$modalInstance', '$http', 'params', function ($scope, $modalInstance, $http, params) {
    $scope.PageId = params.PageId;
    $scope.NoWebParts = false;
    $scope.init = function () {
        $http({
            url: window.localStorage.getItem("H3.PortalRoot") + "/PortalAdminHandler/GetPageWebParts",
            params: {
                PageId: $scope.PageId
            }
        })
        .success(function (data) {
            console.log(data)
            if (data.ExceptionCode == -1 && data.Success == true) {
                if (data.Extend.length == 0) {
                    $scope.NoWebParts = true;
                } else {
                    $scope.WebParts = data.Extend;
                }
            }
        })
    }
    $scope.init();
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel'); // 退出
    };
    $scope.RemovePageWebPart = function (WebPartId) {
        $http({
            url: window.localStorage.getItem("H3.PortalRoot") + "/PortalAdminHandler/RemovePageWebPart",
            params: {
                WebPartId: WebPartId
            }
        })
        .success(function (data) {
            $scope.init();
        })
    }
}])


