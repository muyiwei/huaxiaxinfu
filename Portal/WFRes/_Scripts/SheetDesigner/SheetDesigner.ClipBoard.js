/// <reference path="SheetDesigner.DesignElem.js" />

//剪切板类
var ClipBoard = function () {
    this.Elem = null;     //剪切板元素
    this.Source = null;
};

ClipBoard.prototype = {
    //剪切
    Cut: function (obj) {
        this.Elem = obj;
        this.Source = $(obj).parent();
        $(obj).remove();
    },
    //复制
    Copy: function (obj) {
        var _obj = $(obj).clone();
        var id = Designer.GetControlID();
        var property = JSON.parse(_obj.attr("property"));
        property.Id = id;  //赋值给新ID
        this.Elem = _obj.attr("property", JSON.stringify(property)).attr("id", id); //生成新的ObjectID
    },
    //粘贴
    Plaste: function (parentCtrl) {
        if (parentCtrl && this.Elem) {
            $(parentCtrl).append(this.Elem);

            //元素重新可设计
            $(this.Elem).Designable();
            //清空剪切板
            this.Elem = null;
        }
        else {
            // alert("当前剪切板没有可粘贴的元素！");
            // $("*").removeClass("focus");
        }
    },
    //删除
    Remove: function (obj) {
        this.Elem = null;
        $(obj).remove();
    },
    //撤销
    Cancel: function () {
        if (this.Elem && this.Source) {
            $(this.Elem).appendTo($(this.Source));
        }
        this.Elem = null;
        this.Source = null;
    }
};

