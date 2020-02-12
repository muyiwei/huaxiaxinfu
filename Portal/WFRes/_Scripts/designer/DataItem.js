
/*
    数据项选择控件的脚本库
*/

//var _DataItem_GlobalString = {
//    "DataItem_ChooseDataItem": "选择数据项",
//    "DataItem_Confirm": "确定",
//    "Button_Cancel": "取消",
//};
////获取本地化字符串
//$.get(_PORTALROOT_GLOBAL + "/Ajax/GlobalHandler.ashx", { "Code": "DataItem_ChooseDataItem,DataItem_Confirm,Button_Cancel" }, function (data) {
//    if (data.IsSuccess) {
//        _DataItem_GlobalString = data.TextObj;
//    }
//}, "json");

var DataItem = function (workflowDocument) {
    this.WorkflowDocument = workflowDocument;
    this.Controls = {
        treeDataItems: $("#treeDataItems")    // 树形容器
    };

    this.init();
}

var DataItemPermission = function () {
    this.Visible = true;
    this.Editable = false;
    this.Required = false;
    this.TrackVisible = false;
    this.MobileVisible = true;
    this.ViewName = undefined;
}

DataItem.prototype.init = function () {

    this.Controls.treeDataItems.css("width", "300px");
};

// 数据项选择控件绑定
/*
    @o : Workflow 节点对象
    @p : Porperty 对象的实例
    @d : DataItem 对象的实例
*/

var DataItemStack = {
    //数据项选择窗口
    DataItemDialog: undefined,

    //编辑中的文本控件
    TextControl: undefined,
    //选中的文本
    SelectedText: "",
    //选中的值
    SelectedValue: "",
    CaretPos:0
}

$.fn.DataItemsBind = function () {
    $(this).unbind("click").click(function () {
        DataItemStack.TextControl = $(this).parent().find("input[type=text],input[type=hidden],textarea");
        //获取内容光标位置
        var caretPos = 0; 
        if (DataItemStack.TextControl[0].selectionStart || DataItemStack.TextControl[0].selectionStart == '0') {
            DataItemStack.CaretPos = DataItemStack.TextControl[0].selectionStart;
        } 
        //是在选择流程编码
        DataItemStack.ReplaceMode = $(this).attr("data-select-mode") == "replace";

        //清空已选值
        DataItemStack.SelectedText = "";
        DataItemStack.SelectedValue = "";

        // 选择数据项后的事件
        DataItemStack.DataItemDialog = $.ligerDialog.open({
            title: $.Lang("Designer.DataItem_ChooseDataItem"),
            target: $("#divDataItems"),
            height: 510,
            width: 460,
            buttons: [
               {
                   text: $.Lang("Designer.DataItem_Confirm"), onclick: function (item, dialog) {
                       if (DataItemStack.ReplaceMode) {
                           DataItemStack.TextControl.val(DataItemStack.SelectedValue).change();
                       }
                       else {
                           DataItemStack.TextControl.val(DataItemStack.TextControl.val() + DataItemStack.SelectedValue);
                       }
                       //触发文本框改变事件
                       DataItemStack.TextControl.change();
                       dialog.close();
                   }
               },
               {
                   text: $.Lang("GlobalButton.Cancel"), onclick: function (item, dialog) {
                       dialog.close();
                   }
               }]
        });
    });

    return $(this);
}

var DataItemSelected = function (_Text, _Value) {
    DataItemStack.SelectedText = _Text;
    DataItemStack.SelectedValue = _Value;
    var val = DataItemStack.TextControl.val().substring(0, DataItemStack.CaretPos);
    if (val.split('{').length - 1 > 4 && val.split('}').length - 1 > 4 && (val.split('{').length == val.split('}').length)) {
        $.H3Dialog.Warn({ content: $.Lang("msgGlobalString.NoMorethanFive") });
    } else {
        var str = DataItemStack.TextControl.val().substring(0, DataItemStack.CaretPos) + DataItemStack.SelectedValue + DataItemStack.TextControl.val().substring(DataItemStack.CaretPos);
        if (DataItemStack.ReplaceMode) {
            DataItemStack.TextControl.val(str);
        }
        else {
            DataItemStack.TextControl.val(str);
        }
        //触发文本框改变事件
        DataItemStack.TextControl.change();
    }
    DataItemStack.DataItemDialog.close();
}