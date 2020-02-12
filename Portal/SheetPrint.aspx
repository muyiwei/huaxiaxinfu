<%@ Page Title="" Language="C#" MasterPageFile="~/MvcSheet.master" AutoEventWireup="true" CodeBehind="SheetPrint.aspx.cs" Inherits="OThinker.H3.Portal.SheetPrint" %>

<asp:Content ID="Content1" ContentPlaceHolderID="titleContent" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="headContent" runat="server">
    <script>
        //加载完成后，加载打印模板
        $.MvcSheet.Loaded = function () {
            // 执行后台事件
            $.MvcSheet.Action(
                {
                    Action: "GetPrintContent",    // 后台方法名称
                    Datas: [],     // 输入参数，格式 ["{数据项名称}","String值","控件ID"]，当包含数据项名称时 LoadControlValue必须为true
                    LoadControlValue: true,  // 是否获取表单数据
                    PostSheetInfo: false,    // 是否获取已经改变的表单数据
                    Async: true,
                    OnActionDone: function (e) {
                        // 执行完成后回调事件
                        if (e) {
                            $("#divContent").html(e.printContent);
                        }
                    }
                }
            );
            setTimeout(function () {
                window.print();
            }, 1000)
        }

    </script>
</asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="cphMenu" runat="server">
</asp:Content>
<asp:Content ID="Content4" ContentPlaceHolderID="masterContent" runat="server">
    <style>
        #content-wrapper {
            padding: 5px;
        }

        #main-navbar {
            display: none;
        }
    </style>
    <div id="divContent">
    </div>
</asp:Content>
