(function ($) {
    $.fn.H3Wizard = function (option) {
        var options = $.extend({}, $.fn.H3Wizard.defaults, option);
        var args = arguments;
        return $(this).each(function () {
            var obj = $(this);
            var stepBackObj = $("<div></div>");
            options.stepsObj = $("#" + options.guideId);
            var steps = $("li", options.stepsObj);

            if (obj.attr("H3Wizard") != null) {
                //已经向导化了，只需重新布局内容页面就行了
                for (var i = 0, j = steps.length; i < j; i++) {
                    var aObj = $("a[" + options.StepContentKey + "]", steps[i])
                    var stepContentID = aObj.attr(options.StepContentKey);
                    if (aObj.hasClass("CurrentStep"))
                        $("#" + stepContentID).BuildPanel({ excludeIDs: options.excludeIDs }).show();
                    else
                        $("#" + stepContentID).BuildPanel({ excludeIDs: options.excludeIDs }).hide();
                }
                return;
            }

            obj.attr("H3Wizard", "H3Wizard")
            options.stepsObj.css("z-index", 999);
            options.stepsObj.css("background", "#fff");
            options.stepsObj.css("position", "fixed");
            options.stepsObj.css("padding", "5px");
            options.stepsObj.css("width", "100%");

            options.stepsObj.html("");
            var i = 1;
            var stepsWidth = 0;
            for (var i = 0, j = steps.length; i < j;) {
                var step = $(steps[i]);
                var stepContentID = step.attr(options.StepContentKey);
                var contentOjb = $("#" + stepContentID).BuildPanel({ excludeIDs: options.excludeIDs });
                contentOjb.hide();

                i++;
                var liObj = $("<li></li>").addClass("Step");
                var linkOjb = $("<a></a>").addClass("DisabledStep").attr("StepValue", i).attr(options.StepContentKey, stepContentID);

                linkOjb.append("<span class='StepNumber'>" + i + "</span>");
                linkOjb.append("<span class='StepDes'>Step" + i + "<br /><small>" + $(step).text() + "</small></span>");
                liObj.append(linkOjb).appendTo(options.stepsObj);
                stepsWidth += linkOjb.width();
            }

            //按钮
            var btnObj = $("<div></div>").css("position", "fixed").css("top", options.stepsObj.height()).css("right", 10);
            var btnPrevious = $('<a href="#" class="StepButton ButtonDisabled">上一步</a>');
            var btnNext = $('<a href="#" class="StepButton">下一步</a>');
            var btnFinish = $('<a href="#" class="StepButton ButtonDisabled">完成</a>');
            btnObj.append(btnFinish).append(btnNext).append(btnPrevious);
            btnObj.css("z-index", 999);


            //添加到页面
            stepBackObj.height(options.stepsObj.height() + 20);
            stepBackObj.append(options.stepsObj);
            stepBackObj.append(btnObj);
            obj.html("");
            obj.append(stepBackObj);

            LoadContent(options.selected);

            //加载步骤
            function LoadContent(stepIndex) {
                if ($.isFunction(options.onPreShowStep)) {
                    options.onPreShowStep.call(this, options);
                }

                if (stepIndex < 1) stepIndex = 1;
                if (stepIndex > $("a[StepValue]", options.stepsObj).length) stepIndex = $("a", options.stepsObj).length;
                var steps = $("a[StepValue]", options.stepsObj);
                for (var i = 0, j = steps.length; i < j; i++) {
                    var step = $(steps[i]);
                    var stepContentID = step.attr(options.StepContentKey);
                    $("#" + stepContentID).hide();
                }

                $("#" + $(steps[stepIndex - 1]).attr(options.StepContentKey)).show();
                $(steps[stepIndex - 1]).removeClass("DisabledStep");
                $(steps[stepIndex - 1]).removeClass("DoneStep");
                $(steps[stepIndex - 1]).addClass("CurrentStep");

                if (stepIndex == 1) {
                    btnPrevious.addClass("ButtonDisabled");
                    btnNext.removeClass("ButtonDisabled");
                    btnFinish.addClass("ButtonDisabled");
                }
                else if (stepIndex > 1 && stepIndex < steps.length) {
                    btnPrevious.removeClass("ButtonDisabled");
                    btnFinish.addClass("ButtonDisabled");
                    btnNext.removeClass("ButtonDisabled");
                }
                else if (stepIndex == steps.length) {
                    btnNext.addClass("ButtonDisabled");
                    btnFinish.removeClass("ButtonDisabled");
                    btnPrevious.removeClass("ButtonDisabled");
                }

                if ($.isFunction(options.onAfterShowStep)) {
                    options.onAfterShowStep.call(this, options);
                }
            }
            //修改步骤
            function ChangeStep(curStep, selectedStep) {
                options.preSelected = curStep;
                options.selected = selectedStep;
                var steps = $("a[StepValue]", options.stepsObj);
                $(steps[curStep - 1]).removeClass("CurrentStep");
                $(steps[curStep - 1]).addClass("DoneStep");
                for (var i = selectedStep, j = steps.length; i < j; i++) {
                    $(steps[i]).removeClass("DoneStep");
                    $(steps[i]).removeClass("CurrentStep");
                    $(steps[i]).addClass("DisabledStep");
                }
                LoadContent(selectedStep);
            }

            //按钮事件参数
            var eventOption = {
                isCancel: false,
                selected: options.selected,
                preSelected: options.selected - 1,
                nextSelectd: options.selected + 1,
                stepsObj: options.stepsObj
            };

            //按钮事件
            //检查按是否钮可点击
            function CheckBtnDisabled(obj) {
                if ($(obj).hasClass("ButtonDisabled")) {
                    return false;
                }
                else {
                    return true;
                }
            }
            //下一步事件
            btnNext.click(function () {
                if (!CheckBtnDisabled(this)) {
                    return false;
                }

                //重新初始化事件参数
                eventOption.isCancel = false;
                eventOption.preSelected = options.preSelected;
                if (options.preSelected != options.selected - 1) {
                    if (options.preSelected < options.selected)
                        eventOption.preSelected = options.preSelected;
                    else
                        eventOption.preSelected = options.selected - 1;
                }
                eventOption.nextSelectd = options.selected + 1;
                eventOption.selected = options.selected;

                if ($.isFunction(options.onNextStep)) {
                    options.onNextStep.call(this, eventOption);
                }

                if (!eventOption.isCancel) {
                    ChangeStep(eventOption.selected, eventOption.nextSelectd);
                }
            });
            //上一步事件
            btnPrevious.click(function () {
                if (!CheckBtnDisabled(this)) {
                    return false;
                }

                //重新初始化事件参数
                eventOption.isCancel = false;
                eventOption.preSelected = options.selected - 1;
                if (options.preSelected != options.selected - 1) {
                    if (options.preSelected < options.selected)
                        eventOption.preSelected = options.preSelected;
                    else
                        eventOption.preSelected = options.selected - 1;
                }
                eventOption.nextSelectd = options.selected + 1;
                eventOption.selected = options.selected;

                if ($.isFunction(options.onPreStep)) {
                    options.onPreStep.call(this, eventOption);
                }

                if (!eventOption.isCancel) {
                    ChangeStep(eventOption.selected, eventOption.preSelected);
                }
            });
            //完成事件
            btnFinish.click(function () {
                if (!CheckBtnDisabled(this)) {
                    return false;
                }

                //重新初始化事件参数
                eventOption.isCancel = false;
                eventOption.preSelected = options.selected - 1;
                if (options.preSelected != options.selected - 1) {
                    if (options.preSelected < options.selected)
                        eventOption.preSelected = options.preSelected;
                }
                eventOption.nextSelectd = options.selected + 1;
                eventOption.selected = options.selected;

                if ($.isFunction(options.onFinish)) {
                    options.onFinish.call(this, eventOption)
                }
                else {
                    var frm = obj.parents('form');
                    if (frm && frm.length) {
                        frm.submit();
                    }
                }
            });

        });
    };

    $.fn.H3Wizard.defaults = {
        guideId: "",//向导标题的id
        selected: 1,  // 选中的步骤,1为第一步骤
        preSelected: 0,//执行过的上一步骤
        onNextStep: null, // 下一步事件
        onPreStep: null,  // 上一步事件
        onFinish: null,  // 完成事件
        onPreShowStep: null,//显示步骤之前
        onAfterShowStep: null,
        StepContentKey: "StepContent",
        stepsObj: null//所有的向导步骤
    };
})(jQuery);