app.service('datecalculation', [function () {
    //日起加上天数
    this.addDays = function (date, days) {
        var nd = new Date(date);
        nd = nd.valueOf();
        nd = nd + days * 24 * 60 * 60 * 1000;
        nd = new Date(nd);
        var y = nd.getFullYear();
        var m = nd.getMonth() + 1;
        var h = nd.getDate();
        if (m <= 9) m = "0" + m;
        if (h <= 9) h = "0" + h;
        return y + "-" + m + "-" + h;
    }
    //日起减去天数
    this.redDays = function (date, days) {
        days = -days;
        return this.addDays(date, days);
    }
    //两个日期是否一前一后
    this.isOrderBy = function (frontDate, backDate) {
        var frontDate = new Date(frontDate);
        frontDate = frontDate.valueOf();
        var backDate = new Date(backDate);
        backDate = backDate.valueOf();
        if (frontDate < backDate)
            return true;
        else
            return false;
    }
    //序列化时间
    this.changeDateFormat = function (cellval) {
        var date = new Date(parseInt(cellval.replace("/Date(", "").replace(")/", ""), 10));
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        var h = date.getDate();
        if (m <= 9) m = "0" + m;
        if (h <= 9) h = "0" + h;
        return y + "-" + m + "-" + h;
    }
}]);