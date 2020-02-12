<%@ Page Title="" Language="C#" MasterPageFile="~/MvcSheet.master" AutoEventWireup="true" CodeBehind="MvcDefaultSheet.aspx.cs" Inherits="OThinker.H3.Portal.MvcDefaultSheet" %>

<asp:Content ID="head" ContentPlaceHolderID="headContent" runat="Server">
    <%--javascript code--%>
</asp:Content>
<asp:Content ID="master" ContentPlaceHolderID="masterContent" runat="Server">
    <div id="divContent" runat="server">
        <div class="panel-title" style="text-align: center;">
            <label data-datafield="Sheet__DisplayName" data-bindtype="All"></label>
        </div>
        <div class="panel-body">
            <div class="nav-icon fa  fa-chevron-right bannerTitle">
                <label id="divBasicInfo" data-en_us="Basic information">基本信息</label>
            </div>
            <div class="divContent" id="basicInfo">
                <div class="row">
                    <div class="col-md-2">
                        <label data-datafield="Originator.UserName" data-bindtype="OnlyVisiable" data-en_us="Originator">发起人</label>
                    </div>
                    <div class="col-md-4">
                        <label data-datafield="Originator.UserName" data-bindtype="OnlyData"></label>
                    </div>
                    <div class="col-md-2">
                        <label data-datafield="OriginateTime" data-bindtype="OnlyVisiable" data-en_us="Originate Date">发起时间</label>
                    </div>
                    <div class="col-md-4">
                        <input id="SheetOriginateDate" type="text" data-datafield="OriginateTime" data-timemode="OnlyDate" data-type="SheetTime" class="">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-2">
                        <label data-datafield="Originator.OUName" data-bindtype="OnlyVisiable" data-en_us="Originate OUName">所属组织</label>
                    </div>
                    <div class="col-md-4">
                       <%-- <label data-datafield="Originator.OUName" data-bindtype="OnlyData"></label>--%>
                        <select data-datafield="Originator.OUName" data-type="SheetOriginatorUnit" id="ctlOriginaotrOUName" class=""></select>
                    </div>
                    <div class="col-md-2">
                        <label data-datafield="SequenceNo" data-bindtype="OnlyVisiable" data-en_us="SequenceNo">流水号</label>
                    </div>
                    <div class="col-md-4">
                        <label data-datafield="SequenceNo" data-bindtype="OnlyData"></label>
                    </div>
                </div>
            </div>
            <div class="nav-icon fa  fa-chevron-right bannerTitle">
                <label id="divSheetInfo" data-en_us="Sheet information">表单信息</label>
            </div>
            <div class="divContent" id="divSheet" runat="server">
            </div>
        </div>
    </div>
</asp:Content>