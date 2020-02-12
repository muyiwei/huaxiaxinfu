/// <reference path="SheetDesigner.DesignElem.js" />

//剪切板类
var ClipBoard = function (Designer) {
    this.Designer = Designer;
    this.Elem = null;     //剪切板元素
    this.RemovedControl = null;
    this.Source = null;
    this.Controls = {
        DesignerContent: $(".DesignerContent")
    }
};

ClipBoard.prototype = {
    //剪切
    Cut: function (obj) {
        this.Elem = $(obj);
        this.RemovedControl = this.Elem;
        this.Source = this.Elem.parent();
        $(obj).remove();
    },
    //复制
    Copy: function (obj) {
        var _obj = $(obj).clone();
        var id = this.Designer.DropContainer.GetControlID();
        this.Elem = _obj.attr("id", id); //生成新的ObjectID
    },
    //粘贴
    Paste: function (parentCtrl) {
        if (parentCtrl && this.Elem) {
            $(parentCtrl).append(this.Elem);
            this.Elem.click();
            $(parentCtrl).removeClass("ControlSelected");

            // 元素重新可设计
            this.Elem.Designable(this.Designer.PropertyPanel);
            // 元素可拖拽
            this.Elem.Dragable(this.Designer.DropContainer);
            // 重新绑定元素事件
            this.Designer.RegisterEvent();
            // 重新绑定所有元素的可拖拽行为
            this.Designer.refresh();
            //清空剪切板
            // this.Elem = null;
            this.Source = null;
        }
        else {
            // alert("当前剪切板没有可粘贴的元素！");
            // $("*").removeClass("focus");
        }
    },
    //删除
    Remove: function (obj) {
        this.Elem = null;
        this.RemovedControl = $(obj);
        this.Source = this.RemovedControl.parent();
        this.RemovedControl.remove();
        this.Controls.DesignerContent.click();
    },
    //撤销
    Cancel: function () {
        if (this.Elem && this.Source) {
            this.Elem.appendTo($(this.Source));
            // 元素重新可设计
            this.Elem.Designable(this.Designer.PropertyPanel);
            // 元素可拖拽
            this.Elem.Dragable(this.Designer.DropContainer);
            // 重新绑定元素事件
            this.Designer.RegisterEvent();
        }
        else if (this.RemovedControl && this.Source) {
            this.RemovedControl.appendTo($(this.Source));
            if (this.RemovedControl.data("datafield")) {
                // 元素重新可设计
                this.RemovedControl.Designable(this.Designer.PropertyPanel);
                // 元素可拖拽
                this.RemovedControl.Dragable(this.Designer.DropContainer);
                // 重新绑定元素事件
                this.Designer.RegisterEvent();
            }
            else {
                // 重新绑定所有元素的可拖拽行为
                this.Designer.refresh();
            }
        }
        else if (this.Elem) {
            this.Elem.remove();
        }
        this.RemovedControl = null;
        this.Elem = null;
        this.Source = null;
    }
};