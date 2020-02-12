<%@ Page Title="" Language="C#" MasterPageFile="~/MvcSheet.master" AutoEventWireup="true" CodeBehind="MvcDemo.aspx.cs" Inherits="OThinker.H3.Portal.Sheets.MvcDemo" %>


<%@ OutputCache Duration="999999" VaryByParam="T" VaryByCustom="browser" %>
<asp:Content ID="head" ContentPlaceHolderID="headContent" runat="Server">
    <script type="text/javascript">
        /*
            全局可访问的对象：$.MvcSheetUI.SheetInfo，该属性是后台传递到前端的所有信息，但是需要在 $.MvcSheet.Loaded 方法中使用
                    例如： $.MvcSheetUI.SheetInfo.ActivityCode 当前活动编码
                           $.MvcSheetUI.SheetInfo.Originator   // 发起人
            获取MVC表单控件的实例：$("#控件ID").SheetUIManager()
        */
        // 增加自定义工具栏按钮方法，触发后台事件
        $.MvcSheet.AddAction({
            Action: "TestAction",       // 执行后台方法名称
            Icon: "fa-print",           // 按钮图标
            Text: "后台事件",           // 按钮名称
            Datas: ["{selectUser}"],    // 参数，多个参数 "{Param1}","Param2"...
            //OnAction: function () {     
            /*
            自定义按钮执行事件，如果为 null 则调用$.MvcSheet.Action 执行后台方法
            如果不为 null，那么会执行这里的方法，需要自己Post到后台或写前端逻辑
            */
            //},
            OnActionDone: function (e) {
                // 后台方法调用完成后触发
                // 以下是将后台的值输出到前端控件中
                if (e) {
                    $.MvcSheetUI.SetControlValue("code", e.Code);
                    $.MvcSheetUI.SetControlValue("mvcName", e.Name);
                }
            },
            PostSheetInfo: true         // 是否提交表单数据，如果 false，那么不返回表单的数据
        });

        // 增加自定义工具栏按钮方法，触发前台事件
        $.MvcSheet.AddAction({
            Action: "TestScript",       // 按钮名称
            Icon: "fa-print",           // 按钮图标
            Text: "前端事件",           // 按钮名称
            Datas: ["{selectUser}"],    // 参数，多个参数 "{Param1}","Param2"...
            OnAction: function () {
                alert("这里执行前端事件");
            },
            OnActionDone: function (e) {
                // 事件执行完成
            },
            PostSheetInfo: true         // 是否提交表单数据，如果 false，那么不返回表单的数据
        });

        // 增加自定义工具栏按钮方法，触发前台事件
        $.MvcSheet.AddAction({
            Action: "TestScript",       // 按钮名称
            Icon: "fa-print",           // 按钮图标
            Text: "前端事件",           // 按钮名称
            Datas: ["{selectUser}"],    // 参数，多个参数 "{Param1}","Param2"...
            OnAction: function () {
                alert("这里执行前端事件");
            },
            OnActionDone: function (e) {
                // 事件执行完成
            },
            PostSheetInfo: true         // 是否提交表单数据，如果 false，那么不返回表单的数据
        });

        // 所有工具栏按钮完成事件
        $.MvcSheet.ActionDone = function (data) {
            // this.Action; // 获取当前按钮名称
        }

        // 控件初始化事件
        $.MvcSheet.ControlInit = function () {
            // 如果是 SheetComment，则默认设置所有的 SheetComment 的属性
            if (this.Type == "SheetComment") {
                this.SignHeight = 80;                // 签章高度
                this.SignPosition = "AfterComment";  // 用户名称显示在意见之后
                this.SignAlign = "Right"             // 签章靠右显示
            }
            // 也可以对其他控件进行类似统一设置
        };

        //// 控件初始化事件
        $.MvcSheet.ControlPreRender = function () {
            // 如果是 SheetComment，则默认设置所有的 SheetComment 的属性
            if (this.Type == "SheetGridView") {
                if (this.V && this.V.R.length > 0) {
                    for (var i = 0; i < this.V.R.length; i++) {
                        this.SetRowReadOnly(i); // 设置行只读，这里作用域是 SheetGridView
                    }
                }
            }
            //if (this.DataField.indexOf(".") > -1 && this.RowNum <= rowCount) {
            //    this.Editable = false;
            //    $(this.Element).parent().parent().find("a.delete").hide();
            //}
        };

        // 控件初始化事件
        $.MvcSheet.ControlRendered = function () {
            // 如果是 SheetComment，则默认设置所有的 SheetComment 的属性\
            if (this.Type == "SheetComment") {
                this.SignAlign = "Left"; // 设置 SheetComment 全局的属性
            }
        };

        // 保存前事件
        $.MvcSheet.SaveAction.OnActionPreDo = function () {
            // this.Action  // 获取当前按钮名称
            alert(this.Action);
        }

        // 保存后事件，保存是异步的，可能比回调函数快
        $.MvcSheet.SaveAction.OnActionDone = function () {
            //this   当前SaveAction
            var mvcNum = $.MvcSheetUI.GetSheetDataItem("mvcNum");       //读取后台数据项对象，L：数据项类型，V：数据项的值，O：数据项的权限，N：数据项名称，RowNum:主表中为0，子表中表示行号
            if (mvcNum && (mvcNum.L == $.MvcSheetUI.LogicType.Int
                    || mvcNum.L == $.MvcSheetUI.LogicType.Double
                    || mvcNum.L == $.MvcSheetUI.LogicType.Long)) {
                if (mvcNum.V > 100) {

                }
            }
        }

        // 表单验证接口
        $.MvcSheet.Validate = function () {
            // this.Action 表示当前操作的按钮名称
            var nameText = $.MvcSheetUI.GetControlValue("mvcName");    // 根据数据项编码获取页面控件的值

            // 填写申请单环节，设置 mvcName 必填
            if ($.MvcSheetUI.SheetInfo.ActivityCode == "Apply") {
                if (this.Action == "Submit") {
                    if (!nameText) {
                        $.MvcSheetUI.GetElement("mvcName").focus();
                        alert("请填写名称.");
                        return false;
                    }
                }
            }
            return true;
        }

        // 页面初始化事件,该事件在获取MVC表单数据，并且在控件初始化之前执行
        $.MvcSheet.PreInit = function () {
            // 将提交按钮文字改为通过
            if ($.MvcSheetUI.SheetInfo.ActivityCode == "Approve" || $.MvcSheetUI.SheetInfo.IsOriginateMode) {
                $.MvcSheet.SubmitAction.Text = "通过";
            }
        }

        // 页面加载完成事件
        $.MvcSheet.Loaded = function (sheetInfo) {
            // 获取选人控件
            // sheetInfo 该参数包含MVC表单后台传递到前端的所有信息
            /*
            MVC控件实例，通过 SheetUIManager() 方法获取，例如获取 txtCode 所对应的MvcSheetUI实例
            */
            var txtCode = $("#txtCode").SheetUIManager();
            // 可以调用所有 SheetTextBox 提供的接口方法，例如 txtCode.GetValue();

            // 自定义按钮调用后台方法示例
            $("#btnClick").click(function () {
                // 执行后台事件
                $.MvcSheet.Action(
                    {
                        Action: "TestAction",    // 后台方法名称
                        Datas: ["输入参数"],     // 输入参数，格式 ["{数据项名称}","String值","控件ID"]，当包含数据项名称时 LoadControlValue必须为true
                        LoadControlValue: true,  // 是否获取表单数据
                        PostSheetInfo: false,    // 是否获取已经改变的表单数据
                        Async: true,
                        OnActionDone: function (e) {
                            // 执行完成后回调事件
                            $.MvcSheetUI.SetControlValue("code", e.Code);
                            $.MvcSheetUI.SetControlValue("mvcName", e.Name);
                        }
                    }
                )
            });
        }

        /* 
            子表行保存事件
            参数：grid -> 表示子表对象实例
            参数：args -> 0表示子表行的dom元素，1表示子表当前行数据
        */
        var gridSaving = function (grid, args) {
            if (args && args[1].code) {
                args[1].code += $(args[0]).attr("data-row");
            }
        };

        /*
            子表删除行事件
            参数：row -> 被删除的行
        */
        var rowRemoved = function (row) {
            alert("被删除的行->" + row.attr("data-row"));
        }

        /*
            子表行添加事件
            参数：grid -> 表示子表对象实例
            参数：args -> 0表示子表对象实例，1表示后台返回的数据对象，2表示当前行号
        */
        function gridAddRow(grid, args) {
            if (args[1]) {
                // args[1] 只会在页面加载的时候有值，添加的行是没有值的
                var code = args[1].DataItems["mvcDetail.code"].V;
            }
        }

        // JS 调用业务服务示例
        var setDisplayName = function () {
            // executeService(业务服务名称，业务服务方法,{参数1:数据项1,参数2:数据项2....})
            //var v = $.MvcSheetUI.MvcRuntime.executeService('DllTest', 'GetDisplayName', { Code: 'code' });
            //$("input[data-datafield='mvcName']").val(v);
        }
    </script>
    <script type="text/javascript">

    </script>
</asp:Content>
<%-- 
/*
    如果要改变工具栏按钮顺序，则可以修改 MvcSheet.master 文件，以下地方，将你需要的顺序，写入到 cphMenu 内容中
*/
<asp:ContentPlaceHolder ID="cphMenu" runat="server">
    <li data-action="Submit"><a href="javascript:void(0);"><i class="panel-title-icon fa fa-check toolImage"></i><span class="toolText">提交</span></a></li>
</asp:ContentPlaceHolder>--%>
<asp:Content ID="menu" ContentPlaceHolderID="cphMenu" runat="Server">
</asp:Content>
<asp:Content ID="master" ContentPlaceHolderID="masterContent" runat="Server">
    <div style="text-align: center;" class="DragContainer">
        <label id="lblTitle" class="panel-title">MvcDemo</label>
    </div>
    <div class="panel-body">
        <div class="nav-icon fa fa-chevron-right bannerTitle">
            <label id="divBasicInfo">基本信息</label>
        </div>
        <div class="divContent">
            <div class="row">
                <div id="divFullNameTitle" class="col-md-2">
                    <label id="lblFullNameTitle" data-type="SheetLabel" data-datafield="Originator.UserName" data-bindtype="OnlyVisiable">发起人</label>
                </div>
                <div id="divFullName" class="col-md-4">
                    <label id="lblFullName" data-type="SheetLabel" data-datafield="Originator.UserName" data-bindtype="OnlyData"></label>
                </div>
                <div id="divOriginateDateTitle" class="col-md-2">
                    <label id="lblOriginateDateTitle" data-type="SheetLabel" data-datafield="OriginateTime" data-bindtype="OnlyVisiable">发起时间</label>
                </div>
                <div id="divOriginateDate" class="col-md-4">
                  <input id="SheetOriginateDate" type="text" data-datafield="OriginateTime" data-timemode="OnlyDate" data-type="SheetTime" class="">
			  
                </div>
            </div>
            <div class="row">
                <div id="divOriginateOUNameTitle" class="col-md-2">
                    <label id="lblOriginateOUNameTitle" data-type="SheetLabel" data-datafield="Originator.OUName" data-bindtype="OnlyVisiable">所属组织</label>
                </div>
                <div id="divOriginateOUName" class="col-md-4">
                    <label id="lblOriginateOUName" data-type="SheetLabel" data-datafield="Originator.OUName" data-bindtype="OnlyData"></label>
                </div>
                <div id="divSequenceNoTitle" class="col-md-2">
                    <label id="lblSequenceNoTitle" data-type="SheetLabel" data-datafield="SequenceNo" data-bindtype="OnlyVisiable">流水号</label>
                </div>
                <div id="divSequenceNo" class="col-md-4">
                    <label id="lblSequenceNo" data-type="SheetLabel" data-datafield="SequenceNo" data-bindtype="OnlyData"></label>
                </div>
            </div>
        </div>
        <div class="nav-icon fa  fa-chevron-right bannerTitle">
            <label id="divSheetInfo">表单信息</label>
        </div>
        <div id="ctl00_BodyContent_divSheet" class="divContent">
            <div class="row">
                <div id="title1" class="col-md-2">
                    <span id="Label11" data-type="SheetLabel" data-pretext="自定义属性" data-datafield="code">编码</span>
                </div>
                <div id="control1" class="col-md-4">
                    <input id="txtCode" type="text" data-datafield="code" data-type="SheetTextBox" class="" onchange="setDisplayName();">
                    注：Change事件调用业务服务，并且给名称赋值<br />
                    $.MvcSheetUI.MvcRuntime.executeService("业务服务名称","方法名称",{参数1名称:"值1",参数2名称:"值2"...});
                    <div>
                        <asp:Button ID="txtButton" runat="server" Text="测试按钮" OnClick="txtButton_Click" />
                        <input type="button" id="btnClick" value="前端调用后台方法" />
                    </div>
                </div>
                <div id="title2" class="col-md-2">
                    <span id="Label12" data-type="SheetLabel" data-datafield="mvcName">名称</span>
                </div>
                <div id="control2" class="col-md-4">
                    <input id="txtName" type="text" data-pretext="->" data-datafield="mvcName" data-type="SheetTextBox">
                </div>
            </div>
            <div class="row">
                <div id="title1" class="col-md-2">
                    <span id="Label11" data-type="SheetLabel" data-datafield="Spec">规格</span>
                </div>
                <div id="control1" class="col-md-10">
                    <input id="txtCode" type="text" data-datafield="Spec" data-type="SheetTextBox">
                </div>
            </div>
            <div class="row">
                <div id="title3" class="col-md-2">
                    <span id="Label13" data-type="SheetLabel" data-datafield="radio">单选</span>
                </div>
                <div id="control3" class="col-md-4">
                    <div data-datafield="radio" data-type="SheetRadioButtonList" id="ctl414631" class="" data-defaultitems="A;B;C;其他"></div>
                </div>
                <div id="title4" class="col-md-2">
                    <span id="Label14" data-type="SheetLabel" data-datafield="mvcOther" data-displayrule="{radio}=='其他'">其他</span>
                </div>
                <div id="control4" class="col-md-4">
                    <input id="Control14" type="text" data-datafield="mvcOther" data-type="SheetTextBox" class="" data-displayrule="{radio}=='其他'" data-vaildationrule="{radio}=='其他'">
                </div>
            </div>
            <div class="row">
                <div id="title5" class="col-md-2">
                    <span id="Label15" data-type="SheetLabel" data-datafield="multiCheck">多选</span>
                </div>
                <div id="control5" class="col-md-4">
                    <div data-datafield="multiCheck" data-type="SheetCheckboxList" id="ctl732795" class="" data-defaultitems="A;B;C"></div>
                </div>
                <div id="title6" class="col-md-2">
                    <span id="Label16" data-type="SheetLabel" data-datafield="mvcTime">日期</span>
                </div>
                <div id="control6" class="col-md-4">
                    <input id="Control16" type="text" data-datafield="mvcTime" data-type="SheetTime">
                </div>
            </div>
            <div class="row">
                <div id="title7" class="col-md-2">
                    <span id="Label17" data-type="SheetLabel" data-datafield="mvcMobile">电话</span>
                </div>
                <div id="control7" class="col-md-4">
                    <input id="txtMobile" type="text" data-datafield="mvcMobile" data-type="SheetTextBox" class=""
                        data-regularexpression="/^1[3|4|5|8][0-9]{9}$/" data-regularinvalidtext="请输入一个有效的手机号码.">
                </div>
                <div id="title8" class="col-md-2">
                    <span id="Label18" data-type="SheetLabel" data-datafield="dropList">下拉框</span>
                </div>
                <div id="control8" class="col-md-4">
                    <select data-datafield="dropList" data-type="SheetDropDownList" id="ctl352297" class="" data-defaultitems="A;B;C;D">
                    </select>
                </div>
            </div>
            <div class="row">
                <div id="title11" class="col-md-2">
                    <span id="Label20" data-type="SheetLabel" data-datafield="selectUser">选人</span>
                </div>
                <div id="Div1" class="col-md-4">
                    <div id="Control20" data-datafield="selectUser" data-type="SheetUser" data-defaultvalue="{Originator}"
                        data-mappingcontrols="Email:Email,Dept:FullName">
                    </div>
                </div>
                <div id="title12" class="col-md-2">
                    <span id="Label21" data-type="SheetLabel" data-datafield="mulitUser">多人</span>
                </div>
                <div id="Div2" class="col-md-4">
                    <div id="Control21" data-datafield="mulitUser" data-type="SheetUser"></div>
                </div>
            </div>
            <div class="row">
                <div id="title11" class="col-md-2">
                    <span id="Label20" data-type="SheetLabel" data-datafield="selectUser">指定组选人</span>
                </div>
                <div id="title12" class="col-md-10">
                    <div id="Control20" data-datafield="selectUser" data-type="SheetUser" data-rolename="测试用户组">
                    </div>
                    <br />
                    应用场景：假设存在出纳组，流程需要从出纳组中选择一个人，这里只要指定组名称是【出纳】<br />
                    注：如果未指定RootUnit属性，则从当前用户所在组织往上开始查找<br />
                    也可以设置 OrgJobCode或者OrgPostCode，通过职务或者岗位编码进行绑定用户
                </div>
            </div>
            <div class="row">
                <div id="Div5" class="col-md-2">
                    <span id="Span1" data-type="SheetLabel" data-datafield="Email">邮箱</span>
                </div>
                <div id="Div6" class="col-md-4">
                    <input id="Text3" type="text" data-datafield="Email" data-type="SheetTextBox">
                </div>
                <div id="Div7" class="col-md-2">
                    <span id="Span2" data-type="SheetLabel" data-datafield="Dept">所属组织</span>
                </div>
                <div id="Div8" class="col-md-4">
                    <input id="Text4" type="text" data-datafield="Dept" data-type="SheetTextBox">
                </div>
            </div>
            <div class="row">
                <div id="title13" class="col-md-2">
                    <span id="Label22" data-type="SheetLabel" data-datafield="mvcNum">子表小计</span>
                </div>
                <div id="control13" class="col-md-4">
                    <input id="Control22" type="text" data-datafield="mvcNum" data-type="SheetTextBox" class=""
                        data-computationrule="SUM({mvcDetail.mvcCount})" />
                </div>
                <div id="space14" class="col-md-2">
                    <span id="Span3" data-type="SheetLabel" data-datafield="InvoiceCount">有发票金额</span>
                </div>
                <div id="spaceControl14" class="col-md-4">
                    <input id="Text5" type="text" data-datafield="InvoiceCount" data-type="SheetTextBox" class=""
                        data-computationrule="SUM({mvcDetail.mvcCount},if('{mvcDetail.Invoice}'=='有')return {mvcDetail.mvcCount};else return 0;)" />
                </div>
            </div>
            <div class="row">
                <div id="title17" class="col-md-2">
                    <span id="Label24" data-type="SheetLabel" data-datafield="mvcDetail">子表</span>
                </div>
                <div id="Div3" class="col-md-10">
                    <table id="gridDemo" data-datafield="mvcDetail" data-defaultrowcount="0"
                        data-onadded="gridAddRow(this,arguments);"
                        data-oneditorsaving="gridSaving(this,arguments);"
                        data-onremoved="rowRemoved(this,arguments);"
                        data-type="SheetGridView" class="SheetGridView">
                        <tbody>
                            <tr class="header">
                                <td id="Control24_SerialNo" class="rowSerialNo" rowspan="2">序号</td>
                                <td id="Control24_Header3" data-datafield="mvcDetail.code">
                                    <label id="Control24_Label3" data-datafield="mvcDetail.code" data-type="SheetLabel">编码</label>
                                </td>
                                <td id="Td2" data-datafield="mvcDetail.Invoice">
                                    <label id="Label3" data-datafield="mvcDetail.Invoice" data-type="SheetLabel">发票</label>
                                </td>
                                <td id="Control24_Header4" data-datafield="mvcDetail.mvcNum" rowspan="2">
                                    <label id="Control24_Label4" data-datafield="mvcDetail.mvcNum" data-type="SheetLabel">数量</label>
                                </td>
                                <td id="Control24_Header5" data-datafield="mvcDetail.mvcPrice" rowspan="2">
                                    <label id="Control24_Label5" data-datafield="mvcDetail.mvcPrice" data-type="SheetLabel">单价</label>
                                </td>
                                <td id="Control24_Header6" data-datafield="mvcDetail.mvcCount" rowspan="2">
                                    <label id="Control24_Label6" data-datafield="mvcDetail.mvcCount" data-type="SheetLabel">小计</label>
                                </td>
                                <td class="rowOption" rowspan="2">删除</td>
                            </tr>
                            <tr class="header">
                                <td id="Td3" data-datafield="mvcDetail.Spec">
                                    <label id="Label2" data-datafield="mvcDetail.Spec" data-type="SheetLabel">规格</label>
                                </td>

                                <td id="Td1" data-datafield="mvcDetail.DetailName">
                                    <label id="Label1" data-datafield="mvcDetail.DetailName" data-type="SheetLabel">名称</label>
                                </td>
                            </tr>
                            <tr class="template">
                                <td id="Control24_Option" class="rowOption" rowspan="2"></td>
                                <td data-datafield="mvcDetail.code">
                                    <input id="Control24_ctl3" type="text" data-datafield="mvcDetail.code" data-type="SheetTextBox">
                                </td>

                                <td id="Td4" data-datafield="mvcDetail.Invoice">
                                    <select data-datafield="mvcDetail.Invoice" data-type="SheetDropDownList" id="ctl317318" class="" data-defaultitems="有;无"></select>
                                </td>
                                <td data-datafield="mvcDetail.mvcNum" rowspan="2">
                                    <input id="Control24_ctl4" type="text" data-datafield="mvcDetail.mvcNum" data-type="SheetTextBox">
                                </td>
                                <td data-datafield="mvcDetail.mvcPrice" rowspan="2">
                                    <input id="Control24_ctl5" type="text" data-datafield="mvcDetail.mvcPrice" data-type="SheetTextBox">
                                </td>
                                <td data-datafield="mvcDetail.mvcCount" rowspan="2">
                                    <input id="Control24_ctl6" type="text" data-datafield="mvcDetail.mvcCount" data-type="SheetTextBox" class="" data-computationrule="{mvcDetail.mvcNum}*{mvcDetail.mvcPrice}">
                                </td>
                                <td class="rowOption" rowspan="2">
                                    <a class="delete">
                                        <div class="fa fa-minus">
                                        </div>
                                    </a>
                                    <a class="insert">
                                        <div class="fa fa-arrow-down">
                                        </div>
                                    </a>
                                </td>
                            </tr>
                            <tr class="template">
                                <td data-datafield="mvcDetail.Spec">
                                    <input id="Text2" type="text" data-datafield="mvcDetail.Spec" data-type="SheetTextBox">
                                </td>
                                <td data-datafield="mvcDetail.DetailName">
                                    <input id="Text1" type="text" data-datafield="mvcDetail.DetailName" data-type="SheetTextBox">
                                </td>
                            </tr>
                            <tr class="footer">
                                <td class="rowOption"></td>
                                <td data-datafield="mvcDetail.code"></td>
                                <td data-datafield="mvcDetail.DetailName"></td>
                                <td data-datafield="mvcDetail.mvcNum">
                                    <label id="Control24_stat4" data-datafield="mvcDetail.mvcNum" data-type="SheetCountLabel"></label>
                                </td>
                                <td data-datafield="mvcDetail.mvcPrice">
                                    <label id="Control24_stat5" data-datafield="mvcDetail.mvcPrice" data-type="SheetCountLabel" class="" data-stattype="NONE"></label>
                                </td>
                                <td data-datafield="mvcDetail.mvcCount">
                                    <label id="Control24_stat6" data-datafield="mvcDetail.mvcCount" data-type="SheetCountLabel"></label>
                                </td>
                                <td class="rowOption"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="row">
                <div id="title9" class="col-md-2">
                    <span id="Label19" data-type="SheetLabel" data-datafield="mvcAttachment">附件</span>
                </div>
                <div id="control9" class="col-md-10">
                    <div id="Control19" data-datafield="mvcAttachment" data-type="SheetAttachment"></div>
                </div>
            </div>
            <div class="row">
                <div id="title15" class="col-md-2">
                    <span id="Label23" data-type="SheetLabel" data-datafield="mvcHtml">Html</span>
                </div>
                <div id="control15" class="col-md-10">
                    <textarea id="Control23" data-datafield="mvcHtml" data-richtextbox="true" data-type="SheetRichTextBox"></textarea>
                </div>
            </div>
            <div class="row">
                <div id="title19" class="col-md-2">
                    <span id="Label25" data-type="SheetLabel" data-datafield="mvcComment">审批意见</span>
                </div>
                <div id="Div4" class="col-md-10">
                    <div id="Control25" data-datafield="mvcComment" data-type="SheetComment" data-displaysign="true"></div>
                </div>
            </div>
        </div>
    </div>
</asp:Content>