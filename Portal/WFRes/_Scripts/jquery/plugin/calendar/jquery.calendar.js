(function ($) {
    var defaults = {
        startYear: 2015,
        endYear: 2050,
        weeks: ["一", "二", "三", "四", "五", "六", "日"],
        workdayText: "班",
        holidayText: "休",
        yearText: "年",
        monthText: "月",
        todayText: "今天",
        refresh: false,
        calendarId: null,
        selected: null,      // 日期选中事件
        url: null            // 获取数据的URL
    };
    var options = {};
    var controls = {
        toolbar: null,
        selYear: null,
        selMonth: null,
        btnLeft: null,
        btnRight: null,
        btnToday: null,
        calendarTable: null
    };
    // 当前显示的月份
    var displayYear = null;
    var displayMonth = null;
    var container = null;
    var monthDays = {};

    $.fn.WorkCalendar = function (opt) {
        options = $.extend(defaults, opt);
        container = $(this);
        if (opt.refresh) {
            reload();
        }
        else {
            for (var k in controls) { controls[k] = null; }

            $(this).addClass("workCalendar");
            displayYear = new Date().getFullYear();
            displayMonth = new Date().getMonth() + 1;
            reload();
        }
    }

    var loadMonthWorkingDays = function () {
        if (options.calendarId) {
            $.ajax({
                url: options.url,
                type: 'post',
                dataType: "json",
                data: { calendarId: options.calendarId, year: displayYear, month: displayMonth },
                async: false,//同步执行
                success: function (result) {
                    monthDays = result;
                    if (monthDays) {
                        for (var day in monthDays) {
                            try{
                                monthDays[day].date = eval("new " + monthDays[day].CurrentDate.substring(1, monthDays[day].CurrentDate.length - 1));
                            } catch (e) {
                                monthDays[day].date = eval("new Date(" + monthDays[day].CurrentDate+")");;
                            }
                        }
                    }
                }
            });
        }
    };

    var reload = function () {
        loadMonthWorkingDays();

        renderToolbar(container);
        renderTable(container);

        if (displayYear == options.startYear && displayMonth == 1) {
            controls.btnLeft.attr("disabled", true);
        }
        else {
            controls.btnLeft.attr("disabled", false);
        }

        if (displayYear == options.endYear && displayMonth == 12) {
            controls.btnRight.attr("disabled", true);
        }
        else {
            controls.btnRight.attr("disabled", false);
        }
    }

    var renderToolbar = function (container) {
        if (controls.toolbar == null) {
            controls.toolbar = $("<div></div>");
            controls.toolbar.addClass("toolbar").appendTo(container);
        }

        if (controls.selYear == null) {
            controls.selYear = $("<select></select>");
            for (var i = options.startYear; i <= options.endYear; i++) {
                $("<option value='" + i + "'>" + i.toString() + options.yearText + "</option>").appendTo(controls.selYear);
            }
            controls.selYear.change(function () { loadData() }).appendTo(controls.toolbar);
        }
        controls.selYear.val(displayYear);

        // 向左按钮
        if (controls.btnLeft == null) {
            controls.btnLeft = $("<button/>");
            controls.btnLeft.text("<").click(function () {
                showPreMonth();
            }).appendTo(controls.toolbar);
        }

        if (controls.selMonth == null) {
            controls.selMonth = $("<select></select>");
            for (var i = 1; i <= 12; i++) {
                var monthIndex = i;
                monthIndex = monthIndex > 9 ? monthIndex : "0" + monthIndex;
                $("<option value='" + i + "'>" + monthIndex + options.monthText + "</option>")
                    .appendTo(controls.selMonth);
            }
            controls.selMonth.change(function () { loadData() }).appendTo(controls.toolbar);
        }
        controls.selMonth.val(displayMonth);

        if (controls.btnRight == null) {
            controls.btnRight = $("<button/>");
            controls.btnRight.text(">").click(function () {
                showNextMonth();
            }).appendTo(controls.toolbar);
        }

        if (controls.btnToday == null) {
            controls.btnToday = $("<button/>");
            controls.btnToday.addClass("btnToday").text(options.todayText).click(function () {
                showToday();
            }).appendTo(controls.toolbar);
        }
    }

    var renderTable = function (container) {
        if (controls.calendarTable == null) {
            controls.calendarTable = $("<table/>");
            controls.calendarTable.addClass("calendarTable").appendTo(container);
            var rowTitle = $("<tr></tr>");
            rowTitle.css("border", "0px").appendTo(controls.calendarTable);
            for (var i = 0; i < options.weeks.length; i++) {
                $("<th></th>").addClass("titleCell").text(options.weeks[i]).appendTo(rowTitle);
            }
        }
        else {
            controls.calendarTable.find(".dateRow").remove();
        }

        // 获取月头和月尾
        var firstDay = new Date(displayYear + "-" + displayMonth + "-1");
        var lastDay = new Date(displayYear + "-" + displayMonth + "-1");
        lastDay = dateAdd(lastDay, "m", 1);
        lastDay = dateAdd(lastDay, "d", -1);

        var startWeek = firstDay.getDay();
        var endWeek = lastDay.getDay();

        // 获取开始的日期
        var startDay = firstDay;
        if (startWeek == 0) {
            // 0表示星期天
            startDay = dateAdd(startDay, "d", -6);
        }
        else if (startWeek == 1) {
            startDay = dateAdd(startDay, "d", -7);
        }
        else {
            for (i = 1; i < startWeek; i++) {
                startDay = dateAdd(startDay, "d", -1);
            }
        }
        // 日期表格数据展示
        var rowCount = getRowCount(startWeek, lastDay);
        for (var i = 0; i < rowCount; i++) {
            var row = $("<tr class='dateRow'></tr>");
            row.appendTo(controls.calendarTable);

            for (var j = 0; j < 7; j++) {
                addDayCell(row, startDay);
                startDay = dateAdd(startDay, "d", 1);
            }
        }
    };

    var addDayCell = function (container, d) {
        var td = $("<td></td>");
        td.addClass("dayCell").attr("date", d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate());

        if ((d.getMonth() + 1) != displayMonth) {
            td.addClass("otherMonth");
        }
        if (isToday(d)) {
            td.addClass("today");
        }
        if (isOutRange(d)) {

        }
        else {
            td.text(d.getDate());
            td.mousemove(function () {
                $(this).addClass("mouseMove");
            }).mouseleave(function () {
                $(this).removeClass("mouseMove");
            }).click(function () {
                var date = $(this).attr("date");
                showDay(new Date(date));
                controls.calendarTable.find(".selectedDay").removeClass("selectedDay");
                $(this).addClass("selectedDay");
            });
        }
        td.appendTo(container);

        var workingDay = getWorkingDay(d);
        if (workingDay) {
            // 休息日，以灰色显示
            if (!workingDay.IsWorkingDay) {
                td.addClass("holiday");
            }
            if (workingDay.IsExceptional) {// 例外日期
                if (workingDay.IsWorkingDay) {
                    $("<span></span>").addClass("msgWork").text(options.workdayText).appendTo(td);
                }
                else {
                    $("<span></span>").addClass("msgHoliday").text(options.holidayText).appendTo(td);
                }
                if (workingDay.Description) {
                    var description = workingDay.Description.length > 4 ? workingDay.Description.substring(0, 4) : workingDay.Description;
                    $("<span></span>").addClass("daymessage").text(description).appendTo(td);
                }
            }
        }
    }

    var getWorkingDay = function (d) {
        if (monthDays == null) return null;
        for (var day in monthDays) {
            if (monthDays[day].date.getMonth() == d.getMonth()
                && monthDays[day].date.getDate() == d.getDate()) {
                return monthDays[day];
            }
        }
        return null;
    }

    var getRowCount = function (startWeek, lastDay) {
        var days = lastDay.getDate();
        if (startWeek == 0) days += 6;
        else if (startWeek == 1) days += 7;
        else days = days + startWeek - 1;
        var rows = parseInt(days / 7) + 1;
        return rows;
    }

    var isToday = function (day) {
        var d = new Date();
        return d.getFullYear() == day.getFullYear() && d.getMonth() == day.getMonth() && d.getDate() == day.getDate();
    }

    // 判定当前日期是否在日期范围之外
    var isOutRange = function (day) {
        if (day.getFullYear() < options.startYear) {
            return true;
        }
        else if (day.getFullYear() > options.endYear) {
            return true;
        }
        return false;
    }

    var dateAdd = function (d, interval, number) {
        var k = { 'y': 'FullYear', 'q': 'Month', 'm': 'Month', 'w': 'Date', 'd': 'Date', 'h': 'Hours', 'n': 'Minutes', 's': 'Seconds', 'ms': 'MilliSeconds' };
        var n = { 'q': 3, 'w': 7 };
        eval('d.set' + k[interval] + '(d.get' + k[interval] + '()+' + ((n[interval] || 1) * number) + ')');
        return d;
    }

    // 展示当前日期
    var showDay = function (d) {
        if (d.getMonth() + 1 != displayMonth) {// 重新显示月份
            displayMonth = d.getMonth() + 1;
            displayYear = d.getFullYear();

            controls.selMonth.val(displayMonth);
            controls.selYear.val(displayYear);
            reload();
        }

        setSelectedDay(d);
    }

    // 设置选中的日期
    var setSelectedDay = function (d) {
        var workingDay = getWorkingDay(d);
        if (options.selected) {
            options.selected.apply(container, [workingDay]);
        }
    }

    // 获取上一个月的日期
    var showPreMonth = function () {
        if (displayMonth == 1) {
            displayYear--;
            displayMonth = 12;
        }
        else {
            displayMonth--;
        }

        controls.selMonth.val(displayMonth);
        controls.selYear.val(displayYear);
        reload();
    }

    // 获取下一个月的日期
    var showNextMonth = function () {
        if (displayMonth == 12) {
            displayYear++;
            displayMonth = 1;
        }
        else {
            displayMonth++;
        }

        controls.selMonth.val(displayMonth);
        controls.selYear.val(displayYear);
        reload();
    }

    // 显示当天
    var showToday = function () {
        var today = new Date();
        displayYear = today.getFullYear();
        displayMonth = today.getMonth() + 1;

        controls.selMonth.val(displayMonth);
        controls.selYear.val(displayYear);
        reload();

        setSelectedDay(today);
    }

    // 加载数据并显示
    var loadData = function () {
        displayYear = controls.selYear.val();
        displayMonth = controls.selMonth.val();

        controls.selMonth.val(displayMonth);
        controls.selYear.val(displayYear);
        reload();
    }
})($);