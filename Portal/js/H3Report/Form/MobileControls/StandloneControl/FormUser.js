//选人控件
(function ($) {

    //选人控件数据,单个页面所有数据库共用
    $.FormUserData = {
        //部门
        OrgUnitItems: {},
        //标签
        OrgTagItems: [],
        //部门用户:{部门ID:[]}
        DepUserItems: {},
        //用户
        UserItems: {},
    };

    // 构造函数
    $.MobileControls.FormUser = function (element, ptions, sheetInfo) {
        //选择数据集合
        this.Units = {};
        //所有选择的元素
        this.UnitsElement = null;
        //搜索输入框元素
        this.SearchElement = null;
        this.SearchTxtElement = null;

        //组织机构容器
        this.SelectorPanel = null;
        this.OrgTreePanel = null;
        this.OrgListPanel = null;
        this.FormUserHandler = "/Sheet/SheetUserAction";
        $.MobileControls.FormUser.Base.constructor.call(this, element, ptions, sheetInfo);

    };

    // 继承及控件实现
    $.MobileControls.FormUser.Inherit($.MobileControls.BaseClass, {
        //控件渲染函数
        Render: function () {           
            // 拥有者不能选部门
            if (this.DataField == "OwnerId") { this.OrgUnitVisible = false; }
            //渲染界面
            this.HtmlRender();

            //绑定事件
            this.BindEvents();

            //初始化默认值
            this.InitValue();

            //添加业务服务对象
            this.AddSchema();
        },

        AddSchema: function () {
            if (H3Config.GlobalSheetUser == null) return;
            if (this.DataField.toString().indexOf(".") > -1 && this.BizObjectId) {
                H3Config.GlobalSheetUser.addSchema(this.BizObjectId + "." + this.DataField, this);
            }
            else {
                H3Config.GlobalSheetUser.addSchema(this.DataField, this);
            }
        },

        //初始化值
        InitValue: function () {
            if (this.Value) {
                this.SetValue(this.Value);
            }
        },

        //设置值
        SetValue: function (Obj) {
            if (Obj == void 0 || Obj == null || Obj == "") {
                this.ClearValue();
                return;
            }
            if (this.DataField == "OwnerId") {
                if (Obj.constructor == Array ) {
                    this.AddValue(Obj[0].ObjectId);
                } else if (Obj.constructor == String) {
                    this.AddValue(Obj);
                } else if (Obj.constructor == Object) {
                    this.AddValue(Obj.ObjectId);
                }
                this.AddValue(Obj[0].ObjectId);
            } else if (Obj.constructor == Array || Obj.constructor == String) {
                this.AddValue(Obj);
            } else if (Obj.constructor == Object) {
                this.AddValue(Obj.ObjectId);
            }
        },
        //没有选中人时清空
        ClearValue: function () {
            var that = this;
            $(that.Element).find('input[id*="val_"]').attr('data-val', '').val('').show();
            $(that.Element).find('textarea[id*="val_"]').attr('data-val', '').css('display', "inline-block").val('').show();
        },
        AddValue: function (obj) {
            var that = this;
            if (obj == void 0) {
                return;
            }
            var ids = []
            if (obj.constructor == Array) {
                for (var i = 0; i < obj.length; i++) {
                    if (obj[i].hasOwnProperty('ObjectId')) {
                        ids.push(obj[i].ObjectId);
                    } else {
                        ids.push(obj[i]);
                    }

                }
            }
            else {
                ids.push(obj);
            }
            if (ids.length > 0) {
                var param = { Command: "GetUserProperty", UnitID: JSON.stringify(ids) };
                $.ajax({
                    url: that.FormUserHandler,
                    data: param,
                    type: 'POST',
                    async:false,
                    dataType: 'json',
                    success: function (data) {
                        if (data) {
                            //that.AddUserData.apply(that, [data]);
                            //that.AddUserID.apply(that, [UserID]);
                            var display = "", value = "";
                            if (data != null && data != void 0 && data.length > 0) {
                                for (var i = 0; i < data.length; i++) {
                                    display += data[i].DisplayName + ";"
                                    value += data[i].UnitID + ";"
                                }
                            }
                            if (display != "") {
                                display = display.substr(0, display.length - 1);
                                value = value.substr(0, value.length - 1);
                            }

                            //$(that.Element).find('span[id*="text_"]').html(display);
                            $(that.Element).find('input[id*="val_"]').attr('data-val', value).val(display).show();
                            $(that.Element).find('textarea[id*="val_"]').attr('data-val', value).css('display', "inline-block").val(display).show();

                        }
                    }
                });
                

            }

        },

        //返回 {UnitID1:{UnitID: , Code:, DisplayName:Type, Icon ,ParentId},UnitID1:{UnitID: , Code:, DisplayName: }}对象
        GetValue: function () {
            var val = $(this.Element).find('input[id*="val_"]').attr('data-val');
            if (val != null && val != void 0 && val.length > 0) {
                return val.replace(/(\;*$)/g, "").split(';');
            } else {
                val = $(this.Element).find('textarea[id*="val_"]').attr('data-val');
                if (val != null && val != void 0 && val.length > 0) {
                    return val.replace(/(\;*$)/g, "").split(';');
                }
            }
            return [];
        },

        //读取选中的UnitID
        GetUnitIDs: function () {
            //return this.GetValue();
            var ValObjs = this.GetValue();
            var UintIDs = new Array();
            //for (var i in ValObjs) {
            //    UintIDs.push(ValObjs[i]);
            //}
            return UintIDs.concat(ValObjs);
        },

        //获取显示
        GetText: function () {
            if ($(this.Element).find('input[id*="val_"]').length > 0) {
                return $(this.Element).find('input[id*="val_"]').val();
            } else {
                return $(this.Element).find('textarea[id*="val_"]').val();
            }
            
        },


        OnChage: function () { },

        //渲染样式
        HtmlRender: function () {
            if (this.IsMultiple) {
                this.$Value = $('<textarea style="width:86%;display:none;float:left;" rows="3" readonly datafield="' + this.DataField + '" id="val_' + this.DataField + '" style="padding-right:28px;" />');
            } else {
                this.$Value = $('<input type="text" readonly datafield="' + this.DataField + '" id="val_' + this.DataField + '"  style="padding-right:28px;" />');
            }
            
            this.$InputBody.append(this.$Value);
            $(this.Element).css({'position':'relative'});
            this.$flat = $('<i class=" icon icon-arrow-right m-sheet-arrow" ></i>');
            if (this.IsMultiple) {
                this.$flat = $('<i class=" icon icon-arrow-right m-sheet-arrow" style="padding-top:20px;"></i>');
            }
            this.$InputBody.append(this.$flat);
            this.$InputBody.css({ display: 'inline-block', width: '70%' })
            $(this.Element).find("span.ControlTitle").css({ display: "inline-block", width: "30%",'font-size':'16px'});
            if (this.IsMultiple)
            {
                $(this.Element).find("span.ControlTitle").css({ "padding-top": "20px" });
            }
            $(this.$flat).show();
            this.$Value.css({ 'background-color': '#fff' ,'padding-right':'25px',width:'100%'});
            var $contnt = $(this.Element).find('div.ControlContent');
            if ($contnt.length > 0) {
                $contnt.removeClass('readonly');
            }
            
        },

        //绑定事件
        BindEvents: function () {
            if (this.Editable) {

                //this.$Toogle.unbind("click.FormUser").bind("click.FormUser", this, function (e) {
                //    var that = e.data;
                //    that.ShowShelector.apply(that);
                //});

            }
        },

        Reset: function () {
            //$(this.Element).find('span[datafield="' + this.DataField + '"]').html('');
            $(this.Element).find('input[datafield="' + this.DataField + '"]').attr('data-val', '').val('').hide();
            $(this.Element).find('textarea[datafield="' + this.DataField + '"]').attr('data-val', '').val('').hide();
        },

        SetReadonly: function (flag) {
            if (flag) {
                //隐藏掉链接
                $(this.$link).hide();
                //$(this.Element).find("input").attr("readonly", "readonly");
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }
            }
            else {
                $(this.$link).show();
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.removeClass('readonly');
                }
            }
        },



        //校验
        Validate: function () {
            
            return true;
        },

    });
})(jQuery);