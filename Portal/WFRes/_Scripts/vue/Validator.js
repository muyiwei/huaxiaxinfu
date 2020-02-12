$(function () {
    Vue.validator('number', function (val) {
        return /^[+]?[0-9]+$/.test(val);
    });

    Vue.validator('nullornumber', function (val) {
        if (val == "") { return true; }
        return /^[-+]?[0-9]+$/.test(val);
    });

    Vue.validator('nullordouble', function (val) {
        if (val == "") { return true; }
        return /^[-+]?[0-9]+(\.[0-9]+)?$/.test(val);
    });

    Vue.validator('space', function (val) {
        return /^\S*$/.test(val);
    });
    Vue.validator('chineseforbid', function (val) {
        return /[\u4e00-\u9fa5]/.test(val);
    });
    Vue.validator('email', function (val) {
        if (val == "") { return true; }
        return /^[A-Za-z0-9_-\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(val);
    });
    Vue.validator('mobile', function (val) {
        if (val == "") { return true; }
        return /^1[3|4|5|6|7|8][0-9]{9}$/.test(val);
    });
    
})