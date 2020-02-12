/**高亮过滤器
 * @param  {} 'highlight'
 * @param  {} function($sce
 */
formModule.filter('highlightFilter', function($sce) {
    var fn = function(text, searchKey) {
        if (!searchKey) {
            return $sce.trustAsHtml(text);
        }
        var regExp = new RegExp(searchKey, 'gi');
        var result = text.replace(regExp, '<b>' + searchKey + '</b>');
        return $sce.trustAsHtml(result);
    };

    return fn;
});