var sheetAttachInfo = {};

var ntkoocx = null; //控件对象
var NTKO_errNoOcx = "NTKO附件管理控件装载失败.";
var IsDocFileSaved = false; //是否已经保存,成功保存之后设置。
var PortalRoot = window.localStorage.getItem("H3.PortalRoot");//PortalRoot

function NTKO_InitAtaches() {
    //获得控件对象
    if (NTKO_AttachObj.length == 0 || NTKO_AttachInfo.length == 0) return;
    for (var k = 0; k < NTKO_AttachObj.length; k++) {
        var ntkoocx = document.all(NTKO_AttachObj[k][0]);
        if (ntkoocx != null) {
            for (var i = 0; i < NTKO_AttachInfo.length; i++) {
                if (NTKO_AttachInfo[i][0] != NTKO_AttachObj[k][0]) continue;
                ntkoocx.AddServerFile(NTKO_AttachInfo[i][1], NTKO_AttachInfo[i][2], NTKO_AttachInfo[i][3], NTKO_AttachInfo[i][4]);
            }
        }
    }
}

// 保存NTKO附件文档
function saveNTKOAttach() {
    // document.all("acount").value = ntkoocx.FilesCount; //获取附后数量
    if (NTKO_AttachObj.length == 0) return;
    for (var i = 0; i < NTKO_AttachObj.length; i++) {
        var ntkoocx = document.all(NTKO_AttachObj[i][0]);
        if (ntkoocx != null && ntkoocx.IsPermitAddDelFiles && ntkoocx.IsNeedSaveToServer) {
            ntkoocx.BeginSaveToURL(
                PortalRoot + "/OfficeService/UpFileData",  // 保存的文件地址,/此处为upload.aspx
			    "EDITFILE", //文件输入域名称,可任选,不与其他<input type=file name=..>的name部分重复即可
			    "InstanceID=" + sheetAttachInfo.instanceID + "&dataField=" + encodeURI(NTKO_AttachObj[i][1]) + "&WorkflowPackage=" + encodeURI(sheetAttachInfo.WorkflowPackage) + "&WorkflowName=" + encodeURI(sheetAttachInfo.WorkflowName), //可选的其他自定义数据－值对，以&分隔。如：myname=tanger&hisname=tom,一般为空
			    "myForm" //控件的智能提交功能可以允许同时提交选定的表单的所有数据.此处可使用id或者序号
		    );
        }
    }
}

function beforeFileAdd() {
    return true;
}